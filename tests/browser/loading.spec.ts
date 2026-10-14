import { expect, test } from '@playwright/test';

test('cold-load measurements and lazy maps document loading cost under network and CPU throttling', async ({ page }, info) => {
  test.setTimeout(90000);
  const cdp = await page.context().newCDPSession(page); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 200000, uploadThroughput: 100000 });
  await page.addInitScript(() => {
    const audit = { paints: [] as { name: string; startTime: number }[], lcp: 0, longTasks: [] as number[] }; (window as unknown as { loadingAudit: typeof audit }).loadingAudit = audit;
    new PerformanceObserver(list => list.getEntries().forEach(e => audit.paints.push({ name: e.name, startTime: e.startTime }))).observe({ type: 'paint', buffered: true });
    new PerformanceObserver(list => list.getEntries().forEach(e => { audit.lcp = e.startTime; })).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => list.getEntries().forEach(e => audit.longTasks.push(e.duration))).observe({ type: 'longtask', buffered: true });
  });
  const samples = [];
  for (let i = 0; i < 3; i++) {
    const start = Date.now(); await page.goto('./'); await expect(page.getByRole('status')).toHaveText('100 of 100 properties'); await page.getByRole('searchbox').fill('Mapito'); await page.getByRole('button', { name: 'Search', exact: true }).click(); await expect(page.getByRole('status')).toContainText('1 of 100');
    samples.push(await page.evaluate(elapsed => ({ elapsedToSearchMs: elapsed, metrics: (window as unknown as { loadingAudit: unknown }).loadingAudit, navigation: performance.getEntriesByType('navigation').map(e => ({ duration: e.duration })), resources: performance.getEntriesByType('resource').map(e => { const r = e as PerformanceResourceTiming; return { name: r.name.split('/').pop(), transferBytes: r.transferSize, decodedBytes: r.decodedBodySize, duration: r.duration }; }) }), Date.now() - start));
    expect(samples[i]!.resources.some(r => /land-|GeographicMap/.test(r.name ?? ''))).toBe(false);
  }
  await info.attach('loading-measurements.json', { body: JSON.stringify({ cpuSlowdown: 4, latencyMs: 150, downloadBytesPerSecond: 200000, samples }, null, 2), contentType: 'application/json' });
  await cdp.detach();
});
