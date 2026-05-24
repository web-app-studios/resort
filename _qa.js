const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const pages = ['index', 'about', 'facilities', 'rooms', 'contact'];
  const sizes = [
    { name: 'desktop', w: 1440, h: 900 },
    { name: 'mobile',  w: 390,  h: 844 },
  ];
  const issues = [];

  for (const slug of pages) {
    for (const s of sizes) {
      const page = await browser.newPage();
      const localFails = [];
      const consoleErrs = [];
      page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text()); });
      page.on('pageerror', (err) => consoleErrs.push('PE: ' + err.message));
      page.on('requestfailed', (req) => localFails.push(req.url() + ' :: ' + (req.failure() ? req.failure().errorText : '')));
      page.on('response', (resp) => {
        const u = resp.url();
        if (!resp.ok() && resp.status() !== 304 && !u.includes('google.com/maps')) {
          localFails.push('HTTP ' + resp.status() + ' ' + u);
        }
      });
      await page.setViewport({ width: s.w, height: s.h });
      await page.goto(`http://localhost:8765/${slug}.html`, { waitUntil: 'networkidle2', timeout: 60000 });
      // Step scroll
      await page.evaluate(async () => {
        const dist = document.documentElement.scrollHeight;
        let y = 0;
        const step = window.innerHeight * 0.5;
        while (y < dist) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 220)); y += step; }
        await new Promise(r => setTimeout(r, 1500));
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 600));
      });
      const path = `C:/Users/rathe/Documents/Web & App Studio/resort/_qa_${slug}_${s.name}.png`;
      await page.screenshot({ path, fullPage: true });

      const m = await page.evaluate(() => {
        const out = {};
        out.docW = document.documentElement.scrollWidth;
        out.docH = document.documentElement.scrollHeight;
        out.viewW = window.innerWidth;
        out.overflow = out.docW > out.viewW + 1;
        out.broken = [];
        document.querySelectorAll('img').forEach((im) => {
          if (!im.complete || im.naturalWidth === 0) out.broken.push(im.src);
        });
        out.activeNav = Array.from(document.querySelectorAll('.site-header .nav a.active')).map(a => a.textContent.trim());
        out.h1 = (document.querySelector('h1') || {}).textContent || '';
        out.title = document.title;
        return out;
      });
      console.log(`[${slug} ${s.name}] title="${m.title}"  h1="${m.h1.trim()}"  active=${JSON.stringify(m.activeNav)}  overflow=${m.overflow}  broken=${m.broken.length}`);
      if (m.overflow) issues.push(`${slug} ${s.name}: horizontal overflow`);
      if (m.broken.length) issues.push(`${slug} ${s.name}: broken imgs ${m.broken.length}`);
      if (consoleErrs.length) issues.push(`${slug} ${s.name}: console errors ${consoleErrs.length}\n  ${consoleErrs.join('\n  ')}`);
      const realFails = localFails.filter(u => !u.includes('maps.googleapis') && !u.includes('googletagmanager'));
      if (realFails.length) issues.push(`${slug} ${s.name}: req fails\n  ${realFails.join('\n  ')}`);
      await page.close();
    }
  }
  await browser.close();
  console.log('\n=== ISSUES ===');
  console.log(issues.length ? issues.join('\n') : '(none)');
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
