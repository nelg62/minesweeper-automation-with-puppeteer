const puppeteer = require("puppeteer");

// function to add delay to minesweeper app to clicks are not instant and do not get banned
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// function to find negibors cells of a number cell
function getAdjacent(x, y, board, minX, maxX, minY, maxY) {
  return board.filter((cell) => {
    const dx = Math.abs(cell.x - x);
    const dy = Math.abs(cell.y - y);
    return (
      dx <= 1 &&
      dy <= 1 &&
      !(dx === 0 && dy === 0) &&
      cell.x >= minX &&
      cell.x <= maxX &&
      cell.y >= minY &&
      cell.y <= maxY
    );
  });
}

(async () => {
  // create new browser create new page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //   open page to beginner minesweeper
  await page.goto("https://minesweeperonline.com/#beginner");
  // await page.goto("https://minesweeperonline.com/#intermediate");
  //   await page.goto("https://minesweeperonline.com/");

  //   wait for game to load
  await page.waitForSelector("#game");

  //   click the top left square in the game
  await page.click('[id="1_1"]');

  //   add delay
  await delay(500);

  //   variable to chack if the game has made progress of not for each loop
  let madeProgress = true;

  // while loop to keep game playing if progress if being made
  while (madeProgress) {
    madeProgress = false;

    // create a set to store any flagged squares to stop flagging and unflaggign the same square
    const newlyFlagged = new Set();

    //   get the board data
    const board = await page.evaluate(() => {
      // gets the tiles that have an id game and class square
      const cells = Array.from(document.querySelectorAll("#game .square"));
      return cells
        .filter((cell) => {
          // filter and get cells by style
          const style = window.getComputedStyle(cell);
          //   only return cells that have a display not = none
          return style.display !== "none";
        })
        .map((cell) => {
          // create a list aray of all ids of the cells in 1_1 format
          const id = cell.id;
          // create a list array of all class names of cells to see what the square is e.g number blank open
          const className = cell.className;

          // create an array of each id splitting the x and y cowardinate
          const match = id.match(/^(\d+)_(\d+)$/);

          // check if there is a match it there is set and x and y cowardinate from the 1_1 values otherwise return null
          if (!match) return null;
          const x = parseInt(match[1]);
          const y = parseInt(match[2]);
          // make sure value is not 0
          if (x < 1 || y < 1) return null;
          return { x, y, className };
        })
        .filter(Boolean);
    });

    //   calculate the max and min number to see how many cells are in the game and what are valid cells to click
    function getBoardBounds(board) {
      const xValues = board.map((cell) => cell.x);
      const yValues = board.map((cell) => cell.y);
      return {
        minX: Math.min(...xValues),
        maxX: Math.max(...xValues),
        minY: Math.min(...yValues),
        maxY: Math.max(...yValues),
      };
    }

    //   destructure get board values of min and max to use
    const { minX, maxX, minY, maxY } = getBoardBounds(board);

    // function to check if a click is in bounds of the game board as sometimes sas trying to click and unavailable number
    function isInBounds(x, y, minX, maxX, minY, maxY) {
      return x >= minX && x <= maxX && y >= minY && y <= maxY;
    }

    //   check for open tiles with numbers
    const openTiles = board.filter((cell) =>
      /^square open[1-8]$/.test(cell.className)
    );

    //   search through open tiles
    for (const cell of openTiles) {
      // get the number of each of the open cells
      const num = parseInt(cell.className.match(/open(\d)/)[1]);
      // console.log("num", num);

      // find the neighboring cells of the number cells using getAdjacent function
      const neighbors = getAdjacent(
        cell.x,
        cell.y,
        board,
        minX,
        maxX,
        minY,
        maxY
      );
      // console.log("neighbors", neighbors);

      // check if square has been flagged
      const flaggedNeighbors = neighbors.filter(
        (n) => n.className === "square bombflagged"
      );

      // console.log("flaggedNeighbors",flaggedNeighbors);

      // get list of blank sqaure neighbors
      const blankNeighbors = neighbors.filter(
        (n) => n.className === "square blank"
      );

      // console.log("blankNeighbors", blankNeighbors);

      // check if blank squares is more then 0 and if they are equal to the number of bombs and if already flagged add the bomb flag and compare
      if (
        blankNeighbors.length > 0 &&
        flaggedNeighbors.length + blankNeighbors.length === num
      ) {
        // get x and y cowardinates of the bombs once found then right click to flag
        for (const bombTile of blankNeighbors) {
          // get cowardinates of x and y
          const key = `${bombTile.x}_${bombTile.y}`;
          // find if a neigbor sqaure is already flagged so it is not unflagged
          const isAlreadyFlagged = board.find(
            (c) =>
              c.x === bombTile.x &&
              c.y === bombTile.y &&
              c.className === "square bombflagged"
          );

          // check if the tile is in bounds to click
          if (
            isInBounds(bombTile.x, bombTile.y, minX, maxX, minY, maxY) &&
            !isAlreadyFlagged &&
            !newlyFlagged.has(key)
          ) {
            console.log(`Flagged bomb at: ${bombTile.x}, ${bombTile.y}`);
            // await cell with x and y cowardinate and then right click to place flag
            await page.click(`[id="${bombTile.x}_${bombTile.y}"]`, {
              button: "right",
            });
            // add the cowardinate to the set
            newlyFlagged.add(key);
            await delay(300);
            madeProgress = true;
          }
        }
      }

      // check and see if tile is safe to click and then click tile
      if (flaggedNeighbors.length === num && blankNeighbors.length > 0) {
        for (const safeTiles of blankNeighbors) {
          // check if the tiles sorted is in bounds to click
          if (isInBounds(safeTiles.x, safeTiles.y, minX, maxX, minY, maxY)) {
            console.log(`Safe to click at: ${safeTiles.x}, ${safeTiles.y}`);
            await page.click(`[id="${safeTiles.x}_${safeTiles.y}"]`);
            await delay(300);
            madeProgress = true;
          }
        }
      }
    }
  }

  //   console.log("board", board);
  //   console.log(getBoardBounds(board));

  //   console.log("openTiles", openTiles);
})();
