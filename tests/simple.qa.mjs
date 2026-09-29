import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,access,mkdir} from 'node:fs/promises';

const BASE='http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
await mkdir('qa-screenshots',{recursive:true});
let passed=0,failed=0;
const test=async(name,fn)=>{
 try{const detail=await fn();passed++;console.log('PASS '+name+(detail?' — '+detail:''));}
 catch(err){failed++;console.error('FAIL '+name+' — '+String(err).slice(0,550));}
};
const home=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];home.on('pageerror',e=>errors.push(e.message));
await home.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await test('No animation dependencies, scroll locking or autoplay',async()=>{
 const state=await home.evaluate(()=>({
  scripts:[...document.querySelectorAll('script[src]')].map(x=>x.src),
  overflow:getComputedStyle(document.body).overflowY,
  autoplay:document.querySelectorAll('video[autoplay]').length,
  css:[...document.styleSheets].map(x=>x.href).filter(Boolean)
 }));
 assert.deepEqual(state.scripts,[]);
 assert(!['hidden','clip'].includes(state.overflow));
 assert.equal(state.autoplay,0);
 assert(state.css.some(x=>x.endsWith('/simple.css')));
 return JSON.stringify(state);
});
await test('Recruiter sees role, work and contact actions immediately',async()=>{
 const title=await home.locator('h1').innerText();
 assert.match(title,/Graphic.*motion.*designer/i);
 assert.equal(await home.locator('.hero .button').count(),2);
 assert.equal(await home.locator('.project-card').count(),6);
 assert.equal(await home.locator('.contact-band .button').count(),3);
});
await test('Exact uploaded VT SVG appears in header, favicon and footer',async()=>{
 const mark='/portfolio/assets/vishal-tyagi-mark.svg';
 for(const selector of ['.site-header .brand-logo','.footer .footer-logo']){
  const el=home.locator(selector);
  assert.equal(await el.count(),1,selector);
  assert.equal(await el.getAttribute('src'),mark,selector);
  await el.evaluate(img=>img.decode());
  assert(await el.evaluate(img=>img.naturalWidth>0),'Logo failed to load: '+selector);
 }
 assert.equal(await home.locator('link[rel="icon"]').getAttribute('href'),mark);
 const svg=await(await home.request.get(BASE+mark)).text();
 assert(svg.includes('#B76E79')&&svg.includes('#006D77')&&svg.includes('viewBox="0 0 1000 1000"'),'Uploaded original SVG details changed');
 return 'Original SVG decoded with original teal and rose colors';
});
await test('Original portrait and project artwork load',async()=>{
 const samples=home.locator('.hero-photo img, .project-cover img');
 for(let i=0;i<await samples.count();i++){
  const img=samples.nth(i);
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.decode());
  const state=await img.evaluate(el=>({width:el.naturalWidth,url:el.getAttribute('src')}));
  assert(state.width>0,JSON.stringify(state));
 }
 return (await samples.count())+' original images loaded';
});
await test('Resume and motion files are reachable',async()=>{
 for(const path of ['/portfolio/assets/Vishal-Tyagi-Resume.pdf','/portfolio/assets/motion-selected.mp4']){
  const response=await home.request.get(BASE+path);
  assert.equal(response.status(),200,path);
  assert(Number(response.headers()['content-length']||1)>0,path);
 }
});
await test('Desktop wheel scroll reaches contact with no interception',async()=>{
 await home.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
 await home.waitForTimeout(100);
 await home.mouse.move(500,420);
 const before=await home.evaluate(()=>scrollY);
 await home.mouse.wheel(0,850);
 await home.waitForTimeout(420);
 const after=await home.evaluate(()=>scrollY);
 assert(after>before+100,JSON.stringify({before,after}));
 await home.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await home.waitForTimeout(120);
 const state=await home.evaluate(()=>({atBottom:Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<8,contact:document.querySelector('#contact').getBoundingClientRect().top,vh:innerHeight}));
 assert(state.atBottom&&state.contact<state.vh,JSON.stringify(state));
 return 'wheel moved '+Math.round(after-before)+'px';
});
await test('Contact and resume routes are correct',async()=>{
 const c=await home.locator('#contact .button').evaluateAll(els=>els.map(x=>({text:x.textContent.trim(),href:x.href})));
 assert(c.some(x=>x.text.includes('job')&&x.href.includes('wa.me/917409219402')));
 assert(c.some(x=>x.text.includes('project')&&x.href.includes('wa.me/917409219402')));
 assert(c.some(x=>x.href.includes('linkedin.com/in/vishal-tyagi-graphic-designer')));
 const resume=await home.locator('a[download]').first().getAttribute('href');
 assert.equal(resume,'/portfolio/assets/Vishal-Tyagi-Resume.pdf');
});
await home.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await home.screenshot({path:'qa-screenshots/simple-home-desktop.png'});
const archive=await browser.newPage({viewport:{width:1440,height:900}});
await archive.goto(BASE+'/portfolio/',{waitUntil:'domcontentloaded'});
await test('Portfolio archive uses exactly the same VT header and favicon',async()=>{
 const mark='/portfolio/assets/vishal-tyagi-mark.svg';
 const logo=archive.locator('.site-header .brand-logo');
 assert.equal(await logo.getAttribute('src'),mark);
 await logo.evaluate(img=>img.decode());
 assert(await logo.evaluate(img=>img.naturalWidth>0));
 assert.equal(await archive.locator('.footer-logo').getAttribute('src'),mark);
 assert.equal(await archive.locator('link[rel="icon"]').getAttribute('href'),mark);
});
await test('All 14 original archive categories are preserved',async()=>{
 const map=JSON.parse(await readFile('source-map.json','utf8'));
 for(const project of map.projects){
  const section=archive.locator('#'+project.id);
  assert.equal(await section.count(),1,'Missing '+project.id);
  assert(await section.locator('a img').count()>0,'Missing artwork '+project.id);
 }
 return map.projects.length+' project sections';
});
await test('All archive artwork files remain accessible',async()=>{
 const map=JSON.parse(await readFile('source-map.json','utf8'));
 const manual={resultbull:['assets/resultbull.svg'],gtm:['assets/gtm.svg'],vt:['assets/vishal-tyagi-logo.svg']};
 let checked=0;
 for(const project of map.projects){
  const paths=(manual[project.id]||project.files.map(file=>map.images[file]));
  const urls=await archive.locator('#'+project.id+' .archive-media a').evaluateAll(nodes=>nodes.map(n=>new URL(n.href).pathname));
  assert.equal(urls.length,paths.length,project.id+' image count');
  for(const path of paths){
    assert(urls.includes('/portfolio/'+path),'Missing original '+path);
    await access('portfolio/'+path);
    checked++;
  }
 }
 return checked+' artwork files present and linked';
});
await test('Archive thumbnail images load on demand',async()=>{
 for(const selector of ['#resultbull','#gtm','#ascott','#pride','#rcz','#ginger','#hyatt','#radisson-mumbai','#citadines','#namah','#oakwood','#signum','#archive']){
  const el=archive.locator(selector+' .archive-media a img').first();
  await el.scrollIntoViewIfNeeded();await el.evaluate(img=>img.decode());
  assert(await el.evaluate(img=>img.naturalWidth>0),'Broken '+selector);
 }
});
await test('Additional artwork is collapsed by default but accessible',async()=>{
 const d=archive.locator('#archive details');
 assert.equal(await d.count(),1);
 assert.equal(await d.getAttribute('open'),null);
 await d.locator('summary').click();
 assert(await d.evaluate(el=>el.open));
 assert((await d.locator('img').count())>30);
});
await test('Archive full portfolio links and original videos are present',async()=>{
 assert.equal(await archive.locator('#motion video[controls]').count(),2);
 assert.equal(await archive.locator('.quick-index a').count(),5);
 assert(await archive.locator('a[href="/#contact"]').count()>0);
});
await archive.screenshot({path:'qa-screenshots/simple-archive-desktop.png'});

