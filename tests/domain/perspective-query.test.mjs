import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ActionError,perspectiveActions,project} from '../../lib/domain/core.ts';
import {
  PERSPECTIVE_QUERY_LIMITS,
  evaluatePerspective,
  evaluatePerspectiveQuery,
  normalizePerspectiveQuery,
  perspectiveReferenceIds,
  validatePerspectiveQueryReferences,
} from '../../lib/domain/perspective-query.ts';

const now='2026-10-03T00:00:00.000Z';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const instant=day=>`2026-10-${String(day).padStart(2,'0')}T00:00:00.000Z`;
const projectNode=(n,name,parent_id=null,order=n)=>({id:id(n),name,description:'',parent_id,order,revision:1,created_at:instant(1),updated_at:instant(1)});
const tagNode=(n,name,parent_id=null,order=n)=>({id:id(n),name,description:'',parent_id,order,revision:1,created_at:instant(1),updated_at:instant(1)});
const action=(n,options={})=>({
  id:id(n),title:options.title??`Action ${n}`,revision:1,parent_id:options.parent_id??null,
  project_id:options.project_id??null,status:options.status??'active',due_at:options.due_at??null,
  defer_until:options.defer_until??null,notes:'',order:options.order??n,flagged:options.flagged??false,
  created_at:options.created_at??instant(1),updated_at:options.updated_at??instant(1),
});
function fixture(){
  return {
    revision:0,catalog_identity_ledger:[],
    projects:[projectNode(1,'Work',null,0),projectNode(2,'Build',id(1),0),projectNode(3,'Home',null,1)],
    tags:[tagNode(4,'Work'),tagNode(5,'Private'),tagNode(6,'Personal',id(5)),tagNode(7,'Reference')],
    actions:[
      action(10,{title:'Z parent',project_id:id(1),status:'active',due_at:instant(4),defer_until:instant(5),flagged:true,order:5}),
      action(11,{title:'A child',parent_id:id(10),project_id:id(3),status:'on-hold',due_at:instant(2),created_at:instant(2),updated_at:instant(4)}),
      action(12,{title:'M mixed',project_id:id(2),status:'completed',due_at:null,created_at:instant(3),updated_at:instant(2),flagged:true,order:5}),
      action(13,{title:'B inbox',status:'dropped',due_at:instant(3),order:2}),
      action(14,{title:'Work now',project_id:id(1),status:'active',due_at:instant(1),defer_until:instant(1),flagged:true,order:1}),
      action(15,{title:'Private root',project_id:id(3),status:'active',due_at:null,defer_until:null,order:4}),
    ],
    action_tags:[
      {action_id:id(10),tag_id:id(4),revision:1},
      {action_id:id(11),tag_id:id(6),revision:1},
      {action_id:id(12),tag_id:id(4),revision:1},
      {action_id:id(12),tag_id:id(5),revision:1},
      {action_id:id(14),tag_id:id(4),revision:1},
      {action_id:id(15),tag_id:id(5),revision:1},
    ],
    perspectives:[],
  };
}
function rows(snapshot,value,at=now){return evaluatePerspective(snapshot,at,value).map(item=>item.id);}
function projectedRows(snapshot,value){return evaluatePerspectiveQuery(snapshot,project(snapshot,now),value).map(item=>item.id);}
function expectInvalid(value){assert.throws(()=>normalizePerspectiveQuery(value),error=>error instanceof ActionError&&error.code==='invalid_input');}
function freezeDeep(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.freeze(value);for(const child of Object.values(value))freezeDeep(child);}return value;}
function complementPair(snapshot,positive){
  const all=project(snapshot,now).map(item=>item.id);
  const matched=projectedRows(snapshot,{where:positive});
  const negated=projectedRows(snapshot,{where:{not:positive}});
  assert.equal(matched.filter(value=>negated.includes(value)).length,0);
  assert.deepEqual([...matched,...negated].sort(),[...all].sort());
}

