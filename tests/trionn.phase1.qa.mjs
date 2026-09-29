import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE=process.env.QA_BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
await mkdir('qa-screenshots/trionn-phase1',{recursive:true});
const outcomes=[];
const check=async(name,fn)=>{
  try{const detail=await fn();console.log('PASS '+name+(detail?' — '+detail:''));outcomes.push({name,ok:true});}
  catch(err){console.error('FAIL '+name+' — '+String(err));outcomes.push({name,ok:false});}
};
const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];desktop.on('pageerror',e=>errors.push(e.message));
await desktop.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await check('Cinematic assets load and initialization is idempotent',async()=>{
  await desktop.waitForFunction(()=>document.documentElement.classList.contains('tr-ready'),{timeout:7000});
  const state=await desktop.evaluate(()=>({
    mark:document.querySelectorAll('.tr-orb').length,
    logo:document.querySelector('.tr-orb img')?.getAttribute('src'),
    css:getComputedStyle(document.documentElement).getPropertyValue('--tr-night').trim(),
    bridge:document.querySelectorAll('.tr-bridge').length
  }));
  assert.equal(state.mark,1,JSON.stringify(state));
  assert.equal(state.logo,'/portfolio/assets/vishal-tyagi-mark.svg');
  assert.equal(state.css,'#0b1017');
  assert.equal(state.bridge,1);
  return JSON.stringify(state);
});
await check('Original portrait preserved and real image loaded',async()=>{
  await desktop.locator('.hero-portrait img').evaluate(img=>img.decode());
  const d=await desktop.locator('.hero-portrait img').evaluate(i=>({src:i.getAttribute('src'),naturalWidth:i.naturalWidth}));
  assert.equal(d.src,'/portfolio/assets/vishal-hero-new-portrait.png');
  assert(d.naturalWidth>100,JSON.stringify(d));return JSON.stringify(d);
});
await check('First screen identifies profession and offers two CTAs',async()=>{
  const text=await desktop.locator('.hero-kicker').innerText();
  assert(text.includes('SENIOR GRAPHIC & MOTION DESIGNER'),text);
  const labels=await desktop.locator('.hero-quick-actions a').allTextContents();
  assert(labels.some(s=>/VIEW WORK/.test(s))&&labels.some(s=>/HIRE/.test(s)),JSON.stringify(labels));
});
await check('Pointer movement animates only the decorative VT mark',async()=>{
  await desktop.mouse.move(1100,220);await desktop.waitForTimeout(120);
  const vars=await desktop.locator('.tr-orb').evaluate(el=>[el.style.getPropertyValue('--tr-rx'),el.style.getPropertyValue('--tr-ry')]);
  assert(vars.some(x=>x&&x!=='0deg'),JSON.stringify(vars));return JSON.stringify(vars);
});
await check('Desktop wheel remains native and never frozen',async()=>{
  await desktop.mouse.move(600,450);
  const before=await desktop.evaluate(()=>scrollY);
  await desktop.mouse.wheel(0,850);await desktop.waitForTimeout(260);
  const after=await desktop.evaluate(()=>scrollY);
  assert(after>before+170,JSON.stringify({before,after}));return Math.round(after-before)+'px';
});
await check('Original five projects retained',async()=>{
  assert.equal(await desktop.locator('.story-stage article.scene').count(),5);
  assert.equal(await desktop.locator('.film-brief-form').count(),1);
});
await desktop.evaluate(()=>scrollTo(0,0));await desktop.waitForTimeout(3000);
await desktop.screenshot({path:'qa-screenshots/trionn-phase1/desktop-hero.png'});
await desktop.locator('.tr-bridge').scrollIntoViewIfNeeded();await desktop.waitForTimeout(450);
await check('Editorial scene handoff becomes visible on scroll',async()=>{
  const bridge=desktop.locator('.tr-bridge');
  assert.equal(await bridge.getAttribute('aria-hidden'),'true');
  assert(await bridge.evaluate(el=>el.classList.contains('is-visible')));
});
await desktop.screenshot({path:'qa-screenshots/trionn-phase1/desktop-bridge.png'});
await desktop.locator('#work').scrollIntoViewIfNeeded();await desktop.waitForTimeout(450);
await desktop.screenshot({path:'qa-screenshots/trionn-phase1/desktop-work.png'});
await check('No browser runtime exceptions',async()=>assert.deepEqual(errors,[]));

for(const width of [320,390,430,768]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
  const mobileErrors=[];page.on('pageerror',e=>mobileErrors.push(e.message));
  await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await check('Responsive '+width+': no sideways overflow and role is visible',async()=>{
    await page.waitForFunction(()=>document.documentElement.classList.contains('tr-ready'),{timeout:7000});
    const d=await page.evaluate(()=>({
      viewport:innerWidth,page:document.documentElement.scrollWidth,
      kicker:getComputedStyle(document.querySelector('.hero-kicker')).display,
      role:document.querySelector('.hero-kicker').textContent,
      orb:getComputedStyle(document.querySelector('.tr-orb')).display
    }));
    assert(d.page<=d.viewport+3,JSON.stringify(d));
    assert(d.kicker!=='none'&&d.role.includes('SENIOR GRAPHIC'),JSON.stringify(d));
    if(width<=430)assert.equal(d.orb,'none');
    return JSON.stringify(d);
  });
  await check('Responsive '+width+': reach contact with native scroll',async()=>{
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
    await page.waitForTimeout(160);
    const d=await page.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
    assert(Math.abs(d.y-d.max)<8,JSON.stringify(d));
    assert.equal(await page.locator('#filmBriefForm').count(),1);
  });
  if(width===390){
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(2800);
    await page.screenshot({path:'qa-screenshots/trionn-phase1/mobile-390-hero.png'});
    await page.locator('.tr-bridge').scrollIntoViewIfNeeded();
    await page.screenshot({path:'qa-screenshots/trionn-phase1/mobile-390-bridge.png'});
  }
  await check('Responsive '+width+': no JS errors',async()=>assert.deepEqual(mobileErrors,[]));
  await page.close();
}
const reduced=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
await reduced.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await check('Reduced motion preserves message and skips decorative animation',async()=>{
  await reduced.waitForFunction(()=>document.documentElement.classList.contains('tr-ready'));
  const state=await reduced.evaluate(()=>({
    bridge:document.querySelector('.tr-bridge').classList.contains('is-visible'),
    animation:getComputedStyle(document.querySelector('.tr-orb')).animationName,
    title:document.querySelector('.hero-title').getAttribute('aria-label'),
    paragraphs:document.querySelectorAll('#about p').length
  }));
  assert(state.bridge&&state.animation==='none'&&state.title?.length>15&&state.paragraphs>0,JSON.stringify(state));return JSON.stringify(state);
});
const noJS=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
await noJS.goto(BASE+'/',{waitUntil:'domcontentloaded'});
await check('No-JS content accessible without orb',async()=>{
  assert.equal(await noJS.locator('.tr-orb').count(),0);
  assert.equal(await noJS.locator('.hero-quick-actions a').count(),2);
  assert.equal(await noJS.locator('.story-stage article.scene').count(),5);
});
await browser.close();
console.log('Trionn direction QA: '+outcomes.filter(x=>x.ok).length+'/'+outcomes.length+' checks passed');
if(outcomes.some(x=>!x.ok))process.exitCode=1;
