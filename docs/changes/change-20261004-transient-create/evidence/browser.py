from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 def start():
  page=b.new_page(viewport={'width':390,'height':1000},timezone_id='Asia/Tokyo');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5222');f=page.frame_locator('iframe');expect(f.locator('#addAction')).to_be_enabled();return page,f,errors
 def nav(f,view):f.locator('#navigationToggle').click();f.locator('[data-view="'+view+'"]').click()
 def finish(page,errors,name):assert not errors,errors;out.append({'case':name,'passed':True,'writes':len(page.evaluate('writes'))});page.close()
 page,f,errors=start();f.locator('#addAction').click();expect(f.locator('#editTitle')).to_be_focused();nav(f,'history');assert len(page.evaluate('writes'))==0;assert f.locator('[data-action-id^="local:"]').count()==0;finish(page,errors,'untouched navigation zero writes')
 page,f,errors=start();f.locator('#addAction').click();f.locator('#editNotes').fill('  原文\n<script>literal</script>  ');expect(f.locator('#refresh')).to_have_attribute('data-state','saved');w=page.evaluate('writes');assert len(w)==1 and w[0]['args']['payload']['title']=='';assert w[0]['args']['payload']['notes']=='  原文\n<script>literal</script>  ';finish(page,errors,'notes-only one populated creation')
 page,f,errors=start();f.locator('#addMenuToggle').click();f.locator('#addMenuProject').click();expect(f.locator('#catalogEditName')).to_be_focused();assert len(page.evaluate('writes'))==0;f.locator('#catalogEditDescription').fill(' exact description ');page.wait_for_timeout(600);assert len(page.evaluate('writes'))==0;f.locator('#catalogEditName').fill('Website');expect(f.locator('#refresh')).to_have_attribute('data-state','saved');w=page.evaluate('writes');assert len(w)==1 and w[0]['args']['kind']=='project_add' and w[0]['args']['payload']['name']=='Website';finish(page,errors,'catalog name first with exact description')
 page,f,errors=start();f.locator('#addAction').click();f.locator('#deferDate').fill('2026-10-05');f.locator('#deferUntil').fill('13:');f.locator('#editTitle').fill('local:action:1');page.wait_for_timeout(600);assert len(page.evaluate('writes'))==0;expect(f.locator('#deferUntil')).to_have_value('13:');f.locator('#deferUntil').fill('131745.123');expect(f.locator('#refresh')).to_have_attribute('data-state','saved');w=page.evaluate('writes');assert [r['args']['kind'] for r in w]==['add','defer'];assert page.evaluate('snapshot.actions.find(a=>a.title==="local:action:1").defer_until')=='2026-10-05T04:17:45.123Z';finish(page,errors,'partial clock blocks then valid Defer survives UUID remap and raw title exact')
 for mode in ['check','retry']:
  page,f,errors=start();f.locator('#addAction').click();page.evaluate('dropNextResponse=true');f.locator('#editTitle').fill('A');expect(f.locator('#unknown')).to_be_visible(timeout=30000);original=page.evaluate('writes[0].args');f.locator('#editTitle').fill('B');f.locator('#'+mode).click();expect(f.locator('#refresh')).to_have_attribute('data-state','saved');w=page.evaluate('writes');creates=[r for r in w if r['args']['kind']=='add'];assert len(creates)==(2 if mode=='retry' else 1);assert all(r['args']==original for r in creates);assert len(page.evaluate('snapshot.actions.filter(a=>a.title==="B")'))==1;finish(page,errors,'unknown '+mode+' exact creation and later text same identity')
 b.close()
Path('/tmp/transient-create/browser.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