test('normalizes strict query shape and stores classification/null defaults explicitly',()=>{
  assert.deepEqual(normalizePerspectiveQuery({where:{and:[
    {field:'project_id',op:'eq',value:id(1)},
    {field:'tag_id',op:'in',values:[null,id(4)]},
  ]},order_by:[{field:'due_at',direction:'desc'}]}),{
    where:{and:[
      {field:'project_id',op:'eq',value:id(1),include_descendants:true},
      {field:'tag_id',op:'in',values:[null,id(4)],include_descendants:true},
    ]},
    order_by:[{field:'due_at',direction:'desc',nulls:'last'}],
  });
  assert.deepEqual(normalizePerspectiveQuery({order_by:[]}),{order_by:[]});
  assert.deepEqual(normalizePerspectiveQuery({}),{});
  assert.deepEqual(normalizePerspectiveQuery({where:{field:'status',op:'in',values:[]}}),{where:{field:'status',op:'in',values:[]}});
});

test('field/operator truth tables use two-valued complements for empty and nonempty sets',()=>{
  const snapshot=fixture();
  for(const value of ['active','on-hold','completed','dropped']){
    complementPair(snapshot,{field:'status',op:'eq',value});
    complementPair(snapshot,{field:'status',op:'in',values:[value]});
  }
  complementPair(snapshot,{field:'status',op:'in',values:['active','on-hold']});
  assert.deepEqual(rows(snapshot,{where:{field:'status',op:'in',values:[]}}),[]);
  assert.deepEqual(rows(snapshot,{where:{field:'status',op:'not_in',values:[]}}),project(snapshot,now).map(item=>item.id));
  for(const field of ['flagged','is_deferred']) for(const value of [false,true]) complementPair(snapshot,{field,op:'eq',value});
  complementPair(snapshot,{field:'project_id',op:'eq',value:id(1)});
  complementPair(snapshot,{field:'project_id',op:'in',values:[id(1),null]});
  complementPair(snapshot,{field:'tag_id',op:'eq',value:id(4)});
  complementPair(snapshot,{field:'tag_id',op:'in',values:[id(4),null]});
  assert.deepEqual(rows(snapshot,{where:{field:'project_id',op:'in',values:[]}}),[]);
  assert.deepEqual(rows(snapshot,{where:{field:'project_id',op:'not_in',values:[]}}),project(snapshot,now).map(item=>item.id));
});

test('null classifies unassigned and untagged values, while mixed Tag sets match any overlap',()=>{
  const snapshot=fixture();
  assert.deepEqual(rows(snapshot,{where:{field:'project_id',op:'eq',value:null}}),[id(13)]);
  assert.deepEqual(rows(snapshot,{where:{field:'project_id',op:'in',values:[null,id(1)]}}),[id(13),id(14),id(10),id(12)]);
  assert.deepEqual(rows(snapshot,{where:{field:'tag_id',op:'eq',value:null}}),[id(13)]);
  assert.deepEqual(rows(snapshot,{where:{field:'tag_id',op:'in',values:[null,id(4),id(5)]}}),[id(13),id(14),id(10),id(11),id(12),id(15)]);
  assert.deepEqual(rows(snapshot,{where:{field:'tag_id',op:'ne',value:id(4)}}),[id(13),id(11),id(15)]);
  assert.deepEqual(rows(snapshot,{where:{field:'tag_id',op:'not_in',values:[id(4),id(5)]}}),[id(13)]);
});

test('nested OR/NOT and Work/Private Notification predicates form a disjoint complete partition',()=>{
  const snapshot=fixture();
  const deepNot=Array.from({length:12},(_,index)=>index).reduce(condition=>({not:condition}),{field:'status',op:'eq',value:'dropped'});
  assert.deepEqual(rows(snapshot,{where:{and:[{or:[deepNot,{field:'flagged',op:'eq',value:true}]},{not:{field:'is_deferred',op:'eq',value:true}}]}}),[id(13),id(14),id(12)]);

  const partition=fixture();
  partition.actions=[action(30),action(31),action(32),action(33)];
  partition.action_tags=[
    {action_id:id(30),tag_id:id(4),revision:1},{action_id:id(31),tag_id:id(4),revision:1},
    {action_id:id(32),tag_id:id(5),revision:1},{action_id:id(33),tag_id:id(5),revision:1},
  ];
  const work=rows(partition,{where:{field:'tag_id',op:'eq',value:id(4)}});
  const privateRows=rows(partition,{where:{field:'tag_id',op:'eq',value:id(5)}});
  assert.deepEqual(work,[id(30),id(31)]);
  assert.deepEqual(privateRows,[id(32),id(33)]);
  assert.equal(work.some(value=>privateRows.includes(value)),false);
  assert.deepEqual([...work,...privateRows].sort(),partition.actions.map(value=>value.id).sort());
});

