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
    const cells = Array.from(document.querySelectorAll("#game .square"));
    return cells;
  });

  console.log("board", board);
})();
