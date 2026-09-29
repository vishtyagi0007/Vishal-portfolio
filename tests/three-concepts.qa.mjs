import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";

const BASE="http://127.0.0.1:4173";
await mkdir("qa-screenshots/three-concepts",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(label,fn){
 try{const message=await fn();passed++;console.log("PASS "+label+(message?" — "+message:""))}
 catch(e){failed++;console.error("FAIL "+label+" — "+String(e).slice(0,1200))}
}
const hub=await browser.newPage({viewport:{width:1440,height:900}});
const hubErrors=[];hub.on("pageerror",e=>hubErrors.push(e.message));
let response=await hub.goto(BASE+"/concept-lab/",{waitUntil:"domcontentloaded"});
await check("Comparison hub: three distinct prototype routes and truthful preview notice",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await hub.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert.equal(await hub.locator(".card").count(),3);
 const links=await hub.locator(".launch").evaluateAll(els=>els.map(a=>new URL(a.href).pathname));
 assert.deepEqual(links,["/motion-demo/","/concept-lab/editorial/","/concept-lab/lab/"]);
 assert((await hub.locator("body").innerText()).includes("NOT THE LIVE WEBSITE"));
 assert.deepEqual(hubErrors,[]);
 return JSON.stringify(links);
});
await hub.screenshot({path:"qa-screenshots/three-concepts/hub-desktop.png",fullPage:true});
const editorial=await browser.newPage({viewport:{width:1440,height:900}});
const editorialErrors=[]; editorial.on("pageerror",e=>editorialErrors.push(e.message));
response=await editorial.goto(BASE+"/concept-lab/editorial/",{waitUntil:"domcontentloaded"});
await check("Editorial: original logo, portrait and independent magazine layout render",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await editorial.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 await editorial.waitForFunction(()=>window.__vtEditorialQA?.state?.mode==="editorial");
 assert.equal(await editorial.locator(".spread").count(),3);
 assert.equal(await editorial.locator(".mini-card").count(),3);
 const portrait=editorial.locator(".cover-portrait");
 assert.equal(await portrait.getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 await portrait.evaluate(img=>img.decode());
 assert(await portrait.evaluate(img=>img.naturalWidth>200));
 assert((await editorial.locator(".display").innerText()).includes("DESIGN"));
 const sources=await editorial.locator(".spread-art img,.asym-graphic>img,.feature-art img").evaluateAll(els=>els.map(i=>i.getAttribute("src")));
 assert.deepEqual(sources,["/portfolio/assets/resultbull.svg","/portfolio/assets/gtm.svg","/portfolio/assets/001-ascott-discover-asr-india-01.webp"]);
 return "3 original headline artworks and six editorial projects";
});
await editorial.waitForTimeout(550);
await editorial.screenshot({path:"qa-screenshots/three-concepts/editorial-desktop-hero.png"});
await editorial.locator(".manifesto").scrollIntoViewIfNeeded();
await editorial.waitForTimeout(700);
await editorial.screenshot({path:"qa-screenshots/three-concepts/editorial-desktop-manifesto.png"});
await check("Editorial: typography reveal and native wheel scrolling work",async()=>{
 const manifesto=editorial.locator(".manifesto h2");
 assert(await manifesto.evaluate(el=>el.classList.contains("entered")));
 await editorial.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
 const before=await editorial.evaluate(()=>scrollY);
 await editorial.mouse.move(600,480);
 await editorial.mouse.wheel(0,800);
 await editorial.waitForTimeout(370);
 const after=await editorial.evaluate(()=>scrollY);
 assert(after>before+250,JSON.stringify({before,after}));
 return "Native wheel moved "+Math.round(after-before)+"px";
});
await editorial.locator(".spread-two").scrollIntoViewIfNeeded();
await editorial.waitForTimeout(250);
await editorial.screenshot({path:"qa-screenshots/three-concepts/editorial-desktop-gtm.png"});
await check("Editorial: scroll parallax exposes nonzero real movement without hijack",async()=>{
 await editorial.locator(".spread-two").scrollIntoViewIfNeeded();
 await editorial.waitForTimeout(230);
 const prop=await editorial.locator(".asym-graphic").evaluate(el=>getComputedStyle(el).getPropertyValue("--scroll-y").trim());
 assert(prop.endsWith("px"),"Parallax property missing: "+prop);
 assert.notEqual(prop,"0px");
 return prop;
});
await check("Editorial: full page contact and no runtime exceptions",async()=>{
 await editorial.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await editorial.waitForTimeout(180);
 const d=await editorial.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight,visible:document.querySelector(".closing").getBoundingClientRect().top<innerHeight}));
 assert(Math.abs(d.max-d.y)<8&&d.visible,JSON.stringify(d));
 assert.deepEqual(editorialErrors,[]);
});

