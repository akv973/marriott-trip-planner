import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ExplorerApplication } from '../../app/App';
import { BenefitPanel } from '../../components/EliteBenefits';
import { benefits } from '../../lib/benefits/engine';
import { loadCatalog } from '../../lib/catalog/catalog';
import { emptyPlanner, exportPlanner, STORAGE_KEY } from '../../lib/storage/planner';
const asOf='2026-10-12'; const loaded=loadCatalog(asOf); if(!loaded.success) throw new Error(); const catalog=loaded.data;
beforeEach(()=>{window.localStorage.clear(); window.history.replaceState(null,'','#/benefits?property=jw-tampa');vi.spyOn(window,'scrollTo').mockImplementation(()=>{});});
it('uses saved status, shows property precedence and links to current official sources',()=>{
 const planner=emptyPlanner();planner.profile.status='platinum';window.localStorage.setItem(STORAGE_KEY,exportPlanner(planner,catalog));
 render(<ExplorerApplication catalog={catalog} asOf={asOf}/>);
 const lounge=screen.getByRole('article',{name:'Lounge access'});expect(lounge).toHaveTextContent('Elite lounge access, member +1');expect(lounge).toHaveTextContent('takes precedence');
 fireEvent.click(within(lounge).getByText('Inspect lounge access rules & sources'));expect(within(lounge).getByRole('link',{name:/Tampa/})).toHaveAttribute('href',expect.stringContaining('tpajd'));
});
it('status preview does not write the saved planner; changes recalculate without altering prices',()=>{
 const planner=emptyPlanner();planner.profile.status='platinum'; const json=exportPlanner(planner,catalog);window.localStorage.setItem(STORAGE_KEY,json);
 render(<ExplorerApplication catalog={catalog} asOf={asOf}/>);fireEvent.change(screen.getByLabelText('Benefit status preview'),{target:{value:'gold'}});
 expect(screen.getByRole('article',{name:'Lounge access'})).toHaveTextContent('No elite lounge entitlement');expect(window.localStorage.getItem(STORAGE_KEY)).toBe(json);
});
it('unknown status and package inclusion stay separate from editorial observations',()=>{
 window.history.replaceState(null,'','#/benefits?property=mapito');render(<ExplorerApplication catalog={catalog} asOf={asOf}/>);
 expect(screen.getByRole('article',{name:'Breakfast'})).toHaveTextContent('Published stay inclusion');expect(screen.getByRole('article',{name:'Welcome gift'})).toHaveTextContent('Unknown');
 expect(screen.getByRole('complementary',{name:'Editorial benefit observations'})).toHaveTextContent('planning judgment');
});
it('shows synthetic contradictory claims and both retained official sources in an inspectable card',()=>{
 const b=structuredClone(benefits);const o=b.rules.find(r=>r.id==='override-jw-tampa-lounge')!;b.rules.push({...structuredClone(o),id:'fixture-conflict',outcome:{...o.outcome,code:'fixture-excluded',state:'excluded',label:'Synthetic opposing official statement'},sourceIds:['benefit-source-terms']});
 render(<BenefitPanel catalog={catalog} property={catalog.properties.find(p=>p.slug==='jw-tampa')!} status="platinum" asOf={asOf} bundle={b}/>);
 const lounge=screen.getByRole('article',{name:'Lounge access'});expect(lounge).toHaveTextContent('Sources conflict');expect(lounge).toHaveTextContent('Requires review');expect(lounge).toHaveTextContent('Synthetic opposing');expect(within(lounge).getAllByRole('link',{hidden:true}).length).toBeGreaterThan(1);
});
it('a missing property route has recovery and does not silently show another hotel',()=>{
 window.history.replaceState(null,'','#/benefits?property=missing');render(<ExplorerApplication catalog={catalog} asOf={asOf}/>);expect(screen.getByRole('heading',{name:'Property unavailable in this catalog.'})).toBeVisible();expect(screen.queryByRole('region',{name:'Effective elite benefits'})).not.toBeInTheDocument();
});