test('classification expansion is independent of Action containment and uses the current hierarchy',()=>{
  const before=fixture();
  assert.deepEqual(rows(before,{where:{field:'project_id',op:'eq',value:id(1)}}),[id(14),id(10),id(12)]);
  assert.deepEqual(rows(before,{where:{field:'project_id',op:'eq',value:id(3)}}),[id(11),id(15)]);
  const moved=structuredClone(before);
  moved.projects=moved.projects.map(item=>item.id===id(2)?{...item,parent_id:id(3)}:item);
  assert.deepEqual(rows(moved,{where:{field:'project_id',op:'eq',value:id(1)}}),[id(14),id(10)]);
  assert.deepEqual(rows(moved,{where:{field:'project_id',op:'eq',value:id(3)}}),[id(11),id(12),id(15)]);

  const tagMoved=structuredClone(before);
  tagMoved.tags=tagMoved.tags.map(item=>item.id===id(6)?{...item,parent_id:id(7)}:item);
  assert.deepEqual(rows(before,{where:{field:'tag_id',op:'eq',value:id(5)}}),[id(11),id(12),id(15)]);
  assert.deepEqual(rows(tagMoved,{where:{field:'tag_id',op:'eq',value:id(5)}}),[id(12),id(15)]);

  assert.deepEqual(rows(before,{where:{and:[
    {field:'project_id',op:'eq',value:id(1),include_descendants:true},
    {field:'project_id',op:'ne',value:id(1),include_descendants:false},
  ]}}),[id(12)]);
  assert.deepEqual(rows(before,{where:{and:[
    {field:'tag_id',op:'eq',value:id(5),include_descendants:true},
    {field:'tag_id',op:'ne',value:id(5),include_descendants:false},
  ]}}),[id(11)]);
});

test('explicit time uses the existing Defer projection and sorting reads saved dates',()=>{
  const snapshot=fixture();
  assert.deepEqual(rows(snapshot,{where:{field:'is_deferred',op:'eq',value:true}}),[id(10),id(11)]);
  assert.deepEqual(rows(snapshot,{where:{field:'is_deferred',op:'eq',value:true}},'2026-10-06T00:00:00.000Z'),[]);
  assert.deepEqual(rows(snapshot,{where:{and:[
    {field:'is_deferred',op:'eq',value:true},{field:'project_id',op:'eq',value:id(1)},
  ]},order_by:[{field:'defer_until',direction:'asc',nulls:'first'}]}),[id(10)]);
  const childAndParent=project(snapshot,now).filter(item=>[id(10),id(11)].includes(item.id));
  assert.deepEqual(evaluatePerspectiveQuery(snapshot,childAndParent,{where:{field:'is_deferred',op:'eq',value:true},order_by:[{field:'defer_until',direction:'asc',nulls:'first'}]}).map(item=>item.id),[id(11),id(10)]);
});

