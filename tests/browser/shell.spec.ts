import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const properties = JSON.parse(readFileSync(new URL('../../data/properties/index.json', import.meta.url), 'utf8')) as { slug: string; name: string }[];

async function noOverflow(page: import('@playwright/test').Page) {
  const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
}

test('explorer loads all properties with intact assets and responsive cards', async ({ page }, testInfo) => {
  const applicationErrors: string[] = [];
  const brokenAssets: string[] = [];
  const assetResponses: { url: string; status: number }[] = [];
  page.on('pageerror', (error) => applicationErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') applicationErrors.push(message.text()); });
  page.on('response', (response) => {
    if (['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())) {
      assetResponses.push({ url: response.url(), status: response.status() });
      if (response.status() >= 400) brokenAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => { if (['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) brokenAssets.push(`${request.failure()?.errorText} ${request.url()}`); });
  const response = await page.goto('./', { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Find a stay worththe journey.');
  await expect(page.getByRole('status')).toHaveText('25 of 25 properties');
  await expect(page.locator('.property-card')).toHaveCount(25);
  await expect(page.getByText('Planned', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Available', { exact: true })).toHaveCount(3);
  await noOverflow(page);
  const cards = await page.locator('.property-card').evaluateAll((elements) => elements.slice(0, 2).map((element) => { const r = element.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }));
  if (testInfo.project.name === 'narrow') {
    expect(Math.abs(cards[0]!.left - cards[1]!.left)).toBeLessThan(1);
    expect(cards[1]!.top).toBeGreaterThan(cards[0]!.bottom);
  } else {
    expect(Math.abs(cards[0]!.top - cards[1]!.top)).toBeLessThan(1);
    expect(cards[1]!.left).toBeGreaterThan(cards[0]!.right);
  }
  expect(assetResponses.filter((asset) => /\/assets\/.*\.(js|css)$/.test(asset.url))).toHaveLength(2);
  expect(brokenAssets).toEqual([]); expect(applicationErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath(`explorer-viewport-${testInfo.project.name}.png`) });
  await page.screenshot({ path: testInfo.outputPath(`explorer-${testInfo.project.name}.png`), fullPage: true });
  await testInfo.attach('browser-evidence.json', { body: Buffer.from(JSON.stringify({ url: page.url(), cards, assetResponses, applicationErrors, brokenAssets }, null, 2)), contentType: 'application/json' });
});

test('combined filters, sorting, detail reload, return context and browser history work', async ({ page }, testInfo) => {
  await page.goto('./');
  await page.getByRole('combobox', { name: 'Country / territory' }).selectOption('TZ');
  await page.getByRole('combobox', { name: 'Brand', exact: true }).selectOption('brand-autograph-collection');
  await page.getByRole('combobox', { name: 'Experience', exact: true }).selectOption('wildlife');
  await page.getByRole('combobox', { name: 'Property type', exact: true }).selectOption('safari-camp');
  await page.getByRole('combobox', { name: 'Sort by' }).selectOption('name-desc');
  await expect(page.getByRole('status')).toContainText('2 of 25');
  await expect(page.locator('.property-card h2').first()).toContainText('Mereshi');
  const filteredUrl = page.url();
  await page.screenshot({ path: testInfo.outputPath(`filtered-${testInfo.project.name}.png`), fullPage: true });
  await page.getByRole('link', { name: /View details for Mereshi/ }).click();
  await expect(page).toHaveURL(/#\/properties\/mereshi\?/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mereshi Safari Camp Serengeti, Autograph Collection');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const room = page.locator('.fact-row').filter({ has: page.getByText('Room count', { exact: true }) });
  await expect(room).toContainText('18');
  await room.locator('summary').click();
  await expect(room.getByRole('link')).toHaveAttribute('href', /marriott.com\/en-us\/hotels\/lkymp-/);
  await expect(room).toContainText('High confidence');
  await expect(room).toContainText('Last verified: Oct 7, 2026');
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`mereshi-${testInfo.project.name}.png`), fullPage: true });
  await page.getByRole('link', { name: /Back to your collection/ }).click();
  await expect(page).toHaveURL(filteredUrl);
  await expect(page.getByRole('status')).toContainText('2 of 25');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Mereshi');
  await page.goForward();
  await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('name-desc');
});

test('search, incompatible filters, removable selections and reset recover the collection', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('searchbox').fill('safari Tanzania');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('2 of 25');
  await page.getByRole('combobox', { name: 'Experience', exact: true }).selectOption('beach');
  await expect(page.getByRole('heading', { name: 'No properties match these choices.' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove Experience filter' }).click();
  await expect(page.getByRole('status')).toContainText('2 of 25');
  await page.getByRole('link', { name: 'Reset all' }).click();
  await expect(page.getByRole('status')).toHaveText('25 of 25 properties');
  await expect(page.getByRole('searchbox')).toHaveValue('');
});

test('year sorting puts unknowns last and unknown filters preserve missing facts', async ({ page }) => {
  await page.goto('./#/explore?sort=opening-newest');
  await expect(page.locator('.property-card h2').first()).toContainText('Marqués de Riscal');
  await expect(page.locator('.property-card h2').nth(1)).toContainText('Hotel Imperial');
  await page.getByText('More property details', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Opening year', exact: true }).selectOption('unknown');
  await expect(page.getByRole('status')).toContainText('23 of 25');
  await page.getByRole('combobox', { name: 'Destination-property designation', exact: true }).selectOption('unknown');
  await expect(page.getByRole('status')).toContainText('23 of 25');
  await page.reload();
  await expect(page.getByRole('status')).toContainText('23 of 25');
  await noOverflow(page);
});

test('detail facts, sources, unknown booking values and editorial remain distinct', async ({ page }, testInfo) => {
  await page.goto('./#/properties/dove-mountain');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The Ritz-Carlton, Dove Mountain');
  await expect(page.getByRole('link', { name: 'Official property page', exact: true })).toHaveAttribute('href', /ritzcarlton.com\/en\/hotels\/tusrz-/);
  await expect(page.getByText('Editorial · desk review', { exact: true })).toBeVisible();
  const booking = page.getByRole('region', { name: 'Booking information' });
  await expect(booking.getByText('Unavailable', { exact: true })).toHaveCount(2);
  for (const label of ['Latitude', 'Longitude', 'Opening year', 'Operating status']) await expect(page.locator('.fact-row').filter({ has: page.getByText(label, { exact: true }) })).toContainText('Unknown');
  const airport = page.locator('.fact-row').filter({ has: page.getByText('Nearest airport', { exact: true }) });
  await expect(airport).toContainText('about 53.9 km');
  await airport.locator('summary').click();
  await expect(airport).toContainText('1 mile = 1.609344 km');
  await expect(airport).toContainText('Approximate hotel-published distance');
  await noOverflow(page);
  await page.screenshot({ path: testInfo.outputPath(`dove-mountain-${testInfo.project.name}.png`), fullPage: true });
  await expect(page.getByRole('button', { name: /Save|Add to trip/i })).toHaveCount(0);
});

test('invalid routes and unsupported filters have a clear recovery path', async ({ page }) => {
  await page.goto('./#/properties/not-in-catalog');
  await expect(page.getByRole('heading', { name: 'Property not found.' })).toBeVisible();
  await page.getByRole('link', { name: /Return to the explorer/ }).click();
  await expect(page.getByRole('status')).toHaveText('25 of 25 properties');
  await page.goto('./#/explore?brand=unsupported&country=unsupported&sort=quality');
  await expect(page.getByRole('heading', { name: 'No properties match these choices.' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Brand', exact: true })).toHaveValue('unsupported');
  await expect(page.getByRole('combobox', { name: 'Sort by' })).toHaveValue('name');
  await page.getByRole('link', { name: /View all properties/ }).click();
  await expect(page.getByRole('status')).toHaveText('25 of 25 properties');
});

test('keyboard navigation, approach anchors and direct-fragment reloads work', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('searchbox').focus();
  await page.keyboard.type('Marques Riscal');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('1 of 25');
  await page.getByRole('link', { name: /View details for Hotel Marqués/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await page.getByRole('link', { name: 'Skip to content' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await expect(page).toHaveURL(/#\/properties\/marques-de-riscal/);
  await page.getByRole('link', { name: 'Our approach', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Better planning begins with better information.' })).toBeInViewport();
  await page.getByRole('link', { name: 'What’s next', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Taking shape, one stage at a time.' })).toBeInViewport();
});

test('every catalog property opens directly with safe optional values', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const property of properties) {
    await page.goto(`./#/properties/${property.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(property.name);
    await expect(page.getByRole('region', { name: 'Booking information' }).getByText('Unavailable', { exact: true })).toHaveCount(2);
    await noOverflow(page);
  }
  expect(errors).toEqual([]);
});
