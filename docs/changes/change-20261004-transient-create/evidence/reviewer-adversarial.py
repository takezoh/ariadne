from playwright.sync_api import sync_playwright,expect
import json
out=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 def start():
  page=b.new_page(viewport={'width':1280,'height':1000},timezone_id='Asia/Tokyo');page.goto('http://127.0.0.1:5222',wait_until='domcontentloaded');f=page.frame_locator('iframe');expect(f.locator('#scopeCount')).not_to_have_text('0');return page,f
 def nav(f,v):f.locator('#navigationToggle').click();f.locator('[data-view="'+v+'"]').click()
 page,f=start()
 for i in range(3):f.locator('#addAction').click()
 f.locator('#editTitle').fill('Grandchild');page.wait_for_timeout(700);assert page.evaluate('writes.length')==0
 nav(f,'projects');f.locator('[data-action-id="local:action:1"] .action-select').click();f.locator('#discardTemporaryAction').click();expect(f.locator('#saveProblemText')).to_contain_text('Another draft depends');assert f.locator('.action-row[data-action-id="local:action:1"]').count()==1
 f.locator('#editTitle').fill('Ancestor');page.wait_for_timeout(700);assert page.evaluate('writes.length')==1
 f.locator('[data-action-id="local:action:2"] .action-select').click();f.locator('#editTitle').fill('Middle');page.wait_for_function('snapshot.actions.some(a=>a.title==="Grandchild")');w=page.evaluate('writes');assert [x['args']['kind'] for x in w]==['add','add','add'];assert all('local:' not in json.dumps(x['args']) for x in w);rows=page.evaluate('snapshot.actions');A=next(a for a in rows if a['title']=='Ancestor');B=next(a for a in rows if a['title']=='Middle');C=next(a for a in rows if a['title']=='Grandchild');assert B['parent_id']==A['id'] and C['parent_id']==B['id'];out.append({'case':'transitive discard protection and ordered three-level dependency','passed':True});page.close()
 page,f=start();f.locator('#addAction').click();f.locator('#deferDate').fill('2026-10-07');f.locator('#deferUntil').fill('161745.123');f.locator('#editNotes').fill('local:action:1');page.wait_for_function('snapshot.actions.some(a=>a.notes==="local:action:1"&&a.defer_until==="2026-10-07T07:17:45.123Z")');assert [x['args']['kind'] for x in page.evaluate('writes')]==['add','defer'];out.append({'case':'raw ID literal and valid Defer survive saved UUID remap','passed':True});page.close()
 page,f=start();f.locator('#addMenuToggle').click();f.locator('#addMenuProject').click();f.locator('#catalogEditDescription').fill(' retained dependency ');nav(f,'inbox');f.locator('.action-select').first.click();saved=f.locator('.action-row').first.get_attribute('data-action-id');f.locator('#projectSearch').click();f.locator('[data-focus-key="picker:project:local:project:1"]').click();page.wait_for_timeout(650);assert page.evaluate('writes.length')==0;nav(f,'history');nav(f,'projects');f.locator('[data-catalog-id="local:project:1"] .catalog-select').click();f.locator('#catalogEditName').fill('Committed dependency');page.wait_for_function('writes.some(w=>w.args.kind==="action_project")');w=page.evaluate('writes');assert [x['args']['kind'] for x in w]==['project_add','action_project'];assert all('local:' not in json.dumps(x['args']) for x in w);assert w[1]['args']['payload']['id']==saved;out.append({'case':'saved Action classification waits for local catalog across navigation with no transport ID leak','passed':True});page.close();b.close()
json.dump(out,open('/tmp/transient-create/reviewer-adversarial.json','w'),indent=2)