test('all sort fields and directions are deterministic; null placement ignores direction',()=>{
  const source=[
    action(30,{title:'b',due_at:null,defer_until:instant(2),created_at:instant(2),updated_at:instant(3),status:'on-hold',flagged:true,order:2}),
    action(20,{title:'a',due_at:instant(1),defer_until:null,created_at:instant(1),updated_at:instant(1),status:'active',flagged:false,order:1}),
    action(10,{title:'a',due_at:instant(3),defer_until:instant(1),created_at:instant(1),updated_at:instant(2),status:'completed',flagged:false,order:1}),
    action(40,{title:'c',due_at:instant(2),defer_until:instant(3),created_at:instant(3),updated_at:instant(3),status:'dropped',flagged:true,order:3}),
  ].map(item=>({...item,is_deferred:false}));
  const catalog={projects:[],tags:[],action_tags:[]};
  const order=(field,direction='asc',nulls='last')=>evaluatePerspectiveQuery(catalog,source,{order_by:[{field,direction,nulls}]}).map(item=>item.id);
  const expected={
    due_at:[id(20),id(40),id(10),id(30)],
    defer_until:[id(10),id(30),id(40),id(20)],
    created_at:[id(10),id(20),id(30),id(40)],
    updated_at:[id(20),id(10),id(30),id(40)],
    title:[id(10),id(20),id(30),id(40)],
    status:[id(20),id(30),id(10),id(40)],
    flagged:[id(10),id(20),id(30),id(40)],
    order:[id(10),id(20),id(30),id(40)],
  };
  const expectedDesc={
    due_at:[id(10),id(40),id(20),id(30)],
    defer_until:[id(40),id(30),id(10),id(20)],
    created_at:[id(40),id(30),id(10),id(20)],
    updated_at:[id(30),id(40),id(10),id(20)],
    title:[id(40),id(30),id(10),id(20)],
    status:[id(40),id(10),id(30),id(20)],
    flagged:[id(30),id(40),id(10),id(20)],
    order:[id(40),id(30),id(10),id(20)],
  };
  for(const [field,ascending] of Object.entries(expected)){
    assert.deepEqual(order(field),ascending,field+' asc');
    assert.deepEqual(order(field,'desc'),expectedDesc[field],field+' desc');
  }
  assert.deepEqual(order('due_at','asc','first'),[id(30),id(20),id(40),id(10)]);
  assert.deepEqual(order('due_at','desc','first'),[id(30),id(10),id(40),id(20)]);
  assert.deepEqual(order('due_at','desc','last'),[id(10),id(40),id(20),id(30)]);
  assert.deepEqual(order('defer_until','desc','first'),[id(20),id(40),id(30),id(10)]);
  assert.deepEqual(order('title','desc'),[id(40),id(30),id(10),id(20)]);
  assert.deepEqual(evaluatePerspectiveQuery(catalog,source,{order_by:[
    {field:'title',direction:'asc'},{field:'title',direction:'desc'},
  ]}).map(item=>item.id),[id(10),id(20),id(30),id(40)]);
});

test('omitted order preserves tree projection while an empty explicit order is global ID order',()=>{
  const snapshot=fixture();
  const tree=project(snapshot,now).map(item=>item.id);
  assert.deepEqual(rows(snapshot,{}),tree);
  assert.deepEqual(rows(snapshot,{order_by:[]}),[id(10),id(11),id(12),id(13),id(14),id(15)]);
});

test('the projected query seam can preserve representative v1 filters without changing their callers',()=>{
  const snapshot=fixture();
  const asQuery=filter=>{
    const conditions=[];
    if(filter.statuses!==undefined)conditions.push({field:'status',op:'in',values:filter.statuses});
    if(filter.is_deferred!==undefined)conditions.push({field:'is_deferred',op:'eq',value:filter.is_deferred});
    if(filter.flagged!==undefined)conditions.push({field:'flagged',op:'eq',value:filter.flagged});
    if(Object.hasOwn(filter,'project_id'))conditions.push({field:'project_id',op:'eq',value:filter.project_id,include_descendants:filter.include_descendants??false});
    if(filter.tag_id!==undefined)conditions.push({field:'tag_id',op:'eq',value:filter.tag_id,include_descendants:filter.include_descendants??false});
    if(conditions.length===0)return {};
    return {where:conditions.length===1?conditions[0]:{and:conditions}};
  };
  for(const filter of [
    {},
    {statuses:[]},
    {project_id:null},
    {project_id:id(1)},
    {tag_id:id(5)},
    {project_id:id(1),include_descendants:true,tag_id:id(4),flagged:true,statuses:['active','on-hold'],is_deferred:false},
  ]){
    assert.deepEqual(rows(snapshot,asQuery(filter)),perspectiveActions(snapshot,now,filter).map(item=>item.id));
  }
});

