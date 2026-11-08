import { expect, test } from '@playwright/test';

async function noOverflow(page: import('@playwright/test').Page) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
}

test('explorer sections switch by tab without reloading the collection', async ({ page }) => {
  await page.goto('./');
  const tabs = page.getByRole('tablist', { name: 'Explorer sections' });
  await expect(tabs.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true');
  // Default view shows one group at a time: North America, 32 properties.
  await expect(page.locator('.property-card')).toHaveCount(32);
  await expect(page.getByRole('heading', { name: 'Journeys to linger over.' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Better planning begins' })).toHaveCount(0);

  await tabs.getByRole('tab', { name: 'Journeys' }).click();
  await expect(page).toHaveURL(/#journeys/);
  await expect(tabs.getByRole('tab', { name: 'Journeys' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.property-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Journeys to linger over.' })).toBeVisible();
  await noOverflow(page);

  await tabs.getByRole('tab', { name: 'Journeys' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/#foundation/);
  await expect(tabs.getByRole('tab', { name: 'About' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'Better planning begins' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Taking shape, one stage at a time.' })).toBeVisible();
  // Roadmap labels moved here with ProjectNotes: stages 3, 4 and 6 are all
  // "Available", none "Planned".
  await expect(page.getByText('Available', { exact: true })).toHaveCount(3);
  await expect(page.getByText('Planned', { exact: true })).toHaveCount(0);
  await noOverflow(page);

  await tabs.getByRole('tab', { name: 'Properties' }).click();
  await expect(page).toHaveURL(/#\/explore/);
  await expect(tabs.getByRole('tab', { name: 'Properties' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.property-card')).toHaveCount(32);
});

test('footer links open the About tab at the matching section', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'What’s next', exact: true }).click();
  await expect(page).toHaveURL(/#roadmap/);
  await expect(page.getByRole('heading', { name: 'Taking shape, one stage at a time.' })).toBeInViewport();
  await page.getByRole('link', { name: 'Our approach', exact: true }).click();
  await expect(page).toHaveURL(/#foundation/);
  await expect(page.getByRole('heading', { name: 'Better planning begins' })).toBeInViewport();
});
