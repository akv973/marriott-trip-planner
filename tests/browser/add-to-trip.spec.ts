import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { createStay, createTrip } from '../../lib/trips/trips';
import { emptyPlanner } from '../../lib/storage/planner';
import legacy from '../fixtures/planner-stage-7-v1.json' with { type: 'json' };
const key = 'marriott-trip-planner:v1';
const saved = (page: Page) => page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data, key);
const bytes = (page: Page) => page.evaluate(key => localStorage.getItem(key), key);
const noOverflow = async (page: Page) => expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(() => innerWidth));
const trigger = (page: Page) => page.getByRole('button', { name: /Add to trip: Mapito/ });
const submit = (page: Page) => page.getByRole('button', { name: 'Add stay and open trip', exact: true });
const nav = (page: Page, name: string) => page.getByRole('navigation').getByRole('link', { name, exact: true });
const openExplorer = (page: Page) => page.goto('./#/explore?q=Mapito&country=TZ&compare=jw-tampa');
const seed = async (page: Page, envelope: unknown) => {
  await page.addInitScript(({ key, json }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, json); }, { key, json: JSON.stringify(envelope) });
};

test('keyboard Explorer flow cancels without writes, creates once, focuses the new stay, and retains history/context', async ({ page }, info) => {
  await openExplorer(page); const origin = page.url(); const before = await bytes(page);
  await trigger(page).focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel('Destination trip', { exact: true })).toBeFocused();
  await page.getByLabel('New trip name', { exact: true }).fill('Discard this'); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(trigger(page)).toBeFocused(); expect(await bytes(page)).toBe(before); expect(page.url()).toBe(origin);
  await page.keyboard.press('Enter'); await expect(page.getByLabel('New trip name', { exact: true })).toHaveValue('Untitled trip');
  // Shift+Tab wraps within the native modal, never reaching page navigation.
  await page.keyboard.press('Shift+Tab'); await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
  await page.keyboard.press('Tab'); await expect(page.getByLabel('Destination trip', { exact: true })).toBeFocused();
  await page.getByLabel('New trip name', { exact: true }).fill('Safari planning'); await noOverflow(page);
  await page.screenshot({ path: info.outputPath('add-trip-new-dialog.png') });
  // Two synchronous submissions must represent one intentional addition.
  await submit(page).evaluate(button => { const form = (button as HTMLButtonElement).form!; form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByLabel('Trip name', { exact: true })).toHaveValue('Safari planning');
  await expect(page.getByLabel('Hotel', { exact: true })).toHaveValue('property-mapito'); await expect(page.getByLabel('Hotel', { exact: true })).toBeFocused();
  expect((await saved(page)).workspace.trips[0].stays).toEqual([createStay('stay-2', 'property-mapito')]);
  await expect(nav(page, 'Compare (1)')).toBeVisible(); await noOverflow(page); await page.screenshot({ path: info.outputPath('add-trip-arrival.png') });
  await page.getByRole('link', { name: /Back to where you chose this hotel/ }).click(); expect(page.url()).toBe(origin);
  await expect(page.getByRole('status')).toHaveText('1 of 100 properties · filtered'); await page.goBack(); await expect(page.getByLabel('Trip name')).toHaveValue('Safari planning');
  await page.goBack(); expect(page.url()).toBe(origin); await page.goForward(); expect((await saved(page)).workspace.trips[0].stays).toHaveLength(1);
});

test('details append to a selected inactive v1 trip, permit repeat stays, persist and reconstruct exact v2 backups', async ({ page }, info) => {
  test.setTimeout(90000); await seed(page, legacy); await openExplorer(page);
  await page.getByRole('link', { name: /View details for Mapito/ }).click(); const origin = page.url();
  await expect(page.locator('.unavailable-panel')).toContainText('Unavailable'); await trigger(page).click();
  await page.getByLabel('Destination trip', { exact: true }).selectOption(''); await page.getByLabel('New trip name', { exact: true }).fill('Separate trip'); await submit(page).click();
  const separate = (await saved(page)).workspace.trips.at(-1);
  await page.getByRole('link', { name: /Back to where you chose this hotel/ }).click(); expect(page.url()).toBe(origin); await trigger(page).click();
  await page.getByLabel('Destination trip', { exact: true }).selectOption(legacy.data.workspace.trips[0]!.id);
  await page.screenshot({ path: info.outputPath('add-trip-existing-dialog.png') }); await submit(page).focus(); await page.keyboard.press('Enter');
  const index = legacy.data.workspace.trips[0]!.stays.length + 1;
  await expect(page.getByRole('article', { name: `Stay ${index}`, exact: true }).getByLabel('Hotel', { exact: true })).toBeFocused();
  let after = await saved(page); expect(after.workspace.trips.at(-1)).toEqual(separate); expect(after.profile).toEqual(legacy.data.profile);
  expect(after.workspace.trips[0].stays.slice(0, -1)).toEqual(legacy.data.workspace.trips[0]!.stays);
  await page.getByRole('link', { name: /Back to where you chose this hotel/ }).click(); await trigger(page).click(); await submit(page).click();
  after = await saved(page); expect(after.workspace.trips[0].stays).toHaveLength(index + 1); const ids = after.workspace.trips.flatMap((t: { id: string; stays: { id: string }[] }) => [t.id, ...t.stays.map(s => s.id)]); expect(new Set(ids).size).toBe(ids.length);
  await page.reload(); expect(await saved(page)).toEqual(after); await nav(page, 'Profile').click();
  await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); const json = await page.getByLabel('Planner JSON', { exact: true }).inputValue(); expect(JSON.parse(json).data).toEqual(after);
  await nav(page, 'Trip builder').click(); await page.getByRole('button', { name: 'Remove stay 1', exact: true }).click(); await nav(page, 'Profile').click();
  await page.getByLabel('Planner JSON', { exact: true }).fill(json); await page.getByRole('button', { name: 'Review import', exact: true }).click(); await page.getByRole('button', { name: 'Import and replace planner', exact: true }).click(); await page.reload(); expect(await saved(page)).toEqual(after); await noOverflow(page);
});

