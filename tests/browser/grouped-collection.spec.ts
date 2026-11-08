import { expect, test } from '@playwright/test';

async function noOverflow(page: import('@playwright/test').Page) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
}

const DESTINATION_GROUPS = [
  ['North America', '32 properties'],
  ['Asia', '30 properties'],
  ['Europe', '21 properties'],
  ['South America', '7 properties'],
  ['Africa', '5 properties'],
  ['Oceania', '5 properties'],
] as const;

const BRAND_GROUPS = [
  ['The Ritz-Carlton', '30 properties'],
  ['St. Regis', '22 properties'],
  ['The Luxury Collection', '20 properties'],
  ['JW Marriott', '13 properties'],
  ['EDITION', '9 properties'],
  ['Autograph Collection', '6 properties'],
] as const;

async function expectGroups(page: import('@playwright/test').Page, expected: readonly (readonly [string, string])[]) {
  const groups = page.locator('.collection-group');
  await expect(groups).toHaveCount(expected.length);
  for (const [index, [name, count]] of expected.entries()) {
    await expect(groups.nth(index).locator('.collection-group-name')).toHaveText(name);
    await expect(groups.nth(index).locator('.collection-group-count')).toHaveText(count);
  }
}

test('default shows one group at a time, the largest first, with its banner', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Group by destination' })).toHaveAttribute('aria-pressed', 'true');
  await expectGroups(page, [DESTINATION_GROUPS[0]]);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(1);
  await expect.poll(async () => page.locator('.collection-group-banner img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.property-card')).toHaveCount(32);
  // The status line still counts the whole catalog, not just the visible group.
  await expect(page.getByRole('status')).toHaveText('100 of 100 properties');
  // The dropdown defaults to the largest group and lists every group after All.
  const select = page.getByLabel('Show destination');
  await expect(select).toHaveValue('north-america');
  await expect(select.locator('option')).toHaveCount(7);
  await expect(select.locator('option').nth(0)).toHaveText('All destinations');
  await expect(select.locator('option').nth(1)).toHaveText('North America (32 properties)');
  await noOverflow(page);
});

test('dropdown switches the visible group, persists in the URL and across reload', async ({ page }) => {
  await page.goto('./');
  const select = page.getByLabel('Show destination');
  await select.selectOption('europe');
  await expect(page).toHaveURL(/only=europe/);
  await expectGroups(page, [['Europe', '21 properties']]);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(1);
  await expect(page.locator('.property-card')).toHaveCount(21);
  await expect(page.getByRole('status')).toHaveText('100 of 100 properties');

  await page.reload();
  await expect(page).toHaveURL(/only=europe/);
  await expectGroups(page, [['Europe', '21 properties']]);
  await expect(page.getByLabel('Show destination')).toHaveValue('europe');

  await page.getByLabel('Show destination').selectOption('all');
  await expect(page).toHaveURL(/only=all/);
  await expectGroups(page, DESTINATION_GROUPS);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(6);
  await expect(page.locator('.property-card')).toHaveCount(100);
  await noOverflow(page);
});

test('toggle switches to brand grouping and resets to the largest brand', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Show destination').selectOption('europe');
  await expect(page).toHaveURL(/only=europe/);

  await page.getByRole('button', { name: 'Group by brand' }).click();
  await expect(page).toHaveURL(/group=brand/);
  await expect(page).not.toHaveURL(/only=/);
  await expect(page.getByRole('button', { name: 'Group by brand' })).toHaveAttribute('aria-pressed', 'true');
  await expectGroups(page, [BRAND_GROUPS[0]]);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(1);
  await expect(page.locator('.property-card')).toHaveCount(30);
  await expect(page.getByLabel('Show brand')).toHaveValue('brand-ritz-carlton');

  await page.reload();
  await expect(page).toHaveURL(/group=brand/);
  await expectGroups(page, [BRAND_GROUPS[0]]);

  await page.getByRole('button', { name: 'Group by destination' }).click();
  await expect(page).not.toHaveURL(/group=brand/);
  await expectGroups(page, [DESTINATION_GROUPS[0]]);
  await noOverflow(page);
});

test('filters narrow the visible group and empty selections fall back to a non-empty group', async ({ page }) => {
  await page.goto('./#/explore?country=JP');
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  // Default is the largest group left: only Asia has Japanese properties.
  await expectGroups(page, [['Asia', '7 properties']]);
  await expect(page.locator('.property-card')).toHaveCount(7);
  await expect(page.getByLabel('Show destination')).toHaveValue('asia');

  // A selected group emptied by the filters falls back to the first
  // non-empty group instead of showing nothing.
  await page.goto('./#/explore?country=JP&only=europe');
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expectGroups(page, [['Asia', '7 properties']]);
  await expect(page.locator('.property-card')).toHaveCount(7);
  await expect(page.getByLabel('Show destination')).toHaveValue('asia');

  // 'All' under the same filter shows only the groups that still have properties.
  await page.goto('./#/explore?country=JP&only=all');
  await expectGroups(page, [['Asia', '7 properties']]);
  await expect(page.locator('.property-card')).toHaveCount(7);

  // Brand mode with the same filter: one brand group, narrowed. The seven
  // Japanese properties split across four brands (EDITION, Ritz-Carlton and
  // Luxury Collection have two each, St. Regis one), so the largest group —
  // EDITION, first alphabetically among the ties — shows 2 cards while the
  // status line still counts all 7.
  await page.goto('./#/explore?country=JP&group=brand');
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expectGroups(page, [['EDITION', '2 properties']]);
  await expect(page.locator('.property-card')).toHaveCount(2);
  await expect(page.getByLabel('Show brand')).toHaveValue('brand-edition');
  await noOverflow(page);
});

test('plan bar and feature links still filter the grouped collection', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Destination country').selectOption('IT');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page.getByRole('status')).toHaveText('5 of 100 properties · filtered');
  await expect(page.locator('.collection-group')).toHaveCount(1);
  await expect(page.locator('.collection-group').first().locator('.collection-group-name')).toHaveText('Europe');
  await expect(page.locator('.property-card')).toHaveCount(5);
  await expect(page.getByLabel('Show destination')).toHaveValue('europe');
  await noOverflow(page);
});
