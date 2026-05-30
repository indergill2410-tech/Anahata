const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  // Landing page
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2800);
  await page.screenshot({ path: '/tmp/shot_landing.png', clip: { x:0, y:0, width:390, height:844 } });

  // Enter app
  const btns = await page.$$('button');
  for (const b of btns) {
    const txt = await b.innerText().catch(()=>'');
    if (/enter|begin|start|explore/i.test(txt)) { await b.click(); break; }
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/shot_home.png', clip: { x:0, y:0, width:390, height:844 } });

  // Studio
  const navBtns = await page.$$('button');
  for (const b of navBtns) {
    const txt = await b.innerText().catch(()=>'');
    if (/studio/i.test(txt)) { await b.click(); break; }
  }
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/shot_studio.png', clip: { x:0, y:0, width:390, height:844 } });

  await browser.close();
  console.log('done');
})();
