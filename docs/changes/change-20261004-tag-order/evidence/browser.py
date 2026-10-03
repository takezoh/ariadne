from playwright.sync_api import sync_playwright,expect
import json
from pathlib import Path
ids=json.load(open('/tmp/tag-order/ids.json'));results=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for scenario in ['before','root-end','chooser-after','action-root-end']:
  page=b.new_page(viewport={'width':1280,'height':1400});page.goto('http://127.0.0.1:5224');f=page.frame_locator('iframe');expect(f.locator('#refresh')).to_have_attribute('data-state','saved');f.locator('#navigationToggle').click();f.locator('[data-view="tags"]').click();source=f.locator('.catalog-row[data-catalog-id="'+ids['waiting' if scenario in ['root-end','chooser-after'] else 'focus']+'"] .catalog-select');assert f.locator('#rootDrop').count()==0
  if scenario=='action-root-end':
   source=f.locator('.action-row[data-action-id="'+ids['gamma']+'"] .action-select');r=f.locator('.action-row[data-action-id="'+ids['gamma']+'"]').bounding_box();s=source.bounding_box();page.mouse.move(s['x']+s['width']/2,s['y']+s['height']/2);page.mouse.down();page.mouse.move(r['x']-12,r['y']+r['height']/2,steps=15);page.mouse.up();page.wait_for_timeout(200);w=page.evaluate('writes');assert len(w)==1 and w[0]['args']['kind']=='action_move';a=next(a for a in page.evaluate('snapshot.actions') if a['id']==ids['gamma']);assert a['parent_id'] is None;assert all(q['order']<a['order'] for q in page.evaluate('snapshot.actions') if q['parent_id'] is None and q['project_id']==a['project_id'] and q['id']!=a['id']);results.append({'scenario':scenario,'exactParentAndRank':True,'oneWrite':True});page.close();continue
  if scenario=='chooser-after':
   source.focus();source.press('Space');assert not f.locator('#movePlacement option[value="before"]').evaluate('(e)=>e.hidden');assert not f.locator('#movePlacement option[value="after"]').evaluate('(e)=>e.hidden');f.locator('#movePlacement').select_option('after');f.locator('#moveDestination').select_option(ids['email']);f.locator('#applyMove').click()
  else:
   target=f.locator('.action-row[data-action-id="'+ids['gamma']+'"]') if scenario=='root-end' else f.locator('.catalog-row[data-catalog-id="'+ids['email']+'"]');rect=target.bounding_box();s=source.bounding_box();page.mouse.move(s['x']+s['width']/2,s['y']+s['height']/2);page.mouse.down();page.mouse.move(rect['x']+(-12 if scenario=='root-end' else 30),rect['y']+(rect['height']/2 if scenario=='root-end' else 2),steps=15);page.mouse.up()
  expect(f.locator('#refresh')).to_have_attribute('data-state','saved');page.wait_for_timeout(150);w=page.evaluate('writes');assert len(w)==1,w;assert w[0]['args']['kind']=='tag_move';saved=page.evaluate('snapshot.tags');print(scenario,w,saved,flush=True);item=next(t for t in saved if t['id']==ids['waiting' if scenario in ['root-end','chooser-after'] else 'focus']);assert item['parent_id'] is None
  if scenario=='root-end':assert all(t['order']<item['order'] for t in saved if t['parent_id'] is None and t['id']!=item['id'])
  else:
   email=next(t for t in saved if t['id']==ids['email']);assert (item['order']<email['order']) if scenario=='before' else (item['order']>email['order'])
  before=json.dumps(saved,sort_keys=True);f.locator('#refresh').click();page.wait_for_timeout(100);assert json.dumps(page.evaluate('snapshot.tags'),sort_keys=True)==before;results.append({'scenario':scenario,'exactParentAndRank':True,'oneWrite':True,'refreshStable':True});page.screenshot(path='/tmp/tag-order/'+scenario+'.png');page.close()
 b.close()
Path('/tmp/tag-order/browser.json').write_text(json.dumps(results,indent=2));print(results)
