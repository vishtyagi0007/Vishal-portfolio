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
await check('Contact final act renders dark navy and readable light form text',async()=>{
 const colors=await page.evaluate(()=>{
  const bg=getComputedStyle(document.querySelector('#contact')).backgroundColor;
  const field=getComputedStyle(document.querySelector('#filmBriefForm input[name="contact_name"]')).color;
  return {bg,field};
 });
 const rgb=str=>(str.match(/[0-9.]+/g)||[]).slice(0,3).map(Number);
 const [r,g,b]=rgb(colors.bg);
 const [fr,fg,fb]=rgb(colors.field);
 assert(r<45&&g<45&&b<55,JSON.stringify(colors));
 assert(fr>180&&fg>180&&fb>175,JSON.stringify(colors));
 return JSON.stringify(colors);
});

// Video-reference functional acceptance checks (desktop + phone).
const film=await browser.newPage({viewport:{width:1440,height:900}});
await film.goto(BASE+'/',{waitUntil:'load'});
await film.waitForTimeout(2500);
await check('Reference hero: portrait and four theatrical text lines',async()=>{
  const lines=film.locator('.hero-title .title-line');
  assert.equal(await lines.count(),4);
  const portrait=await film.locator('.hero-portrait').boundingBox();
  const title=await film.locator('.hero-title').boundingBox();
  assert(portrait.width>400 && title.width>700,JSON.stringify({portrait,title}));
  assert(portrait.x<title.x+title.width && portrait.x+portrait.width>title.x,'portrait and type do not share frame');
  return 'hero portrait and typography overlap within one composition';
});
await check('Opening sequence is dismissible and removed after completion',async()=>{
 assert.equal(await film.locator('#filmIntroLoader').evaluate(x=>x.hidden),true);
 assert.equal(await film.locator('.ref-morph-portrait').count(),0);
 return 'loader exits, no blocking overlay remains';
});
await film.screenshot({path:'qa-screenshots/reference-rebuild-hero.png',animations:'disabled'});
await film.locator('#contact').scrollIntoViewIfNeeded();
await film.waitForTimeout(350);
await film.screenshot({path:'qa-screenshots/reference-rebuild-contact-heading.png',animations:'disabled'});

await film.locator('#services').scrollIntoViewIfNeeded();
await check('Desktop services expand on click with artwork integrated',async()=>{
 const rows=film.locator('.services .service-row');
 await rows.nth(2).click();
 await film.waitForTimeout(650); // Wait for the intentional expansion animation before visual assertion.
 const active=rows.nth(2);
 assert.equal(await active.getAttribute('aria-expanded'),'true');
 assert.equal(await rows.first().getAttribute('aria-expanded'),'false');
 const preview=active.locator('.film-service-preview');
 assert(await preview.isVisible(),'no project preview');
 const rect=await preview.boundingBox();
 assert(rect.height>100,'preview image not expanded '+JSON.stringify(rect));
 return 'desktop accordion text + art revealed';
});
await film.screenshot({path:'qa-screenshots/reference-rebuild-services.png'});
await check('Kinetic interlude exists without scroll interception',async()=>{
 const section=film.locator('#typeInterlude');
 await section.scrollIntoViewIfNeeded();
 await film.waitForTimeout(180);
 assert(await section.locator('textPath').count()===1);
 const value=await section.evaluate(el=>el.style.getPropertyValue('--type-travel'));
 assert(value.includes('%'),'kinetic scroll state missing');
 return value;
});
await film.screenshot({path:'qa-screenshots/reference-rebuild-kinetic.png'});
const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});
await phone.goto(BASE+'/',{waitUntil:'load'});
await phone.waitForTimeout(2300);
await check('Phone hero has photographic first-screen composition without horizontal overflow',async()=>{
 const d=await phone.evaluate(()=>({vw:innerWidth,w:document.documentElement.scrollWidth,portrait:document.querySelector('.hero-portrait').getBoundingClientRect().height,title:document.querySelector('.hero-title').getBoundingClientRect().height}));
 assert(d.w<=d.vw+3,JSON.stringify(d));
 assert(d.portrait>d.title,'portrait not meaningful');
 return JSON.stringify(d);
});
await phone.screenshot({path:'qa-screenshots/reference-rebuild-phone-hero.png'});
await phone.waitForTimeout(1900);
await check('Filmed mobile hero letters assemble and become readable within 4 seconds',async()=>{
 const result=await phone.locator('.hero-title').evaluate(el=>{
  const letters=[...el.querySelectorAll('.letter')];
  return {count:letters.length,done:document.documentElement.classList.contains('ref-intro-complete'),running:letters.filter(x=>getComputedStyle(x).animationPlayState==='running').length,opacity:Math.min(...letters.map(x=>parseFloat(getComputedStyle(x).opacity)))};
 });
 assert(result.done && result.count>30&&result.opacity>.99,JSON.stringify(result));
 return JSON.stringify(result);
});
await phone.screenshot({path:'qa-screenshots/reference-mobile-hero-assembled.png'});

