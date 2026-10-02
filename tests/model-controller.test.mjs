import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { initializeModelPreview } from '../src/scripts/model-preview.mjs';
class Element {
  constructor(dataset = {}) { this.dataset=dataset; this.attributes={}; this.hidden=false; this.disabled=false; this.events=new Map(); this.children=[]; }
  addEventListener(type, callback) { this.events.set(type,[...(this.events.get(type)??[]),callback]); }
  dispatch(type, event={}) { return Promise.all((this.events.get(type)??[]).map(callback=>callback({target:this,currentTarget:this,...event}))); }
  setAttribute(name,value) { this.attributes[name]=value; }
  getAttribute(name) { return this.attributes[name]??null; }
  remove() { this.removed=true; }
  replaceChildren(...children) { this.children=children; }
  focus() { this.focused=true; }
  closest() { return this; }
  querySelector() { return this.firstButton; }
  getCameraOrbit() { return this.orbit??{theta:0,phi:1.36,radius:2}; }
  jumpCameraToGoal() { this.jumped=true; }
}
function harness({load=async()=>{},reducedMotion=false}={}) {
  const messages={load:'Load',idle:'Idle',loading:'Loading',ready:'Ready',error:'Error',retry:'Retry',moved:'Moved',resetDone:'Reset',posterDone:'Still'};
  const root=new Element({messages:JSON.stringify(messages),src:'/atlas/models/whale.glb',poster:'/atlas/models/poster.webp',title:'Model',description:'Description',lang:'ja',state:'idle'});
  const nodes=Object.fromEntries(['.model-stage','[data-model-mount]','[data-model-poster]','[data-model-overlay]','[data-model-load]','[data-model-load-label]','[data-model-status]','[data-model-controls]','[data-model-help]','[data-model-unload]'].map(selector=>[selector,new Element()]));
  nodes['[data-model-controls]'].firstButton=new Element();
  root.querySelector=selector=>nodes[selector];
  const viewers=[];const pageEvents={};
  globalThis.matchMedia=()=>({matches:reducedMotion,addEventListener(){}});
  globalThis.document={createElement(){const viewer=new Element();viewers.push(viewer);return viewer;}};
  globalThis.addEventListener=(type,callback)=>pageEvents[type]=callback;
  let loads=0;
  initializeModelPreview(root,()=>{loads++;return load();});
  return {root,nodes,viewers,pageEvents,loads:()=>loads,click:()=>nodes['[data-model-load]'].dispatch('click')};
}
test('preview controller defers loading, ignores double activation, and exposes deliberate controls',async()=>{
  let resolve;const h=harness({load:()=>new Promise(done=>resolve=done),reducedMotion:true});
  assert.equal(h.loads(),0);assert.equal(h.viewers.length,0);
  const first=h.click();await h.click();assert.equal(h.loads(),1);assert.equal(h.root.dataset.state,'loading');
  resolve();await first;
  const viewer=h.viewers[0];
  assert.equal(viewer.src,'/atlas/models/whale.glb');
  assert.equal(viewer.getAttribute('interpolation-decay'),'0');
  assert.equal(viewer.getAttribute('auto-rotate'),null);assert.equal(viewer.getAttribute('autoplay'),null);
  assert.equal(viewer.a11y.front,'正面');
  await viewer.dispatch('load');assert.equal(h.root.dataset.state,'ready');
  assert.equal(h.nodes['[data-model-poster]'].hidden,true);assert.equal(h.nodes['[data-model-controls]'].hidden,false);
  assert.equal(h.nodes['[data-model-controls]'].firstButton.focused,true);
  await h.nodes['[data-model-controls]'].dispatch('click',{target:new Element({modelAction:'left'})});
  assert.match(viewer.cameraOrbit,/rad.*rad.*m/);
  await h.nodes['[data-model-controls]'].dispatch('click',{target:new Element({modelAction:'reset'})});
  assert.equal(viewer.cameraOrbit,'0deg 78deg 105%');assert.equal(viewer.fieldOfView,'auto');
  h.pageEvents.pagehide();assert.equal(h.root.dataset.state,'idle');assert.equal(h.nodes['[data-model-poster]'].hidden,false);
});
test('renderer failure preserves still image and retries with a genuinely new model URL',async()=>{
  const h=harness();await h.click();await h.viewers[0].dispatch('error');
  assert.equal(h.root.dataset.state,'error');assert.equal(h.nodes['[data-model-poster]'].hidden,false);
  assert.equal(h.nodes['[data-model-load]'].disabled,false);assert.equal(h.nodes['[data-model-load-label]'].textContent,'Retry');
  await h.click();assert.equal(h.viewers[1].src,'/atlas/models/whale.glb?previewRetry=1');
  await h.viewers[1].dispatch('load');assert.equal(h.root.dataset.state,'ready');
  await h.nodes['[data-model-unload]'].dispatch('click');assert.equal(h.root.dataset.state,'idle');
  assert.equal(h.nodes['[data-model-controls]'].hidden,true);assert.equal(h.nodes['[data-model-load]'].focused,true);
});
test('module-load rejection and timeout both recover, and late startup never mounts a stale viewer',async()=>{
  const rejected=harness({load:async()=>{throw Error('Offline');}});await rejected.click();
  assert.equal(rejected.root.dataset.state,'error');assert.equal(rejected.viewers.length,0);
  mock.timers.enable({apis:['setTimeout']});
  let resolve;const slow=harness({load:()=>new Promise(done=>resolve=done)});
  const pending=slow.click();mock.timers.tick(45001);assert.equal(slow.root.dataset.state,'error');
  resolve();await pending;assert.equal(slow.viewers.length,0);mock.timers.reset();
});
