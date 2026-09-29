import assert from "node:assert/strict";
import {chromium} from "playwright";
import {readFile,mkdir} from "node:fs/promises";
const BASE="http://127.0.0.1:4173",ROUTE="/fold-2026/";
await mkdir("qa-evidence/fold-2026",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(name,run){try{const extra=await run();passed++;console.log("PASS "+name+(extra?" — "+extra:""))}catch(e){failed++;console.error("FAIL "+name+" — "+String(e).slice(0,1600))}}
const p=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});p.setDefaultTimeout(6000);
const errors=[];p.on("pageerror",e=>errors.push(e.message));
const res=await p.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(400);
await check("Isolated design experiment, genuine single two-leaf folding original-art canvas",async()=>{
assert.equal(res.status(),200);assert.equal(await p.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
assert.equal(await p.locator(".fold-sculpture").count(),1);assert.equal(await p.locator(".fold-leaf").count(),2);
assert.equal(await p.locator(".stage-dots button").count(),4);
assert((await p.locator(".concept-ribbon").innerText()).includes("LIVE SITE UNCHANGED"));
assert((await p.evaluate(()=>window.__foldQA.state)).enhanced);
});
await check("Source assets HTTP 200, original portrait and original reel only",async()=>{
const s=await p.evaluate(()=>window.__foldQA.assets);
assert.equal(s.length,4);
const assets=[...new Set([...s.flat(),"/portfolio/assets/vishal-hero-new-portrait.png","/portfolio/assets/motion-selected.mp4","/portfolio/assets/Vishal-Tyagi-Resume.pdf"])];
for(const asset of assets){const r=await p.request.get(BASE+asset);assert.equal(r.status(),200,asset)}
assert.equal(await p.locator(".about-portrait img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
assert.equal(await p.locator("#motion video").getAttribute("autoplay"),null);return assets.length+" original assets";
});
await p.screenshot({path:"qa-evidence/fold-2026/01-desktop-first-screen.png"});
async function seek(x){await p.evaluate(v=>{const e=document.querySelector(".fold-journey");scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*v,behavior:"instant"})},x);await p.waitForTimeout(280)}
await check("Physical fold genuinely unfolds with normal native mouse scrolling",async()=>{
await seek(.018);const a=await p.evaluate(()=>window.__foldQA.state);await seek(.17);
const b=await p.evaluate(()=>window.__foldQA.state);
assert(+b.open>+a.open+.4,JSON.stringify({a,b}));
const before=await p.evaluate(()=>scrollY);await p.mouse.wheel(0,360);await p.waitForTimeout(200);
assert((await p.evaluate(()=>scrollY))>before+120,"wheel hijacking");
return "fold progresses from "+a.open+" to "+b.open;
});
await p.screenshot({path:"qa-evidence/fold-2026/02-desktop-unfolded-transition.png"});
const chapters=[[0,"001-ascott"],[1,"resultbull.svg"],[2,"gtm.svg"],[3,"008-pride"]];
for(const [i,name] of chapters){
await check("Chapter "+(i+1)+" dynamically folds original project into the same physical canvas",async()=>{
await seek(.19+.81/4*(i+.43));
const s=await p.evaluate(()=>window.__foldQA.state);
assert.equal(s.active,i,JSON.stringify(s));assert(s.currentArt.includes(name),JSON.stringify(s));
assert(+s.open>.88,JSON.stringify(s));assert.equal(await p.locator(".fold-sculpture").count(),1);
assert.equal(await p.locator(".stage-dots [aria-current='true']").count(),1);
assert.equal(await p.locator("#project-index").innerText(),String(i+1).padStart(2,"0"));
return s.currentArt;
});
await p.screenshot({path:"qa-evidence/fold-2026/0"+(3+i)+"-desktop-project-"+(i+1)+".png"});
}
await check("Four meaningful chapter buttons jump within native document scrolling",async()=>{
await p.locator('[data-jump="0"]').click();await p.waitForTimeout(1200);
assert.equal((await p.evaluate(()=>window.__foldQA.state)).active,0);
});
await check("Full original case viewer supports artwork arrows, archive links and close on Escape",async()=>{
await p.locator("#open-project").click();assert(await p.locator("#work-dialog").evaluate(x=>x.open));
assert.equal(await p.locator("#dialog-title").innerText(),"Discover ASR");
assert.equal(await p.locator("#dialog-original-link").getAttribute("href"),"/portfolio/#ascott");
await p.keyboard.press("ArrowRight");
assert((await p.locator("#dialog-image").getAttribute("src")).includes("002-ascott"));
await p.keyboard.press("Escape");assert(!(await p.locator("#work-dialog").evaluate(x=>x.open)));
});
await check("One-artwork cases have no nonworking carousel controls",async()=>{
await seek(.19+.81/4*1.44);await p.locator("#open-project").click();
assert.equal(await p.locator("#dialog-title").innerText(),"Resultbull.ai");
assert(await p.locator("#gallery-next").isDisabled());assert(await p.locator("#gallery-prev").isDisabled());await p.locator("#dialog-close").click();
});
await check("The native document reaches recruiter contact, reel never autoplays",async()=>{
await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));await p.waitForTimeout(220);
const y=await p.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
assert(Math.abs(y.y-y.max)<8,JSON.stringify(y));assert.equal(await p.locator("#contact a[href*='linkedin.com']").count(),1);
assert.equal(await p.locator("#motion video").getAttribute("autoplay"),null);assert.deepEqual(errors,[]);
});
await p.screenshot({path:"qa-evidence/fold-2026/07-desktop-contact.png"});
for(const width of [320,390,430,768,1024,1280,1440]){
const height=width<=430?844:width===768?1024:900;
const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
page.setDefaultTimeout(5000);const err=[];page.on("pageerror",e=>err.push(e.message));
const r=await page.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(220);
await check(width+"px exact viewport, no horizontal overflow, original work accessible",async()=>{
assert.equal(r.status(),200);
const s=await page.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
if(s.vw!==width||s.doc>width+2){
 const offenders=await page.evaluate(limit=>[...document.querySelectorAll("body *")].map(e=>{const v=e.getBoundingClientRect();return{tag:e.tagName,cls:e.className,right:Math.round(v.right),left:Math.round(v.left),w:Math.round(v.width)}}).filter(e=>e.right>limit+3||e.w>limit+2).sort((a,b)=>b.right-a.right).slice(0,12),width);
 console.error("OVERFLOW "+width+" "+JSON.stringify({s,offenders}));
}
assert.equal(s.vw,width,JSON.stringify(s));assert(s.doc<=width+2,JSON.stringify(s));
const state=await page.evaluate(()=>window.__foldQA.state);
assert.equal(state.enhanced,width>=1100);
if(width<1100){assert(await page.locator(".mobile-collection").isVisible());assert.equal(await page.locator(".mobile-piece").count(),4)}
else{assert(await page.locator(".fold-sticky").isVisible())}
assert.deepEqual(err,[]);return JSON.stringify(s);
});
await check(width+"px untrapped native scroll reaches page end",async()=>{
await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));await page.waitForTimeout(130);
const s=await page.evaluate(()=>({v:scrollY,m:document.documentElement.scrollHeight-innerHeight}));
assert(Math.abs(s.v-s.m)<9,JSON.stringify(s));assert.deepEqual(err,[]);
});
if(width===390){
await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await page.waitForTimeout(550);
await page.screenshot({path:"qa-evidence/fold-2026/08-mobile-first-screen.png"});
await page.locator('[data-mobile="0"]').scrollIntoViewIfNeeded();await page.screenshot({path:"qa-evidence/fold-2026/09-mobile-original-artwork.png"});
await check("Mobile touch exposes real gallery and usable close button",async()=>{
await page.locator('[data-mobile-open="0"]').click();assert(await page.locator("#work-dialog").evaluate(x=>x.open));
await page.locator("#dialog-close").click();assert(!(await page.locator("#work-dialog").evaluate(x=>x.open)));
});
}
await page.close();
}
for(const width of [390,1440]){
const page=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:"reduce",isMobile:width===390,hasTouch:width===390});
await page.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});
await check("Reduced motion "+width+"px removes pinned scroll and exposes every original project",async()=>{
assert.equal((await page.evaluate(()=>window.__foldQA.state)).enhanced,false);
assert(await page.locator(".mobile-collection").isVisible());
assert.equal(await page.locator(".fold-sticky").evaluate(e=>getComputedStyle(e).position),"relative");
assert((await page.evaluate(()=>document.documentElement.scrollWidth))<=width+2);
});
await page.close();
}
const nojs=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
await nojs.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});await nojs.evaluate(()=>document.fonts.ready);
await check("No JS: four original works have direct fallback links, video and recruiter contact remain",async()=>{
assert(await nojs.locator(".mobile-collection").isVisible());
assert.equal(await nojs.locator(".mobile-piece").count(),4);
assert.equal(await nojs.locator(".mobile-piece noscript a").count(),4);
assert.equal(await nojs.locator("#motion video").count(),1);
assert.equal(await nojs.locator("#contact a[href*='linkedin.com']").count(),1);
const s=await nojs.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth}));
assert(s.vw===390&&s.doc<=392,JSON.stringify(s));
});
await check("Original live homepage and portfolio CSS untouched",async()=>{
const [home,css,archive]=await Promise.all(["index.html","simple.css","portfolio/index.html"].map(x=>readFile(x,"utf8")));
assert(home.includes('href="/simple.css"')&&home.includes("Graphic &amp; motion <em>designer.</em>"));
assert(!home.includes("fold-2026"));assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
assert(archive.includes('id="resultbull"')&&archive.includes('id="pride"'));
});
await browser.close();
console.log("FOLD 2026 QA: "+passed+" passed; "+failed+" failed.");
if(failed)process.exitCode=1;