test('references include negative, NOT and every set UUID and validate against the current snapshot',()=>{
  const snapshot=fixture();
  const query={where:{or:[
    {not:{field:'project_id',op:'ne',value:id(1)}},
    {field:'tag_id',op:'not_in',values:[null,id(5),id(6)]},
  ]}};
  assert.deepEqual(perspectiveReferenceIds(query),{project_ids:[id(1)],tag_ids:[id(5),id(6)]});
  assert.deepEqual(validatePerspectiveQueryReferences(snapshot,query),normalizePerspectiveQuery(query));
  for(const bad of [
    {where:{not:{field:'project_id',op:'ne',value:id(99)}}},
    {where:{field:'tag_id',op:'not_in',values:[id(99)]}},
  ]) assert.throws(()=>validatePerspectiveQueryReferences(snapshot,bad),error=>error.code==='not_found');
});

test('strict validation rejects malformed operators, keys, values and UUIDs',()=>{
  for(const value of [
    null,[],{where:null},{where:{and:[]}},{where:{or:[]}},{where:{not:null}},
    {where:{field:'status',op:'in',value:['active']}},
    {where:{field:'status',op:'in',values:['waiting']}},
    {where:{field:'status',op:'ne',value:null}},
    {where:{field:'project_id',op:'eq',value:' '+id(1)}},
    {where:{field:'tag_id',op:'eq',value:id(1),sort:'ascending'}},
    {where:{field:'flagged',op:'in',values:[true]}},
    {where:{field:'is_deferred',op:'ne',value:1}},
    {where:{field:'title',op:'eq',value:'Task'}},
    {where:{field:'tag_id',op:'eq',value:id(1),include_descendants:null}},
    {where:{field:'tag_id',op:'eq',value:id(1),include_descendants:undefined}},
    {sort:[{field:'title',direction:'asc'}]},
    {order_by:[{field:'title',direction:'sideways'}]},
    {order_by:[{field:'title',direction:'asc',nulls:'middle'}]},
    {order_by:[{field:'title',direction:'asc',nulls:undefined}]},
    {order_by:[{field:'unknown',direction:'asc'}]},
    {where:{field:'project_id',op:'eq',value:id(1),include_descendants:false,unexpected:true}},
    {where:undefined},
    {order_by:undefined},
  ]) expectInvalid(value);
  const symbolKey={[Symbol('query')]:true};
  expectInvalid(symbolKey);
  const nonEnumerableKey={};
  Object.defineProperty(nonEnumerableKey,'where',{value:{field:'status',op:'eq',value:'active'}});
  expectInvalid(nonEnumerableKey);
  const sparse=new Array(1);
  expectInvalid({where:{and:sparse}});
  const decorated=[{field:'status',op:'eq',value:'active'}];
  decorated.extra=true;
  expectInvalid({where:{and:decorated}});
});