await check('Phone navigation becomes a fullscreen overlay and closes',async()=>{
 await phone.locator('.mobile-nav-toggle').click();
 await phone.waitForTimeout(80);
 let data=await phone.locator('#mobileNav').evaluate(el=>({hidden:el.hidden,h:el.getBoundingClientRect().height,screen:innerHeight}));
 assert(!data.hidden&&data.h>=data.screen*.9,JSON.stringify(data));
 const mainInert=await phone.locator('#main').evaluate(el=>el.inert);
 assert(mainInert,'background stays keyboard focusable when menu is open');
 const names=await phone.locator('#mobileNav > a').allTextContents();
 assert.deepEqual(names.map(n=>n.trim()),['About','Services','Work','Process']);

 await phone.keyboard.press('Escape');
 assert.equal(await phone.locator('#mobileNav').evaluate(el=>el.hidden),true);
 assert.equal(await phone.locator('#main').evaluate(el=>el.inert),false);

 return 'full-screen menu visible and Escape closes';
});
await phone.locator('.mobile-nav-toggle').click();
await phone.screenshot({path:'qa-screenshots/reference-rebuild-phone-menu.png'});
await phone.keyboard.press('Escape');
await check('Phone projects are stacked, readable and scroll naturally',async()=>{
 await phone.locator('#work').scrollIntoViewIfNeeded();
 const scenes=await phone.locator('.story-stage .scene').evaluateAll(nodes=>nodes.map(n=>({position:getComputedStyle(n).position,y:n.getBoundingClientRect().top,h:n.getBoundingClientRect().height})));
 assert(scenes.length===5 && scenes.every(x=>x.position!=='absolute'),JSON.stringify(scenes));
 return 'all selected projects remain in document flow';
});
await phone.screenshot({path:'qa-screenshots/reference-rebuild-phone-projects.png'});
const archivePhone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
await archivePhone.goto(BASE+'/portfolio/',{waitUntil:'domcontentloaded'});
await check('Portfolio archive has full-screen touch menu',async()=>{
 await archivePhone.locator('.archive-menu-toggle').click();
 const v=await archivePhone.locator('#archiveMobileMenu').evaluate(el=>({hidden:el.hidden,h:el.getBoundingClientRect().height,vh:innerHeight}));
 assert(!v.hidden && v.h>=v.vh*.9,JSON.stringify(v));
 assert.equal(await archivePhone.locator('main').evaluate(el=>el.inert),true,'archive background focusable behind menu');
 await archivePhone.locator('#archiveMobileMenu a[href="#work"]').click();
 assert.equal(await archivePhone.locator('#archiveMobileMenu').evaluate(el=>el.hidden),true);
 assert.equal(await archivePhone.locator('main').evaluate(el=>el.inert),false);
 return 'menu opens, navigates, closes';
});
await archivePhone.screenshot({path:'qa-screenshots/reference-rebuild-phone-archive.png'});