test('full trips and the trip limit are explicit; another eligible trip remains usable and cancellation is inert', async ({ page }, info) => {
  const data = emptyPlanner(); data.workspace = { trips: Array.from({ length: 10 }, (_, i) => ({ ...createTrip(`trip-${i + 1}`), name: `Saved trip ${i + 1}`, stays: i === 0 ? Array.from({ length: 30 }, (_, j) => createStay(`stay-${11 + j}`, 'property-mapito')) : [] })), activeId: 'trip-1', sequence: 41 };
  await seed(page, { ...legacy, schemaVersion: 2, data }); await openExplorer(page); const before = await bytes(page); await trigger(page).click();
  await expect(page.getByRole('option', { name: /Saved trip 1 ·/ })).toBeDisabled(); await expect(page.getByRole('option', { name: /Create a new trip/ })).toBeDisabled(); await expect(page.getByLabel('Destination trip')).toHaveValue('trip-2');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(await bytes(page)).toBe(before); await trigger(page).click(); await submit(page).click();
  await expect(page.getByLabel('Choose trip')).toHaveValue('trip-2'); expect((await saved(page)).workspace.trips[0]).toEqual(data.workspace.trips[0]);
  const full = await saved(page); full.workspace.trips.forEach((t: { stays: ReturnType<typeof createStay>[] }, i: number) => { t.stays = Array.from({ length: 30 }, (_, j) => createStay(`stay-${100 + i * 30 + j}`, 'property-mapito')); }); full.workspace.sequence = 400;
  await page.evaluate(({ key, full, legacy }) => localStorage.setItem(key, JSON.stringify({ ...legacy, schemaVersion: 2, data: full })), { key, full, legacy });
  await openExplorer(page); await page.reload(); const fullBytes = await bytes(page); await trigger(page).click(); await expect(submit(page)).toBeDisabled(); await expect(page.getByRole('dialog')).toContainText('No room for this stay'); await noOverflow(page); await page.screenshot({ path: info.outputPath('add-trip-limits.png') });
  await page.keyboard.press('Escape'); expect(await bytes(page)).toBe(fullBytes); await expect(trigger(page)).toBeFocused();
});

test('storage quota and competing-tab failures preserve saved plans and disclose the in-memory addition', async ({ page }) => {
  await seed(page, legacy); await openExplorer(page); await trigger(page).click(); const before = await bytes(page);
  await page.evaluate(() => { Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); }; }); await submit(page).click();
  await expect(page.locator('.storage-status')).toContainText('Could not save'); expect(await bytes(page)).toBe(before); expect(await page.getByLabel('Hotel', { exact: true }).count()).toBe(legacy.data.workspace.trips[0]!.stays.length + 1);
  await page.reload(); await openExplorer(page); await trigger(page).click();
  await page.evaluate(key => { const envelope = JSON.parse(localStorage.getItem(key)!); envelope.data.profile.balance = 123; localStorage.setItem(key, JSON.stringify(envelope)); }, key);
  const competing = await bytes(page); await submit(page).click(); await expect(page.locator('.storage-status')).toContainText('changed in another tab'); expect(await bytes(page)).toBe(competing);
  await nav(page, 'Profile').click(); await page.getByRole('button', { name: 'Export planner JSON', exact: true }).click(); expect(JSON.parse(await page.getByLabel('Planner JSON').inputValue()).data.workspace.trips[0].stays).toHaveLength(legacy.data.workspace.trips[0]!.stays.length + 1);
});

test('320px dialog reflows with long trip names and rejects blank new names without changing plans', async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 700 }); const data = emptyPlanner(); data.workspace = { trips: [{ ...createTrip('trip-1'), name: 'A'.repeat(200) }], activeId: 'trip-1', sequence: 2 };
  await seed(page, { ...legacy, schemaVersion: 2, data }); await openExplorer(page); const before = await bytes(page); await trigger(page).click(); await noOverflow(page);
  const modal = page.getByRole('dialog'); expect(await modal.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('add-trip-320-existing.png') }); await page.getByLabel('Destination trip').selectOption(''); await page.getByLabel('New trip name').fill('   '); await expect(submit(page)).toBeDisabled();
  await page.getByLabel('New trip name').fill('A valid new trip'); await noOverflow(page); await page.screenshot({ path: info.outputPath('add-trip-320-new.png') }); await page.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(await bytes(page)).toBe(before);
});