test('resource bounds accept exact limits, reject the next value, and reject deep input before recursive normalization',()=>{
  const leaf={field:'status',op:'eq',value:'active'};
  const atDepth=Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxDepth-1},()=>0).reduce(value=>({not:value}),leaf);
  const aboveDepth={not:atDepth};
  const belowDepth=Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxDepth-2},()=>0).reduce(value=>({not:value}),leaf);
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:belowDepth}));
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:atDepth}));
  expectInvalid({where:aboveDepth});

  const belowNodes={and:Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxNodes-2},()=>leaf)};
  const atNodes={and:Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxNodes-1},()=>leaf)};
  const aboveNodes={and:Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxNodes},()=>leaf)};
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:belowNodes}));
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:atNodes}));
  expectInvalid({where:aboveNodes});

  const belowSet={field:'project_id',op:'in',values:Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxCandidates-1},(_,index)=>id(index+100))};
  const atSet={field:'project_id',op:'in',values:Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxCandidates},(_,index)=>id(index+100))};
  const aboveSet={field:'project_id',op:'in',values:[...atSet.values,id(999)]};
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:belowSet}));
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:atSet}));
  expectInvalid({where:aboveSet});

  const mixedCandidates={and:[
    ...Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxNodes-2},(_,index)=>({field:'project_id',op:'eq',value:id(index+100)})),
    {field:'project_id',op:'in',values:[id(900),id(901)]},
  ]};
  assert.doesNotThrow(()=>normalizePerspectiveQuery({where:mixedCandidates}));
  mixedCandidates.and[mixedCandidates.and.length-1].values.push(id(902));
  expectInvalid({where:mixedCandidates});

  const belowSort=Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxSortKeys-1},()=>({field:'title',direction:'asc'}));
  const atSort=Array.from({length:PERSPECTIVE_QUERY_LIMITS.maxSortKeys},()=>({field:'title',direction:'asc'}));
  assert.doesNotThrow(()=>normalizePerspectiveQuery({order_by:belowSort}));
  assert.doesNotThrow(()=>normalizePerspectiveQuery({order_by:atSort}));
  expectInvalid({order_by:[...atSort,{field:'title',direction:'asc'}]});

  expectInvalid({where:{and:new Array(1_000_000)}});
  expectInvalid({where:{field:'project_id',op:'in',values:new Array(1_000_000)}});
  const deepButSmall=Array.from({length:100},()=>0).reduce(value=>({not:value}),leaf);
  expectInvalid({where:deepButSmall});
  expectInvalid({where:{field:'project_id',op:'eq',value:'x'.repeat(1_000_000)}});
  expectInvalid({where:{field:'status',op:'eq',value:'x'.repeat(1_000_000)}});
});

test('oversized cardinality and accessor properties reject before reading array or object values',()=>{
  let reads=0;
  const wide=new Array(PERSPECTIVE_QUERY_LIMITS.maxNodes+1);
  Object.defineProperty(wide,0,{enumerable:true,configurable:true,get(){reads++;return {field:'status',op:'eq',value:'active'};}});
  expectInvalid({where:{and:wide}});
  assert.equal(reads,0);

  const accessorQuery={};
  Object.defineProperty(accessorQuery,'where',{enumerable:true,get(){reads++;return {field:'status',op:'eq',value:'active'};}});
  expectInvalid(accessorQuery);
  const accessorSort=[];
  Object.defineProperty(accessorSort,0,{enumerable:true,configurable:true,get(){reads++;return {field:'title',direction:'asc'};}});
  accessorSort.length=1;
  expectInvalid({order_by:accessorSort});
  assert.equal(reads,0);

  const symbolDecorated=[{field:'status',op:'eq',value:'active'}];
  symbolDecorated[Symbol('condition')]=true;
  expectInvalid({where:{and:symbolDecorated}});
  const hiddenIndex=[];
  Object.defineProperty(hiddenIndex,'0',{value:{field:'status',op:'eq',value:'active'}});
  hiddenIndex.length=1;
  expectInvalid({where:{and:hiddenIndex}});
  const accessorLeaf={field:'status',op:'eq'};
  Object.defineProperty(accessorLeaf,'value',{enumerable:true,get(){reads++;return 'active';}});
  expectInvalid({where:accessorLeaf});
  assert.equal(reads,0);
});

test('compiled evaluation accepts frozen snapshots and never mutates source arrays or rows',()=>{
  const snapshot=fixture();
  const before=structuredClone(snapshot);
  const frozen=freezeDeep(snapshot);
  const source=Object.freeze(project(frozen,now));
  const result=evaluatePerspectiveQuery(frozen,source,{where:{field:'tag_id',op:'in',values:[id(4),id(5)]},order_by:[{field:'title',direction:'asc'}]});
  assert.deepEqual(result.map(item=>item.id),[id(11),id(12),id(15),id(10),id(14)].sort((left,right)=>{
    const l=frozen.actions.find(item=>item.id===left).title,r=frozen.actions.find(item=>item.id===right).title;
    return l<r?-1:l>r?1:left<right?-1:left>right?1:0;
  }));
  assert.deepEqual(frozen,before);
});
