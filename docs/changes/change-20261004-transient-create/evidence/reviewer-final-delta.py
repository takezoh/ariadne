from playwright.sync_api import sync_playwright,expect
import json
out=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for kind in ['action','project','tag']:
  page=b.new_page(viewport={'width':390,'height':1100});page.goto('http://127.0.0.1:5222',wait_until='domcontentloaded');f=page.frame_locator('iframe');expect(f.locator('#scopeCount')).not_to_have_text('0')
  for i in range(3):
   if kind=='action':f.locator('#addAction').click()
   else:f.locator('#addMenuToggle').click();f.locator('#addMenu'+kind.title()).click()
  assert page.evaluate('writes.length')==0
  if kind=='action':
   expect(f.locator('#scopeTitle')).to_have_text('Inbox');assert f.locator('.action-row[data-action-id^="local:"]').count()==3;f.locator('#editTitle').fill('Local child');page.wait_for_timeout(650);assert page.evaluate('writes.length')==0;f.locator('[data-action-id="local:action:1"] .action-select').click();expect(f.locator('#editTitle')).to_be_focused();f.locator('#editTitle').fill('Inbox ancestor');page.wait_for_function('snapshot.actions.some(a=>a.title==="Inbox ancestor")');f.locator('[data-action-id="local:action:2"] .action-select').click();f.locator('#editTitle').fill('Inbox middle');page.wait_for_function('snapshot.actions.some(a=>a.title==="Local child")');rows=page.evaluate('snapshot.actions');a=next(r for r in rows if r['title']=='Inbox ancestor');m=next(r for r in rows if r['title']=='Inbox middle');c=next(r for r in rows if r['title']=='Local child');assert m['parent_id']==a['id'] and c['parent_id']==m['id'];expect(f.locator('#scopeTitle')).to_have_text('Inbox')
  else:
   assert f.locator('.catalog-row[data-catalog-id^="local:"]').count()==3;f.locator('#catalogEditName').fill('Child '+kind);page.wait_for_timeout(650);assert page.evaluate('writes.length')==0;f.locator('[data-catalog-id="local:'+kind+':1"] .catalog-select').click();f.locator('#catalogEditName').fill('Ancestor '+kind);page.wait_for_function('writes.length===1');f.locator('[data-catalog-id="local:'+kind+':2"] .catalog-select').click();f.locator('#catalogEditName').fill('Middle '+kind);page.wait_for_function('writes.length===3');page.wait_for_function('snapshot.'+('projects' if kind=='project' else 'tags')+'.some(r=>r.name==="Child '+kind+'")');rows=page.evaluate('snapshot.'+('projects' if kind=='project' else 'tags'));a=next(r for r in rows if r['name']=='Ancestor '+kind);m=next(r for r in rows if r['name']=='Middle '+kind);c=next(r for r in rows if r['name']=='Child '+kind);assert m['parent_id']==a['id'] and c['parent_id']==m['id']
  out.append({'kind':kind,'threeUntouchedLocalAncestorsRetained':True,'sameViewEditing':True,'zeroWritesBeforeEligibleDependencies':True,'exactThreeLevelSavedParents':True});page.close()
 b.close()
json.dump(out,open('/tmp/transient-create/reviewer-final-delta.json','w'),indent=2)