await check('Intro: same-tab reload keeps the hero visible',async()=>{
 const fresh=await browser.newPage({viewport:{width:1440,height:900}});
 await fresh.goto(BASE+'/',{waitUntil:'load'});
 await fresh.waitForTimeout(2600);
 const first=await fresh.evaluate(()=>({hidden:document.querySelector('#filmIntroLoader').hidden,done:document.documentElement.classList.contains('ref-intro-complete')}));
 assert(first.hidden&&first.done,JSON.stringify(first));
 await fresh.reload({waitUntil:'load'});
 await fresh.waitForTimeout(380);
 const state=await fresh.evaluate(()=>({
  hidden:document.querySelector('#filmIntroLoader').hidden,
  done:document.documentElement.classList.contains('ref-intro-complete'),
  play:getComputedStyle(document.querySelector('.hero-title .title-line>span')).animationPlayState,
  opacity:getComputedStyle(document.querySelector('.hero-title .title-line>span')).opacity
 }));
 assert(state.hidden&&state.done&&state.play!=='paused',JSON.stringify(state));
 await fresh.waitForTimeout(1300);const opacity=await fresh.locator('.hero-title .title-line>span').first().evaluate(el=>parseFloat(getComputedStyle(el).opacity));assert(opacity>.99,'repeat visitor heading remains obscured: '+opacity);
 await fresh.screenshot({path:'qa-screenshots/repeat-visit-desktop.png'});
 await fresh.close();
 return JSON.stringify(state);
});
await check('Mobile opener has independently animated accessible character spans',async()=>{
 const title=phone.locator('.hero-title');
 const state=await title.evaluate(el=>({
  aria:el.getAttribute('aria-label'),
  letters:el.querySelectorAll('.letter').length,
  lineCount:el.querySelectorAll('.title-line').length,
  screenWidth:el.getBoundingClientRect().width,
  page:document.documentElement.scrollWidth
 }));
 assert(state.letters>35&&state.aria?.length>20&&state.lineCount===4,JSON.stringify(state));
 assert(state.page<=393,JSON.stringify(state));
 return JSON.stringify(state);
});
await check('Mobile selected projects load real artwork, and images appear inside each card',async()=>{
 const selected=phone.locator('#work .scene');
 const report=[];
 for(let i=0;i<await selected.count();i++){
  const scene=selected.nth(i);
  await scene.scrollIntoViewIfNeeded();
  await phone.waitForTimeout(160);
  const v=await scene.evaluate(el=>{
   const art=el.querySelector('.scene-art'),img=art&&art.querySelector('img');
   const a=art?.getBoundingClientRect(),b=img?.getBoundingClientRect(),box=el.getBoundingClientRect();
   return {name:el.id,imgLoaded:!!img?.complete&&img?.naturalWidth>0,artH:a?.height||0,imgH:b?.height||0,sceneH:box.height,scenePosition:getComputedStyle(el).position};
  });
  assert(v.imgLoaded&&v.artH>150&&v.imgH>100&&v.sceneH<1200,JSON.stringify(v));
  report.push(v);
 }
 await selected.nth(2).scrollIntoViewIfNeeded();
 await phone.waitForTimeout(300);
 await phone.screenshot({path:'qa-screenshots/reference-mobile-project-real-images.png'});
 return JSON.stringify(report);
});
await check('Reduced-motion mobile text remains legible without kinetic animation',async()=>{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const page=await ctx.newPage();await page.goto(BASE+'/',{waitUntil:'domcontentloaded'});
 const result=await page.evaluate(()=>({title:document.querySelector('.hero-title')?.textContent?.trim(),loaderHidden:document.querySelector('#filmIntroLoader')?.hidden}));
 assert(result.title&&result.title.includes('STORY')&&result.loaderHidden,JSON.stringify(result));
 await ctx.close();return 'reduced motion has text and no loader';
});

