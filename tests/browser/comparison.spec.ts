import { expect, test } from '@playwright/test';

const slugs = ['dove-mountain', 'mapito', 'mereshi', 'jw-sao-paulo'];
const comparePath = (count: number) => `./#/compare?${slugs.slice(0, count).map((slug) => `compare=${slug}`).join('&')}`;
const noOverflow = async (page: import('@playwright/test').Page) => {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
};

test('select from filtered explorer and details, compare, reload, return, and use history', async ({ page }) => {
  await page.goto('./#/explore?country=TZ&tag=wildlife&sort=name-desc');
  await page.getByRole('checkbox', { name: /Compare Mapito/ }).check();
  await expect(page.getByText('Select at least 2 to compare.')).toBeVisible();
  await page.getByRole('link', { name: /View details for Mereshi/ }).click();
  await page.getByRole('checkbox', { name: /Compare Mereshi/ }).check();
  await page.getByRole('link', { name: 'Compare 2 properties' }).click();
  await expect(page.getByRole('table')).toHaveAccessibleName('Side-by-side comparison of 2 properties');
  await expect(page.getByRole('columnheader')).toHaveCount(3);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  const url = page.url();
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('columnheader').filter({ hasText: 'Mereshi' }).getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mereshi');
  await expect(page.getByRole('checkbox', { name: /Compare Mereshi/ })).toBeChecked();
  await page.goBack();
  await expect(page.getByRole('table')).toBeVisible();
  await page.getByRole('link', { name: /Back to your collection/ }).click();
  await expect(page.getByRole('status')).toContainText('2 of 25');
  await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('name-desc');
  await expect(page.getByRole('checkbox', { name: /Compare Mapito/ })).toBeChecked();
  await page.goBack();
  await expect(page.getByRole('table')).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('status')).toContainText('2 of 25');
});

for (const count of [2, 3, 4]) test(`${count}-property metrics align with responsive scrolling and evidence`, async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(comparePath(count));
  const table = page.getByRole('table');
  await expect(table).toHaveAccessibleName(`Side-by-side comparison of ${count} properties`);
  await expect(page.getByRole('columnheader')).toHaveCount(count + 1);
  const airport = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Nearest airport', exact: true }) });
  await expect(airport.getByRole('cell')).toHaveCount(count);
  await expect(airport.getByRole('cell').first()).toContainText('about 53.9 km');
  await airport.getByRole('cell').first().locator('summary').click();
  await expect(airport.getByRole('cell').first()).toContainText('1 mile = 1.609344 km');
  const source = airport.getByRole('cell').first().getByRole('link');
  await expect(source).toHaveAttribute('href', /marriott.com|ritzcarlton.com/);
  await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
  const cash = page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Cash cost', exact: true }) });
  await expect(cash.getByText('Unavailable', { exact: true })).toHaveCount(count);
  await expect(page.getByText('Editorial · desk review', { exact: true })).toHaveCount(1);
  await noOverflow(page);
  // Scroll using the keyboard, then verify sticky labels remain aligned and the
  // fourth property can be reached without horizontal overflow of the document.
  const region = page.getByRole('region', { name: 'Scrollable property comparison table' });
  await region.focus();
  await region.press('Home');
  if (await region.evaluate((element) => element.scrollWidth > element.clientWidth)) {
    await region.press('ArrowRight');
    await expect.poll(async () => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  }
  const alignment = await table.locator('tbody').first().locator('tr').nth(1).locator('td').evaluateAll((cells) => cells.map((cell) => cell.getBoundingClientRect().top));
  expect(new Set(alignment.map(Math.round)).size).toBe(1);
  await region.press('Control+End');
  await region.press('End');
  await page.screenshot({ path: testInfo.outputPath(`comparison-${count}-${testInfo.project.name}-scrolled.png`), fullPage: true });
  await region.press('Control+Home');
  await region.press('Home');
  await page.getByRole('heading', { level: 1 }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath(`comparison-${count}-${testInfo.project.name}.png`), fullPage: true });
  expect(errors).toEqual([]);
});

test('capacity, deselection, replacement, reset filters and clear work from explorer', async ({ page }) => {
  await page.goto(`./#/explore?${slugs.map((slug) => `compare=${slug}`).join('&')}`);
  await expect(page.getByRole('checkbox', { name: /Compare The Cloudveil/ })).toBeDisabled();
  await page.getByRole('checkbox', { name: /Compare Mereshi/ }).uncheck();
  await expect(page.getByRole('checkbox', { name: /Compare The Cloudveil/ })).toBeEnabled();
  await page.getByRole('checkbox', { name: /Compare The Cloudveil/ }).check();
  await page.getByRole('combobox', { name: 'Country / territory' }).selectOption('TZ');
  await page.getByRole('link', { name: 'Reset all' }).click();
  await expect(page.getByRole('link', { name: 'Compare 4 properties' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear comparison' }).click();
  await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Compare (0)' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /Compare Mapito/ })).not.toBeChecked();
});

test('empty, single, duplicated, missing and oversized URLs recover explicitly', async ({ page }) => {
  await page.goto('./#/compare');
  await expect(page.getByRole('heading', { name: 'Start with two properties.' })).toBeVisible();
  await page.goto('./#/compare?compare=mapito&compare=mapito');
  await expect(page.getByRole('heading', { name: 'Choose one more property.' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.goto(`./#/compare?${[...slugs, 'missing'].map((slug) => `compare=${slug}`).join('&')}`);
  await expect(page.getByRole('alert')).toContainText('Property unavailable in this catalog: missing.');
  await expect(page.getByRole('alert')).toContainText('at most four');
  await page.getByRole('button', { name: 'Keep valid selections' }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: /Remove Mapito/ }).click();
  await page.getByRole('button', { name: /Remove Mereshi/ }).click();
  await page.getByRole('button', { name: /Remove JW Marriott Hotel São Paulo/ }).click();
  await expect(page.getByRole('heading', { name: 'Choose one more property.' })).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
  await noOverflow(page);
});
