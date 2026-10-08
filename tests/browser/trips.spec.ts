import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

const begin = async (page: Page) => { await page.goto('./#/trips'); await page.getByRole('button', { name: 'Create trip', exact: true }).click(); await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click(); };
const summary = (page: Page) => page.getByRole('complementary', { name: 'Trip totals' });
const stay = (page: Page, index = 1) => page.getByRole('article', { name: `Stay ${index}`, exact: true });
const fill = async (scope: Locator, values: Record<string, string>) => { for (const [label, value] of Object.entries(values)) await scope.getByLabel(label, { exact: true }).fill(value); };
const fillCash = async (scope: Locator) => fill(scope, { 'Nightly room rate (USD)': '500', 'Cash taxes, stay total (USD)': '50', 'Cash mandatory fees, stay total (USD)': '0' });
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));

test('multi-hotel chosen totals, immediate recalculation, incomplete costs and visual inspection', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await begin(page); await page.getByLabel('Trip name', { exact: true }).fill('Winter: city & desert');
  await page.getByLabel('Trip points balance', { exact: true }).fill('300000');
  await stay(page).getByLabel('Hotel', { exact: true }).selectOption('property-dove-mountain');
  await stay(page).getByLabel('Check-in date', { exact: true }).fill('2027-01-01'); await fillCash(stay(page));
  await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click();
  await stay(page, 2).getByLabel('Hotel', { exact: true }).selectOption('property-mapito');
  await stay(page, 2).getByLabel('Check-in date', { exact: true }).fill('2027-01-02');
  await stay(page, 2).getByLabel('Nights', { exact: true }).fill('5');
  await stay(page, 2).getByLabel('Booking method', { exact: true }).selectOption('points');
  await fill(stay(page, 2), { 'Nightly room rate (USD)': '500', 'Cash taxes, stay total (USD)': '250', 'Cash mandatory fees, stay total (USD)': '100', 'Final quoted award points': '200000', 'Award cash payable, stay total (USD)': '100', 'Stay notes': 'Confirm transfer before departure' });
  await stay(page, 2).getByLabel('Quote products and terms', { exact: true }).selectOption('same');
  await expect(summary(page)).toContainText('2 stays · 6 nights · 1 hotel change'); await expect(summary(page)).toContainText('$650.00'); await expect(summary(page)).toContainText('100,000 points'); await expect(summary(page)).toContainText('1.375 USD cents/point');
  await noOverflow(page); await page.screenshot({ path: testInfo.outputPath('trip-builder-full.png'), fullPage: true });
  await page.getByRole('link', { name: 'View trip totals' }).click(); await expect(summary(page)).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('trip-totals.png'), fullPage: false });
  await stay(page, 2).getByText('Inspect stay arithmetic & assumptions', { exact: true }).click(); await stay(page, 2).scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('trip-stay-arithmetic.png'), fullPage: true });
  await stay(page, 2).getByLabel('Final quoted award points', { exact: true }).fill('400000'); await expect(summary(page)).toContainText('100,000 points short');
  await stay(page).getByLabel('Cash taxes, stay total (USD)', { exact: true }).fill(''); await expect(summary(page)).toContainText('Known subtotal: $100.00');
  await stay(page, 2).getByLabel('Final quoted award points', { exact: true }).fill(''); await expect(summary(page)).toContainText('Known points subtotal'); await expect(summary(page)).toContainText('incomplete stays');
  await noOverflow(page); expect(errors).toEqual([]);
});

test('separate trips, notes, hotel order/removal, navigation memory and reload boundary', async ({ page }) => {
  await begin(page); await page.getByLabel('Trip name', { exact: true }).fill('Safari'); await page.getByLabel('Trip notes / planned activities', { exact: true }).fill('<script>Notes stay text</script>'); await stay(page).getByLabel('Stay notes', { exact: true }).fill('Morning drive');
  await stay(page).getByLabel('Hotel', { exact: true }).selectOption('property-mapito');
  await page.getByRole('button', { name: 'Create trip', exact: true }).click(); await page.getByLabel('Trip name', { exact: true }).fill('Desert');
  await expect(summary(page)).toContainText('0 stays'); await page.getByLabel('Choose trip', { exact: true }).selectOption('trip-1');
  await expect(stay(page).getByLabel('Stay notes', { exact: true })).toHaveValue('Morning drive');
  await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click(); await stay(page, 2).getByLabel('Hotel', { exact: true }).selectOption('property-mereshi');
  await page.getByRole('button', { name: 'Move stay 2 earlier', exact: true }).click(); await expect(stay(page).getByLabel('Hotel', { exact: true })).toHaveValue('property-mereshi');
  await page.getByRole('button', { name: 'Remove stay 1', exact: true }).click(); await expect(stay(page).getByLabel('Hotel', { exact: true })).toHaveValue('property-mapito');
  await page.getByRole('navigation').getByRole('link', { name: 'Points calculator', exact: true }).click(); await page.goBack();
  await expect(page.getByLabel('Trip name', { exact: true })).toHaveValue('Safari'); await expect(page.getByLabel('Trip notes / planned activities', { exact: true })).toHaveValue('<script>Notes stay text</script>');
  await page.getByRole('button', { name: 'Delete this trip', exact: true }).click(); await expect(page.getByLabel('Trip name', { exact: true })).toHaveValue('Desert');
  await page.reload(); await expect(page.getByText('Your next journey starts here.', { exact: true })).toBeVisible(); await expect(page.getByLabel('Choose trip', { exact: true })).toHaveCount(0);
});

