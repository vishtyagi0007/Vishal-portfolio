import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";
const BASE="http://127.0.0.1:4173",ROOT="/worlds-2026/";
await mkdir("qa-screenshots/worlds-2026",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let pass=0,fail=0;
async function check(label,fn){try{const msg=await fn();pass++;console.log("PASS "+label+(msg?" — "+msg:""))}catch(e){fail++;console.error("FAIL "+label+" — "+String(e).slice(0,1250))}}
const page=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
page.setDefaultTimeout(7000);
const errors=[];page.on("pageerror",e=>errors.push(e.message));
async function open(path){errors.length=0;const res=await page.goto(BASE+ROOT+path,{waitUntil:"domcontentloaded"});await page.waitForTimeout(150);return res}
let response=await open("");
await check("Three concept hub: separate routes, genuine three layouts and private preview",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await page.locator(".concept").count(),3);
 assert.equal(await page.locator(".concept-art").count(),3);
 const paths=await page.locator(".launch").evaluateAll(els=>els.map(el=>new URL(el.href).pathname));
 assert.deepEqual(paths,["/worlds-2026/editorial/","/worlds-2026/cinema/","/worlds-2026/core/"]);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert((await page.locator(".flag").innerText()).includes("LIVE WEBSITE UNCHANGED"));
 return paths.join(" | ");
});
await page.screenshot({path:"qa-screenshots/worlds-2026/00-comparison-hub.png",fullPage:true});
response=await open("editorial/");
await check("OFFGRID: genuine editorial layout with serif title, offgrid spreads, portrait unchanged",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await page.locator(".spread").count(),4);
 assert.equal(await page.locator(".spread-art img").count(),4);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 await page.locator(".hero-photo img").evaluate(img=>img.decode());
 assert.equal(await page.locator(".hero-photo img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 assert.equal((await page.evaluate(()=>window.__offgridQA.state.layout)),"editorial");
 const typography=await page.locator(".hero-heading h1").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(typography.toLowerCase().includes("instrument serif")||typography.toLowerCase().includes("georgia"),typography);
 return typography;
});
await page.waitForTimeout(440);
await page.screenshot({path:"qa-screenshots/worlds-2026/01-editorial-first-screen.png"});
await check("OFFGRID: sticky chapter index advances and art reveals with native scroll",async()=>{
 await page.locator(".spread:nth-child(2)").scrollIntoViewIfNeeded();
 await page.waitForTimeout(220);
 const state=await page.evaluate(()=>window.__offgridQA.state);
 assert.equal(state.spreads,4);
 assert.equal(state.active,"02",JSON.stringify(state));
 const prop=await page.locator(".spread:nth-child(2) .spread-art").evaluate(el=>getComputedStyle(el).getPropertyValue("--art-reveal"));
 assert(prop.includes("%"),"native scroll image mask did not update: "+prop);
 assert.equal(await page.locator(".work-index").evaluate(el=>getComputedStyle(el).position),"sticky");
 await page.mouse.move(700,410);
 const before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,700);await page.waitForTimeout(280);
 assert((await page.evaluate(()=>scrollY))>before+170,"Native wheel did not move");
 return JSON.stringify({active:state.active,artReveal:prop});
});
await page.locator(".spread:nth-child(3)").scrollIntoViewIfNeeded();await page.waitForTimeout(330);
await page.screenshot({path:"qa-screenshots/worlds-2026/02-editorial-asymmetric-project.png"});
await check("OFFGRID: no duplicate gallery, original links and user-triggered reel",async()=>{
 const img=await page.locator(".spread-art img").evaluateAll(els=>els.map(x=>x.getAttribute("src")));
 assert.deepEqual(img,["/portfolio/assets/resultbull.svg","/portfolio/assets/001-ascott-discover-asr-india-01.webp","/portfolio/assets/gtm.svg","/portfolio/assets/008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp"]);
 const links=await page.locator(".spread-copy a").evaluateAll(els=>els.map(x=>x.getAttribute("href")));
 assert.deepEqual(links,["/portfolio/#resultbull","/portfolio/#ascott","/portfolio/#gtm","/portfolio/#pride"]);
 assert.equal(await page.locator("video").count(),1);
 assert.equal(await page.locator("video").getAttribute("autoplay"),null);
 assert.deepEqual(errors,[]);
});