for(const width of [320,390,430,768,1280]){
 const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
 const jsErrors=[];page.on('pageerror',err=>jsErrors.push(err.message));
 await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
 await test('Home '+width+'px: no sideways overflow and nav reachable',async()=>{
  const data=await page.evaluate(()=>({content:document.documentElement.scrollWidth,viewport:innerWidth,hero:document.querySelector('h1').getBoundingClientRect().width}));
  assert(data.content<=data.viewport+3,JSON.stringify(data));
  assert(data.hero>120,JSON.stringify(data));
  for(const sel of ['.brand','.site-header .brand-logo','.nav-links a[href="#work"]','.nav-links .nav-cta']){
   assert(await page.locator(sel).isVisible(),sel);
  }
 });
 await test('Home '+width+'px: reaches projects and contact',async()=>{
  await page.locator('#contact').scrollIntoViewIfNeeded();
  assert(await page.locator('#contact').isVisible());
  assert.deepEqual(jsErrors,[]);
 });
 if(width===390){await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:'qa-screenshots/simple-home-mobile.png'});}
 await page.goto(BASE+'/portfolio/',{waitUntil:'domcontentloaded'});
 await test('Archive '+width+'px: no sideways overflow and all artwork sections exist',async()=>{
  const dim=await page.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
  assert(dim.page<=dim.vw+3,JSON.stringify(dim));
  assert.equal(await page.locator('.archive-section').count(),14);
 });
 if(width===390)await page.screenshot({path:'qa-screenshots/simple-archive-mobile.png'});
 await page.close();
}
await test('Desktop has no JS exceptions',async()=>assert.deepEqual(errors,[]));
const noJS=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
await noJS.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await test('Homepage works entirely without JavaScript',async()=>{
 assert.equal(await noJS.locator('h1').count(),1);
 assert.equal(await noJS.locator('.project-card').count(),6);
 assert(await noJS.locator('#contact .button').count()>=2);
});
await noJS.goto(BASE+'/portfolio/',{waitUntil:'domcontentloaded'});
await test('Archive works entirely without JavaScript',async()=>{
 assert.equal(await noJS.locator('.archive-section').count(),14);
 const disclosure=noJS.locator('#ascott details');
 assert.equal(await disclosure.count(),1);
 await disclosure.locator('summary').click();
 assert(await disclosure.evaluate(el=>el.open));
});
await browser.close();
console.log('Simple website QA: '+passed+' passed, '+failed+' failed.');
if(failed)process.exitCode=1;
