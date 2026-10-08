import { expect, test } from '@playwright/test';

const generate = async (page: import('@playwright/test').Page) => page.getByRole('button', { name: 'Generate recommendations' }).click();

test('deterministic sourced recommendations, inspectable layers and responsive screenshots', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./#/recommendations');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByLabel('Required country', { exact: true }).selectOption('TZ');
  await page.getByRole('group', { name: 'Preferred experiences' }).getByLabel('Wildlife', { exact: true }).check();
  await generate(page);
  await expect(page.getByRole('status')).toHaveText('2 candidates · 23 excluded · trip-fit-1');
  await expect(page.getByRole('heading', { name: 'Your recommendations' })).toBeFocused();
  const cards = page.getByRole('article', { name: /Recommendation for/ });
  expect(await cards.count()).toBe(2);
  const card = cards.first();
  await expect(card).toContainText('Partial trip fit');
  await expect(card).toContainText('Booking value unavailable');
  await card.getByText('02 · Inspect trip-fit components', { exact: true }).click();
  await expect(card).toContainText('Elite benefits · 15% weight');
  await expect(card).toContainText('High confidence');
  await card.getByText('04 · Why this candidate / what needs review', { exact: true }).click();
  await expect(card).toContainText('Property quality: unknown');
  await page.getByText('Inspect request and structured results (JSON)', { exact: true }).click();
  const before = await page.locator('.recommendation-audit pre').textContent();
  await generate(page);
  expect(await page.locator('.recommendation-audit pre').textContent()).toBe(before);
  await page.locator('.recommendation-audit summary').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
  await page.screenshot({ path: testInfo.outputPath('recommendations-full.png'), fullPage: true });
  await card.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('recommendation-card.png') });
  await page.getByRole('button', { name: 'Show excluded properties (23)' }).click();
  await expect(page.getByRole('article', { name: /Recommendation for/ })).toHaveCount(25);
  expect(errors).toEqual([]);
});

test('manual quote economics remain distinct from fit and unknown costs', async ({ page }, testInfo) => {
  await page.goto('./#/recommendations');
  await page.getByLabel('Required country', { exact: true }).selectOption('TZ');
  await page.getByText('03 · Optional manual booking quotes (0 applied)', { exact: true }).click();
  await page.getByLabel('Property for manual quote', { exact: true }).selectOption('property-mapito');
  for (const [label, value] of [['Room cost, stay total (USD)', '2500'], ['Taxes, stay total (USD)', '250'], ['Mandatory fees, stay total (USD)', '100'], ['Cash due on award, stay total (USD)', '100'], ['Final quoted award points', '200000'], ['Quote available points (optional)', '199999']]) await page.getByLabel(label!, { exact: true }).fill(value!);
  await page.getByLabel('Quote products and terms', { exact: true }).selectOption('same');
  await page.getByRole('button', { name: 'Apply quote' }).click(); await generate(page);
  const card = page.getByRole('article', { name: /Recommendation for Mapito/ });
  await expect(card).toContainText('Partial trip fit'); await expect(card).toContainText('Excellent points use');
  await expect(card).toContainText('1.375¢ / point'); await expect(card).toContainText('cannot fund this award');
  await card.getByText('Inspect booking arithmetic and quote', { exact: true }).click(); await expect(card).toContainText('$2,750.00');
  await card.scrollIntoViewIfNeeded(); await page.screenshot({ path: testInfo.outputPath('recommendation-economics.png') });
  await page.getByLabel('Taxes, stay total (USD)', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Apply quote' }).click(); await generate(page);
  await expect(card).toContainText('Booking value unavailable');
  await page.getByLabel('Stay length (nights)', { exact: true }).fill('4'); await generate(page);
  await expect(card).toContainText('Booking value unavailable');
  await page.reload(); await expect(page.getByLabel('Room cost, stay total (USD)', { exact: true })).toHaveValue('');
});

test('validation, required unknowns, no-match recovery and custom weights', async ({ page }) => {
  await page.goto('./#/recommendations');
  await page.getByLabel('Required country', { exact: true }).selectOption('TZ');
  await page.getByLabel('Require lounge access').check(); await generate(page);
  await expect(page.getByRole('status')).toHaveText('2 candidates · 23 excluded · trip-fit-1');
  await page.getByRole('article', { name: /Recommendation for Mapito/ }).getByText('04 · Why this candidate / what needs review', { exact: true }).click();
  await expect(page.getByRole('article', { name: /Recommendation for Mapito/ })).toContainText('lounge presence and elite access are not assumed');
  await page.getByLabel('Required recorded experience', { exact: true }).selectOption('ski'); await generate(page);
  await expect(page.getByRole('status')).toHaveText('0 candidates · 25 excluded · trip-fit-1');
  await expect(page.getByText('No candidate meets the known required constraints.', { exact: false })).toBeVisible();
  await page.getByText('Scoring methodology and configurable weights', { exact: true }).click();
  await page.getByLabel('Property quality weight (%)', { exact: true }).fill('20'); await generate(page);
  await expect(page.getByRole('alert')).toContainText('Weights must total 100');
  await page.getByLabel('Experience preference weight (%)', { exact: true }).fill('30'); await generate(page);
  await expect(page.getByRole('status')).toContainText('trip-fit-1-custom');
  await page.getByRole('button', { name: 'Clear recommendation inputs' }).click();
  await expect(page.getByLabel('Require lounge access')).not.toBeChecked(); await generate(page);
  await expect(page.getByRole('status')).toHaveText('25 candidates · 0 excluded · trip-fit-1');
});

test('recommendation navigation preserves earlier feature context and supports history/reload', async ({ page }) => {
  await page.goto('./#/compare?country=TZ&compare=mapito&compare=mereshi');
  await page.getByRole('navigation').getByRole('link', { name: 'Recommendations', exact: true }).click();
  await expect(page).toHaveURL(/recommendations\?country=TZ&compare=mapito&compare=mereshi/);
  await page.reload(); await generate(page);
  await page.getByRole('article', { name: /Recommendation for Mapito/ }).getByRole('heading', { level: 3 }).getByRole('link').click();
  await expect(page).toHaveURL(/properties\/mapito\?country=TZ&compare=mapito&compare=mereshi/);
  await page.goBack(); await expect(page.getByRole('heading', { level: 1 })).toContainText('Find a fit');
  await page.getByRole('navigation').getByRole('link', { name: 'Points calculator' }).click();
  await expect(page).toHaveURL(/calculator\?country=TZ&compare=mapito&compare=mereshi/);
  await page.getByRole('navigation').getByRole('link', { name: 'Compare (2)' }).click();
  await expect(page.getByRole('table')).toHaveAccessibleName('Side-by-side comparison of 2 properties');
});
