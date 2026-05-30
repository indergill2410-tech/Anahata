const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);

  // Dismiss landing — find any button with enter/begin/explore text
  try {
    await page.click('button:has-text("Enter")', { timeout: 3000 });
  } catch {
    try { await page.click('button:has-text("Begin")', { timeout: 1000 }); } catch {
      // click first visible button if landing is visible
      const btns = await page.$$('button');
      if (btns.length) await btns[0].click();
    }
  }
  await page.waitForTimeout(1000);

  // Navigate to Studio tab - look for nav items at the bottom
  const navBtns = await page.$$('nav button, [role=tablist] button, button');
  for (const btn of navBtns) {
    const txt = await btn.innerText().catch(() => '');
    if (/studio/i.test(txt)) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(1500);
  
  // Top of page screenshot
  await page.screenshot({ path: '/tmp/studio_top.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  
  // Scroll down and screenshot middle section
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/studio_mid.png', clip: { x: 0, y: 0, width: 390, height: 844 } });
  
  // Scroll down more
  await page.evaluate(() => window.scrollTo(0, 1400));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/studio_bot.png', clip: { x: 0, y: 0, width: 390, height: 844 } });

  await browser.close();
  console.log('done');
})();
