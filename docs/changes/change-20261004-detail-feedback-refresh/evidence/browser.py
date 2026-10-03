from playwright.sync_api import sync_playwright,expect
from pathlib import Path
import json
out=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for width in [320,390,1280]:
  for theme in ['light','dark']:
   page=b.new_page(viewport={'width':width,'height':1100},locale='en-US',timezone_id='Asia/Tokyo',color_scheme=theme);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:5220/?theme='+theme);f=page.frame_locator('iframe');expect(f.locator('#scopeTitle')).to_have_text('Inbox');f.locator('.action-select').first.click();expect(f.locator('#editor')).to_be_visible()
   assert f.locator('#saveIndicator').count()==0
   assert f.locator('#refresh').evaluate('e=>e===e.parentElement.lastElementChild')
   for dateId,timeId,errorId in [('editDue','dueTime','dueError'),('deferDate','deferUntil','deferError')]:
    f.locator('#'+dateId).fill('');f.locator('#'+dateId).blur();expect(f.locator('#'+timeId)).to_have_value('');assert f.locator('#'+timeId).evaluate('e=>e.matches(":placeholder-shown")');expect(f.locator('#'+timeId)).to_have_attribute('placeholder','HH:mm');assert f.locator('#'+timeId).evaluate('e=>e.getBoundingClientRect().width-parseFloat(getComputedStyle(e).paddingLeft)-parseFloat(getComputedStyle(e).paddingRight)>=65')
    f.locator('#'+dateId).fill('2026-10-09');expect(f.locator('#'+timeId)).to_have_value('09:00');f.locator('#'+timeId).fill('13:');expect(f.locator('#'+timeId)).to_have_attribute('aria-invalid','true');expect(f.locator('#'+timeId)).to_have_attribute('aria-describedby',errorId);expect(f.locator('#'+errorId)).to_be_visible();f.locator('#'+timeId).blur();expect(f.locator('#saveProblem')).to_be_hidden();expect(f.locator('#refresh')).to_have_attribute('data-state','error');f.locator('#refresh').click();expect(f.locator('#'+timeId)).to_have_value('13:');f.locator('#'+timeId).fill('1317');expect(f.locator('#'+timeId)).to_have_value('13:17');expect(f.locator('#'+errorId)).to_be_hidden();f.locator('#'+timeId).blur();expect(f.locator('#refresh')).to_have_attribute('data-state','saved')
   page.evaluate('delayNextResponse=700');f.locator('#editNotes').fill('Saving exact 日本語');f.locator('#editNotes').blur();expect(f.locator('#refresh')).to_have_attribute('data-saving','true');expect(f.locator('#refresh')).to_have_attribute('aria-busy','true');expect(f.locator('#refresh')).to_be_disabled();assert f.locator('#refresh > svg').evaluate('e=>getComputedStyle(e).animationName')=='save-spin';expect(f.locator('#refresh')).to_have_attribute('data-state','saved');expect(f.locator('#refresh')).to_be_enabled();f.locator('#refresh').click();expect(f.locator('#refreshStatus')).to_have_text('All changes saved')
   if width==390:
    page.emulate_media(reduced_motion='reduce');page.evaluate('delayNextResponse=700');f.locator('#editNotes').fill('Reduced motion');f.locator('#editNotes').blur();expect(f.locator('#refresh')).to_have_attribute('data-saving','true');assert f.locator('#refresh > svg').evaluate('e=>getComputedStyle(e).animationName')=='none';expect(f.locator('#refresh')).to_have_attribute('data-state','saved')
   geometry=f.locator('#statusIcons').evaluate('e=>{const buttons=[...e.querySelectorAll("button")],s=buttons[3].getBoundingClientRect(),flag=buttons[4].getBoundingClientRect();return {gap:flag.left-s.right,color:getComputedStyle(buttons[4]).color,width:e.getBoundingClientRect().width}}');assert geometry['gap']>=10
   f.locator('#editFlag').click();expect(f.locator('#editFlag')).to_have_attribute('aria-pressed','true');expect(f.locator('#refresh')).to_have_attribute('data-state','saved');color=f.locator('#editFlag').evaluate('e=>getComputedStyle(e).color');assert color==('rgb(184, 102, 22)' if theme=='light' else 'rgb(238, 172, 89)')
   f.locator('html').evaluate('e=>window.scrollTo(0,0)');page.screenshot(path=f'/tmp/detail-feedback/after-{width}-{theme}.png');assert not errors,errors;assert f.locator('html').evaluate('e=>e.scrollWidth<=e.clientWidth');out.append({'width':width,'theme':theme,'placeholderEmptyAndPartialPreserved':True,'adjacentDateErrors':True,'singleRefreshStatus':True,'actualSaveAnimation':True,'reducedMotion':width==390,'refreshReadSafe':True,'flag':geometry,'activeFlagColor':color,'errors':errors});page.close()
 b.close()
Path('/tmp/detail-feedback/browser.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
