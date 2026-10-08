import { expect, test } from '@playwright/test';

const fill = async (page: import('@playwright/test').Page) => {
  await page.getByLabel('Nightly room rate (USD)', { exact: true }).fill('500');
  await page.getByLabel('Cash taxes, stay total (USD)', { exact: true }).fill('250');
  await page.getByLabel('Cash mandatory fees, stay total (USD)', { exact: true }).fill('100');
  await page.getByLabel('Points per night before discount', { exact: true }).fill('50000');
  await page.getByLabel('Award cash payable, stay total (USD)', { exact: true }).fill('100');
  await page.getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('eligible');
  await page.getByLabel('Are the two quotes comparable?', { exact: true }).selectOption('same');
};
const calculate = async (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Calculate value' }).click();
const results = (page: import('@playwright/test').Page) => page.getByRole('complementary', { name: 'Calculation results' });

test('manual five-night assessment, formula, balance and responsive screenshots', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./#/calculator');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await fill(page);
  await page.getByLabel('Available points (optional)', { exact: true }).fill('199999');
  await calculate(page);
  await expect(results(page).getByRole('status')).toContainText('Excellent points use');
  await expect(results(page).getByRole('status')).toContainText('1.375¢');
  await expect(results(page)).toContainText('1 more points needed');
  await expect(results(page)).toContainText('($2,850.00 − $100.00) × 1 ÷ 200,000 × 100');
  await expect(results(page)).toContainText('Discounted nights: 1');
  await expect(results(page).getByRole('link', { name: /Marriott terms/ })).toHaveAttribute('href', 'https://www.marriott.com/loyalty/terms/default.mi');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  await page.screenshot({ path: testInfo.outputPath('calculator-filled.png'), fullPage: true });
  await results(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('calculator-result.png') });
  expect(errors).toEqual([]);
});

test('unknown values, unknown eligibility, comparison warning, validation and reset', async ({ page }) => {
  await page.goto('./#/calculator');
  await calculate(page);
  await expect(results(page)).toContainText('Still unknown');
  await expect(results(page)).toContainText('Cash taxes');
  await fill(page);
  await page.getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('unknown');
  await calculate(page);
  await expect(results(page).getByRole('status')).toContainText('CPP unavailable');
  await page.getByLabel('Stay for 5, Pay for 4 eligibility', { exact: true }).selectOption('eligible');
  await page.getByLabel('Are the two quotes comparable?', { exact: true }).selectOption('different');
  await calculate(page);
  await expect(results(page).getByRole('status')).toContainText('Assessment unavailable');
  await expect(results(page).getByRole('status')).toContainText('illustrative');
  await page.getByLabel('Number of nights', { exact: true }).fill('61');
  await calculate(page);
  await expect(page.getByRole('alert')).toContainText('nights');
  await page.getByRole('button', { name: 'Clear inputs' }).click();
  await expect(page.getByLabel('Nightly room rate (USD)', { exact: true })).toBeEmpty();
  await expect(page.getByLabel('Number of nights', { exact: true })).toHaveValue('5');
});

test('varying nights, final quoted total and manual non-USD exchange rate', async ({ page }) => {
  await page.goto('./#/calculator'); await fill(page);
  await page.getByLabel('Award points basis', { exact: true }).selectOption('varying');
  for (const [index, value] of [50000, 30000, 60000, 70000, 90000].entries()) await page.getByLabel(`Night ${index + 1} points`, { exact: true }).fill(String(value));
  await calculate(page); await expect(results(page)).toContainText('270,000 points'); await expect(results(page)).toContainText('Discounted nights: 2');
  await page.getByLabel('Award points basis', { exact: true }).selectOption('total');
  await page.getByLabel('Quoted final points total', { exact: true }).fill('200000');
  await calculate(page); await expect(results(page).getByRole('status')).toContainText('1.375¢');
  await page.getByLabel('Quote currency', { exact: true }).selectOption('BRL');
  await page.getByLabel('Nightly room rate (BRL)', { exact: true }).fill('500');
  await page.getByLabel('Cash taxes, stay total (BRL)', { exact: true }).fill('250');
  await page.getByLabel('Cash mandatory fees, stay total (BRL)', { exact: true }).fill('100');
  await page.getByLabel('Award cash payable, stay total (BRL)', { exact: true }).fill('100');
  await calculate(page); await expect(results(page).getByRole('status')).toContainText('CPP unavailable');
  await page.getByLabel('Exchange rate (USD per 1 BRL)', { exact: true }).fill('0.2');
  await calculate(page); await expect(results(page).getByRole('status')).toContainText('0.275¢');
  await page.getByLabel('Cash taxes, stay total (BRL)', { exact: true }).fill('');
  await expect(results(page).getByRole('status')).toHaveCount(0);
  await calculate(page); await expect(results(page).getByRole('status')).toContainText('CPP unavailable');
});

test('explorer comparison context, property entry, reload and native history preserve existing flows', async ({ page }) => {
  await page.goto('./#/compare?country=TZ&compare=mapito&compare=mereshi');
  await page.getByRole('navigation').getByRole('link', { name: 'Points calculator' }).click();
  await expect(page).toHaveURL(/calculator\?country=TZ&compare=mapito&compare=mereshi/);
  await fill(page); await calculate(page);
  await page.reload();
  await expect(page.getByLabel('Nightly room rate (USD)', { exact: true })).toBeEmpty();
  await page.getByRole('link', { name: 'Back to comparison' }).click();
  await expect(page.getByRole('table')).toHaveAccessibleName('Side-by-side comparison of 2 properties');
  await page.getByRole('columnheader').filter({ hasText: 'Mapito' }).getByRole('link').click();
  await page.getByRole('link', { name: 'Calculate with your own rates' }).click();
  await expect(page).toHaveURL(/property=mapito/);
  await expect(page.getByText(/Catalog rates and fees remain unknown/)).toBeVisible();
  await page.goBack(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Mapito');
  await page.goForward(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Make your points count');
});
