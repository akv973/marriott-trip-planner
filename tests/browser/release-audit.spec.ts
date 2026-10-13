import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { portfolioFixture } from '../fixtures/portfolio';
import { createTrip } from '../../lib/trips/trips';
import legacy from '../fixtures/planner-stage-7-v1.json' with { type: 'json' };
const key = 'marriott-trip-planner:v1';
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name, exact: true });
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
const seed = async (page: Page, d = portfolioFixture('property-jw-tampa')) => {
  await page.addInitScript(({ key, json }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, json); }, { key, json: JSON.stringify({ appId: 'marriott-trip-planner', schemaVersion: 2, exportedAt: '2026-10-13T12:00:00.000Z', data: d }) });
};
const enterQuote = async (page: Page, index: number, property: string, date: string, nights: string, room: string, points: string) => {
  const s = page.getByRole('article', { name: `Stay ${index}`, exact: true });
  await s.getByLabel('Hotel', { exact: true }).selectOption(property);
  await s.getByLabel('Check-in date', { exact: true }).fill(date); await s.getByLabel('Nights', { exact: true }).fill(nights);
  for (const [label, value] of Object.entries({ 'Nightly room rate (USD)': room, 'Cash taxes, stay total (USD)': '0', 'Cash mandatory fees, stay total (USD)': '0', 'Final quoted award points': points, 'Award cash payable, stay total (USD)': '0', 'Quote observed on': new Date().toISOString().slice(0, 10) })) await s.getByLabel(label, { exact: true }).fill(value);
  await s.getByLabel('Quote products and terms', { exact: true }).selectOption('same');
};

test('real manual journey: discover, compare, calculate, save two hotels, optimize, watch, and restore', async ({ page }, info) => {
  test.setTimeout(90000);
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('./#/profile'); await page.getByLabel('Bonvoy status', { exact: true }).selectOption('ambassador'); await page.getByLabel('Profile points balance', { exact: true }).fill('600000'); await page.getByLabel('Profile value (USD cents per point)', { exact: true }).fill('1');
  await nav(page, 'Explorer').click(); await page.getByRole('searchbox').fill('Dove Mountain'); await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page.getByLabel('Compare The Ritz-Carlton, Dove Mountain', { exact: true }).check();
  await page.getByRole('link', { name: /View details for The Ritz-Carlton, Dove Mountain/ }).click();
  await page.getByRole('button', { name: 'Save to watchlist: The Ritz-Carlton, Dove Mountain', exact: true }).click();
  await page.getByLabel('Desired cash rate per night', { exact: true }).fill('575'); await page.getByLabel('Cash target currency', { exact: true }).fill('USD');
  await nav(page, 'Explorer').click(); await page.getByRole('searchbox').fill('Mapito'); await page.getByRole('button', { name: 'Search', exact: true }).click(); await page.getByLabel(/Compare Mapito Safari/).check();
  await nav(page, 'Compare (2)').click(); await expect(page.getByRole('table')).toHaveAccessibleName('Side-by-side comparison of 2 properties');
  await nav(page, 'Points calculator').click();
  for (const [label, value] of Object.entries({ 'Number of nights': '5', 'Nightly room rate (USD)': '1400', 'Cash taxes, stay total (USD)': '0', 'Cash mandatory fees, stay total (USD)': '0', 'Points per night before discount': '100000', 'Award cash payable, stay total (USD)': '200' })) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('eligible'); await page.getByLabel('Are the two quotes comparable?', { exact: true }).selectOption('same');
  await page.getByRole('button', { name: 'Calculate value', exact: true }).click(); await expect(page.locator('.calculator-results')).toContainText('400,000 points');
  await nav(page, 'Trip builder').click(); await page.getByRole('button', { name: 'Create trip', exact: true }).click(); await page.getByLabel('Trip name', { exact: true }).fill('Winter & safari audit'); await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click();
  await enterQuote(page, 1, 'property-dove-mountain', '2027-01-10', '4', '575', '240000');
  await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click(); await enterQuote(page, 2, 'property-mapito', '2027-02-10', '5', '1400', '400000');
  await page.getByRole('article', { name: 'Stay 2', exact: true }).getByLabel('Booking method', { exact: true }).selectOption('points');
  await expect(page.getByRole('complementary', { name: 'Trip totals' })).toContainText('$2,300.00');
  await nav(page, 'Portfolio').click(); const cash = page.getByRole('article', { name: 'Cash conservation', exact: true }); await expect(cash).toContainText('400,000 points'); await expect(cash).toContainText('$2,300.00'); await expect(cash).toContainText('200,000 points');
  await noOverflow(page); await page.locator('.portfolio-strategies').screenshot({ path: info.outputPath('audit-real-journey.png') });
  await nav(page, 'Profile').click(); await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); const backup = await page.getByLabel('Planner JSON', { exact: true }).inputValue();
  await page.getByLabel('Profile points balance', { exact: true }).fill('1'); await page.getByLabel('Planner JSON', { exact: true }).fill(backup); await page.getByRole('button', { name: 'Review import', exact: true }).click(); await page.getByRole('button', { name: 'Import and replace planner', exact: true }).click(); await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, key)).toEqual(JSON.parse(backup).data);
  await nav(page, 'Portfolio').click(); await expect(cash).toContainText('400,000 points'); expect(errors).toEqual([]);
});

