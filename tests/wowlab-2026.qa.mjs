import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
const HOST='http://127.0.0.1:4173',ROOT='/wowlab-2026/';
await mkdir('qa-screenshots/wowlab-2026',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
let passed=0,failed=0;
async function test(label,fn){try{const info=await fn();passed++;console.log('PASS '+label+(info?' / '+info:''))}catch(e){failed++;console.log('FAIL '+label+' '+String(e).slice(0,1500))}}
const desk=await browser.newPage({viewport:{width:1440,height:900}});
desk.setDefaultTimeout(7500);
let errors=[];
desk.on('pageerror',e=>errors.push(e.message));
const go=async(path)=>{errors=[];const res=await desk.goto(HOST+ROOT+path,{waitUntil:'domcontentloaded'});await desk.evaluate(()=>document.fonts.ready);await desk.waitForTimeout(180);return res};

let res=await go('');
await test('New concept hub: 3 unique destinations, noindex and prototype-not-production disclaimer',async()=>{
 assert.equal(res.status(),200);
 assert.equal(await desk.locator('.world').count(),3);
 assert.deepEqual(await desk.locator('.world-copy .launch').evaluateAll(es=>es.map(el=>new URL(el.href).pathname)),
 ['/wowlab-2026/portal/','/wowlab-2026/orbit/','/wowlab-2026/cut/']);
 assert.equal(await desk.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 assert((await desk.locator('body').innerText()).includes('NOT FINAL FULL WEBSITES'));
});
await desk.screenshot({path:'qa-screenshots/wowlab-2026/00-hub-full.png',fullPage:true});

res=await go('portal/');
await test('TYPE/PORTAL: SVG masks original artwork rather than generating assets',async()=>{
 assert.equal(res.status(),200);
 assert.equal(await desk.locator('#mask-type').count(),1);
 assert.equal(await desk.locator('.portal-svg image').getAttribute('href'),'/portfolio/assets/022-rcz-weekend-buffet-carnival-1.webp');
 assert.equal(await desk.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 assert.equal((await desk.evaluate(()=>window.__wowQA.state.concept)),'TYPE/PORTAL');
 const img=await desk.request.get(HOST+'/portfolio/assets/001-ascott-discover-asr-india-01.webp');
 assert.equal(img.status(),200);
});
await desk.screenshot({path:'qa-screenshots/wowlab-2026/01-portal-first-desktop.png'});
await test('TYPE/PORTAL: native vertical scroll physically enlarges typography and reveals original project',async()=>{
 let before=await desk.evaluate(()=>window.__wowQA.state);
 await desk.evaluate(()=>{const section=document.querySelector('#portal');scrollTo({top:section.offsetHeight*.60,behavior:'instant'})});
 await desk.waitForTimeout(230);
 let after=await desk.evaluate(()=>window.__wowQA.state);
 assert(after.progress>before.progress+.4,JSON.stringify({before,after}));
 assert(after.zoom.includes('scale(')&&Number(after.zoom.match(/scale\(([\d.]+)/)[1])>3,JSON.stringify(after));
 const openOpacity=await desk.locator('.portal-stage').evaluate(el=>+getComputedStyle(el).getPropertyValue('--open-o'));
 const fullOpacity=await desk.locator('.portal-stage').evaluate(el=>+getComputedStyle(el).getPropertyValue('--full-o'));
 assert(openOpacity>0,JSON.stringify({openOpacity,after}));
 assert(fullOpacity>.85,'The final project must genuinely fill the hero instead of leaving a black VT counter gap: '+JSON.stringify({fullOpacity,after}));
});
await desk.screenshot({path:'qa-screenshots/wowlab-2026/02-portal-after-scroll.png'});
await test('TYPE/PORTAL: original project cases, logo, portrait-free opening and contact work',async()=>{
 assert.equal(await desk.locator('.work-piece').count(),3);
 assert.deepEqual(await desk.locator('.detail a').evaluateAll(els=>els.map(el=>el.getAttribute('href'))),['/portfolio/#rcz','/portfolio/#resultbull','/portfolio/#pride']);
 assert.equal(await desk.locator('.hero-photo').count(),0);
 const first=await desk.locator('.brand img').getAttribute('src');
 assert.equal(first,'/portfolio/assets/vishal-tyagi-mark.svg');
 assert((await desk.locator('.contact a[href*="linkedin.com"]').count())===1);
 assert.deepEqual(errors,[]);
});
res=await go('orbit/');
await test('ORBIT/WORK: five dimensional original panels, no reused split landing architecture',async()=>{
 assert.equal(res.status(),200);
 assert.equal(await desk.locator('.orbit-panel').count(),5);
 assert.equal(await desk.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
 assert.equal((await desk.evaluate(()=>window.__wowQA.state.concept)),'ORBIT/WORK');
 assert.equal(await desk.locator('.hero-photo').count(),0);
});
await desk.waitForTimeout(260);await desk.screenshot({path:'qa-screenshots/wowlab-2026/03-orbit-first-desktop.png'});
await test('ORBIT/WORK: native wheel advances gallery and CSS 3D panel coordinates',async()=>{
 const old=await desk.evaluate(()=>window.__wowQA.state);
 const before=await desk.locator('.orbit-panel[data-i="3"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--pz'));
 await desk.evaluate(()=>scrollTo({top:document.querySelector('#orbit').offsetHeight*.60,behavior:'instant'}));
 await desk.waitForTimeout(240);
 const now=await desk.evaluate(()=>window.__wowQA.state);
 const after=await desk.locator('.orbit-panel[data-i="3"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--pz'));
 assert(now.progress>.5,JSON.stringify(now));
 assert(now.active>0,JSON.stringify(now));
 assert.notEqual(before,after);
 return 'active '+now.active+', depth '+before+' → '+after;
});
await desk.screenshot({path:'qa-screenshots/wowlab-2026/04-orbit-depth-scroll.png'});
await test('ORBIT/WORK: clicking selected project opens actual accessible original-asset viewer',async()=>{
 // Clicking a visual 3D artwork is a pointer interaction. Locator.click() tries to
 // auto-scroll the sticky source during actionability checks and changes its position;
 // use the real on-screen centre under the native-scroll camera instead.
 await desk.evaluate(()=>{
   const runway=document.querySelector('.orbit-runway'),dist=runway.offsetHeight-innerHeight;
   scrollTo({top:runway.getBoundingClientRect().top+scrollY+dist*.60,behavior:'instant'});
 });
 await desk.waitForTimeout(240);
 const coords=await desk.evaluate(()=>{
   const s=window.__wowQA.state;
   const target=document.querySelector('.orbit-panel[data-i="'+s.active+'"]');
   const r=target.getBoundingClientRect();
   return {x:r.left+r.width/2,y:r.top+r.height/2,active:s.active,front:document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('.orbit-panel')?.dataset.i};
 });
 await desk.mouse.click(coords.x,coords.y);
 await desk.waitForTimeout(100);
 assert.equal(await desk.locator('#viewer').evaluate(el=>el.open),true,JSON.stringify(coords));
 assert.equal(await desk.locator('#viewer-img').getAttribute('src').then(s=>s.startsWith('/portfolio/assets/')),true);
 assert.equal(await desk.locator('#viewer-archive').getAttribute('href').then(s=>s.startsWith('/portfolio/#')),true);
 await desk.locator('#close').click();
 assert.equal(await desk.locator('#viewer').evaluate(el=>el.open),false);
 assert.deepEqual(errors,[]);
});
res=await go('cut/');
await test('CUT/SHIFT: acid-lime original composition, genuine 3-column shutter stage',async()=>{
 assert.equal(res.status(),200);
 assert.equal(await desk.locator('.slice').count(),3);
 assert.equal(await desk.locator('.hero-photo').count(),0);
 assert.equal(await desk.locator('.slice-img').first().getAttribute('src'),'/portfolio/assets/001-ascott-discover-asr-india-01.webp');
 assert.equal((await desk.evaluate(()=>window.__wowQA.state.concept)),'CUT/SHIFT');
});
await desk.screenshot({path:'qa-screenshots/wowlab-2026/05-cut-first-desktop.png'});
for(const [progress,sceneExpected] of [[.08,0],[.39,1],[.73,2],[.99,2]]){
 await test('CUT/SHIFT: scroll '+Math.round(progress*100)+'% updates original shuttered artwork',async()=>{
  await desk.evaluate(progress=>{let el=document.querySelector('#studio'),dist=el.offsetHeight-innerHeight;scrollTo({top:el.getBoundingClientRect().top+scrollY+dist*progress,behavior:'instant'})},progress);
  await desk.waitForTimeout(180);
  const now=await desk.evaluate(()=>window.__wowQA.state);
  assert.equal(now.scene,sceneExpected,JSON.stringify(now));
  assert(Math.abs(now.progress-progress)<.025,JSON.stringify(now));
  assert.equal(await desk.locator('.slice-img').count(),3);
  assert.equal(await desk.locator('.frame .current').count(),1);
  assert((await desk.locator('#case-link').getAttribute('href')).startsWith('/portfolio/#'));
  return JSON.stringify(now);
 });
 if(progress===.39)await desk.screenshot({path:'qa-screenshots/wowlab-2026/06-cut-mid-transition.png'});
}
await test('CUT/SHIFT: original showreel remains user controlled and no script crashes',async()=>{
 assert.equal(await desk.locator('video source').getAttribute('src'),'/portfolio/assets/motion-selected.mp4');
 assert.equal(await desk.locator('video').getAttribute('autoplay'),null);
 assert.deepEqual(errors,[]);
});

for(const width of [320,390,430,768,1024,1440]){
 const p=await browser.newPage({viewport:{width,height:width<500?844:900},isMobile:width<500,hasTouch:width<500});
 p.setDefaultTimeout(6500);const err=[];p.on('pageerror',e=>err.push(e.message));
 for(const name of ['','portal/','orbit/','cut/']){
  const concept=name?name.split('/')[0]:'hub';
  const r=await p.goto(HOST+ROOT+name,{waitUntil:'domcontentloaded'});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(130);
  await test(concept+' '+width+'px: real responsive viewport, no overflow or crashes',async()=>{
   assert.equal(r.status(),200);
   const m=await p.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
   if(m.viewport!==width||m.doc>width+3){
    const offenders=await p.evaluate(w=>[...document.querySelectorAll('body *')].map(el=>{const r=el.getBoundingClientRect();return{el:el.tagName+'.'+(typeof el.className==='string'?el.className.slice(0,35):''),w:Math.round(r.width),right:Math.round(r.right),scroll:el.scrollWidth}}).filter(o=>o.right>w+5||o.w>w+5).slice(0,16),width);
    console.error('MOBILE_DEBUG '+concept+' '+width+' '+JSON.stringify({m,offenders}));
   }
   assert.equal(m.viewport,width,JSON.stringify(m));
   assert(m.doc<=width+3,JSON.stringify(m));
   assert.deepEqual(err,[]);
   if(concept==='orbit'&&width<=760)assert((await p.evaluate(()=>window.__wowQA.state)).mobile);
  });
  if(concept!=='hub'){
   await test(concept+' '+width+'px: native scrolling reaches actual contact/footer',async()=>{
    await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
    await p.waitForTimeout(140);
    const m=await p.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
    assert(Math.abs(m.y-m.max)<8,JSON.stringify(m));assert.deepEqual(err,[]);
   });
  }
  if(width===390){await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(180);await p.screenshot({path:'qa-screenshots/wowlab-2026/mobile-'+concept+'-390.png'})}
 }
 await p.close();
}
for(const name of ['portal','orbit','cut']){
 const red=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const r=await red.goto(HOST+ROOT+name+'/',{waitUntil:'domcontentloaded'});
 await test(name+': accessibility motion reduction retains original work and normal scroll',async()=>{
  assert.equal(r.status(),200);assert.equal((await red.evaluate(()=>window.__wowQA.state)).reduced,true);
  assert((await red.locator('a[href*="linkedin.com"]').count())>0);
  if(name==='orbit')assert.equal(await red.locator('.orbit-panel').count(),5);
  if(name==='portal')assert.equal(await red.locator('.work-piece').count(),3);
  if(name==='cut')assert.equal(await red.locator('video').count(),1);
 });
 await red.close();
 const nj=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
 await nj.goto(HOST+ROOT+name+'/',{waitUntil:'domcontentloaded'});
 await test(name+': no-JS fallback reveals original visual content and contact',async()=>{
  assert((await nj.locator('img[src^="/portfolio/assets/"]').count())>0);
  assert((await nj.locator('a[href*="linkedin.com"]').count())>0);
  if(name==='orbit')assert.equal(await nj.locator('.orbit-panel').count(),5);
 });
 await nj.close();
}
await test('All referenced original files exist and old site production unchanged',async()=>{
 for(const a of ['001-ascott-discover-asr-india-01.webp','resultbull.svg','gtm.svg','008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp','022-rcz-weekend-buffet-carnival-1.webp','motion-selected.mp4','vishal-tyagi-mark.svg']){
  const r=await desk.request.get(HOST+'/portfolio/assets/'+a);assert.equal(r.status(),200,a);
 }
 const home=await readFile('index.html','utf8'),css=await readFile('simple.css','utf8');
 assert(home.includes('href="/simple.css"')&&home.includes('Graphic &amp; motion <em>designer.</em>'));
 assert(!home.includes('wowlab-2026'));
 assert(css.includes('--primary:#006D77')&&css.includes('--secondary:#B76E79'));
});
await browser.close();
console.log('WOW MOTION REBOOT QA: '+passed+' passed / '+failed+' failed');
if(failed)process.exitCode=1;
