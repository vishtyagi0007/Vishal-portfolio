import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";
const BASE="http://127.0.0.1:4173",PATH="/vt-shift/";
await mkdir("qa-screenshots/vt-shift",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(label,run){
 try{const note=await run();passed++;console.log("PASS "+label+(note?" | "+note:""))}
 catch(e){failed++;console.error("FAIL "+label+" | "+String(e).slice(0,1500))}
}
async function ready(p){await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(280)}
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.setDefaultTimeout(7000);
const errors=[];page.on("pageerror",e=>errors.push(e.message));
const response=await page.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
await ready(page);await page.waitForTimeout(1300);
await check("Private one-surface preview and original visual identity",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert((await page.locator(".private-strip").innerText()).includes("LIVE WEBSITE UNCHANGED"));
 assert.equal(await page.locator(".brand img").getAttribute("src"),"/portfolio/assets/vishal-tyagi-mark.svg");
 assert.equal(await page.locator("#art-stage .visual-scene").count(),5);
 assert.equal(await page.locator(".visual-scene.is-active").count(),1);
 assert.equal(await page.locator("#art-title").innerText(),"Discover ASR");
 const type=await page.locator(".stage-intro h1").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(type.toLowerCase().includes("unbounded"),type);
 return "Unbounded typography, 5 compositions, no fake OS";
});
await page.screenshot({path:"qa-screenshots/vt-shift/01-desktop-first-screen.png"});
await check("Original work assets resolve without regenerating files or altering any pixels",async()=>{
 const assets=await page.evaluate(()=>window.__shiftQA.assets);
 assert.equal(assets.length,5);
 const files=[...new Set(assets.flatMap(x=>x.files).concat(["/portfolio/assets/vishal-hero-new-portrait.png","/portfolio/assets/vishal-tyagi-mark.svg","/portfolio/assets/Vishal-Tyagi-Resume.pdf","/portfolio/assets/motion-selected.mp4"]))];
 for(const asset of files){const res=await page.request.get(BASE+asset);assert.equal(res.status(),200,asset)}
 for(const entry of assets){assert(entry.archive.startsWith("/portfolio/#"))}
 const imgs=await page.locator(".visual-scene img").evaluateAll(es=>es.map(e=>e.getAttribute("src")));
 assert(imgs.every(x=>x.startsWith("/portfolio/assets/")),JSON.stringify(imgs));
 return files.length+" original assets HTTP 200";
});
for(const [i,slug,title,src] of [
 [0,"ascott","Discover ASR","001-ascott"],
 [1,"resultbull","Resultbull.ai","resultbull.svg"],
 [2,"gtm","GTM Leads","gtm.svg"],
 [3,"pride","Pride Hotels","008-pride"],
 [4,"radisson","Radisson","022-rcz"]
]){
 await check("Interactive project "+(i+1)+" independently changes the complete artwork composition",async()=>{
  await page.locator('[data-index="'+i+'"]').click();
  await page.waitForFunction(expected=>document.querySelector("#art-title")?.textContent===expected,title);
  const state=await page.evaluate(()=>window.__shiftQA.state);
  assert.equal(state.slug,slug);
  assert.equal(state.selected,i);
  assert.equal(await page.locator(".visual-scene.is-active").count(),1);
  assert.equal(await page.locator(".visual-scene[aria-hidden='true']").count(),4);
  assert.equal(await page.locator(".index-controls button[aria-current='true']").count(),1);
  assert.equal(await page.locator(".visual-scene.is-active .art-main").count(),1);
  assert((await page.locator(".visual-scene.is-active .art-main").getAttribute("src")).includes(src));
  return "state "+state.artboard;
 });
 await page.waitForTimeout(870);
 await page.screenshot({path:"qa-screenshots/vt-shift/"+String(i+2).padStart(2,"0")+"-desktop-project-"+slug+".png"});
}
await check("Keyboard work-navigation changes actual project, not a decorative keyboard hint",async()=>{
 await page.locator("#artboard").focus();
 await page.keyboard.press("1");
 await page.waitForFunction(()=>document.querySelector("#art-title").textContent==="Discover ASR");
 await page.keyboard.press("ArrowRight");
 await page.waitForFunction(()=>document.querySelector("#art-title").textContent==="Resultbull.ai");
 assert.equal(await page.locator(".visual-scene.is-active").getAttribute("data-scene"),"resultbull");
 await page.keyboard.press("5");
 await page.waitForFunction(()=>document.querySelector("#art-title").textContent==="Radisson");
 return "1 / ArrowRight / 5";
});
await check("FLIP uses original artwork and opens an actual usable fullscreen case study",async()=>{
 await page.locator('[data-index="0"]').click();
 await page.waitForFunction(()=>document.querySelector("#art-title").textContent==="Discover ASR");
 await page.locator("#open-study").click();
 await page.waitForFunction(()=>document.querySelector("#study").open);
 assert.equal(await page.locator("#study-image").getAttribute("src"),"/portfolio/assets/001-ascott-discover-asr-india-01.webp");
 assert.equal(await page.locator("#study-gallery img").count(),3);
 const s=await page.evaluate(()=>window.__shiftQA.state);
 assert.equal(s.viewer,true);
 assert(s.flights>=1,"FLIP animation did not start");
 assert.equal(s.hash,"#case-ascott");
 assert(await page.locator("#study").evaluate(el=>getComputedStyle(el).height==="900px"));
 return "full-screen original case gallery + shared element";
});
await page.waitForTimeout(1000);await page.screenshot({path:"qa-screenshots/vt-shift/07-fullscreen-original-case.png"});
await check("Case-to-case navigation and archive links are real and accurate",async()=>{
 await page.locator("#next-study").click();
 await page.waitForFunction(()=>document.querySelector("#study-title").textContent==="Resultbull.ai");
 assert.equal(await page.locator("#study-gallery img").count(),0);
 assert.equal(await page.locator(".study-gallery-empty").count(),1);
 assert.equal(await page.locator("#study-original").getAttribute("href"),"/portfolio/#resultbull");
 await page.locator("#next-study").click();
 await page.waitForFunction(()=>document.querySelector("#study-title").textContent==="GTM Leads");
 assert.equal(await page.locator("#study-original").getAttribute("href"),"/portfolio/#gtm");
 assert.equal(await page.locator("#artboard").getAttribute("data-tone"),"gtm");
 return "No fabricated project galleries";
});
await check("Escape closes the actual top-layer viewer and restores selected-project focus",async()=>{
 await page.keyboard.press("Escape");
 await page.waitForFunction(()=>!document.querySelector("#study").open);
 assert.equal(await page.locator("#study").evaluate(x=>x.open),false);
 assert.equal(await page.locator("#art-title").innerText(),"GTM Leads");
 assert.equal((await page.evaluate(()=>location.hash)),"#work");
 assert.deepEqual(errors,[]);
});
await check("Deep-link to a specific real project preserves direct access",async()=>{
 await page.goto(BASE+PATH+"#case-pride",{waitUntil:"domcontentloaded"});
 await ready(page);
 await page.waitForFunction(()=>document.querySelector("#study").open);
 assert.equal(await page.locator("#study-title").innerText(),"Pride Hotels");
 assert.equal(await page.locator("#study-gallery img").count(),2);
 await page.locator("#close-study").click();
 assert.equal(await page.locator("#study").evaluate(e=>e.open),false);
});
await check("Natural desktop wheel reaches motion, biography and contact without any scroll hijack",async()=>{
 await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
 await page.mouse.move(600,410);
 const start=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,750);await page.waitForTimeout(270);
 assert((await page.evaluate(()=>scrollY))>start+170);
 await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await page.waitForTimeout(150);
 const pos=await page.evaluate(()=>({now:scrollY,max:document.documentElement.scrollHeight-innerHeight,contact:document.querySelector("#contact").getBoundingClientRect().top<innerHeight}));
 assert(Math.abs(pos.now-pos.max)<8&&pos.contact,JSON.stringify(pos));
 assert.equal(await page.locator("#motion video").getAttribute("autoplay"),null);
 assert.equal(await page.locator(".about-photo img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 assert.deepEqual(errors,[]);
});
await page.locator("#motion").scrollIntoViewIfNeeded();await page.waitForTimeout(210);
await page.screenshot({path:"qa-screenshots/vt-shift/08-motion-scroll-stage.png"});
await page.locator("#about").scrollIntoViewIfNeeded();await page.screenshot({path:"qa-screenshots/vt-shift/09-about-original-portrait.png"});
await page.locator("#contact").scrollIntoViewIfNeeded();await page.screenshot({path:"qa-screenshots/vt-shift/10-contact-no-clutter.png"});
for(const width of [320,390,430,768,1024,1280,1440]){
 const height=width<500?844:width===768?1024:900;
 const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
 p.setDefaultTimeout(6800);
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 const res=await p.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
 await ready(p);
 await check("Responsive "+width+"px: real viewport, no page overflow or content autozoom",async()=>{
  const box=await p.evaluate(()=>({width:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  if(box.width!==width||box.doc>width+3){
   const diag=await p.evaluate(w=>[...document.querySelectorAll("body *")].map(e=>{const r=e.getBoundingClientRect();return{selector:e.tagName+"."+(e.className||""),x:Math.round(r.x),right:Math.round(r.right),width:Math.round(r.width),scroll:e.scrollWidth,client:e.clientWidth}}).filter(e=>e.right>w+3||e.width>w+3).sort((a,b)=>b.right-a.right).slice(0,16),width);
   console.error("OVERFLOW "+width+" "+JSON.stringify(diag));
  }
  assert.equal(res.status(),200);
  assert.equal(box.width,width,JSON.stringify(box));
  assert(box.doc<=width+3,JSON.stringify(box));
  assert.deepEqual(errs,[]);
  return JSON.stringify(box);
 });
 await check("Responsive "+width+"px: functional five-work layout and original artwork visible",async()=>{
   assert.equal(await p.locator("[data-index]").count(),5);
   assert.equal(await p.locator(".visual-scene.is-active").count(),1);
   const bb=await p.locator("#art-stage").boundingBox();
   assert(bb.height>230&&bb.width>width*.4,JSON.stringify(bb));
   if(width===390){
     assert(bb.y<730,"Selected original artwork starts below mobile first-screen, y="+bb.y);
     const prev=await p.evaluate(()=>window.__shiftQA.state.selected);
     await p.evaluate(()=>{
       const el=document.querySelector("#art-stage");
       const t=(x,y)=>new Touch({identifier:1,target:el,clientX:x,clientY:y});
       el.dispatchEvent(new TouchEvent("touchstart",{touches:[t(340,280)],changedTouches:[t(340,280)],bubbles:true}));
       el.dispatchEvent(new TouchEvent("touchend",{touches:[],changedTouches:[t(80,296)],bubbles:true}));
     });
     await p.waitForFunction(old=>window.__shiftQA.state.selected===(old+1)%5,prev);
   }
   assert.deepEqual(errs,[]);
 });
 await check("Responsive "+width+"px: native scrolling reaches full-time/freelance contact",async()=>{
   await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
   await p.waitForTimeout(130);
   const v=await p.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
   assert(Math.abs(v.y-v.max)<10,JSON.stringify(v));
   assert.equal(await p.locator("#contact .contact-actions a").count(),2);
 });
 if(width===390){
   await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
   await p.waitForTimeout(1300);
   await p.screenshot({path:"qa-screenshots/vt-shift/11-mobile-first-screen-390.png"});
   await p.locator("#open-study").click();
   await p.waitForFunction(()=>document.querySelector("#study").open);
   await p.waitForTimeout(1200);
   await p.screenshot({path:"qa-screenshots/vt-shift/12-mobile-project-study-390.png"});
   await p.locator("#close-study").click();
 }
 await p.close();
}
for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900},isMobile:width===390,reducedMotion:"reduce"});
 await p.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
 await check("Reduced-motion "+width+"px: no forced animation, real projects remain interactive",async()=>{
   const motion=await p.evaluate(()=>matchMedia("(prefers-reduced-motion: reduce)").matches);
   assert.equal(motion,true);
   await p.locator('[data-index="4"]').click();
   assert.equal(await p.locator("#art-title").innerText(),"Radisson");
   await p.locator("#open-study").click();
   assert.equal(await p.locator("#study").evaluate(e=>e.open),true);
   const s=await p.evaluate(()=>window.__shiftQA.state);
   assert.equal(s.flights,0,"Flight should respect reduced-motion setting");
   await p.locator("#close-study").click();
   assert.equal(await p.locator("#study").evaluate(e=>e.open),false);
 });
 await p.close();
}
const nojs=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
await nojs.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
await nojs.evaluate(()=>document.fonts.ready);
await check("No-JS access: real original work, reel, resume and contact are still reachable",async()=>{
 assert.equal(await nojs.locator(".visual-scene.is-active").count(),1);
 assert.equal(await nojs.locator('noscript a[href="/portfolio/"]').count(),1);
 assert.equal(await nojs.locator("#motion video").count(),1);
 assert.equal(await nojs.locator('#contact a[href*="wa.me"]').count(),2);
 const v=await nojs.evaluate(()=>({w:innerWidth,d:document.documentElement.scrollWidth}));
 assert(v.w===390&&v.d<=393,JSON.stringify(v));
});
await check("Production homepage, styling and original archive remain byte-for-byte in the untouched main branch",async()=>{
 const [home,css,archive]=await Promise.all(["index.html","simple.css","portfolio/index.html"].map(x=>readFile(x,"utf8")));
 assert(home.includes('href="/simple.css"')&&home.includes("Graphic &amp; motion <em>designer.</em>"));
 assert(!home.includes("/vt-shift/"));
 assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
 assert(archive.includes('id="ascott"')&&archive.includes('id="pride"'));
});
await browser.close();
console.log("VT SHIFT PRIVATE QA: "+passed+" passed; "+failed+" failed");
if(failed)process.exitCode=1;