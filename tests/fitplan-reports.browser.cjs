const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { startServer, isolate } = require('./study-browser-fixture.cjs');
const output = process.env.PORTAL_REPORT_DIR || '/tmp/fitplan-reports-check';
fs.mkdirSync(output, { recursive: true });

async function contrast(locator) {
  return locator.evaluate(element => {
    const rgb = value => (value.match(/[\d.]+/g) || []).map(Number);
    const luminance = colors => colors.map(value => {
      value /= 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    let background = [255, 255, 255];
    const ancestors = [];
    for (let node = element; node; node = node.parentElement) ancestors.unshift(node);
    for (const node of ancestors) {
      const color = rgb(getComputedStyle(node).backgroundColor), alpha = color[3] ?? 1;
      background = color.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
    }
    const front = luminance(rgb(getComputedStyle(element).color).slice(0, 3)), back = luminance(background);
    return (Math.max(front, back) + .05) / (Math.min(front, back) + .05);
  });
}

(async () => {
  const { server, origin } = await startServer();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PORTAL_BROWSER_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 }, serviceWorkers: 'block' });
    page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await isolate(page, origin);
    await page.route(origin + '/apps/fitplan/modul/**', route => route.fulfill({ contentType: 'text/html', body: fs.readFileSync('apps/fitplan/index.html', 'utf8') }));
    await page.addInitScript(() => {
      const NativeDate = Date;
      window.Date = class extends NativeDate {
        constructor(...args) { super(...(args.length ? args : [2026, 9, 18, 12])); }
        static now() { return new NativeDate(2026, 9, 18, 12).getTime(); }
      };
    });
    await page.goto(origin + '/apps/fitplan/');
    const frame = page.frameLocator('#appFrame');
    const open = async title => { await frame.getByRole('heading', { name: title, exact: true }).click(); };
    const home = async () => { await frame.locator('#backBtn').click(); };
    await frame.locator('#sectionGrid .section-card').last().waitFor();
    assert.equal(await frame.locator('#sectionGrid .section-card').count(), 6);
    assert.equal(await frame.locator('#progressPercent').isVisible(), false);
    await open('Plan treningowy');
    await frame.locator('#fpkKettlebell').waitFor();
    assert.equal(await frame.locator('#moduleTabs').isVisible(), false);
    assert.equal(await frame.locator('#completeSectionBtn').count(), 0);
    await frame.locator('#fpkKettlebell').click();
    for (const level of ['poczatkujacy', 'sredniozaawansowany', 'zaawansowany', 'zawodowiec']) {
      await frame.locator('[data-fpk-level="' + level + '"]').click();
      assert.equal(await frame.locator('[data-fpk-level="' + level + '"]').getAttribute('aria-pressed'), 'true');
    }
    await page.reload();
    await frame.locator('#fpkSelected').filter({ hasText: 'Zawodowiec' }).waitFor();
    await home(); await open('Lista ćwiczeń');
    await frame.locator('.fitplan-exercise-filters select').selectOption('chest');
    assert.equal(await frame.locator('.fitplan-exercise-group').count(), 1);
    assert.equal(await frame.locator('.fitplan-exercise-group h4').innerText(), 'Klatka piersiowa');
    assert.equal(await frame.locator('#moduleTabs').isVisible(), false);
    await home(); await open('Kalendarz treningowy');
    await frame.locator('.fpc-day.today').waitFor();
    assert.match(await frame.locator('.fpc-season-metrics').innerText(), /291\. dzień roku[\s\S]*Do końca jesieni: 43/);
    await frame.locator('[data-date="2026-10-18"]').click();
    for (const width of [1024, 820, 768, 390]) {
      await page.setViewportSize({ width, height: 960 });
      const fields = await frame.locator('.fpc-fields').evaluate(element => {
        const [time, note] = [...element.children].map(node => node.getBoundingClientRect());
        return { overlap: time.left < note.right && time.right > note.left && time.top < note.bottom && time.bottom > note.top,
          overflow: document.documentElement.scrollWidth > innerWidth + 1 };
      });
      assert.equal(fields.overlap, false, 'note/time overlap at ' + width);
      assert.equal(fields.overflow, false, 'calendar overflow at ' + width);
    }
    for (const theme of ['light', 'blue', 'gray']) {
      await page.evaluate(value => window.PortalPreferences.setTheme(value), theme);
      assert.ok(await contrast(frame.locator('.fpc-day.past .num').first()) >= 4.5, theme + ' past-day contrast');
      assert.ok(await contrast(frame.locator('.fpc-day.today .num')) >= 4.5, theme + ' current-day contrast');
      assert.equal(await frame.locator('.fpc-day.today').getAttribute('aria-current'), 'date');
      await page.screenshot({ path: path.join(output, 'calendar-' + theme + '.png') });
    }
    await frame.locator('#fpcTime').fill('18:30'); await frame.locator('#fpcNote').fill('Trening klatki piersiowej');
    await frame.locator('[data-act="save"]').click(); await page.reload();
    await frame.locator('[data-date="2026-10-18"]').click();
    assert.equal(await frame.locator('#fpcNote').inputValue(), 'Trening klatki piersiowej');
    assert.equal(await frame.locator('#fpcTime').inputValue(), '18:30');
    await home(); await page.setViewportSize({ width: 1366, height: 1000 }); await open('Model 3D');
    await frame.locator('.fp').waitFor({ timeout: 30000 });
    await frame.locator('canvas[data-selected]').waitFor({ timeout: 30000 });
    assert.doesNotMatch(await frame.locator('.fp-footer').innerText(), /1\.7\.0/);
    for (const theme of ['light', 'blue', 'gray']) {
      await page.evaluate(value => window.PortalPreferences.setTheme(value), theme);
      for (const layer of ['superficial', 'deep']) {
        const button = frame.locator('.fp-segment [data-layer="' + layer + '"]');
        await button.click();
        assert.ok(await contrast(button) >= 4.5, theme + ' selected layer ' + layer);
        assert.equal(await button.getAttribute('aria-pressed'), 'true');
      }
    }
    const canvas = frame.locator('canvas');
    for (const layer of ['superficial', 'deep']) {
      await frame.locator('.fp-segment [data-layer="' + layer + '"]').click();
      await frame.locator('.fp-filters [data-category="chest"]').click();
      await page.waitForFunction(active => {
        const canvas = document.querySelector('#appFrame').contentDocument.querySelector('canvas');
        return canvas?.dataset.layer === active && Number(canvas.dataset.highlighted) > 2;
      }, layer);
      assert.ok(Number(await canvas.getAttribute('data-highlighted')) > 2, 'chest group highlights multiple muscle pairs in ' + layer);
      const size = await canvas.boundingBox(), selections = new Set();
      for (const x of [.35, .5, .65]) for (const y of [.23, .38, .53, .68]) {
        await canvas.click({ position: { x: size.width * x, y: size.height * y } });
        const selected = await canvas.getAttribute('data-selected'); selections.add(selected);
        const muscle = await page.locator('#appFrame').evaluate((element, id) => element.contentWindow.FitAtlas.muscles.find(item => item.id === id), selected);
        assert.equal(muscle.layer, layer, 'canvas picked only the active layer');
        assert.equal(await canvas.getAttribute('data-layer'), layer);
      }
      assert.ok(selections.size > 1, 'canvas pointer test selected multiple actual muscles in ' + layer);
    }
    await page.screenshot({ path: path.join(output, 'model-3d.png') });
    assert.deepEqual(errors, []);
    console.log('PASS FitPlan: six modules, persistent kettlebell levels, exercise category, tablet/mobile calendar, three-theme contrast, actual 3D group highlight and layer-only canvas selections');
  } finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