test('audit fixes are visible after restoring inactive trips, rounded FX and an empty trip', async ({ page }, info) => {
  const d = portfolioFixture('property-jw-tampa'); d.profile.balance = 0; d.workspace.activeId = null;
  const t = d.workspace.trips[0]!; t.stays = [structuredClone(t.stays[0]!), structuredClone(t.stays[0]!)];
  t.stays.forEach((s, i) => { s.id = `round-${i}`; s.checkIn = `2027-01-${10 + i}`; s.pricing.currency = 'EUR'; s.pricing.cashRoom = 100.02; s.pricing.usdPerCurrency = 1.125; });
  const empty = createTrip('empty-journey'); empty.name = 'Unpriced idea'; d.workspace.trips = [t, empty];
  await seed(page, d); await page.goto('./#/trips'); await expect(page.getByLabel('Trip name', { exact: true })).toHaveValue('Luxury'); const before = await page.evaluate(key => localStorage.getItem(key), key);
  await expect(page.getByRole('complementary', { name: 'Trip totals' })).toContainText('$225.04'); await nav(page, 'Portfolio').click(); await expect(page.getByRole('article', { name: 'Cash conservation', exact: true })).toContainText('$225.04');
  const row = page.getByRole('row').filter({ hasText: 'Unpriced idea' }); await expect(row).toContainText('0 points'); await expect(row).not.toContainText('Unknown');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(before); await page.reload(); await noOverflow(page); await page.locator('.portfolio-table-scroll').screenshot({ path: info.outputPath('audit-empty-trip-fx.png') });
});

test('legacy backup, rejected replacement and another-tab conflict preserve saved work', async ({ page, context }, info) => {
  await page.goto('./#/profile'); await page.getByLabel('Planner JSON', { exact: true }).fill(JSON.stringify(legacy)); await page.getByRole('button', { name: 'Review import', exact: true }).click(); await page.getByRole('button', { name: 'Import and replace planner', exact: true }).click(); await page.reload();
  const initial = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key); expect(initial.schemaVersion).toBe(2); expect(initial.data.watchlist).toEqual([]); expect(initial.data.profile).toEqual(legacy.data.profile);
  const other = await context.newPage(); await other.goto('./#/profile'); await page.getByLabel('Profile points balance', { exact: true }).fill('123456'); const saved = await page.evaluate(key => localStorage.getItem(key), key);
  await other.getByLabel('Profile points balance', { exact: true }).fill('7'); await expect(other.locator('.storage-status')).toContainText('another tab'); expect(await other.evaluate(key => localStorage.getItem(key), key)).toBe(saved);
  await other.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); expect(JSON.parse(await other.getByLabel('Planner JSON', { exact: true }).inputValue()).data.profile.balance).toBe(7);
  await page.getByLabel('Planner JSON', { exact: true }).fill('{"schemaVersion":99}'); await page.getByRole('button', { name: 'Review import', exact: true }).click(); await expect(page.getByRole('button', { name: 'Import and replace planner', exact: true })).toHaveCount(0); expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(saved);
  await other.locator('.storage-status').screenshot({ path: info.outputPath('audit-tab-conflict.png') }); await other.reload(); await expect(other.getByLabel('Profile points balance', { exact: true })).toHaveValue('123456'); await other.close();
});

