import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { portfolioFixture } from '../fixtures/portfolio';
import type { PlannerData } from '../../lib/storage/planner';
const card = (page: Page, label: string) => page.getByRole('article', { name: label, exact: true });
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
const seed = async (page: Page, data = portfolioFixture('property-jw-tampa')) => {
  const envelope = { appId: 'marriott-trip-planner', schemaVersion: 2, exportedAt: '2026-10-13T12:00:00.000Z', data };
  await page.addInitScript((json) => { if (!localStorage.getItem('marriott-trip-planner:v1')) localStorage.setItem('marriott-trip-planner:v1', json); }, JSON.stringify(envelope));
  await page.goto('./#/portfolio'); await expect(page.getByRole('heading', { name: 'Plan your travel portfolio.' })).toBeVisible();
};
test('three strategies, ledger arithmetic, responsive layouts, and exact backup reconstruction', async ({ page }, info) => {
  await seed(page); const before = await page.evaluate(() => localStorage.getItem('marriott-trip-planner:v1'));
  await expect(card(page, 'Cash conservation')).toContainText('$1,000.00'); await expect(card(page, 'Redemption value')).toContainText('2.000 USD cents/point');
  await expect(card(page, 'Balanced')).toContainText('70,000 points'); await noOverflow(page);
  await page.locator('.portfolio-controls').screenshot({ path: info.outputPath('portfolio-controls.png') }); await page.locator('.portfolio-strategies').screenshot({ path: info.outputPath('portfolio-strategies.png') });
  await page.getByRole('button', { name: 'Inspect cash conservation', exact: true }).click(); await expect(page.getByRole('article', { name: 'Allocation 1', exact: true })).toContainText('100,000 points');
  await page.locator('.portfolio-ledger').screenshot({ path: info.outputPath('portfolio-ledger.png') });
  expect(await page.evaluate(() => localStorage.getItem('marriott-trip-planner:v1'))).toBe(before);
  await page.getByRole('navigation').getByRole('link', { name: 'Profile', exact: true }).click(); await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click();
  const exported = await page.getByLabel('Planner JSON', { exact: true }).inputValue(); expect(JSON.parse(exported).schemaVersion).toBe(2); expect(JSON.parse(exported).data).toEqual(JSON.parse(before!).data);
  await page.getByLabel('Profile points balance', { exact: true }).fill('1'); await page.getByLabel('Planner JSON', { exact: true }).fill(exported); await page.getByRole('button', { name: 'Review import', exact: true }).click(); await page.getByRole('button', { name: 'Import and replace planner', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Portfolio', exact: true }).click(); await expect(card(page, 'Cash conservation')).toContainText('$1,000.00'); await page.reload(); await expect(card(page, 'Balanced')).toContainText('70,000 points'); await noOverflow(page);
});
test('priorities, impossible budget, selection and keyboard inspection remain transient', async ({ page }, info) => {
  await seed(page); const before = await page.evaluate(() => localStorage.getItem('marriott-trip-planner:v1'));
  await page.getByLabel('Priority for City', { exact: true }).selectOption('3'); await expect(page.getByRole('article', { name: 'Allocation 3', exact: true })).toContainText('80,000 points');
  await page.getByLabel('Selected-trip cash budget (USD, optional)', { exact: true }).fill('999'); await expect(card(page, 'Cash conservation')).toContainText('No allocation fits'); await page.locator('.portfolio-strategies').screenshot({ path: info.outputPath('portfolio-infeasible.png') });
  await page.getByLabel('Selected-trip cash budget (USD, optional)', { exact: true }).fill(''); await page.getByLabel('Include Luxury', { exact: true }).uncheck(); await expect(page.getByRole('article', { name: 'Allocation 3', exact: true })).toHaveCount(0);
  const inspect = page.getByRole('button', { name: 'Inspect redemption value', exact: true }); await inspect.focus(); await page.keyboard.press('Enter'); await expect(inspect).toHaveAttribute('aria-pressed', 'true'); await noOverflow(page);
  expect(await page.evaluate(() => localStorage.getItem('marriott-trip-planner:v1'))).toBe(before); await page.reload(); await expect(page.getByLabel('Priority for City', { exact: true })).toHaveValue('1'); await expect(page.getByLabel('Include Luxury', { exact: true })).toBeChecked();
});
test('single-use certificate top-off and inventory are inspectable across trips', async ({ page }, info) => {
  const d = portfolioFixture('property-jw-tampa'); d.profile.certificates = [{ id: 'cert-one', label: 'Annual award', points: 60000, expiresOn: '2027-12-31', notes: '' }]; await seed(page, d);
  await page.getByRole('checkbox', { name: /Confirm certificate-eligible/ }).nth(2).check(); await page.getByRole('button', { name: 'Inspect cash conservation', exact: true }).click();
  const a = page.getByRole('article', { name: 'Allocation 3', exact: true }); await expect(a).toContainText('Top-off points'); await expect(a).toContainText('20,000 points'); await expect(a).toContainText('50,000 points');
  await a.getByText('Inspect alternatives and balances', { exact: true }).click(); await expect(a).toContainText('Remaining certificate inventory: None'); await a.screenshot({ path: info.outputPath('portfolio-certificate.png') }); await noOverflow(page);
});
test('unknown chosen cash and fixed resource uncertainty stay partial', async ({ page }, info) => {
  const d = portfolioFixture('property-jw-tampa'); d.workspace.trips[0]!.stays[0]!.pricing.cashTaxes = null; await seed(page, d);
  await expect(card(page, 'Cash conservation')).toContainText('Incomplete assessment'); await expect(card(page, 'Cash conservation')).toContainText('$400.00 · partial'); await expect(page.getByRole('article', { name: 'Allocation 1', exact: true })).toContainText('Cash quote, taxes or mandatory fees unknown.');
  await page.locator('.portfolio-strategies').screenshot({ path: info.outputPath('portfolio-incomplete.png') }); await noOverflow(page);
  await page.evaluate(() => { const e = JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!); e.data.workspace.trips[0].stays[0].bookingMethod = 'points'; e.data.workspace.trips[0].stays[0].pricing.awardPoints = null; localStorage.setItem('marriott-trip-planner:v1', JSON.stringify(e)); }); await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'New points and certificate allocations are withheld' })).toBeVisible(); await expect(card(page, 'Cash conservation')).toContainText('Unknown'); await expect(card(page, 'Redemption value')).toContainText('aggregate CPP cannot be ranked');
});
test('reserved resources outside selection remain held; duplicate certificate fails closed', async ({ page }, info) => {
  const d: PlannerData = portfolioFixture('property-jw-tampa'); d.workspace.trips[0]!.stays[0]!.bookingMethod = 'points'; d.workspace.trips[0]!.stays[0]!.reservationStatus = 'reserved'; await seed(page, d);
  await page.getByLabel('Include Luxury', { exact: true }).uncheck(); await expect(card(page, 'Cash conservation')).toContainText('$1,000.00'); await expect(card(page, 'Cash conservation')).toContainText('0 points'); await expect(page.locator('.portfolio-ledger')).toContainText('Reserved outside selection: 100,000 points');
  await page.evaluate(() => { const e = JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!); e.data.profile.certificates = [{ id: 'cert-one', label: 'Annual award', points: 100000, expiresOn: '2027-12-31', notes: '' }]; for (const t of e.data.workspace.trips.slice(0, 2)) { t.stays[0].bookingMethod = 'certificate'; t.stays[0].reservationStatus = 'reserved'; t.stays[0].certificate = { id: 'cert-one', eligibility: 'eligible' }; } localStorage.setItem('marriott-trip-planner:v1', JSON.stringify(e)); }); await page.reload();
  await expect(page.getByRole('alert')).toContainText('more than one stay'); await page.getByRole('alert').screenshot({ path: info.outputPath('portfolio-duplicate-certificate.png') }); await noOverflow(page);
});
test('empty portfolio recovers and route query/comparison context survives', async ({ page }, info) => {
  await page.goto('./#/portfolio?country=TZ&compare=jw-tampa'); await expect(page.getByText('Create saved trips in Trip builder to compare strategies.')).toBeVisible(); await noOverflow(page); await page.screenshot({ path: info.outputPath('portfolio-empty.png'), fullPage: true });
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Trip builder', exact: true })).toHaveAttribute('href', '#/trips?country=TZ&compare=jw-tampa');
  await page.getByRole('navigation').getByRole('link', { name: 'Trip builder', exact: true }).click(); await page.getByRole('button', { name: 'Create trip', exact: true }).click(); await page.getByRole('button', { name: 'Add hotel stay', exact: true }).click();
  await page.getByRole('navigation').getByRole('link', { name: 'Portfolio', exact: true }).click(); await expect(card(page, 'Cash conservation')).toContainText('Incomplete assessment'); await expect(page.getByRole('navigation').getByRole('link', { name: 'Compare (1)', exact: true })).toBeVisible();
});
