import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
const backup = readFileSync(new URL('../fixtures/planner-stage-7-v1.json',import.meta.url),'utf8');
const original = JSON.parse(backup).data;
const noOverflow = async (page: import('@playwright/test').Page) => expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(await page.evaluate(()=>innerWidth));
const nav = (page: import('@playwright/test').Page, name: string) => page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name,exact:true}).click();
const card = (page: import('@playwright/test').Page, name:string) => page.getByRole('article',{name,exact:true});

test('Stage 7 saved backup loads intact and its status drives property and comparison benefits',async({page},info)=>{
 await page.addInitScript(json=>localStorage.setItem('marriott-trip-planner:v1',json),backup);
 await page.goto('./#/benefits?property=jw-tampa');await expect(page.getByRole('heading',{level:1})).toHaveText('Understand your elite benefits.');
 await expect(page.getByLabel('Benefit status preview',{exact:true})).toHaveValue('profile');await expect(card(page,'Lounge access')).toContainText('Elite lounge access, member +1');
 await card(page,'Lounge access').getByText('Inspect lounge access rules & sources',{exact:true}).click();await expect(card(page,'Lounge access').getByRole('link',{name:/Tampa/})).toHaveAttribute('href',/tpajd/);await expect(card(page,'Lounge access')).toContainText('takes precedence');
 await noOverflow(page);await page.screenshot({path:info.outputPath('benefits-property-precedence.png'),fullPage:true});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!).data)).toEqual(original);
 await nav(page,'Trip builder');await expect(page.getByLabel('Trip name',{exact:true})).toHaveValue('Stage 7 saved trip');await expect(page.getByLabel('Stay notes',{exact:true})).toHaveValue('Keep this manual stay');
 await nav(page,'Profile');await page.getByRole('button',{name:'Export planner JSON',exact:true}).click();const after=JSON.parse(await page.getByLabel('Planner JSON',{exact:true}).inputValue());expect(after.data).toEqual(original);expect(after.schemaVersion).toBe(1);
 await page.goto('./#/compare?compare=jw-tampa&compare=half-moon-bay');await expect(page.locator('tbody.comparison-benefits')).toContainText('Club access requires a qualifying booking');await expect(page.locator('tbody.comparison-benefits')).toContainText('Elite lounge access, member +1');await noOverflow(page);
});
test('status previews recalculate rules and preserve saved profile on reload',async({page},info)=>{
 await page.goto('./#/profile');await page.getByLabel('Bonvoy status',{exact:true}).selectOption('platinum');await nav(page,'Elite benefits');
 await page.getByLabel('Benefit property',{exact:true}).selectOption('half-moon-bay');await expect(card(page,'Suite upgrade')).toContainText('Select suites, subject to availability');await expect(card(page,'Club access')).toContainText('Club access requires a qualifying booking');
 await page.getByLabel('Benefit status preview',{exact:true}).selectOption('gold');await expect(card(page,'Suite upgrade')).toContainText('No suite entitlement at Gold');await page.getByLabel('Benefit status preview',{exact:true}).selectOption('ambassador');await expect(card(page,'Your24')).toContainText('subject to approval');await expect(card(page,'Late checkout')).toContainText('Up to 4 p.m., if available');
 await card(page,'Club access').getByText('Inspect club access rules & sources',{exact:true}).click();await noOverflow(page);await page.screenshot({path:info.outputPath('benefits-ritz-club.png'),fullPage:true});
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('marriott-trip-planner:v1')!).data.profile.status)).toBe('platinum');await page.reload();await expect(page.getByLabel('Benefit status preview',{exact:true})).toHaveValue('profile');await expect(card(page,'Elite points bonus')).toContainText('50%');
});
test('package inclusions, unknown conditions and editorial observations are distinct',async({page},info)=>{
 await page.goto('./#/benefits?property=mapito');await expect(card(page,'Breakfast')).toContainText('Published stay inclusion');await expect(card(page,'Welcome gift')).toContainText('Unknown');await expect(page.getByRole('complementary',{name:'Editorial benefit observations'})).toContainText('planning judgment');
 await page.getByText('Inspect property conditions & review',{exact:true}).click();await expect(page.getByRole('region',{name:'Effective elite benefits'})).toContainText('participation in the separate All-Inclusive');await noOverflow(page);await page.screenshot({path:info.outputPath('benefits-safari-unknowns.png'),fullPage:true});
 await page.getByLabel('Benefit property',{exact:true}).selectOption('st-regis-new-york');await page.getByLabel('Benefit status preview',{exact:true}).selectOption('platinum');await expect(card(page,'Breakfast')).toContainText('Breakfast as welcome choice');await expect(card(page,'Late checkout')).toContainText('Unknown — confirmation needed');
 await page.goto('./#/benefits?property=missing');await expect(page.getByRole('heading',{name:'Property unavailable in this catalog.'})).toBeVisible();await page.getByRole('link',{name:'Choose a catalog property'}).click();await expect(page.getByLabel('Benefit property',{exact:true})).toHaveValue('dove-mountain');
});
test('profile changes update detail benefits and importing the previous backup reconstructs them',async({page})=>{
 await page.goto('./#/profile');await page.getByLabel('Bonvoy status',{exact:true}).selectOption('gold');await page.goto('./#/properties/jw-tampa');await expect(card(page,'Lounge access')).toContainText('No elite lounge entitlement');
 await nav(page,'Profile');await page.getByLabel('Planner JSON',{exact:true}).fill(backup);await page.getByRole('button',{name:'Review import',exact:true}).click();await page.getByRole('button',{name:'Import and replace planner',exact:true}).click();await page.goto('./#/properties/jw-tampa');await expect(card(page,'Lounge access')).toContainText('Elite lounge access, member +1');await page.reload();await expect(card(page,'Elite points bonus')).toContainText('50%');await noOverflow(page);
});
test('all 100 catalog properties render all benefit categories without page errors',async({page})=>{
 test.setTimeout(180000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));const properties=JSON.parse(readFileSync(new URL('../../data/properties/index.json',import.meta.url),'utf8')) as {slug:string}[];
 for(const p of properties){await page.goto(`./#/benefits?property=${p.slug}`);await expect(page.locator('.benefit-grid > article')).toHaveCount(10);await noOverflow(page);}expect(errors).toEqual([]);
});
