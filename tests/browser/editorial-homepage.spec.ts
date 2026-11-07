import { expect, test } from '@playwright/test';

async function noOverflow(page: import('@playwright/test').Page) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
}

test('hero carousel advances automatically and the arrows move the counter', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByText('1 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('Lake Como, Italy')).toBeVisible();

  await page.getByRole('button', { name: 'Next photo' }).click();
  await expect(page.getByText('2 / 4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Previous photo' }).click();
  await expect(page.getByText('1 / 4', { exact: true })).toBeVisible();

  // Auto-advance restarts its timer on a manual step, so the next slide
  // arrives about seven seconds after the last click. The mouse rests on
  // the hero after clicking an arrow, which pauses the carousel, so move
  // it away first.
  await page.locator('.editorial-intro').hover();
  await expect(page.getByText('2 / 4', { exact: true })).toBeVisible({ timeout: 10000 });
  await noOverflow(page);
});

test('hero carousel pauses while hovered', async ({ page }) => {
  await page.goto('./');
  await page.locator('.editorial-hero').hover();
  await page.waitForTimeout(8000);
  await expect(page.getByText('1 / 4', { exact: true })).toBeVisible();
  await expect(page.getByText('2 / 4', { exact: true })).toHaveCount(0);
});

test('plan bar applies filters and scrolls to the collection grid', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel('Destination country').selectOption('JP');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page).toHaveURL(/country=JP/);
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expect(page.locator('#collection-grid')).toBeInViewport();
  await expect(page.getByLabel('Destination country')).toHaveValue('JP');

  await page.getByLabel('Experience type').selectOption('culture');
  await page.getByRole('button', { name: 'Begin' }).click();
  await expect(page).toHaveURL(/country=JP/);
  await expect(page).toHaveURL(/tag=culture/);
  await expect(page.getByRole('status')).not.toHaveText('100 of 100 properties');
  await expect(page.locator('#collection-grid')).toBeInViewport();
  await noOverflow(page);
});

test('feature Learn more links filter the collection', async ({ page }) => {
  await page.goto('./');
  const features = page.locator('.editorial-duo article');
  await features.first().getByRole('link', { name: /Learn more/ }).click();
  await expect(page).toHaveURL(/country=JP/);
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await expect(page.locator('#collection-grid')).toBeInViewport();

  await features.nth(1).getByRole('link', { name: /Learn more/ }).click();
  await expect(page).toHaveURL(/country=IT/);
  await expect(page.getByRole('status')).toHaveText('5 of 100 properties · filtered');
  await expect(page.locator('#collection-grid')).toBeInViewport();
  await noOverflow(page);
});

test('plan in stages tabs switch content and link to the tools', async ({ page }) => {
  await page.goto('./');
  const tabs = page.getByRole('tablist', { name: 'Plan in stages' });
  await expect(tabs.getByRole('tab', { name: 'Compare' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Compare your contenders' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the comparison' })).toHaveAttribute('href', /#\/compare/);

  await tabs.getByRole('tab', { name: 'Cash & points' }).click();
  await expect(tabs.getByRole('tab', { name: 'Cash & points' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Make your points count' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the points calculator' })).toHaveAttribute('href', /#\/calculator/);

  await tabs.getByRole('tab', { name: 'Build a trip' }).click();
  await expect(tabs.getByRole('tab', { name: 'Build a trip' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Bring your trip together' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open the trip builder' })).toHaveAttribute('href', /#\/trips/);

  await tabs.getByRole('tab', { name: 'Cash & points' }).click();
  await page.getByRole('link', { name: 'Open the points calculator' }).click();
  await expect(page).toHaveURL(/#\/calculator/);
  await noOverflow(page);
});

test('browse panel clears filters and scrolls to the grid', async ({ page }) => {
  await page.goto('./#/explore?country=JP');
  await expect(page.getByRole('status')).toHaveText('7 of 100 properties · filtered');
  await page.getByRole('button', { name: 'Browse the collection' }).click();
  await expect(page).toHaveURL(/#\/explore$/);
  await expect(page.getByRole('status')).toHaveText('100 of 100 properties');
  await expect(page.locator('#collection-grid')).toBeInViewport();
});