await check('Recorded visual chapter order is preserved on desktop and mobile',async()=>{
 const result=await film.evaluate(()=>[...document.querySelector('main').querySelectorAll(':scope > section')].map(el=>el.id||el.className.split(' ')[0]));
 const expected=['home','about','services','process','typeInterlude','work','typeOutro','contact'];
 assert.deepEqual(result,expected,JSON.stringify(result));
 return result.join(' → ');
});
await check('Phone services match recorded image-first editorial rows',async()=>{
 await phone.locator('#services').scrollIntoViewIfNeeded();
 const rows=phone.locator('.services .service-row');
 const items=[];
 for(let i=0;i<await rows.count();i++){
  const item=rows.nth(i);
  await item.scrollIntoViewIfNeeded();
  await phone.waitForTimeout(90);
  const v=await item.evaluate(el=>{
   const img=el.querySelector('.film-service-preview img'),wrapper=el.querySelector('.film-service-preview'),heading=el.querySelector('h3');
   const a=wrapper.getBoundingClientRect(),b=heading.getBoundingClientRect();
   return {imageFirst:a.bottom<=b.top+1,visible:a.height>130,width:a.width,imageLoaded:!!img?.complete&&img?.naturalWidth>0};
  });
  assert(v.imageFirst&&v.visible&&v.imageLoaded,JSON.stringify({i,...v}));
  items.push(v);
 }
 await rows.nth(1).scrollIntoViewIfNeeded();
 await phone.screenshot({path:'qa-screenshots/recorded-mobile-image-first-services.png'});
 return JSON.stringify(items);
});
await check('Motion work remains reachable from the simplified filmed homepage',async()=>{
 const a=film.locator('#about a[href="portfolio/#motion"]');
 assert(await a.isVisible());
 const archive=await browser.newPage();
 await archive.goto(BASE+'/portfolio/#motion',{waitUntil:'domcontentloaded'});
 assert.equal(await archive.locator('#motion').count(),1);
 await archive.close();
 return 'real motion section accessible from about';
});
await check('Filmed phone process handoff is compact and expandable without losing steps',async()=>{
 await phone.locator('#process').scrollIntoViewIfNeeded();
 const button=phone.locator('.mobile-process-toggle');
 assert(await button.isVisible(),'process disclosure missing');
 assert.equal(await button.getAttribute('aria-expanded'),'false');
 const folded=await phone.locator('#process').boundingBox();
 assert(folded.height<=350,'reference mobile process interlude is too tall '+folded.height);
 await phone.screenshot({path:'qa-screenshots/video-mobile-process-collapsed.png'});
 await button.click();
 assert.equal(await button.getAttribute('aria-expanded'),'true');
 assert(await phone.locator('#processSteps .film-process-step').first().isVisible());
 await phone.screenshot({path:'qa-screenshots/video-mobile-process-expanded.png'});
 await button.click();
 return 'compact light handoff and optional 3-stage process';
});
await check('Reference contact opening is correctly positioned and only uses the inline portrait',async()=>{
 await film.evaluate(()=>{const el=document.querySelector('#contact');window.scrollTo({top:el.getBoundingClientRect().top+scrollY,behavior:'instant'})});
 await film.waitForTimeout(300);
 const state=await film.evaluate(()=>{
  const c=document.querySelector('#contact'),headline=c.querySelector('.reference-contact-title'),inline=c.querySelector('.contact-photo-mark img');
  return {sectionTop:c.getBoundingClientRect().top,titleTop:headline.getBoundingClientRect().top,titleBottom:headline.getBoundingClientRect().bottom,portraitVisible:inline.getBoundingClientRect().height>35,ghost:getComputedStyle(c,'::before').display};
 });
 assert(state.titleTop>40 && state.titleTop<420 && state.portraitVisible && state.ghost==='none',JSON.stringify(state));
 await film.screenshot({path:'qa-screenshots/filmed-contact-at-section-entry.png'});
 return JSON.stringify(state);
});
await check('Small phones and tablet: no horizontal overflow, visible hero and reachable footer',async()=>{
 const sizes=[{w:320,h:740},{w:360,h:780},{w:430,h:932},{w:768,h:1024}];
 const findings=[];
 for(const d of sizes){
  const p=await browser.newPage({viewport:{width:d.w,height:d.h},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  await p.goto(BASE+'/',{waitUntil:'domcontentloaded'});
  await p.waitForTimeout(180);
  const a=await p.evaluate(()=>({
   page:document.documentElement.scrollWidth,
   viewport:innerWidth,
   portrait:document.querySelector('.hero-portrait').getBoundingClientRect().width,
   title:document.querySelector('.hero-title').getBoundingClientRect().width
  }));
  assert(a.page<=a.viewport+3,JSON.stringify({d,a}));
  assert(a.portrait>Math.min(260,d.w*.65),JSON.stringify({d,a}));
  await p.evaluate(()=>{const c=document.querySelector('#contact');scrollTo({top:c.getBoundingClientRect().top+scrollY,behavior:'instant'})});
  await p.waitForTimeout(160);
  assert(await p.locator('#filmBriefForm').count()===1,'contact form missing at '+d.w);
  if(d.w===320)await p.screenshot({path:'qa-screenshots/mobile-320-hero-and-layout.png'});
  findings.push({width:d.w,...a});
  await p.close();
 }
 return JSON.stringify(findings);
});
await browser.close();console.log('QA RESULT '+results.filter(x=>x.success).length+'/'+results.length);
if(process.exitCode)process.exit(process.exitCode);
