const puppeteer = require("puppeteer");

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
})();
