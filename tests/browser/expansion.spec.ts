import { expect, test } from '@playwright/test';
const noOverflow = async (page: import('@playwright/test').Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
const fact = (page: import('@playwright/test').Page, label: string) => page.locator('.fact-row').filter({ has: page.getByText(label, { exact: true }) });
const card = (page: import('@playwright/test').Page, label: string) => page.getByRole('article', { name: label, exact: true });

test('expanded geographic filters, current sources, detail reload and editorial unknowns remain inspectable', async ({ page }, info) => {
  await page.goto('./#/explore?country=AU');
  await expect(page.getByRole('status')).toHaveText('5 of 100 properties · filtered');
  await expect(page.locator('.property-card')).toHaveCount(5); await noOverflow(page);
  await page.screenshot({ path: info.outputPath('expansion-australia.png'), fullPage: true });
  await page.getByRole('link', { name: /View details for The Tasman/ }).click(); await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Tasman, a Luxury Collection Hotel, Hobart');
  await expect(page.getByText('Editorial · desk review', { exact: true })).toBeVisible();
  const name = fact(page, 'Property name'); await name.locator('summary').click();
  await expect(name).toContainText('Last verified: Oct 12, 2026');
  await expect(name.getByRole('link')).toHaveAttribute('href', /hbalc/);
  await expect(fact(page, 'Opening year')).toContainText('Unknown');
  await noOverflow(page); await page.screenshot({ path: info.outputPath('expansion-tasman-details.png'), fullPage: true });
  await page.getByRole('link', { name: /Back to your collection/ }).click();
  await expect(page.getByRole('status')).toHaveText('5 of 100 properties · filtered');
  await page.getByRole('combobox', { name: 'Country / territory' }).selectOption('PE');
  await expect(page.getByRole('status')).toHaveText('4 of 100 properties · filtered'); await noOverflow(page);
});

test('new factual conflicts preserve evidence and withhold the current factual winner', async ({ page }, info) => {
  await page.goto('./#/properties/st-regis-deer-valley');
  const count = fact(page, 'Room count'); await expect(count).toContainText('Requires review — sources conflict');
  await count.locator('summary').click(); await expect(count).toContainText('Claim: 174'); await expect(count).toContainText('Claim: 181');
  await noOverflow(page); await count.screenshot({ path: info.outputPath('expansion-deer-valley-conflict.png') });
  await page.goto('./#/properties/al-bustan');
  const operating = fact(page, 'Operating status'); await expect(operating).toContainText('Requires review — sources conflict');
  await operating.locator('summary').click(); await expect(operating).toContainText('30 June 2026'); await expect(operating).toContainText('Current closure/reopening status cannot be verified');
  await noOverflow(page); await operating.screenshot({ path: info.outputPath('expansion-operating-conflict.png') });
});

test('published Waikiki exclusions and the Athenee policy contradiction remain distinct from paid products', async ({ page }, info) => {
  await page.goto('./#/benefits?property=ritz-waikiki');
  await page.getByLabel('Benefit status preview', { exact: true }).selectOption('ambassador');
  for (const label of ['Room upgrade', 'Suite upgrade', 'Late checkout', 'Your24']) await expect(card(page, label)).toContainText('Excluded at Waikiki Residences');
  await noOverflow(page); await page.screenshot({ path: info.outputPath('expansion-waikiki-exclusions.png'), fullPage: true });
  await page.getByLabel('Benefit property', { exact: true }).selectOption('athenee-bangkok');
  await expect(card(page, 'Lounge access')).toContainText('official benefit evidence conflicts');
  await card(page, 'Lounge access').getByText('Inspect lounge access rules & sources', { exact: true }).click();
  await expect(card(page, 'Lounge access')).toContainText('lounge-excluded-brands');
  await expect(card(page, 'Lounge access')).toContainText('override-athenee-bangkok-lounge');
  await noOverflow(page); await page.screenshot({ path: info.outputPath('expansion-athenee-conflict.png'), fullPage: true });
  await page.getByLabel('Benefit property', { exact: true }).selectOption('ritz-perth');
  await expect(card(page, 'Club access')).toContainText('Club access requires a qualifying booking');
});

test('new property selections persist in trips and current-version backups', async ({ page }) => {
  await page.goto('./#/trips');
  await page.getByRole('button', { name: 'Create trip', exact: true }).click();
  await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click();
  await page.getByLabel('Hotel', { exact: true }).selectOption('property-tasman-hobart');
  await page.getByLabel('Stay notes', { exact: true }).fill('Stage 9 destination plan');
  await page.reload(); await expect(page.getByLabel('Hotel', { exact: true })).toHaveValue('property-tasman-hobart');
  await expect(page.getByLabel('Stay notes', { exact: true })).toHaveValue('Stage 9 destination plan');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click();
  const data = JSON.parse(await page.getByLabel('Planner JSON', { exact: true }).inputValue());
  expect(data.schemaVersion).toBe(2); expect(JSON.stringify(data.data)).toContain('property-tasman-hobart');
});
