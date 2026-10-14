import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPerspectiveTransientState,setPerspectiveBodyExpanded,setPerspectiveScrollTop} from '../../lib/ui/model/perspective-transient.ts';

test('saved perspective body and scroll overrides are immutable, isolated and retained for hidden IDs',()=>{
 const initial=initialPerspectiveTransientState(),expanded=setPerspectiveBodyExpanded(initial,'perspective-a','action-a',true),scrolled=setPerspectiveScrollTop(expanded,'perspective-a',640),other=setPerspectiveBodyExpanded(scrolled,'perspective-b','action-b',false);
 assert.deepEqual(initial,{});assert.deepEqual(expanded['perspective-a'],{expandedBodies:{'action-a':true},scrollTop:0});assert.deepEqual(scrolled['perspective-a'],{expandedBodies:{'action-a':true},scrollTop:640});
 assert.deepEqual(other['perspective-a'],scrolled['perspective-a']);assert.deepEqual(other['perspective-b'],{expandedBodies:{'action-b':false},scrollTop:0});
 assert.equal(setPerspectiveScrollTop(scrolled,'perspective-a',640),scrolled);assert.equal(setPerspectiveBodyExpanded(scrolled,'perspective-a','action-a',true),scrolled);assert.equal(setPerspectiveScrollTop(scrolled,'perspective-a',Number.NaN),scrolled);
});
