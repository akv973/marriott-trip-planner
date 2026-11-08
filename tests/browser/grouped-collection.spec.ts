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

test('destination grouping shows six region sections, largest first, with banners', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Group by destination' })).toHaveAttribute('aria-pressed', 'true');
  await expectGroups(page, DESTINATION_GROUPS);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(6);
  await expect.poll(async () => page.locator('.collection-group-banner img').evaluateAll((images) => images.every((image) => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await expect(page.locator('.property-card')).toHaveCount(100);
  await expect(page.getByRole('status')).toHaveText('100 of 100 properties');
  await noOverflow(page);
});

test('toggle switches to brand grouping, persists in the URL and across reload', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Group by brand' }).click();
  await expect(page).toHaveURL(/group=brand/);
  await expect(page.getByRole('button', { name: 'Group by brand' })).toHaveAttribute('aria-pressed', 'true');
  await expectGroups(page, BRAND_GROUPS);
  await expect(page.locator('.collection-group-banner img')).toHaveCount(6);
  await expect(page.locator('.property-card')).toHaveCount(100);

  await page.reload();
  await expect(page).toHaveURL(/group=brand/);
  await expectGroups(page, BRAND_GROUPS);

  await page.getByRole('button', { name: 'Group by destination' }).click();
  await expect(page).not.toHaveURL(/group=brand/);
  await expectGroups(page, DESTINATION_GROUPS);
  await noOverflow(page);
});

test('filters narrow the groups and keep the status count', async ({ page }) => {
  await page.goto('./#/explore?country=JP');
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expect(page.locator('.collection-group')).toHaveCount(1);
  await expect(page.locator('.collection-group').first().locator('.collection-group-name')).toHaveText('Asia');
  await expect(page.locator('.property-card')).toHaveCount(7);

  await page.getByRole('button', { name: 'Group by brand' }).click();
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expect(page.locator('.property-card')).toHaveCount(7);
  const groupCount = await page.locator('.collection-group').count();
  expect(groupCount).toBeGreaterThan(0);
  expect(groupCount).toBeLessThan(6);
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
  await noOverflow(page);
});
