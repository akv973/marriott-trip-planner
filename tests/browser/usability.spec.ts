import { expect, test } from '@playwright/test';
import { portfolioFixture } from '../fixtures/portfolio';
import { createWatchTarget } from '../../lib/watchlist/watchlist';
const key = 'marriott-trip-planner:v1';
const seed = async (page: import('@playwright/test').Page) => {
  const data = portfolioFixture('property-dove-mountain');
  data.profile.certificates = [1, 2].map(n => ({id: `award-${n}`, label: `Award ${n}`, points: 85000, expiresOn: '2028-12-31', notes: ''}));
  data.watchlist = [1, 2].map(n => createWatchTarget(`target-${n}`, 'property-dove-mountain'));
  const trip = data.workspace.trips[0]!; trip.stays.push({...structuredClone(trip.stays[0]!), id: 'second-stay'});
  await page.addInitScript(({key, data}) => localStorage.setItem(key, JSON.stringify({appId:'marriott-trip-planner',schemaVersion:2,exportedAt:'2026-10-13T12:00:00Z',data})), {key,data});
};
for (const item of [
  {route:'watchlist', remove:'Remove target 1', next:'Target check-in', add:'Add watch target'},
  {route:'profile', remove:'Remove certificate 1', next:'Award label', add:'Add certificate'},
  {route:'trips', remove:'Remove stay 1', next:'Hotel', add:'Add hotel stay'},
]) test(`keyboard removal of ${item.route} items keeps a usable focus position`, async ({page}) => {
  await seed(page); await page.goto(`./#/${item.route}`);
  await page.getByRole('button',{name:item.remove,exact:true}).focus(); await page.keyboard.press('Enter');
  await expect(page.getByLabel(item.next,{exact:true})).toBeFocused();
  await page.getByRole('button',{name:item.remove,exact:true}).focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:item.add,exact:true})).toBeFocused();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).data,key);
  if(item.route==='watchlist') {expect(saved.watchlist).toEqual([]);expect(saved.workspace.trips).toHaveLength(3);}
  if(item.route==='profile') {expect(saved.profile.certificates).toEqual([]);expect(saved.watchlist).toHaveLength(2);}
  if(item.route==='trips') {expect(saved.workspace.trips[0].stays).toEqual([]);expect(saved.profile.certificates).toHaveLength(2);}
});
test('keyboard disclosure and 320px comparison keep source text readable and scroll contained', async ({page},info) => {
  await page.goto('./#/compare?compare=dove-mountain&compare=mapito&compare=mereshi&compare=jw-sao-paulo');
  await page.setViewportSize({width:320,height:844});
  const airport = page.getByRole('row').filter({has:page.getByRole('rowheader',{name:'Nearest airport',exact:true})}).getByRole('cell').first();
  const summary = airport.locator('summary'); await summary.focus(); await page.keyboard.press('Enter');
  await expect(airport).toContainText('1 mile = 1.609344 km'); await expect(airport.getByRole('link')).toBeVisible(); await expect(summary).toBeFocused();
  const detail = airport.locator('details'); await expect(detail).toHaveAttribute('open','');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  await airport.screenshot({path:info.outputPath('usability-source-disclosure-320.png')});
});
test('cold engine startup responds to a real search and defers optional map assets', async ({browser,baseURL},info) => {
  test.setTimeout(90000); const samples=[];
  for(let i=0;i<3;i++) {
    const context=await browser.newContext({viewport:info.project.use.viewport ?? {width:1366,height:900}});const page=await context.newPage();const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const started=Date.now();await page.goto(baseURL!);await expect(page.getByRole('status')).toHaveText('100 of 100 properties');
    await page.getByRole('searchbox').fill('Mapito');await page.getByRole('button',{name:'Search',exact:true}).click();await expect(page.getByRole('status')).toContainText('1 of 100');
    const elapsedToSearchMs=Date.now()-started;
    const metrics=await page.evaluate(() => ({userAgent:navigator.userAgent,supportedEntryTypes:PerformanceObserver.supportedEntryTypes,paints:performance.getEntriesByType('paint').map(e=>({name:e.name,startTime:e.startTime})),navigation:performance.getEntriesByType('navigation').map(e=>({duration:e.duration})),resources:performance.getEntriesByType('resource').map(e=>({name:e.name.split('/').pop(),duration:e.duration,transferBytes:(e as PerformanceResourceTiming).transferSize,decodedBytes:(e as PerformanceResourceTiming).decodedBodySize}))}));
    expect(metrics.resources.some(r=>/land-|GeographicMap/.test(r.name??''))).toBe(false);expect(errors).toEqual([]);samples.push({elapsedToSearchMs,...metrics});await context.close();
  }
  await info.attach('engine-loading.json',{body:JSON.stringify({browserVersion:browser.version(),viewport:info.project.use.viewport ?? {width:1366,height:900},throttled:false,samples},null,2),contentType:'application/json'});
});
