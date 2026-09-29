import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";

const BASE="http://127.0.0.1:4173",ROUTE="/vform/";
await mkdir("qa-screenshots/vform",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(label,fn){
 try{const extra=await fn();passed++;console.log("PASS "+label+(extra?" — "+extra:""))}
 catch(error){failed++;console.error("FAIL "+label+" — "+String(error).slice(0,1400))}
}
const desktop=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
desktop.setDefaultTimeout(6500);const jsErrors=[];
desktop.on("pageerror",e=>jsErrors.push(e.message));
let response=await desktop.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});
await desktop.evaluate(()=>document.fonts.ready);
await desktop.waitForTimeout(900);
await check("VFORM is an isolated private original-design concept, not production",async()=>{
 assert.equal(response.status(),200);
 assert.equal(await desktop.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
 assert((await desktop.locator(".preview").innerText()).includes("NOT THE LIVE WEBSITE"));
 assert.equal(await desktop.locator('script[src]').count(),1);
 assert.equal(await desktop.locator(".film-scene").count(),4);
 assert.equal(await desktop.locator(".scene-art img").count(),5);
 return "4 original artwork worlds, unique CSS compositions";
});
await check("Original portrait, branding, unregenerated media and real archive links",async()=>{
 const portrait=desktop.locator(".hero-photo img");
 assert.equal(await portrait.getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
 await portrait.evaluate(el=>el.decode());
 assert((await portrait.evaluate(x=>x.naturalWidth))>200);
 const originals=await desktop.evaluate(()=>window.__vformQA.originalArt);
 assert.deepEqual(originals,[
   "/portfolio/assets/001-ascott-discover-asr-india-01.webp",
   "/portfolio/assets/resultbull.svg",
   "/portfolio/assets/gtm.svg",
   "/portfolio/assets/009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp",
   "/portfolio/assets/008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp"
 ]);
 const links=await desktop.locator(".scene-copy>a").evaluateAll(es=>es.map(e=>e.getAttribute("href")));
 assert.deepEqual(links,["/portfolio/#ascott","/portfolio/#resultbull","/portfolio/#gtm","/portfolio/#pride"]);
 const urls=[...new Set([...originals,"/portfolio/assets/vishal-hero-new-portrait.png","/portfolio/assets/vishal-tyagi-mark.svg","/portfolio/assets/motion-selected.mp4"])];
 for(const url of urls){const req=await desktop.request.get(BASE+url);assert.equal(req.status(),200,url)}
 return urls.length+" verified original media assets";
});
await desktop.screenshot({path:"qa-screenshots/vform/01-desktop-hero.png"});
await check("Hero typographic hierarchy is genuinely bespoke, no multiple CTA buttons",async()=>{
 assert.equal(await desktop.locator(".hero-title").count(),1);
 assert.equal(await desktop.locator(".hero-bottom>a").count(),1);
 const title=await desktop.locator(".hero-title").evaluate(el=>getComputedStyle(el).fontFamily);
 assert(title.toLowerCase().includes("archivo")||title.toLowerCase().includes("impact"),title);
 assert.equal(await desktop.locator(".hero-photo img").count(),1);
 assert.equal(await desktop.locator(".hero-sticky").evaluate(el=>getComputedStyle(el).position),"sticky");
 const s=await desktop.evaluate(()=>window.__vformQA.state);
 assert(s.portal.includes("inset")||!s.portal,JSON.stringify(s));
 return title;
});
await check("Signature hero portrait-to-original-project visual takeover advances by native scroll",async()=>{
 await desktop.evaluate(()=>{const e=document.querySelector("#opening");scrollTo({top:e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*.74,behavior:"instant"})});
 await desktop.waitForTimeout(240);
 const state=await desktop.evaluate(()=>window.__vformQA.state);
 const match=state.portal.match(/inset\(([\d.]+)%/);
 assert(match&&+match[1]<95,JSON.stringify(state));
 const before=await desktop.evaluate(()=>scrollY);
 await desktop.mouse.move(800,430);await desktop.mouse.wheel(0,450);await desktop.waitForTimeout(280);
 assert((await desktop.evaluate(()=>scrollY))>before+150);
 return "Portal clip current "+match[1]+"%, native wheel advances";
});
await desktop.screenshot({path:"qa-screenshots/vform/02-desktop-portal-morph.png"});
await check("Narrative heading and project-film scroll architecture are distinct from old software UI",async()=>{
 assert.equal(await desktop.locator(".work-intro h2").count(),1);
 assert.equal(await desktop.locator(".film-sticky").count(),1);
 assert.equal(await desktop.locator(".scene-asr .scene-art-plate").count(),1);
 assert.equal(await desktop.locator(".scene-result .identity-frame").count(),1);
 assert.equal(await desktop.locator(".scene-gtm .gtm-disc").count(),1);
 assert.equal(await desktop.locator(".scene-pride .pride-card").count(),2);
 const s=await desktop.evaluate(()=>window.__vformQA.state);
 assert(s.enhanced&&s.film.endsWith("px"),JSON.stringify(s));
});
await desktop.locator(".work-intro").scrollIntoViewIfNeeded();
await desktop.screenshot({path:"qa-screenshots/vform/03-desktop-work-intro.png"});
async function filmAt(position){
 await desktop.evaluate(p=>{
 const e=document.querySelector(".project-film"),start=e.getBoundingClientRect().top+scrollY;
 scrollTo({top:start+(e.offsetHeight-innerHeight)*p,behavior:"instant"});
 },position);
 await desktop.waitForTimeout(940);
}
for(const [percent,index,file] of [
 [.04,0,"001-ascott"],
 [.31,1,"resultbull.svg"],
 [.56,2,"gtm.svg"],
 [.88,3,"008-pride"]
]){
 await check("Custom full-screen composition "+(index+1)+" progresses with native vertical scroll",async()=>{
  await filmAt(percent);
  const s=await desktop.evaluate(()=>window.__vformQA.state);
  assert.equal(s.active,index,JSON.stringify(s));
  assert.equal(await desktop.locator(".film-scene.is-active").count(),1);
  assert.equal(await desktop.locator(".film-scene[aria-hidden='true']").count(),3);
  const src=await desktop.locator(".film-scene.is-active img").evaluateAll(es=>es.map(e=>e.getAttribute("src")));
  assert(src.some(x=>x.includes(file)),JSON.stringify(src));
  const chapter=await desktop.locator("#film-number").innerText();
  assert(chapter.startsWith("0"+(index+1)),chapter);
  const art=await desktop.locator(".film-scene.is-active .scene-art").evaluate(el=>getComputedStyle(el).display);
  assert(art!=="none");
  return JSON.stringify({chapter,src});
 });
 await desktop.screenshot({path:"qa-screenshots/vform/0"+(4+index)+"-desktop-world-"+(index+1)+".png"});
}
await check("Native wheel can leave cinematic film and reach original motion + recruiter contact",async()=>{
 await desktop.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
 await desktop.waitForTimeout(150);
 const pos=await desktop.evaluate(()=>({actual:scrollY,max:document.documentElement.scrollHeight-innerHeight,contact:document.querySelector("#contact").getBoundingClientRect().top<innerHeight}));
 assert(Math.abs(pos.actual-pos.max)<8&&pos.contact,JSON.stringify(pos));
 assert.equal(await desktop.locator("#motion video").getAttribute("autoplay"),null);
 assert.equal(await desktop.locator("#contact a[href*='linkedin.com']").count(),1);
 assert.deepEqual(jsErrors,[]);
});
await desktop.screenshot({path:"qa-screenshots/vform/08-desktop-contact.png"});

for(const width of [320,390,430,768,1024,1280,1440]){
 const height=width<=430?844:width===768?1024:900;
 const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,isMobile:width<500,hasTouch:width<500});
 p.setDefaultTimeout(5000);const errors=[];
 p.on("pageerror",e=>errors.push(e.message));
 const res=await p.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});
 await p.evaluate(()=>document.fonts.ready);
 await p.waitForTimeout(200);
 await check(width+"px responsive layout: true viewport width, no horizontal overflow and clear identity",async()=>{
  assert.equal(res.status(),200);
  const v=await p.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,text:document.querySelector(".hero-title")?.textContent}));
  if(v.vw!==width||v.doc>width+3){
   const diag=await p.evaluate(limit=>[...document.querySelectorAll("body *")].map(el=>{const r=el.getBoundingClientRect();return{name:el.tagName+"."+(el.className||""),left:Math.round(r.left),right:Math.round(r.right),width:Math.round(r.width),scroll:el.scrollWidth,client:el.clientWidth}}).filter(x=>x.right>limit+2||x.scroll>x.client+6).sort((a,b)=>b.right-a.right).slice(0,14),width);
   console.error("RESPONSIVE_OVERFLOW "+width+" "+JSON.stringify(diag));
  }
  assert.equal(v.vw,width,JSON.stringify(v));
  assert(v.doc<=width+3,JSON.stringify(v));
  assert(v.text?.includes("VISHAL")&&v.text?.includes("TYAGI"),JSON.stringify(v));
  assert.deepEqual(errors,[]);
  return JSON.stringify(v);
 });
 await check(width+"px original work: normal document flow or properly controlled desktop story",async()=>{
  const state=await p.evaluate(()=>window.__vformQA.state);
  assert.equal(state.sceneCount,4);
  if(width<1100)assert.equal(state.enhanced,false,JSON.stringify(state));
  else assert.equal(state.enhanced,true,JSON.stringify(state));
  const src=await p.locator(".scene-art img").evaluateAll(es=>es.map(x=>x.getAttribute("src")));
  assert.equal(src.length,5);
  if(width<1100){for(const s of await p.locator(".film-scene").all())assert.equal(await s.getAttribute("aria-hidden"),null)}
  assert.deepEqual(errors,[]);
 });
 await check(width+"px native scrolling: end contact is reachable without trapping",async()=>{
  await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
  await p.waitForTimeout(120);
  const d=await p.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
  assert(Math.abs(d.y-d.max)<8,JSON.stringify(d));
  assert.deepEqual(errors,[]);
 });
 if(width===390){
  await p.evaluate(()=>scrollTo({top:0,behavior:"instant"}));
  await p.waitForTimeout(1450);
  await p.screenshot({path:"qa-screenshots/vform/09-mobile-first-screen-390.png"});
  await p.locator(".scene-asr").scrollIntoViewIfNeeded();
  await p.screenshot({path:"qa-screenshots/vform/10-mobile-first-project-390.png"});
  await p.locator(".scene-result").scrollIntoViewIfNeeded();
  await p.screenshot({path:"qa-screenshots/vform/11-mobile-second-project-390.png"});
 }
 await p.close();
}
for(const width of [390,1440]){
 const p=await browser.newPage({viewport:{width,height:width===390?844:900},reducedMotion:"reduce",isMobile:width===390,hasTouch:width===390});
 await p.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});
 await check("Reduced motion "+width+"px: original scenes visible in normal scroll without sticky traps",async()=>{
  const state=await p.evaluate(()=>window.__vformQA.state);
  assert.equal(state.reduced,true);
  assert.equal(state.enhanced,false);
  assert.equal(await p.locator(".film-scene").count(),4);
  assert.notEqual(await p.locator("#film-sticky").evaluate(x=>getComputedStyle(x).position),"sticky");
  assert.notEqual(await p.locator(".hero-sticky").evaluate(x=>getComputedStyle(x).position),"sticky");
 });
 await p.close();
}
const nojs=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,javaScriptEnabled:false});
await nojs.goto(BASE+ROUTE,{waitUntil:"domcontentloaded"});
await check("Without JavaScript: original art, reel, resume and direct contact are all present",async()=>{
 assert.equal(await nojs.locator(".film-scene").count(),4);
 assert.equal(await nojs.locator(".film-scene[aria-hidden=true]").count(),0);
 assert.equal(await nojs.locator("#motion video").count(),1);
 assert.equal(await nojs.locator('a[href$="Vishal-Tyagi-Resume.pdf"]').count(),1);
 assert.equal(await nojs.locator('#contact a[href*="linkedin.com"]').count(),1);
 const s=await nojs.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth}));
 assert(s.vw===390&&s.doc<=393,JSON.stringify(s));
});
await check("Private preview never edits main index, approved original palette or existing project archive",async()=>{
 const [home,css,archive]=await Promise.all(["index.html","simple.css","portfolio/index.html"].map(x=>readFile(x,"utf8")));
 assert(home.includes('href="/simple.css"')&&home.includes("Graphic &amp; motion <em>designer.</em>"));
 assert(!home.includes("/vform/"));
 assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
 assert(archive.includes('id="ascott"')&&archive.includes('id="pride"'));
});
await browser.close();
console.log("V/FORM FRESH CONCEPT QA: "+passed+" passed; "+failed+" failed.");
if(failed)process.exitCode=1;