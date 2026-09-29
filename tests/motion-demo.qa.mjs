import assert from "node:assert/strict";
import {chromium} from "playwright";
import {access,mkdir,readFile} from "node:fs/promises";

const BASE="http://127.0.0.1:4173";
await mkdir("qa-screenshots/vt-motion-demo",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(name,run){
 try{const detail=await run();passed++;console.log("PASS "+name+(detail?" — "+detail:""))}
 catch(err){failed++;console.error("FAIL "+name+" — "+String(err).slice(0,1100))}
}
const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];const failedRequests=[];
desktop.on("pageerror",e=>errors.push(e.message));
desktop.on("requestfailed",r=>failedRequests.push(r.url()+" — "+r.failure()?.errorText));
const response=await desktop.goto(BASE+"/motion-demo/",{waitUntil:"domcontentloaded"});
await check("Isolated preview route and honest no-index metadata",async()=>{
 assert.equal(response.status(),200);
 assert.match(await desktop.title(),/Cinematic Motion/);
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert(await desktop.locator(".demo-strip").innerText().then(s=>s.includes("NOT ON YOUR LIVE WEBSITE")));
 assert.equal((await desktop.locator("script[src]").count()),1);
 assert((await desktop.locator('script[src]').getAttribute("src")).endsWith("demo.js"));
});
await check("Original face and exact VT logo are unchanged and render successfully",async()=>{
 for(const src of [
  "/portfolio/assets/vishal-hero-new-portrait.png",
  "/portfolio/assets/vishal-tyagi-mark.svg",
  "/portfolio/assets/resultbull.svg",
  "/portfolio/assets/gtm.svg",
  "/portfolio/assets/001-ascott-discover-asr-india-01.webp"
 ]){
  const r=await desktop.request.get(BASE+src);
  assert.equal(r.status(),200,src);
 }
 for(const sel of [".wordmark img",".hero-portrait"]){
  const el=desktop.locator(sel);
  await el.evaluate(img=>img.decode());
  const d=await el.evaluate(img=>({url:img.getAttribute("src"),width:img.naturalWidth}));
  assert(d.width>20,JSON.stringify(d));
 }
 assert.equal(await desktop.locator(".hero-portrait").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
});
await check("Desktop animated hero, 3 projects and working direct routes",async()=>{
 await desktop.waitForFunction(()=>window.__vtDemoQA?.state?.desktop===true);
 assert.equal(await desktop.locator(".hero-title .line").count(),2);
 assert.equal(await desktop.locator(".film-scene").count(),3);
 assert.equal(await desktop.locator(".hero-actions a").count(),2);
 assert.equal(await desktop.locator(".film-rail button").count(),3);
 const destinations=await desktop.locator(".project-cta").evaluateAll(els=>els.map(a=>a.getAttribute("href")));
 assert.deepEqual(destinations,["/portfolio/#resultbull","/portfolio/#gtm","/portfolio/#ascott"]);
});
await desktop.screenshot({path:"qa-screenshots/vt-motion-demo/desktop-hero.png"});
async function filmScrollTo(p){
 return desktop.evaluate(function(p){
  const el=document.querySelector(".project-film");
  const top=el.getBoundingClientRect().top+window.scrollY;
  const travel=el.offsetHeight-innerHeight;
  scrollTo({top:top+p*travel,behavior:"instant"});
 },p);
}
await check("Desktop stage uses native sticky scroll, not scroll interception",async()=>{
 const s=await desktop.locator(".film-sticky").evaluate(e=>getComputedStyle(e).position);
 assert.equal(s,"sticky");
 await filmScrollTo(.10);
 await desktop.waitForTimeout(130);
 const before=await desktop.evaluate(()=>scrollY);
 await desktop.mouse.move(530,450);
 await desktop.mouse.wheel(0,650);
 await desktop.waitForTimeout(340);
 const after=await desktop.evaluate(()=>scrollY);
 assert(after>before+170,JSON.stringify({before,after}));
 return "Native wheel moved "+Math.round(after-before)+"px";
});
for(const [p,expected,name] of [[.05,0,"Resultbull"],[.46,1,"GTM Leads"],[.82,2,"Discover ASR"]]){
 await check("Desktop cinematic project chapter: "+name,async()=>{
  await filmScrollTo(p);
  await desktop.waitForTimeout(1200);
  const d=await desktop.evaluate(()=>({
   index:window.__vtDemoQA.state.active,
   visible:[...document.querySelectorAll(".film-scene")].filter(e=>e.classList.contains("is-active")).length,
   hidden:[...document.querySelectorAll(".film-scene")].filter(e=>e.getAttribute("aria-hidden")==="true").length,
   inert:[...document.querySelectorAll(".film-scene")].filter(e=>e.inert).length,
   counter:document.querySelector("#film-number").textContent
  }));
  assert.equal(d.index,expected,JSON.stringify(d));
  assert.equal(d.visible,1,JSON.stringify(d));
  assert.equal(d.hidden,2,JSON.stringify(d));
  assert.equal(d.inert,2,JSON.stringify(d));
  assert.equal(d.counter,String(expected+1).padStart(2,"0"));
  return JSON.stringify(d);
 });
 await desktop.screenshot({path:"qa-screenshots/vt-motion-demo/desktop-project-"+(expected+1)+".png"});
}
await check("Project rail buttons navigate within native document",async()=>{
 const btn=desktop.locator('[data-scene-jump="0"]');
 await btn.click();
 await desktop.waitForTimeout(850);
 assert.equal(await desktop.locator("#film-number").innerText(),"01");
});
await check("Responsive original showreel uses user-initiated play",async()=>{
 const video=desktop.locator("#demo-reel");
 assert.equal(await video.getAttribute("autoplay"),null);
 assert(await video.evaluate(el=>el.controls));
 assert.equal(await video.locator("source").getAttribute("src"),"/portfolio/assets/motion-selected.mp4");
 const src=await desktop.request.get(BASE+"/portfolio/assets/motion-selected.mp4");
 assert.equal(src.status(),200);
});
await check("Full native page scroll reaches real contact without getting stuck",async()=>{
 await desktop.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await desktop.waitForTimeout(130);
 const d=await desktop.evaluate(()=>({
  scroll:scrollY,
  max:document.documentElement.scrollHeight-innerHeight,
  contact:document.querySelector("#contact").getBoundingClientRect().top,
  vh:innerHeight
 }));
 assert(Math.abs(d.max-d.scroll)<8,JSON.stringify(d));
 assert(d.contact<d.vh,JSON.stringify(d));
 return "Contact reachable";
});
await desktop.locator(".expertise").scrollIntoViewIfNeeded();
await desktop.screenshot({path:"qa-screenshots/vt-motion-demo/desktop-services.png"});
await desktop.locator(".reel-section").scrollIntoViewIfNeeded();
await desktop.screenshot({path:"qa-screenshots/vt-motion-demo/desktop-reel.png"});
await check("No desktop runtime errors or broken requests",async()=>{
 assert.deepEqual(errors,[]);
 assert.deepEqual(failedRequests,[]);
});
for(const width of [320,390,430,768,900,1280]){
 const height=width<=430?844:width===768?1024:900;
 const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
 const pageErrors=[];page.on("pageerror",e=>pageErrors.push(e.message));
 await page.goto(BASE+"/motion-demo/",{waitUntil:"domcontentloaded"});
 await check("Width "+width+"px: no horizontal overflow and CTAs visible",async()=>{
  const d=await page.evaluate(()=>({
   page:document.documentElement.scrollWidth,
   viewport:innerWidth,
   title:document.querySelector(".hero-title").textContent.trim(),
   link:document.querySelector(".hero-actions .main-button")?.getAttribute("href"),
   film:window.__vtDemoQA?.state?.desktop
  }));
  assert(d.page<=d.viewport+3,JSON.stringify(d));
  assert(d.title.includes("DESIGN")&&d.link==="#work",JSON.stringify(d));
  if(width<900)assert.equal(d.film,false,JSON.stringify(d));
  return JSON.stringify(d);
 });
 if(width<=760){
  await check("Width "+width+"px: all original projects in natural scroll layout",async()=>{
   assert.notEqual(await page.locator(".film-sticky").evaluate(e=>getComputedStyle(e).position),"sticky");
   for(let i=0;i<3;i++){
    const e=page.locator('.film-scene[data-scene="'+i+'"]');
    assert.equal(await e.count(),1);
    assert.equal(await e.getAttribute("aria-hidden"),null);
    assert(await e.locator("img").count()===1);
   }
  });
  await check("Width "+width+"px: menu opens, closes, and navigation works",async()=>{
   const menu=page.locator("#menu-toggle");
   assert(await menu.isVisible());
   await menu.click();
   assert.equal(await menu.getAttribute("aria-expanded"),"true");
   const about=page.locator('#navigation a[href="#about"]');
   assert(await about.isVisible());
   await about.click();
   assert.equal(await menu.getAttribute("aria-expanded"),"false");
   assert.equal(await page.evaluate(()=>location.hash),"#about");
  });
 }
 await check("Width "+width+"px: smooth-scroll alternative reaches contact",async()=>{
  await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
  await page.waitForTimeout(140);
  const d=await page.evaluate(()=>({pos:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
  assert(Math.abs(d.pos-d.max)<8,JSON.stringify(d));
  assert.equal(await page.locator("#contact").count(),1);
  assert.deepEqual(pageErrors,[]);
 });
 if(width===390){
  await page.evaluate(()=>{history.replaceState(null,"",location.pathname);scrollTo({top:0,behavior:"instant"})});
  await page.waitForTimeout(1250);
  await page.screenshot({path:"qa-screenshots/vt-motion-demo/mobile-hero-390.png"});
  await page.locator("#scene-resultbull").scrollIntoViewIfNeeded();
  await page.screenshot({path:"qa-screenshots/vt-motion-demo/mobile-project-390.png"});
 }
 await page.close();
}
const reduced=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:"reduce"});
await reduced.goto(BASE+"/motion-demo/",{waitUntil:"domcontentloaded"});
await check("Reduced-motion preference disables pinned sequence but retains three projects",async()=>{
 const state=await reduced.evaluate(()=>window.__vtDemoQA.state);
 assert.equal(state.reduced,true,JSON.stringify(state));
 assert.equal(state.desktop,false,JSON.stringify(state));
 const s=await reduced.evaluate(()=>({
  sticky:getComputedStyle(document.querySelector(".film-sticky")).position,
  revealed:getComputedStyle(document.querySelector(".intro h2")).opacity,
  articles:[...document.querySelectorAll(".film-scene")].map(e=>e.getAttribute("aria-hidden"))
 }));
 assert.notEqual(s.sticky,"sticky");
 assert.equal(s.revealed,"1");
 assert(s.articles.every(x=>x===null));
});
const noJS=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
await noJS.goto(BASE+"/motion-demo/",{waitUntil:"domcontentloaded"});
await check("No-JS fallback keeps navigation, every project, portrait and text visible",async()=>{
 assert.equal(await noJS.locator(".film-scene").count(),3);
 assert.equal(await noJS.locator(".hero-portrait").count(),1);
 assert(await noJS.locator(".nav-links").isVisible());
 const visible=await noJS.evaluate(()=>({
  page:document.documentElement.scrollWidth,
  viewport:innerWidth,
  sticky:getComputedStyle(document.querySelector(".film-sticky")).position,
  introOpacity:getComputedStyle(document.querySelector(".intro h2")).opacity,
  card:getComputedStyle(document.querySelector(".film-scene")).position
 }));
 assert(visible.page<=visible.viewport+3,JSON.stringify(visible));
 assert.equal(visible.introOpacity,"1");
 assert.notEqual(visible.sticky,"sticky");
 assert.equal(visible.card,"relative");
 return JSON.stringify(visible);
});
await check("Original production homepage is not altered on the demo branch",async()=>{
 const source=await readFile("index.html","utf8");
 assert(source.includes('href="/simple.css"'));
 assert(!source.includes('motion-demo/style.css'));
 assert(source.includes('Graphic &amp; motion <em>designer.</em>'));
 const css=await readFile("simple.css","utf8");
 assert(css.includes("--primary:#006D77"));
 assert(css.includes("--secondary:#B76E79"));
});
await browser.close();
console.log("VT Motion Demo QA: "+passed+" passed, "+failed+" failed.");
if(failed)process.exitCode=1;
