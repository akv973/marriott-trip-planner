import { expect,test } from '@playwright/test';
import type { Page } from '@playwright/test';
const panel=(page:Page,title='Property location')=>page.getByRole('region',{name:title,exact:true});
const noOverflow=async(page:Page)=>expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
test('published pins have inspectable sources and optional maps retain discovery context',async({page},info)=>{
  const external:string[]=[];page.on('request',r=>{if(r.url().includes('tile.openstreetmap.org'))external.push(r.url());});
  await page.goto('./#/properties/dove-mountain?tag=desert&compare=mapito');
  await expect(panel(page)).toContainText('1 of 1 properties mapped · 0 locations unknown');
  const latitude=page.locator('.fact-row').filter({has:page.getByText('Latitude',{exact:true})});
  await latitude.locator('summary').click();await expect(latitude).toContainText('Oct 13, 2026');await expect(latitude).toContainText('32.467144');
  await expect(latitude.getByRole('link')).toHaveAttribute('href',/tusrz/);
  await panel(page).getByRole('button',{name:'Show geographic map'}).click();
  await expect(panel(page).getByRole('img',{name:'Property geography map'})).toBeVisible();expect(external).toEqual([]);
  await panel(page).getByRole('button',{name:'Zoom in'}).click();await panel(page).getByRole('button',{name:'Pan east'}).click();
  await panel(page).getByRole('button',{name:'Fit locations'}).click();
  const pin = await page.locator('.map-pin circle').first().boundingBox(); expect(pin!.width).toBeGreaterThanOrEqual(27); expect(pin!.width).toBeLessThanOrEqual(30);
  await noOverflow(page);await panel(page).screenshot({path:info.outputPath('maps-property.png')});
  await page.getByRole('link',{name:/Back to your collection/}).click();await expect(page).toHaveURL(/explore\?tag=desert&compare=mapito/);await expect(page.locator('.property-card').first()).toBeVisible();
});
test('map data failure and retry preserve location evidence and independent explorer',async({page},info)=>{
  await page.route('**/assets/land-*.json',r=>r.abort());
  await page.goto('./#/properties/mapito?country=TZ');await panel(page).getByRole('button',{name:'Show geographic map'}).click();
  await expect(panel(page)).toContainText('Geographic map unavailable');await expect(panel(page).getByRole('link',{name:/Mapito Safari/})).toBeVisible();
  await noOverflow(page);await panel(page).screenshot({path:info.outputPath('maps-data-failure.png')});
  await page.unroute('**/assets/land-*.json');await panel(page).getByRole('button',{name:'Retry map',exact:true}).click();
  await expect(panel(page).getByRole('img')).toBeVisible();await panel(page).screenshot({path:info.outputPath('maps-data-recovered.png')});
  await page.getByRole('link',{name:/Back to your collection/}).click();await expect(page.getByRole('status')).toHaveText('2 of 100 properties · filtered');
});
test('street maps are opt-in, visibly attributed, bounded, and recover after provider failure',async({page},info)=>{
  await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
  await page.goto('./#/properties/jw-tampa');await panel(page).getByRole('button',{name:'Show geographic map'}).click();await expect(panel(page).getByRole('img')).toBeVisible();
  await panel(page).getByRole('button',{name:'Load street map',exact:true}).click();await expect(panel(page)).toContainText('Street map unavailable');
  await expect(panel(page).getByRole('img')).toBeVisible();await noOverflow(page);await panel(page).screenshot({path:info.outputPath('maps-street-failure.png')});
  await page.unroute('https://tile.openstreetmap.org/**');const requests:string[]=[];
  await page.route('https://tile.openstreetmap.org/**',r=>{requests.push(r.request().url());return r.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dce9ed"/></svg>'});});
  await panel(page).getByRole('button',{name:'Retry street map',exact:true}).click();
  await expect(panel(page).getByRole('link',{name:'© OpenStreetMap contributors'})).toBeVisible();
  await expect.poll(()=>page.locator('.map-canvas image').count()).toBeGreaterThan(0);
  expect(requests.length).toBeLessThanOrEqual(40);expect(requests.every(url=>/\.org\/\d+\/\d+\/\d+\.png$/.test(url))).toBe(true);
  await panel(page).getByRole('button',{name:'Use geographic overview'}).click();await expect(panel(page).getByRole('link',{name:'Natural Earth · public domain'})).toBeVisible();
});
test('trip maps preserve ordered repeat visits and exact backups through reload and restoration',async({page},info)=>{
  await page.goto('./#/trips');await page.getByRole('button',{name:'Create trip',exact:true}).click();
  for(const id of ['property-mapito','property-mereshi','property-mapito']){await page.getByRole('button',{name:'Add hotel stay',exact:true}).click();await page.getByLabel('Hotel',{exact:true}).last().selectOption(id);}
  const data=await page.evaluate(()=>JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!).data);
  const tripMap=panel(page,'Trip geography');await expect(tripMap).toContainText('3 of 3 stays mapped');await tripMap.getByRole('button',{name:'Show geographic map'}).click();
  await expect(tripMap.getByRole('img',{name:'Trip geography map'})).toBeVisible();await expect(page.locator('.map-pin')).toHaveCount(3);await expect(page.locator('.map-segment')).toHaveCount(2);
  await tripMap.getByLabel('Focus location').selectOption({index:2});await tripMap.getByRole('button',{name:'Fit locations'}).click();await noOverflow(page);await tripMap.screenshot({path:info.outputPath('maps-itinerary.png')});
  await page.reload();await expect(tripMap).toContainText('3 of 3 stays mapped');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!).data)).toEqual(data);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();await page.getByRole('button',{name:'Export planner JSON'}).click();const json=await page.getByLabel('Planner JSON',{exact:true}).inputValue();expect(JSON.parse(json).data).toEqual(data);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Trip builder',exact:true}).click();await page.getByRole('button',{name:'Delete this trip'}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Profile',exact:true}).click();await page.getByLabel('Planner JSON',{exact:true}).fill(json);await page.getByRole('button',{name:'Review import'}).click();await page.getByRole('button',{name:'Import and replace planner'}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:'Trip builder',exact:true}).click();await expect(tripMap).toContainText('3 of 3 stays mapped');expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!).data)).toEqual(data);
  await page.getByRole('button',{name:'Move stay 2 earlier'}).click();await expect(tripMap.getByRole('listitem').first()).toContainText('Mereshi');
});
test('comparison geography and map-chunk failure remain isolated from the saved planner',async({page},info)=>{
  await page.goto('./#/trips');await page.getByRole('button',{name:'Create trip',exact:true}).click();await page.getByRole('button',{name:'Add hotel stay',exact:true}).click();
  const saved=await page.evaluate(()=>localStorage.getItem('marriott-trip-planner:v1'));
  await page.route('**/assets/GeographicMap-*.js',r=>r.abort());await page.goto('./#/compare?compare=mapito&compare=mereshi&country=TZ');
  const compared=panel(page,'Compared property locations');await compared.getByRole('button',{name:'Show geographic map'}).click();await expect(compared).toContainText('Map unavailable');await expect(page.getByRole('table')).toBeVisible();
  await page.unroute('**/assets/GeographicMap-*.js');await compared.getByRole('button',{name:'Reload page',exact:true}).click();await compared.getByRole('button',{name:'Show geographic map'}).click();await expect(compared.getByRole('img')).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('marriott-trip-planner:v1'))).toBe(saved);await noOverflow(page);await compared.screenshot({path:info.outputPath('maps-comparison.png')});
});
