import { expect, test } from '@playwright/test';

test('shell loads with intact assets and fits its viewport', async ({ page }, testInfo) => {
  const applicationErrors: string[] = [];
  const brokenAssets: string[] = [];
  const assetResponses: { url: string; status: number }[] = [];
  page.on('pageerror', (error) => applicationErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') applicationErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (['script', 'stylesheet', 'image', 'font'].includes(response.request().resourceType())) {
      assetResponses.push({ url: response.url(), status: response.status() });
      if (response.status() >= 400) brokenAssets.push(`${response.status()} ${response.url()}`);
    }
  });
  page.on('requestfailed', (request) => {
    if (['script', 'stylesheet', 'image', 'font'].includes(request.resourceType())) {
      brokenAssets.push(`${request.failure()?.errorText ?? 'Failed request'} ${request.url()}`);
    }
  });

  const response = await page.goto('./', { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText('Catalog not yet populated')).toBeVisible();
  await expect(page.getByText('Planned', { exact: true })).toHaveCount(3);

  const layout = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.roadmap-card')].map((card) => {
      const rect = card.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, cards };
  });
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.cards).toHaveLength(3);
  const first = layout.cards[0]!;
  const second = layout.cards[1]!;
  if (testInfo.project.name === 'narrow') {
    expect(Math.abs(first.left - second.left)).toBeLessThan(1);
    expect(second.top).toBeGreaterThan(first.bottom);
  } else {
    expect(Math.abs(first.top - second.top)).toBeLessThan(1);
    expect(second.left).toBeGreaterThan(first.right);
  }
  expect(assetResponses.filter((asset) => /\/assets\/.*\.(js|css)$/.test(asset.url))).toHaveLength(2);
  expect(brokenAssets).toEqual([]);
  expect(applicationErrors).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath(`stage-0-${testInfo.project.name}.png`), fullPage: true });
  await testInfo.attach('browser-evidence.json', {
    body: Buffer.from(JSON.stringify({ url: page.url(), layout, assetResponses, applicationErrors, brokenAssets }, null, 2)),
    contentType: 'application/json',
  });
});

test('anchor navigation survives a direct fragment reload', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Our approach', exact: true }).click();
  await expect(page).toHaveURL(/\/marriott-trip-planner\/#foundation$/);
  await expect(page.getByRole('heading', { name: 'Better planning begins with better information.' })).toBeInViewport();
  await page.getByRole('link', { name: 'What’s next', exact: true }).click();
  await expect(page).toHaveURL(/\/marriott-trip-planner\/#roadmap$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Taking shape, one stage at a time.' })).toBeInViewport();
  await page.getByRole('link', { name: 'Overview', exact: true }).click();
  await expect(page).toHaveURL(/\/marriott-trip-planner\/#overview$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeInViewport();
});