test('denied storage reads and quota failures retain exportable in-memory work', async ({ page, browser }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('Blocked storage'); }; Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; });
  await page.goto('./#/profile'); await expect(page.locator('.storage-status')).toContainText('unavailable'); await page.getByLabel('Profile points balance', { exact: true }).fill('123456'); await expect(page.locator('.storage-status')).toContainText('Export this page before reloading');
  await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); expect(JSON.parse(await page.getByLabel('Planner JSON', { exact: true }).inputValue()).data.profile.balance).toBe(123456);
  await nav(page, 'Portfolio').click(); await expect(page.locator('.portfolio-start')).toContainText('123,456 points');
  const quota = await browser.newPage({ viewport: page.viewportSize()! });
  await quota.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; });
  await quota.goto(new URL('./', page.url()).href + '#/profile'); await quota.getByLabel('Profile points balance', { exact: true }).fill('654321'); await expect(quota.locator('.storage-status')).toContainText('Changes remain in memory');
  await quota.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); expect(JSON.parse(await quota.getByLabel('Planner JSON', { exact: true }).inputValue()).data.profile.balance).toBe(654321); await quota.close();
});

test('keyboard route focus, control names, optional map and horizontal ledgers are usable', async ({ page }, info) => {
  await seed(page); await page.goto('./#/portfolio');
  for (const name of ['Explorer', 'Compare (0)', 'Points calculator', 'Recommendations', 'Trip builder', 'Portfolio', 'Profile', 'Watchlist', 'Elite benefits']) {
    await nav(page, name).focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
    await page.getByRole('link', { name: 'Skip to content', exact: true }).focus(); await page.keyboard.press('Enter'); await expect(page.locator('main')).toBeFocused();
    for (const control of await page.locator('button:visible, input:visible, select:visible, textarea:visible, summary:visible').all()) await expect(control).toHaveAccessibleName(/\S/);
  }
  await page.goto('./#/properties/dove-mountain'); const show = page.getByRole('button', { name: 'Show geographic map', exact: true }); await show.focus(); await page.keyboard.press('Enter'); await expect(page.getByRole('img', { name: 'Property geography map' })).toBeVisible(); await page.keyboard.press('Tab'); await expect(page.getByRole('button', { name: 'Zoom in', exact: true })).toBeFocused(); await page.keyboard.press('Enter');
  await page.goto('./#/portfolio'); await page.setViewportSize({ width: 320, height: 844 });
  const scroll = page.locator('.portfolio-table-scroll'); await scroll.focus(); await expect(scroll).toBeFocused(); const x = await scroll.evaluate(e => e.scrollLeft); await page.keyboard.press('ArrowRight'); await expect.poll(() => scroll.evaluate(e => e.scrollLeft)).toBeGreaterThan(x); await noOverflow(page); await scroll.screenshot({ path: info.outputPath('audit-keyboard-ledger.png') });
});

test('320px phone, tablet and desktop reflow preserve navigation and visible controls', async ({ page }, info) => {
  test.setTimeout(90000); await seed(page);
  for (const width of [320, 768, 1366]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['explore', 'compare?compare=mapito&compare=mereshi', 'calculator', 'recommendations', 'trips', 'portfolio', 'profile', 'watchlist', 'benefits']) {
      await page.goto(`./#/${route}`); await expect(page.getByRole('heading', { level: 1 })).toBeVisible(); await noOverflow(page);
    }
    await page.goto('./#/portfolio'); await page.screenshot({ path: info.outputPath(`audit-reflow-${width}.png`), fullPage: true });
  }
});
