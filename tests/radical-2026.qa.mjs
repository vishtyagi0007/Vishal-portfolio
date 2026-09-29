import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";
const BASE="http://127.0.0.1:4173";let passed=0,failed=0;
await mkdir("qa-screenshots/radical-2026",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
async function check(name,run){try{const msg=await run();passed++;console.log("PASS "+name+(msg?" — "+msg:""));}catch(err){failed++;console.error("FAIL "+name+" — "+String(err).slice(0,1300))}}
const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];desktop.on("pageerror",err=>errors.push(err.message));
let response=await desktop.goto(BASE+"/radical-2026/",{waitUntil:"domcontentloaded"});
await check("Review hub: exactly 3 new, radically different routes and no-index metadata",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert.equal(await desktop.locator(".direction").count(),3);
 const paths=await desktop.locator(".go").evaluateAll(els=>els.map(x=>new URL(x.href).pathname));
 assert.deepEqual(paths,["/radical-2026/type/","/radical-2026/gallery/","/radical-2026/os/"]);
 assert((await desktop.locator("body").innerText()).includes("LIVE SITE IS SAFE"));
 return paths.join(" | ");
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/hub-desktop.png",fullPage:true});
const load=async(path)=>{errors.length=0;return desktop.goto(BASE+path,{waitUntil:"domcontentloaded"})};
response=await load("/radical-2026/type/");
await check("TYPE/CTRL: brutalist original layout, 3 work pieces and default slider",async()=>{
 assert.equal(response.status(),200);
 await desktop.waitForFunction(()=>window.__vtTypeQA?.state?.mode==="type");
 assert.equal(await desktop.locator(".massive>span").count(),4);
 assert.equal(await desktop.locator(".job").count(),3);
 assert.equal(await desktop.locator("aside.side nav a").count(),4);
 assert.equal(await desktop.locator("#stretch").inputValue(),"100");
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 const d=await desktop.locator(".massive").evaluate(el=>({font:getComputedStyle(el).fontFamily,size:getComputedStyle(el).fontSize}));
 assert(d.font.includes("Impact"),JSON.stringify(d));
 return JSON.stringify(d);
});
await check("TYPE/CTRL: real typography stretch control visibly modifies text shape",async()=>{
 const before=await desktop.locator("#test-type").evaluate(el=>getComputedStyle(el).transform);
 await desktop.locator("#stretch").fill("124");
 await desktop.waitForTimeout(250);
 const after=await desktop.locator("#test-type").evaluate(el=>getComputedStyle(el).transform);
 assert.equal(await desktop.locator("#value").innerText(),"124%");
 assert.notEqual(before,after,JSON.stringify({before,after}));
 return JSON.stringify({before,after});
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/type-desktop-hero.png"});
await desktop.locator(".control").scrollIntoViewIfNeeded();await desktop.waitForTimeout(250);
await desktop.screenshot({path:"qa-screenshots/radical-2026/type-desktop-control.png"});
await check("TYPE/CTRL: native mouse wheel and real sticky portfolio index",async()=>{
 await desktop.locator("#work").scrollIntoViewIfNeeded();
 const sticky=await desktop.locator(".work-left").evaluate(el=>getComputedStyle(el).position);
 assert.equal(sticky,"sticky");
 const y=await desktop.evaluate(()=>scrollY);
 await desktop.mouse.move(575,430);await desktop.mouse.wheel(0,650);await desktop.waitForTimeout(370);
 const after=await desktop.evaluate(()=>scrollY);
 assert(after>y+180,JSON.stringify({y,after}));
 assert(await desktop.locator("#work-progress").evaluate(el=>getComputedStyle(el).transform)!=="none");
});
await desktop.locator(".job-two").scrollIntoViewIfNeeded();await desktop.waitForTimeout(420);
await desktop.screenshot({path:"qa-screenshots/radical-2026/type-desktop-projects.png"});
await check("TYPE/CTRL: untouched original artwork and accessible contact",async()=>{
 const images=await desktop.locator(".job-stage img,.me-image img").evaluateAll(a=>a.map(i=>i.getAttribute("src")));
 assert.deepEqual(images,["/portfolio/assets/resultbull.svg","/portfolio/assets/gtm.svg","/portfolio/assets/001-ascott-discover-asr-india-01.webp","/portfolio/assets/vishal-hero-new-portrait.png"]);
 for(const src of images)assert.equal((await desktop.request.get(BASE+src)).status(),200,src);
 await desktop.locator("#reach").scrollIntoViewIfNeeded();
 assert(await desktop.locator("#reach a[href*='linkedin.com']").count()>0);
 assert.deepEqual(errors,[]);
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/type-desktop-contact.png"});

response=await load("/radical-2026/gallery/");
await check("EXHIBITION: bright museum architecture, original framed portrait and three curated rooms",async()=>{
 assert.equal(response.status(),200);
 await desktop.waitForFunction(()=>window.__vtGalleryQA?.state?.mode==="gallery");
 assert.equal(await desktop.locator(".portrait-frame img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 await desktop.locator(".portrait-frame img").evaluate(img=>img.decode());
 assert(await desktop.locator(".portrait-frame img").evaluate(img=>img.naturalWidth>100));
 assert.equal(await desktop.locator(".room-scene").count(),3);
 const fonts=await desktop.locator(".entrance-copy h1").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(fonts.includes("Georgia"),fonts);
 const state=await desktop.evaluate(()=>window.__vtGalleryQA.state);
 assert(state.enhanced&&state.distance>1000,JSON.stringify(state));
 return JSON.stringify({font:fonts,roomCount:state.rooms,distance:Math.round(state.distance)});
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/gallery-desktop-entrance.png"});
await desktop.locator(".preface").scrollIntoViewIfNeeded();
await desktop.screenshot({path:"qa-screenshots/radical-2026/gallery-desktop-preface.png"});
const goRoom=async p=>{
 await desktop.evaluate(p=>{
  const el=document.querySelector(".rooms");
  const top=el.getBoundingClientRect().top+scrollY;
  scrollTo({top:top+Math.max(1,el.offsetHeight-innerHeight)*p,behavior:"instant"});
 },p);
 await desktop.waitForTimeout(1220);
};
for(const [p,i] of [[.06,0],[.41,1],[.78,2]]){
 await check("EXHIBITION: room "+(i+1)+" renders its distinct spatial wall",async()=>{
  await goRoom(p);
  const state=await desktop.evaluate(()=>window.__vtGalleryQA.state);
  assert.equal(state.active,i,JSON.stringify(state));
  const enabled=await desktop.locator(".room-scene").evaluateAll(els=>els.filter(e=>e.classList.contains("is-active")).length);
  const inert=await desktop.locator(".room-scene").evaluateAll(els=>els.filter(e=>e.inert).length);
  assert.equal(enabled,1);assert.equal(inert,2);
  assert.equal(await desktop.locator("#room-readout").innerText(),"ROOM "+String(i+1).padStart(2,"0")+" / 03");
 });
 await desktop.screenshot({path:"qa-screenshots/radical-2026/gallery-desktop-room-"+(i+1)+".png"});
}
await check("EXHIBITION: room buttons move document scroll natively without blocking the final CTA",async()=>{
 await goRoom(.47);
 await desktop.locator('[data-room="0"]').click();await desktop.waitForTimeout(900);
 assert.equal((await desktop.evaluate(()=>window.__vtGalleryQA.state)).active,0);
 await desktop.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await desktop.waitForTimeout(160);
 assert(await desktop.locator(".museum-exit").isVisible());
 assert.deepEqual(errors,[]);
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/gallery-desktop-exit.png"});

response=await load("/radical-2026/os/");
await check("VT.OS: truly different cobalt desktop with 4 accessible app windows",async()=>{
 assert.equal(response.status(),200);
 await desktop.waitForFunction(()=>window.__vtOsQA?.state?.desktop===true);
 assert.equal(await desktop.locator(".app-window").count(),4);
 assert.equal(await desktop.locator(".app-dock button").count(),4);
 assert.equal(await desktop.locator(".project-panel").count(),5);
 const state=await desktop.evaluate(()=>window.__vtOsQA.state);
 assert.deepEqual(state.open,["work","about"]);
 assert.equal(state.project,0);
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 return JSON.stringify(state);
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/os-desktop-desktop.png"});
await check("VT.OS: real project file browser changes original art without navigation",async()=>{
 await desktop.locator('[data-project="2"]').click();
 assert.equal((await desktop.evaluate(()=>window.__vtOsQA.state)).project,2);
 const img=await desktop.locator(".project-panel.is-selected img").getAttribute("src");
 assert.equal(img,"/portfolio/assets/001-ascott-discover-asr-india-01.webp");
 const hidden=await desktop.locator(".project-panel").evaluateAll(els=>els.filter(e=>e.inert).length);
 assert.equal(hidden,4);
});
await check("VT.OS: draggable project window physically moves via pointer interaction",async()=>{
 const bar=desktop.locator('[data-handle="work"]');
 const win=desktop.locator('[data-window="work"]');
 const before=await win.boundingBox();
 const b=await bar.boundingBox();
 await desktop.mouse.move(b.x+b.width*.45,b.y+b.height*.5);
 await desktop.mouse.down();
 await desktop.mouse.move(b.x+b.width*.45+82,b.y+b.height*.5+39,{steps:10});
 await desktop.mouse.up();
 await desktop.waitForTimeout(140);
 const after=await win.boundingBox();
 const state=await desktop.evaluate(()=>window.__vtOsQA.state);
 assert(after.x>before.x+20&&after.y>before.y+10,JSON.stringify({before,after,drags:state.drags}));
 assert(state.drags>0);
 return "Moved "+Math.round(after.x-before.x)+"px horizontally";
});
await check("VT.OS: Ctrl K palette filters commands and opens requested original project",async()=>{
 await desktop.keyboard.press("Control+k");
 assert.equal((await desktop.evaluate(()=>window.__vtOsQA.state)).commandOpen,true);
 await desktop.locator("#command-input").fill("gtm");
 await desktop.locator("#command-input").press("Enter");
 await desktop.waitForTimeout(100);
 const state=await desktop.evaluate(()=>window.__vtOsQA.state);
 assert.equal(state.commandOpen,false,JSON.stringify(state));
 assert.equal(state.project,1,JSON.stringify(state));
 assert.equal(state.active,"work",JSON.stringify(state));
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/os-desktop-work.png"});
await check("VT.OS: dock launches functioning original showreel app and close hides it",async()=>{
 await desktop.locator('[data-open="motion"]').first().click();
 assert((await desktop.evaluate(()=>window.__vtOsQA.state)).open.includes("motion"));
 assert.equal(await desktop.locator('.window-motion video source').getAttribute("src"),"/portfolio/assets/motion-selected.mp4");
 assert.equal((await desktop.locator('.window-motion video').getAttribute("autoplay")),null);
 await desktop.locator('[data-close="motion"]').click();
 assert.equal(await desktop.locator(".window-motion").getAttribute("aria-hidden"),"true");
});
await desktop.locator("#activity").scrollIntoViewIfNeeded();
await desktop.waitForTimeout(300);
await desktop.screenshot({path:"qa-screenshots/radical-2026/os-desktop-activity.png"});
await check("VT.OS: native wheel reaches activity and terminal contact without hijacking",async()=>{
 const y=await desktop.evaluate(()=>scrollY);
 await desktop.mouse.move(590,470);await desktop.mouse.wheel(0,725);await desktop.waitForTimeout(310);
 assert((await desktop.evaluate(()=>scrollY))>y+170);
 await desktop.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await desktop.waitForTimeout(100);
 const d=await desktop.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
 assert(Math.abs(d.max-d.y)<8,JSON.stringify(d));
 assert.deepEqual(errors,[]);
});
await desktop.screenshot({path:"qa-screenshots/radical-2026/os-desktop-contact.png"});

for(const width of [320,390,430,768,1024,1280]){
 const height=width<=430?844:width===768?1024:900;
 const p=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
 const errs=[];p.on("pageerror",e=>errs.push(e.message));
 for(const path of ["/radical-2026/","/radical-2026/type/","/radical-2026/gallery/","/radical-2026/os/"]){
  await p.goto(BASE+path,{waitUntil:"domcontentloaded"});
  const label=path.split("/").filter(Boolean).at(-1)||"hub";
  await check(label+" / "+width+"px: no horizontal overflow and real content",async()=>{
   const d=await p.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth,h1:document.querySelector("h1")?.textContent?.trim()}));
   assert(d.page<=d.vw+3,JSON.stringify(d));
   assert(d.h1&&d.h1.length>5,JSON.stringify(d));
   assert.deepEqual(errs,[]);
   if(label==="type")assert.equal(await p.locator(".job").count(),3);
   if(label==="gallery"){
    assert.equal(await p.locator(".room-scene").count(),3);
    if(width<1000)assert.equal((await p.evaluate(()=>window.__vtGalleryQA.state)).enhanced,false);
   }
   if(label==="os"){
    assert.equal(await p.locator(".app-window").count(),4);
    if(width<1000){
     assert.equal((await p.evaluate(()=>window.__vtOsQA.state)).desktop,false);
     const hidden=await p.locator(".app-window").evaluateAll(els=>els.filter(e=>e.inert).length);
     assert.equal(hidden,0);
    }
   }
  });
  if(label!=="hub")await check(label+" / "+width+"px: full native scroll and contact available",async()=>{
   await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
   await p.waitForTimeout(150);
   const d=await p.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
   assert(Math.abs(d.y-d.max)<8,JSON.stringify(d));
  });
  if(width===390){
   await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await p.waitForTimeout(500);
   await p.screenshot({path:"qa-screenshots/radical-2026/"+label+"-mobile-390.png"});
  }
 }
 await p.close();
}
for(const path of ["/radical-2026/type/","/radical-2026/gallery/","/radical-2026/os/"]){
 const label=path.split("/").filter(Boolean).at(-1);
 const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false,isMobile:true,hasTouch:true});
 await nojs.goto(BASE+path,{waitUntil:"domcontentloaded"});
 await check(label+" fallback: full portfolio content visible without any JavaScript",async()=>{
  const expected=label==="type"?await nojs.locator(".job").count():label==="gallery"?await nojs.locator(".room-scene").count():await nojs.locator(".app-window").count();
  assert.equal(expected,label==="os"?4:3);
  const widths=await nojs.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
  assert(widths.page<=widths.vw+3,JSON.stringify(widths));
  if(label==="gallery")assert.notEqual(await nojs.locator(".gallery-sticky").evaluate(e=>getComputedStyle(e).position),"sticky");
  if(label==="os"){
   assert(await nojs.locator(".window-motion").isVisible());
   assert.equal(await nojs.locator(".project-panel").count(),5);
  }
 });
 await nojs.close();
 const reducePage=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce",isMobile:true});
 await reducePage.goto(BASE+path,{waitUntil:"domcontentloaded"});
 await check(label+" reduced-motion: readable project content remains accessible",async()=>{
  if(label==="gallery"){
   assert.equal((await reducePage.evaluate(()=>window.__vtGalleryQA.state)).enhanced,false);
   assert.equal(await reducePage.locator(".room-scene").count(),3);
  }
  if(label==="type")assert.equal(await reducePage.locator(".job.appeared").count(),3);
  if(label==="os"){
   assert.equal(await reducePage.locator(".app-window").count(),4);
   assert.equal((await reducePage.evaluate(()=>window.__vtOsQA.state)).desktop,false);
  }
 });
 await reducePage.close();
}
await check("Production home and shared stylesheet remain unchanged on this review-only branch",async()=>{
 const html=await readFile("index.html","utf8");
 const css=await readFile("simple.css","utf8");
 assert(html.includes('href="/simple.css"'));
 assert(html.includes("Graphic &amp; motion <em>designer.</em>"));
 assert(!html.includes("radical-2026"));
 assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
});
await browser.close();
console.log("RADICAL 2026 QA: "+passed+" passed; "+failed+" failed.");
if(failed)process.exitCode=1;
