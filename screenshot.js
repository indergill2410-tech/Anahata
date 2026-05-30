const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']
  });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2500);

  // Dismiss landing
  const btns = await page.$$('button');
  for (const b of btns) {
    const txt = await b.innerText().catch(()=>'');
    if (/enter|begin|start|explore/i.test(txt)) { await b.click(); break; }
  }
  await page.waitForTimeout(1000);

  // Go to Studio
  const nav = await page.$$('button');
  for (const b of nav) {
    const txt = await b.innerText().catch(()=>'');
    if (/studio/i.test(txt)) { await b.click(); break; }
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/ck_generate.png', clip: { x:0, y:0, width:390, height:844 } });

  // Mix mode
  const segBtns = await page.$$('.ck-seg-btn');
  if (segBtns[1]) { await segBtns[1].click(); await page.waitForTimeout(400); }
  await page.screenshot({ path: '/tmp/ck_mix.png', clip: { x:0, y:0, width:390, height:844 } });

  // Tune mode
  if (segBtns[2]) { await segBtns[2].click(); await page.waitForTimeout(400); }
  await page.screenshot({ path: '/tmp/ck_tune.png', clip: { x:0, y:0, width:390, height:844 } });

  await browser.close();
  console.log('done');
})();