response=await open("cinema/");
await check("FRAMEONE: full-bleed film opening, condensed typography and four actual acts",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await page.locator(".act").count(),4);
 assert.equal(await page.locator(".scene-nav button").count(),4);
 assert.equal(await page.locator(".intro-media img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 const f=await page.locator(".intro-heading").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(f.toLowerCase().includes("barlow")||f.toLowerCase().includes("impact"),f);
 const s=await page.evaluate(()=>window.__frameQA.state);
 assert.equal(s.layout,"cinematic");assert(s.pinned,JSON.stringify(s));
 return JSON.stringify({font:f,pinned:s.pinned});
});
await page.waitForTimeout(500);await page.screenshot({path:"qa-screenshots/worlds-2026/03-cinema-first-screen.png"});
async function positionFilm(p){
 await page.evaluate(p=>{
 const el=document.querySelector(".filmwalk");
 scrollTo({top:el.getBoundingClientRect().top+scrollY+(el.offsetHeight-innerHeight)*p,behavior:"instant"});
 },p);
 await page.waitForTimeout(910);
}
for(const [percent,index] of [[.04,0],[.31,1],[.56,2],[.86,3]]){
 await check("FRAMEONE: cinema scene "+(index+1)+" is active at real vertical scroll",async()=>{
  await positionFilm(percent);
  const s=await page.evaluate(()=>window.__frameQA.state);
  assert.equal(s.active,index,JSON.stringify(s));
  assert.equal(await page.locator(".act.is-current").count(),1);
  assert.equal(await page.locator(".act[aria-hidden='true']").count(),3);
  const file=await page.locator(".act.is-current img").getAttribute("src");
  assert(file.startsWith("/portfolio/assets/"));
  return "scene "+s.active+" / original media "+file;
 });
 if(index===0||index===2)await page.screenshot({path:"qa-screenshots/worlds-2026/04-cinema-scene-"+(index+1)+".png"});
}
await check("FRAMEONE: scene navigation buttons drive actual native document scroll",async()=>{
 await positionFilm(.62);
 await page.locator('[data-jump="0"]').click();
 await page.waitForTimeout(1250);
 assert.equal((await page.evaluate(()=>window.__frameQA.state.active)),0);
 await page.mouse.move(780,420);const b=await page.evaluate(()=>scrollY);
 await page.mouse.wheel(0,730);await page.waitForTimeout(280);
 assert((await page.evaluate(()=>scrollY))>b+160,"native wheel blocked");
 assert.equal(await page.locator("#reel video").getAttribute("autoplay"),null);
 assert.deepEqual(errors,[]);
});