const lab=await browser.newPage({viewport:{width:1440,height:900}});
const labErrors=[];lab.on("pageerror",e=>labErrors.push(e.message));
response=await lab.goto(BASE+"/concept-lab/lab/",{waitUntil:"domcontentloaded"});
await check("Creative Lab: modular visual architecture, correct original media and full rail",async()=>{
 assert.equal(response.status(),200);
 await lab.waitForFunction(()=>window.__vtLabQA?.state?.enhanced===true);
 assert.equal(await lab.locator(".matrix-tile").count(),3);
 assert.equal(await lab.locator(".experiment").count(),5);
 assert.equal(await lab.locator(".lab-portrait img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 await lab.locator(".lab-portrait img").evaluate(img=>img.decode());
 assert(await lab.locator(".lab-portrait img").evaluate(img=>img.naturalWidth>200));
 const projects=await lab.locator(".exp-copy a").evaluateAll(a=>a.map(x=>x.getAttribute("href")));
 assert.deepEqual(projects,["/portfolio/#resultbull","/portfolio/#gtm","/portfolio/#ascott","/portfolio/#pride","/portfolio/#vt"]);
 const state=await lab.evaluate(()=>window.__vtLabQA.state);
 assert(state.offset>500&&state.travel>900,JSON.stringify(state));
 return JSON.stringify({offset:Math.round(state.offset),scrollLength:Math.round(state.travel)});
});
await lab.waitForTimeout(600);
await lab.screenshot({path:"qa-screenshots/three-concepts/lab-desktop-hero.png"});
await lab.locator(".matrix").scrollIntoViewIfNeeded();await lab.waitForTimeout(550);
await lab.screenshot({path:"qa-screenshots/three-concepts/lab-desktop-bento.png"});
async function railPosition(p){
 await lab.evaluate(p=>{
  const s=document.querySelector(".lab-scroll");
  const top=s.getBoundingClientRect().top+scrollY;
  const travel=s.offsetHeight-innerHeight;
  scrollTo({top:top+p*travel,behavior:"instant"});
 },p);
 await lab.waitForTimeout(260);
}
await check("Creative Lab: real native vertical wheel advances horizontal gallery",async()=>{
 await railPosition(.25);
 const xBefore=await lab.locator(".project-track").evaluate(el=>getComputedStyle(el).getPropertyValue("--track-x"));
 const yBefore=await lab.evaluate(()=>scrollY);
 await lab.mouse.move(600,480);await lab.mouse.wheel(0,750);await lab.waitForTimeout(300);
 const xAfter=await lab.locator(".project-track").evaluate(el=>getComputedStyle(el).getPropertyValue("--track-x"));
 const yAfter=await lab.evaluate(()=>scrollY);
 assert(yAfter>yBefore+200,JSON.stringify({yBefore,yAfter}));
 assert.notEqual(xBefore,xAfter,JSON.stringify({xBefore,xAfter}));
 return JSON.stringify({verticalDelta:Math.round(yAfter-yBefore),horizontalBefore:xBefore,horizontalAfter:xAfter});
});
for(const [p,n,name] of [[.03,0,"Resultbull"],[.49,2,"Discover ASR"],[.96,4,"VT identity"]]){
 await check("Creative Lab: scroll-controlled project "+name,async()=>{
  await railPosition(p);
  const state=await lab.evaluate(()=>window.__vtLabQA.state);
  assert.equal(state.active,n,JSON.stringify(state));
  const visible=await lab.locator(".experiment").evaluateAll(e=>e.filter(el=>el.getAttribute("aria-hidden")==="false").length);
  const hidden=await lab.locator(".experiment").evaluateAll(e=>e.filter(el=>el.inert).length);
  assert.equal(visible,1,JSON.stringify({visible,hidden}));
  assert.equal(hidden,4,JSON.stringify({visible,hidden}));
  assert.equal(await lab.locator("#rail-count").innerText(),String(n+1).padStart(2,"0")+" / 05");
 });
 if(n!==2)await lab.screenshot({path:"qa-screenshots/three-concepts/lab-project-"+(n+1)+".png"});
}
await check("Creative Lab: project arrow buttons and normal contact scroll",async()=>{
 await railPosition(.49);
 await lab.locator("#next-project").click();
 await lab.waitForTimeout(1050);
 const state=await lab.evaluate(()=>window.__vtLabQA.state);
 assert(state.active>=3,JSON.stringify(state));
 await lab.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await lab.waitForTimeout(220);
 const d=await lab.evaluate(()=>({atEnd:Math.abs(scrollY-(document.documentElement.scrollHeight-innerHeight))<8,contactVisible:document.querySelector(".endgame").getBoundingClientRect().top<innerHeight}));
 assert(d.atEnd&&d.contactVisible,JSON.stringify(d));
 assert.deepEqual(labErrors,[]);
});
await lab.locator(".endgame").scrollIntoViewIfNeeded();
await lab.screenshot({path:"qa-screenshots/three-concepts/lab-desktop-contact.png"});

for(const width of [320,390,430,768,1024]){
 const height=width<=430?844:width===768?1024:900;
 const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 for(const [path,kind] of [["/concept-lab/","hub"],["/concept-lab/editorial/","editorial"],["/concept-lab/lab/","lab"]]){
  await page.goto(BASE+path,{waitUntil:"domcontentloaded"});
  await check(kind+" at "+width+"px: no sideways overflow, original preview present",async()=>{
   const d=await page.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,h1:document.querySelector("h1")?.textContent?.trim()}));
   assert(d.doc<=d.vw+3,JSON.stringify(d));
   assert(d.h1&&d.h1.length>4,JSON.stringify(d));
   if(kind==="hub")assert.equal(await page.locator(".card").count(),3);
   if(kind==="editorial")assert.equal(await page.locator(".spread").count(),3);
   if(kind==="lab"){
     assert.equal(await page.locator(".experiment").count(),5);
     const state=await page.evaluate(()=>window.__vtLabQA.state);
     if(width<1024)assert.equal(state.enhanced,false,JSON.stringify(state));
   }
   assert.deepEqual(errors,[]);
  });
  if(kind!=="hub")await check(kind+" at "+width+"px: native scroll reaches closing CTA",async()=>{
   await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
   await page.waitForTimeout(160);
   const d=await page.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
   assert(Math.abs(d.max-d.y)<8,JSON.stringify(d));
   if(kind==="lab"&&width<1024){
     assert.notEqual(await page.locator(".rail-sticky").evaluate(el=>getComputedStyle(el).position),"sticky");
     const hidden=await page.locator(".experiment").evaluateAll(els=>els.some(el=>el.inert||el.getAttribute("aria-hidden")==="true"));
     assert.equal(hidden,false);
   }
  });
  if(width===390&&kind!=="hub"){
   await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await page.waitForTimeout(650);
   await page.screenshot({path:"qa-screenshots/three-concepts/"+kind+"-mobile-390-hero.png"});
   if(kind==="lab"){await page.locator(".matrix").scrollIntoViewIfNeeded();await page.screenshot({path:"qa-screenshots/three-concepts/lab-mobile-390-bento.png"})}
  }
 }
 await page.close();
}
for(const [path,kind] of [["/concept-lab/editorial/","editorial"],["/concept-lab/lab/","lab"]]){
 const reduced=await browser.newPage({viewport:{width:390,height:844},isMobile:true,reducedMotion:"reduce"});
 await reduced.goto(BASE+path,{waitUntil:"domcontentloaded"});
 await check(kind+": reduced-motion readable with no pinned gallery",async()=>{
  if(kind==="editorial"){
   assert.equal(await reduced.locator(".ticker-track").evaluate(el=>getComputedStyle(el).animationName),"none");
   assert.equal(await reduced.locator(".manifesto h2").evaluate(el=>getComputedStyle(el).opacity),"1");
  }else{
   assert.equal((await reduced.evaluate(()=>window.__vtLabQA.state)).enhanced,false);
   assert.notEqual(await reduced.locator(".rail-sticky").evaluate(el=>getComputedStyle(el).position),"sticky");
   assert.equal(await reduced.locator(".animated-rings i").first().evaluate(el=>getComputedStyle(el).animationName),"none");
  }
 });
 await reduced.close();
 const noJS=await browser.newPage({viewport:{width:390,height:844},isMobile:true,javaScriptEnabled:false});
 await noJS.goto(BASE+path,{waitUntil:"domcontentloaded"});
 await check(kind+": no-JS fallback preserves original projects",async()=>{
  const count=await noJS.locator(kind==="lab"?".experiment":".spread").count();
  assert.equal(count,kind==="lab"?5:3);
  const d=await noJS.evaluate(()=>({viewport:innerWidth,page:document.documentElement.scrollWidth}));
  assert(d.page<=d.viewport+3,JSON.stringify(d));
  if(kind==="lab")assert.notEqual(await noJS.locator(".rail-sticky").evaluate(el=>getComputedStyle(el).position),"sticky");
 });
 await noJS.close();
}
await check("Production homepage files are untouched in this demo branch",async()=>{
 const html=await readFile("index.html","utf8");
 const css=await readFile("simple.css","utf8");
 assert(html.includes('href="/simple.css"'));
 assert(html.includes("Graphic &amp; motion <em>designer.</em>"));
 assert(!html.includes("concept-lab/"));
 assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
});
await browser.close();
console.log("THREE CONCEPTS QA: "+passed+" passed, "+failed+" failed.");
if(failed)process.exitCode=1;
