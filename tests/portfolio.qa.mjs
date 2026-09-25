import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const BASE='http://127.0.0.1:4173';
await mkdir('qa-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
const results=[];
const record=(name,success,detail='')=>{results.push({name,success,detail});console.log((success?'PASS ':'FAIL ')+name+(detail?' — '+detail:''));if(!success)process.exitCode=1};
async function check(name,fn){try{let detail=await fn();record(name,true,detail??'')}catch(e){record(name,false,String(e).slice(0,300))}}
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await page.waitForTimeout(220);
await check('Desktop 1440: stage enabled',async()=>assert.equal(await page.locator('#work').evaluate(el=>el.classList.contains('film-enhanced')),true));
await check('Desktop 1440: correct number of projects',async()=>assert.equal(await page.locator('.story-stage article.scene').count(),5));
await check('Desktop wheel over page genuinely scrolls',async()=>{
 await page.mouse.move(490,390);const before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,930);await page.waitForTimeout(220);
 const after=await page.evaluate(()=>scrollY);assert(after>before+170,JSON.stringify({before,after}));return 'wheel delta moved '+Math.round(after-before)+'px';
});
await check('Desktop pinned stage transitions are smooth & reachable',async()=>{
 const stageTop=await page.locator('.story-stack').evaluate(el=>el.getBoundingClientRect().top+scrollY);
 await page.evaluate(y=>scrollTo(0,y),stageTop+450);
 await page.waitForTimeout(550);
 const geom=await page.evaluate(()=>({position:getComputedStyle(document.querySelector('.story-stage')).position,y:parseFloat(getComputedStyle(document.querySelectorAll('article.scene')[1]).getPropertyValue('--film-enter'))}));
 assert.equal(geom.position,'sticky');assert(geom.y>0&&geom.y<100,JSON.stringify(geom));return JSON.stringify(geom);
});
await page.screenshot({path:'qa-screenshots/stage-desktop.png'});
await check('Wheel within sticky project stage never freezes',async()=>{
 await page.mouse.move(600,390);let before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,610);await page.waitForTimeout(200);let after=await page.evaluate(()=>scrollY);assert(after>before+100,JSON.stringify({before,after}));return 'advanced '+Math.round(after-before)+'px';
});
await check('Keyboard scroll works within stage',async()=>{
 const before=await page.evaluate(()=>scrollY);await page.keyboard.press('PageDown');await page.waitForTimeout(250);
 const after=await page.evaluate(()=>scrollY);assert(after>before+30,JSON.stringify({before,after}));return 'advanced '+Math.round(after-before)+'px';
});
await check('Page reaches contact after entire stage',async()=>{
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(250);
 let v=await page.evaluate(()=>({y:scrollY,top:document.getElementById('contact').getBoundingClientRect().top,max:document.documentElement.scrollHeight-innerHeight,vh:innerHeight}));
 assert(Math.abs(v.max-v.y)<5,JSON.stringify(v));assert(v.top<v.vh,JSON.stringify(v));return JSON.stringify(v);
});
await page.screenshot({path:'qa-screenshots/contact-desktop.png'});
await check('WhatsApp brief builds actual message without redirecting QA browser',async()=>{
 await page.fill('input[name="contact_name"]','Test Person');await page.fill('input[name="contact_email"]','qa@example.com');await page.selectOption('select[name="kind"]','Freelance creative project');await page.fill('textarea[name="brief"]','Interested in an identity and motion collaboration');
 await page.evaluate(()=>document.getElementById('filmBriefForm').addEventListener('submit',e=>e.preventDefault()));
 await page.locator('#filmBriefForm button[type="submit"]').click();let text=await page.locator('#filmBriefText').inputValue();
 assert(text.includes('Test Person')&&text.includes('qa@example.com')&&text.includes('identity and motion'));return 'required fields included in message';
});
await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1550);
await page.screenshot({path:'qa-screenshots/hero-desktop.png',animations:'disabled'});
await page.evaluate(()=>document.getElementById('services').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(900);
await page.screenshot({path:'qa-screenshots/services-desktop.png'});
await check('Desktop 1366x768: stage and project sections',async()=>{
 await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(160);assert.equal(await page.locator('#work').evaluate(el=>el.classList.contains('film-enhanced')),true);
 assert.equal(await page.locator('.story-stage article.scene').count(),5);
});
await check('Short desktop 1280x600: safe normal-scroll fallback',async()=>{
 await page.setViewportSize({width:1280,height:600});await page.waitForTimeout(160);
 assert.equal(await page.locator('#work').evaluate(el=>el.classList.contains('film-enhanced')),false);
 let r=await page.locator('.story-stage article.scene').evaluateAll(els=>els.map(x=>x.getBoundingClientRect().top));
 assert(r[1]>r[0],JSON.stringify(r));return 'all five projects remain in page flow';
});
const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
await mobile.goto(BASE+'/',{waitUntil:'domcontentloaded'});await mobile.waitForTimeout(220);
await check('Mobile: no scroll-hijacking/pinned stage',async()=>{
 assert.equal(await mobile.locator('#work').evaluate(el=>el.classList.contains('film-enhanced')),false);
 const tops=await mobile.locator('.story-stage article.scene').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));
 assert(tops[1]>tops[0],JSON.stringify(tops));return 'natural project flow';
});
await check('Mobile hero portrait is centered and meaningfully visible',async()=>{
 const v=await mobile.locator('.hero-portrait').evaluate(el=>{
  const r=el.getBoundingClientRect(), vp=innerWidth;
  return {x:r.x,right:r.right,width:r.width,viewport:vp,center:r.x+r.width/2};
 });
 assert(v.x>=-8&&v.right<=v.viewport+8,JSON.stringify(v));
 assert(Math.abs(v.center-v.viewport/2)<v.viewport*.2,JSON.stringify(v));
 return JSON.stringify(v);
});
await check('Mobile: no unexpected sideways scrolling',async()=>{
 const dim=await mobile.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));assert(dim.page<=dim.viewport+3,JSON.stringify(dim));return JSON.stringify(dim);
});
await mobile.waitForTimeout(1700);await mobile.screenshot({path:'qa-screenshots/home-mobile.png',fullPage:false});
await check('Mobile scrolling reaches contact',async()=>{
 await mobile.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await mobile.waitForTimeout(120);
 let d=await mobile.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));assert(Math.abs(d.max-d.y)<6,JSON.stringify(d));return 'contact reachable';
});
const noJs=await browser.newPage({viewport:{width:1440,height:900},javaScriptEnabled:false});await noJs.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await check('JavaScript-off still shows every project',async()=>{
 let coords=await noJs.locator('.story-stage article.scene').evaluateAll(xs=>xs.map(x=>x.getBoundingClientRect().top));
 assert(coords.length===5&&coords.every((x,i)=>i===0||x>coords[i-1]),JSON.stringify(coords));return 'progressive enhancement works';
});
const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await reduced.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await check('Reduced motion: no pinned stage',async()=>assert.equal(await reduced.locator('#work').evaluate(x=>x.classList.contains('film-enhanced')),false));
const archive=await browser.newPage({viewport:{width:1440,height:900}});await archive.goto(BASE+'/portfolio/',{waitUntil:'domcontentloaded'});
await check('Full portfolio remains navigable',async()=>{
 assert((await archive.locator('#work').count())>0);assert((await archive.locator('#contact').count())>0);
 assert((await archive.locator('img').count())>40);return 'projects & CTAs rendered';
});
await archive.screenshot({path:'qa-screenshots/archive-desktop.png'});
await check('Page JavaScript has no runtime exceptions',async()=>assert.equal(errors.length,0,JSON.stringify(errors)));
const ref=await browser.newPage({viewport:{width:1440,height:900}});
try{
 await ref.goto('https://www.nbnzia.com/',{waitUntil:'domcontentloaded',timeout:25000});
 await ref.waitForTimeout(1800);await ref.screenshot({path:'qa-screenshots/reference-loading.png'});
 await ref.waitForTimeout(5800);await ref.screenshot({path:'qa-screenshots/reference-hero.png'});
 await ref.waitForTimeout(3300);await ref.screenshot({path:'qa-screenshots/reference-hero-late.png'});
 for(let j=0;j<4;j++){
   await ref.mouse.move(600,470);await ref.mouse.wheel(0,850);await ref.waitForTimeout(1700);
   await ref.screenshot({path:'qa-screenshots/reference-scroll-'+(j+1)+'.png'});
 }
 console.log('REFERENCE visual captures completed at several time/scroll states. They require manual comparison.');
}catch(e){console.log('REFERENCE capture unavailable: '+String(e).slice(0,140))}
await check('Mobile services accordion expands on touch and exposes an actual preview',async()=>{
 await mobile.evaluate(()=>document.getElementById('services').scrollIntoView({behavior:'instant'}));
 const row=mobile.locator('.services .service-row').nth(1);
 await row.click();await mobile.waitForTimeout(180);
 assert.equal(await row.getAttribute('aria-expanded'),'true');
 assert.equal(await mobile.locator('.services .service-row').first().getAttribute('aria-expanded'),'false');
 let vis=await row.locator('p').isVisible();
 assert(vis,'selected description not visible');
 let img=await row.locator('.film-service-preview').isVisible();
 assert(img,'selected portfolio preview not visible');
 return 'touch accordion and visual preview work';
});
await check('Inactive desktop project links are not keyboard focusable',async()=>{
 await page.setViewportSize({width:1440,height:900});
 await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.querySelector('.story-stack').scrollIntoView({behavior:'instant'}));
 await page.waitForTimeout(600);
 const states=await page.locator('.story-stage article.scene').evaluateAll(els=>els.map(e=>({hidden:e.getAttribute('aria-hidden'),inert:e.inert})));
 assert.equal(states.length,5);
 assert(states.filter(e=>e.hidden==='true').every(e=>e.inert),JSON.stringify(states));
 return JSON.stringify(states);
});
await check('Public website content has no reference or demo copy',async()=>{
 const content=await page.locator('main').innerText();
 assert(!/NBNZIA|inspired by|demo v3/i.test(content));
 return 'original Vishal portfolio copy';
});
await check('Archive artwork attribution does not claim unverified client credits',async()=>{
 const text=await archive.locator('body').innerText();
 assert(!text.includes('client credit unverified'),'unreviewed label visible');
 assert(text.includes('no client relationship claimed'),'clarifying label missing');
 return 'unattributed artwork labelled separately';
});
await browser.close();console.log('QA RESULT '+results.filter(x=>x.success).length+'/'+results.length);
if(process.exitCode)process.exit(process.exitCode);