test('calculator reuse for flat and variable awards and no discount across separate hotels', async ({ page }) => {
  await begin(page); await stay(page).getByLabel('Nights', { exact: true }).fill('5'); await stay(page).getByLabel('Booking method', { exact: true }).selectOption('points');
  await stay(page).getByLabel('Award points basis', { exact: true }).selectOption('flat'); await stay(page).getByLabel('Points per night before discount', { exact: true }).fill('50000');
  await stay(page).getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('eligible'); await stay(page).getByLabel('Award cash payable, stay total (USD)', { exact: true }).fill('0');
  await expect(summary(page)).toContainText('200,000 points'); await stay(page).getByLabel('Award points basis', { exact: true }).selectOption('varying');
  await expect(page.getByRole('alert')).toHaveCount(0); await expect(summary(page)).toContainText('Known points subtotal');
  for (let i = 1; i <= 5; i++) await stay(page).getByLabel(`Night ${i} points`, { exact: true }).fill(String(i * 10000));
  await expect(summary(page)).toContainText('140,000 points');
  await stay(page).getByLabel('Nights', { exact: true }).fill('3'); await stay(page).getByLabel('Award points basis', { exact: true }).selectOption('flat'); await stay(page).getByLabel('Points per night before discount', { exact: true }).fill('50000'); await stay(page).getByLabel('Award cash payable, stay total (USD)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click(); await stay(page, 2).getByLabel('Hotel', { exact: true }).selectOption('property-mapito'); await stay(page, 2).getByLabel('Nights', { exact: true }).fill('2'); await stay(page, 2).getByLabel('Booking method', { exact: true }).selectOption('points');
  await stay(page, 2).getByLabel('Award points basis', { exact: true }).selectOption('flat'); await stay(page, 2).getByLabel('Points per night before discount', { exact: true }).fill('50000'); await stay(page, 2).getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('eligible'); await stay(page, 2).getByLabel('Award cash payable, stay total (USD)', { exact: true }).fill('0');
  await expect(summary(page)).toContainText('250,000 points'); await noOverflow(page);
});

test('manual FX, validation, quote invalidation and incomplete input recovery', async ({ page }) => {
  await begin(page); await fillCash(stay(page)); await stay(page).getByLabel('Stay currency', { exact: true }).selectOption('EUR'); await expect(stay(page).getByLabel('Nightly room rate (EUR)', { exact: true })).toHaveValue('');
  await fill(stay(page), { 'Nightly room rate (EUR)': '100', 'Cash taxes, stay total (EUR)': '0', 'Cash mandatory fees, stay total (EUR)': '0' }); await expect(summary(page)).toContainText('€100.00'); await expect(summary(page)).toContainText('Manual USD exchange rate');
  await stay(page).getByLabel('Exchange rate (USD per 1 EUR)', { exact: true }).fill('1.2'); await expect(summary(page)).toContainText('$120.00');
  await stay(page).getByLabel('Nights', { exact: true }).fill('61'); await expect(page.getByRole('alert')).toContainText('nights'); await expect(summary(page)).not.toContainText('$120.00');
  await stay(page).getByLabel('Nights', { exact: true }).fill('2'); await expect(page.getByRole('alert')).toHaveCount(0); await expect(stay(page).getByLabel('Cash taxes, stay total (EUR)', { exact: true })).toHaveValue('');
  await stay(page).getByLabel('Check-in date', { exact: true }).fill('2028-02-28'); await expect(stay(page)).toContainText('2028-03-01'); await expect(stay(page).getByLabel('Nightly room rate (EUR)', { exact: true })).toHaveValue('');
  await stay(page).getByLabel('Hotel', { exact: true }).selectOption('property-mapito'); await expect(stay(page).getByLabel('Check-in date', { exact: true })).toHaveValue(''); await noOverflow(page);
});

test('inspectable totals and evidence preserve explorer and comparison context', async ({ page }) => {
  await page.goto('./#/compare?country=TZ&compare=mapito&compare=mereshi'); await page.getByRole('navigation').getByRole('link', { name: 'Trip builder', exact: true }).click(); await expect(page).toHaveURL(/trips\?country=TZ&compare=mapito&compare=mereshi/);
  await page.getByRole('button', { name: 'Create trip', exact: true }).click(); await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click(); await stay(page).getByLabel('Hotel', { exact: true }).selectOption('property-mapito');
  await stay(page).getByText('Catalog facts & evidence', { exact: true }).click(); await expect(stay(page)).toContainText('Operating status'); await expect(stay(page)).toContainText('Unknown');
  await summary(page).getByText('Inspect trip and structured totals (JSON)', { exact: true }).click(); const audit = summary(page).locator('pre'); await expect(audit).toContainText('trip-totals-1'); await expect(audit).toContainText('"selectedCash": null');
  await stay(page).getByRole('link', { name: 'Open sourced details and separate editorial assessment' }).click(); await expect(page).toHaveURL(/properties\/mapito\?country=TZ&compare=mapito&compare=mereshi/); await page.goBack(); await expect(stay(page).getByLabel('Hotel', { exact: true })).toHaveValue('property-mapito');
  await page.getByRole('navigation').getByRole('link', { name: 'Compare (2)', exact: true }).click(); await expect(page.getByRole('table')).toHaveAccessibleName('Side-by-side comparison of 2 properties');
});
