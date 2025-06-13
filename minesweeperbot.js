const puppeteer = require("puppeteer");

// function to add delay to minesweeper app to clicks are not instant and do not get banned
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  // create new browser create new page
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  //   open page to beginner minesweeper
  await page.goto("https://minesweeperonline.com/#beginner");

  //   wait for game to load
  await page.waitForSelector("#game");

  //   click the top left square in the game
  await page.click('[id="1_1"]');

  //   add delay
  await delay(500);

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

  //   check for open tiles with numbers
  const openTiles = board.filter((cell) =>
    /^square open[1-8]$/.test(cell.className)
  );

  //   search through open tiles
  for (const cell of openTiles) {
    const num = parseInt(cell.className.match(/open(\d)/)[1]);
    console.log("num", num);
  }

  //   console.log("board", board);
  //   console.log(getBoardBounds(board));

  //   console.log("openTiles", openTiles);
})();
