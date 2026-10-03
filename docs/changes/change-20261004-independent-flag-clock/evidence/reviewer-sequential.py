from playwright.sync_api import sync_playwright,expect
import json
out=[]
with sync_playwright() as p:
 b=p.chromium.launch()
 for width in [320,390,1280]:
  c=b.new_context(viewport={'width':width,'height':1100},locale='en-US');page=c.new_page();page.goto('http://127.0.0.1:5221/',wait_until='domcontentloaded');f=page.frame_locator('iframe');expect(f.locator('#scopeCount')).not_to_have_text('0');f.locator('.action-select').first.click()
  for field in ['dueTime','deferUntil']:
   n=f.locator('#'+field);tail=n.locator('xpath=following-sibling::span');n.fill('');steps=[]
   for ch,value,remaining in [('1','1','-:--:--'),('2','12',':--:--'),('3','12:3','-:--'),('4','12:34',':--'),('5','12:34:5','-'),('6','12:34:56','')]:
    n.press(ch);expect(n).to_have_value(value);expect(tail).to_have_text(remaining);steps.append({'value':value,'guide':remaining})
   n.press('Backspace');expect(n).to_have_value('12:34:5');expect(tail).to_have_text('-');n.press('Backspace');expect(n).to_have_value('12:34:');expect(tail).to_have_text('--');n.blur();page.wait_for_timeout(550);assert page.evaluate('writes.length')==0;f.locator('#refresh').click();expect(n).to_have_value('12:34:');expect(tail).to_have_text('--');out.append({'width':width,'field':field,'steps':steps,'endDeleteGuide':True,'partialRefreshNoWrite':True})
  c.close()
 b.close()
json.dump(out,open('/tmp/flag-independent/reviewer-sequential.json','w'),indent=2)