response=await open("core/");
await check("VTCORE: single canvas architecture, modern geometric type, six original projects",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await page.locator("[data-p]").count(),6);
 assert.equal(await page.locator(".art-window").count(),1);
 assert.equal(await page.locator(".project-selectors button[aria-current='true']").count(),1);
 assert.equal(await page.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert.equal(await page.locator("#art-image").getAttribute("src"),"/portfolio/assets/001-ascott-discover-asr-india-01.webp");
 const font=await page.locator(".masthead").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(font.toLowerCase().includes("space grotesk")||font.toLowerCase().includes("arial"),font);
 assert.equal((await page.evaluate(()=>window.__coreQA.state.layout)),"single-canvas");
 return font;
});
await page.waitForTimeout(460);await page.screenshot({path:"qa-screenshots/worlds-2026/06-core-first-screen.png"});
await check("VTCORE: switching six original projects dynamically updates ONE canvas",async()=>{
 await page.locator("[data-p='2']").click();
 const s=await page.evaluate(()=>window.__coreQA.state);
 assert.equal(s.index,2);assert.equal(await page.locator("#project-title").innerText(),"GTM Leads");
 assert.equal(await page.locator("#art-image").getAttribute("src"),"/portfolio/assets/gtm.svg");
 assert.equal(await page.locator("#art-window").getAttribute("data-tone"),"mint");
 await page.locator("[data-p='4']").click();
 assert.equal(await page.locator("#art-image").getAttribute("src"),"/portfolio/assets/022-rcz-weekend-buffet-carnival-1.webp");
 return "One canvas, six distinct original assets";
});
await check("VTCORE: actual modal viewer supports multi-image artwork and keyboard project arrows",async()=>{
 await page.locator("[data-p='0']").click();
 await page.locator("#present").click();
 assert(await page.locator("#viewer").evaluate(e=>e.open));
 assert.equal(await page.locator("#viewer-dots button").count(),4);
 await page.locator("#viewer-dots button").nth(2).click();
 assert.equal(await page.locator("#viewer-image").getAttribute("src"),"/portfolio/assets/003-ascott-discover-asr-india-03.webp");
 await page.keyboard.press("ArrowRight");
 assert.equal(await page.locator("#viewer-title").innerText(),"Resultbull.ai");
 await page.keyboard.press("Escape");
 assert.equal(await page.locator("#viewer").evaluate(e=>e.open),false);
});
await page.screenshot({path:"qa-screenshots/worlds-2026/07-core-project-switched.png"});
await check("VTCORE: Ctrl K searches original projects and navigates without page reload",async()=>{
 await page.keyboard.press("Control+k");
 assert(await page.locator("#command").evaluate(e=>e.open));
 await page.locator("#query").fill("Pride");
 assert.equal(await page.locator(".command-results button").count(),1);
 await page.keyboard.press("Enter");await page.waitForTimeout(120);
 assert.equal(await page.locator("#command").evaluate(e=>e.open),false);
 assert.equal(await page.locator("#project-title").innerText(),"Pride Hotels");
 await page.keyboard.press("Control+k");await page.locator("#query").fill("motion");
 assert.equal(await page.locator(".command-results button").count(),1);
 await page.locator("#close-command").click();
 assert.deepEqual(errors,[]);
});
await page.locator("#present").click();await page.waitForTimeout(280);
await page.screenshot({path:"qa-screenshots/worlds-2026/08-core-immersive-project.png"});
await page.locator("#close-viewer").click();

const paths=[ROOT,ROOT+"editorial/",ROOT+"cinema/",ROOT+"core/"];
for(const width of [320,390,430,768,1024,1280,1440]){
 const height=width<=430?844:width===768?1024:900;
 const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
 p.setDefaultTimeout(5500);
 const err=[];p.on("pageerror",e=>err.push(e.message));
 for(const url of paths){
  const name=url===ROOT?"hub":url.split("/").filter(Boolean).at(-1);
  const res=await p.goto(BASE+url,{waitUntil:"domcontentloaded"});
  await p.waitForTimeout(140);
  await check(name+" / "+width+"px: real viewport width, no page overflow, correct original layout",async()=>{
   assert.equal(res.status(),200);
   const state=await p.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,hero:!!document.querySelector("h1")}));
   if(state.vw!==width||state.doc>state.vw+3){
    const diag=await p.evaluate(limit=>[...document.querySelectorAll("body *")].map(el=>({name:el.tagName+"."+(el.className||""),x:Math.round(el.getBoundingClientRect().left),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width),scroll:el.scrollWidth,client:el.clientWidth,nowrap:getComputedStyle(el).whiteSpace})).filter(x=>x.right>limit+3||x.width>limit+3).sort((a,b)=>b.right-a.right).slice(0,14),width);
    console.error("OVERFLOW_DIAGNOSTIC "+name+" "+width+" "+JSON.stringify(diag));
   }
   assert.equal(state.vw,width,JSON.stringify(state));
   assert(state.doc<=state.vw+3,JSON.stringify(state));
   assert(state.hero);
   assert.deepEqual(err,[]);
   if(name==="cinema"&&width<1000)assert.equal((await p.evaluate(()=>window.__frameQA.state)).pinned,false);
   if(name==="core")assert.equal(await p.locator("[data-p]").count(),6);
   if(name==="editorial")assert.equal(await p.locator(".spread").count(),4);
  });
  if(name!=="hub"){
   await check(name+" / "+width+"px: native document scrolling reaches footer",async()=>{
    await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
    await p.waitForTimeout(180);
    const s=await p.evaluate(()=>({pos:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
    assert(Math.abs(s.pos-s.max)<8,JSON.stringify(s));assert.deepEqual(err,[]);
   });
  }
  if(width===390){
   await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await p.waitForTimeout(700);
   await p.screenshot({path:"qa-screenshots/worlds-2026/mobile-390-"+name+".png"});
  }
 }
 await p.close();
}
for(const name of ["editorial","cinema","core"]){
 const p=await browser.newPage({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
 await p.goto(BASE+ROOT+name+"/",{waitUntil:"domcontentloaded"});
 await check(name+": motion-reduction and no forced scroll with original work accessible",async()=>{
  if(name==="cinema"){assert.equal((await p.evaluate(()=>window.__frameQA.state)).pinned,false);assert.equal(await p.locator(".act").count(),4);assert.equal(await p.locator(".act[aria-hidden='true']").count(),0)}
  if(name==="editorial"){assert.equal((await p.evaluate(()=>window.__offgridQA.state)).reduced,true);assert.equal(await p.locator(".spread").count(),4);assert.equal(await p.locator(".marquee-track").evaluate(e=>getComputedStyle(e).animationName),"none")}
  if(name==="core"){assert.equal(await p.locator(".art-window").count(),1);await p.locator("[data-p='1']").click();assert.equal(await p.locator("#project-title").innerText(),"Resultbull.ai")}
 });
 await p.close();
 const nojs=await browser.newPage({viewport:{width:390,height:844},isMobile:true,javaScriptEnabled:false});
 await nojs.goto(BASE+ROOT+name+"/",{waitUntil:"domcontentloaded"});
 await check(name+": no-JS fallback retains real artwork and contact",async()=>{
  assert.equal(await nojs.locator("video").count(),1);
  assert.equal(await nojs.locator("a[href*='linkedin.com']").count()>0,true);
  assert.equal((await nojs.evaluate(()=>document.documentElement.scrollWidth)),390);
  if(name==="cinema")assert.equal(await nojs.locator(".act").count(),4);
  if(name==="editorial")assert.equal(await nojs.locator(".spread").count(),4);
  if(name==="core")assert.equal(await nojs.locator("#art-image").getAttribute("src"),"/portfolio/assets/001-ascott-discover-asr-india-01.webp");
 });
 await nojs.close();
}
await check("Real original media and original archive links are accessible",async()=>{
 const names=["vishal-hero-new-portrait.png","vishal-tyagi-mark.svg","resultbull.svg","gtm.svg","001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp","003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp","008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp","009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp","010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp","022-rcz-weekend-buffet-carnival-1.webp","023-rcz-weekend-buffet-carnival-2.webp","024-rcz-weekend-buffet-carnival-3.webp","Vishal-Tyagi-Resume.pdf","motion-selected.mp4"];
 for(const n of names){const r=await page.request.get(BASE+"/portfolio/assets/"+n);assert.equal(r.status(),200,n)}
 const archive=await page.request.get(BASE+"/portfolio/");assert.equal(archive.status(),200);
 return names.length+" original assets available";
});
await check("Existing production site index and shared style have not been edited",async()=>{
 const home=await readFile("index.html","utf8"),css=await readFile("simple.css","utf8");
 assert(home.includes('href="/simple.css"')&&home.includes("Graphic &amp; motion <em>designer.</em>"));
 assert(!home.includes("worlds-2026"));
 assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
});
await browser.close();
console.log("THREE DISTINCT WORLDS QA: "+pass+" passed; "+fail+" failed.");
if(fail)process.exitCode=1;
