import assert from "node:assert/strict";
import {chromium} from "playwright";
import {mkdir,readFile} from "node:fs/promises";

const BASE="http://127.0.0.1:4173";
const PATH="/vt-os-next/";
await mkdir("qa-screenshots/vt-os-next",{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
let passed=0,failed=0;
async function check(name,run){
  try{const msg=await run();passed++;console.log("PASS "+name+(msg?" — "+msg:""))}
  catch(e){failed++;console.error("FAIL "+name+" — "+String(e).slice(0,1300))}
}
const desk=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
const errors=[];const broken=[];
desk.on("pageerror",e=>errors.push(e.message));
desk.on("requestfailed",r=>broken.push(r.url()+" "+r.failure()?.errorText));
const response=await desk.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
await check("Preview is separate, no-index, uses only local assets and labels production safe",async()=>{
  assert.equal(response.status(),200);
  assert.equal(await desk.locator('meta[name="robots"]').getAttribute("content"),"noindex,nofollow");
  assert((await desk.locator(".preview-ribbon").innerText()).includes("LIVE WEBSITE UNCHANGED"));
  assert.equal(await desk.locator('script[src]').count(),1);
  assert.equal(await desk.locator('link[rel="stylesheet"]').getAttribute("href"),"./system.css");
  assert((await desk.locator("title").count())===1);
});
await check("Hero: exact original VT logo and original face load unmodified",async()=>{
  for(const selector of [".topbrand img",".hero-portrait-plate img"]){
    await desk.locator(selector).evaluate(img=>img.decode());
    const data=await desk.locator(selector).evaluate(img=>({src:img.getAttribute("src"),width:img.naturalWidth}));
    assert(data.width>40,JSON.stringify(data));
  }
  assert.equal(await desk.locator(".hero-portrait-plate img").getAttribute("src"),"/portfolio/assets/vishal-hero-new-portrait.png");
  assert.equal(await desk.locator(".topbrand img").getAttribute("src"),"/portfolio/assets/vishal-tyagi-mark.svg");
  assert(await desk.locator("#home-title").innerText().then(s=>s.includes("IDEAS")));
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert.equal(state.projectCount,6);
  assert(state.desktop,JSON.stringify(state));
});
await desk.waitForTimeout(1400);
await desk.screenshot({path:"qa-screenshots/vt-os-next/01-desktop-hero.png"});
await check("Original art provenance: all explorer gallery assets and originals return HTTP 200",async()=>{
  const data=await desk.evaluate(()=>window.__vtOs2QA.assets);
  assert.equal(data.length,6);
  const urls=[...new Set(data.flatMap(p=>p.images).map(name=>"/portfolio/assets/"+name))];
  urls.push("/portfolio/assets/Vishal-Tyagi-Resume.pdf","/portfolio/assets/motion-selected.mp4","/portfolio/assets/motion-vertical.mp4");
  for(const url of urls){
    const res=await desk.request.get(BASE+url);
    assert.equal(res.status(),200,url);
  }
  for(const p of data)assert(p.archive.startsWith("/portfolio/#")&&p.images.length>0,JSON.stringify(p));
  return urls.length+" originals, no new artwork generation";
});
await check("Desktop: real workspace boots with correct six original projects and two visible apps",async()=>{
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert.deepEqual(state.open,["work","about"]);
  assert.equal(await desk.locator(".project-option").count(),6);
  assert.equal(await desk.locator(".window").count(),4);
  assert.equal(await desk.locator(".window:not([hidden])").count(),2);
  assert.equal(await desk.locator("#canvas-title").innerText(),"Resultbull.ai");
  assert.equal(await desk.locator("#thumbnail-rail button").count(),1);
  const css=await desk.locator(".explorer-window").evaluate(el=>getComputedStyle(el).position);
  assert.equal(css,"absolute");
});
await desk.locator("#workspace").scrollIntoViewIfNeeded();
await desk.waitForTimeout(400);
await desk.screenshot({path:"qa-screenshots/vt-os-next/02-desktop-workspace.png"});
await check("Project explorer: actual identity filter selects exactly three originals",async()=>{
  await desk.locator('[data-filter="identity"]').click();
  const buttons=desk.locator(".project-option:not([hidden])");
  assert.equal(await buttons.count(),3);
  assert.equal(await desk.locator('[data-filter="identity"]').getAttribute("aria-pressed"),"true");
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert.equal(state.filter,"identity");
});
await check("Project search: filters by name and handles zero results",async()=>{
  await desk.locator('[data-filter="all"]').click();
  await desk.locator("#project-search").fill("Radisson");
  assert.equal(await desk.locator(".project-option:not([hidden])").count(),1);
  assert.equal(await desk.locator("#canvas-title").innerText(),"Radisson Chandigarh");
  assert.equal(await desk.locator("#thumbnail-rail button").count(),3);
  await desk.locator("#project-search").fill("this-should-not-match-anything");
  assert.equal(await desk.locator(".project-option:not([hidden])").count(),0);
  assert(await desk.locator("#no-results").isVisible());
  await desk.locator("#project-search").fill("");
  assert.equal(await desk.locator(".project-option:not([hidden])").count(),6);
});
await check("Original campaign gallery thumbnails switch image source, not regenerate it",async()=>{
  await desk.locator('[data-project="2"]').click();
  assert.equal(await desk.locator("#canvas-title").innerText(),"Discover ASR");
  assert.equal(await desk.locator("#thumbnail-rail button").count(),4);
  await desk.locator("#thumbnail-rail button").nth(1).click();
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert.equal(state.project,2);
  assert.equal(state.image,1);
  assert.equal(await desk.locator("#canvas-image").getAttribute("src"),"/portfolio/assets/002-ascott-discover-asr-india-02.webp");
});
await desk.screenshot({path:"qa-screenshots/vt-os-next/03-desktop-campaign-gallery.png"});
await check("Presentation mode: true modal, real original gallery navigation and keyboard arrow switching",async()=>{
  await desk.locator("#present-project").click();
  assert(await desk.locator("#presentation").evaluate(el=>el.open));
  assert.equal(await desk.locator("#presentation-title").innerText(),"Discover ASR");
  assert.equal(await desk.locator("#present-dots button").count(),4);
  await desk.locator("#present-dots button").nth(2).click();
  assert.equal(await desk.locator("#present-image").getAttribute("src"),"/portfolio/assets/003-ascott-discover-asr-india-03.webp");
  await desk.keyboard.press("ArrowRight");
  assert.equal(await desk.locator("#presentation-title").innerText(),"Pride Hotels");
  assert.equal(await desk.locator("#present-archive").getAttribute("href"),"/portfolio/#pride");
  return "Native dialog and original multi-image gallery functional";
});
await desk.screenshot({path:"qa-screenshots/vt-os-next/04-desktop-presentation.png"});
await check("Presentation mode: Escape closes and returns to native document scroll",async()=>{
  await desk.keyboard.press("Escape");
  assert.equal(await desk.locator("#presentation").evaluate(el=>el.open),false);
  const before=await desk.evaluate(()=>scrollY);
  await desk.mouse.move(650,530);await desk.mouse.wheel(0,620);await desk.waitForTimeout(370);
  const after=await desk.evaluate(()=>scrollY);
  assert(after>before+180,JSON.stringify({before,after}));
  return "Wheel moved "+Math.round(after-before)+"px after modal";
});
await check("Desktop windows: draggable project explorer is physically moved and clamped",async()=>{
  await desk.locator(".explorer-window").scrollIntoViewIfNeeded();
  const bar=desk.locator('[data-drag="work"]');
  const win=desk.locator(".explorer-window");
  const before=await win.boundingBox(),b=await bar.boundingBox();
  await desk.mouse.move(b.x+b.width*.40,b.y+b.height*.5);await desk.mouse.down();
  await desk.mouse.move(b.x+b.width*.40+53,b.y+b.height*.5+38,{steps:9});await desk.mouse.up();
  const after=await win.boundingBox();
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert(after.x>before.x+20&&after.y>before.y+9,JSON.stringify({before,after,drags:state.dragMoves}));
  assert(state.dragMoves>1);
  return "Window moved "+Math.round(after.x-before.x)+" px";
});
await check("Desktop windows: maximize then restore original explorer geometry",async()=>{
  const w=desk.locator(".explorer-window");
  const old=await w.boundingBox();
  await desk.locator('[data-maximize="work"]').click();
  assert(await w.evaluate(el=>el.classList.contains("is-maximized")));
  const max=await w.boundingBox();assert(max.width>old.width+100,JSON.stringify({old,max}));
  await desk.locator('[data-maximize="work"]').click();
  assert.equal(await w.evaluate(el=>el.classList.contains("is-maximized")),false);
  const restored=await w.boundingBox();assert(Math.abs(restored.width-old.width)<10);
});
await check("Workspace: dock opens motion player, both original reels and minimize-to-dock",async()=>{
  await desk.locator('#os-shell [data-app="motion"]').first().click();
  assert.equal(await desk.locator(".motion-window").getAttribute("aria-hidden"),"false");
  assert((await desk.evaluate(()=>window.__vtOs2QA.state.open)).includes("motion"));
  assert.equal(await desk.locator("#window-video source").getAttribute("src"),"/portfolio/assets/motion-selected.mp4");
  await desk.locator('[data-reel="1"]').click();
  assert.equal(await desk.locator("#window-video source").getAttribute("src"),"/portfolio/assets/motion-vertical.mp4");
  assert.equal(await desk.locator("#window-video").getAttribute("autoplay"),null);
  await desk.locator('[data-minimize="motion"]').click();
  assert.equal(await desk.locator(".motion-window").getAttribute("aria-hidden"),"true");
});
await check("Command palette: Ctrl K finds project and Enter navigates to it",async()=>{
  await desk.keyboard.press("Control+k");
  assert(await desk.locator("#commands").evaluate(el=>el.open));
  await desk.locator("#command-input").fill("GTM");
  await desk.keyboard.press("Enter");
  assert.equal(await desk.locator("#commands").evaluate(el=>el.open),false);
  assert.equal((await desk.evaluate(()=>window.__vtOs2QA.state)).project,1);
  assert.equal(await desk.locator("#canvas-title").innerText(),"GTM Leads");
});
await desk.keyboard.press("Control+k");await desk.locator("#command-input").fill("motion");
await desk.screenshot({path:"qa-screenshots/vt-os-next/05-desktop-command-palette.png"});
await desk.keyboard.press("Escape");
await check("Theme toggle: light and dark are both live CSS modes",async()=>{
  const btn=desk.locator("#theme-toggle");
  await btn.click();
  const v=await desk.evaluate(()=>window.__vtOs2QA.state.theme);
  assert.equal(v,"light");
  assert.equal(await btn.getAttribute("aria-label"),"Switch to dark mode");
  const bg=await desk.locator("body").evaluate(e=>getComputedStyle(e).backgroundColor);
  assert.equal(bg,"rgb(241, 240, 236)");
  await btn.click();assert.equal((await desk.evaluate(()=>window.__vtOs2QA.state.theme)),"dark");
});
await check("All major website sections exist and contact channels use existing verified profile links",async()=>{
  for(const id of ["home","workspace","projects","stories","about","motion","contact"])
    assert.equal(await desk.locator("#"+id).count(),1,id);
  const links=await desk.locator(".contact-cards a").evaluateAll(es=>es.map(a=>a.href));
  assert.equal(links.length,2);
  assert(links[0].startsWith("https://wa.me/917409219402"));
  assert(links[1].startsWith("https://wa.me/917409219402"));
  assert(await desk.locator(".profile-body a[href$='Vishal-Tyagi-Resume.pdf']").count()===1);
});
await check("Scroll film: wide desktop uses native sticky horizontal chapter progression",async()=>{
  const state=await desk.evaluate(()=>window.__vtOs2QA.state);
  assert(state.pinned,JSON.stringify(state));
  assert(state.storyOffset>1000,JSON.stringify(state));
  assert.equal(await desk.locator(".story-card").count(),4);
  const stick=await desk.locator("#story-pin").evaluate(el=>getComputedStyle(el).position);
  assert.equal(stick,"sticky");
  await desk.evaluate(()=>{
    const el=document.querySelector(".scroll-stories");
    scrollTo({top:el.getBoundingClientRect().top+scrollY+el.offsetHeight*.15,behavior:"instant"});
  });
  await desk.waitForTimeout(140);
  const before=await desk.locator("#story-track").evaluate(el=>getComputedStyle(el).getPropertyValue("--stories-x"));
  const y=await desk.evaluate(()=>scrollY);
  await desk.mouse.move(710,475);await desk.mouse.wheel(0,740);await desk.waitForTimeout(340);
  const after=await desk.locator("#story-track").evaluate(el=>getComputedStyle(el).getPropertyValue("--stories-x"));
  assert.notEqual(before,after,JSON.stringify({before,after}));
  assert((await desk.evaluate(()=>scrollY))>y+200,"Native scrolling did not advance");
  return JSON.stringify({from:before,to:after});
});
await desk.screenshot({path:"qa-screenshots/vt-os-next/06-desktop-scroll-film.png"});
await check("Full desktop scroll reaches expertise, original showreel and contact without lock",async()=>{
  await desk.locator(".expertise-section").scrollIntoViewIfNeeded();
  await desk.screenshot({path:"qa-screenshots/vt-os-next/07-desktop-expertise.png"});
  await desk.locator(".reel-section").scrollIntoViewIfNeeded();
  assert.equal(await desk.locator(".reel-player video source").getAttribute("src"),"/portfolio/assets/motion-selected.mp4");
  await desk.screenshot({path:"qa-screenshots/vt-os-next/08-desktop-motion.png"});
  await desk.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
  await desk.waitForTimeout(130);
  const d=await desk.evaluate(()=>({y:scrollY,max:document.documentElement.scrollHeight-innerHeight,contact:document.querySelector("#contact").getBoundingClientRect().top<innerHeight}));
  assert(Math.abs(d.y-d.max)<8&&d.contact,JSON.stringify(d));
  assert.deepEqual(errors,[]);
  assert.deepEqual(broken,[]);
});
await desk.screenshot({path:"qa-screenshots/vt-os-next/09-desktop-contact.png"});

for(const width of [320,390,430,768,1024,1280,1440]){
  const height=width<=430?844:width===768?1024:900;
  const page=await browser.newPage({viewport:{width,height},isMobile:width<500,hasTouch:width<500,deviceScaleFactor:1});
  const errs=[];page.on("pageerror",e=>errs.push(e.message));
  const res=await page.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
  await check("Viewport "+width+"px: original artwork loads, no horizontal overflow and hero CTA present",async()=>{
    assert.equal(res.status(),200);
    const d=await page.evaluate(()=>({width:innerWidth,page:document.documentElement.scrollWidth,hero:document.querySelector("#home-title")?.textContent,workspace:!!document.querySelector("#workspace"),cta:document.querySelector(".solid-cta")?.getAttribute("href")}));
    assert(d.page<=d.width+3,JSON.stringify(d));
    assert(d.hero.includes("HAPPEN")&&d.cta==="#workspace"&&d.workspace,JSON.stringify(d));
    await page.locator(".hero-portrait-plate img").evaluate(img=>img.decode());
    assert((await page.locator(".hero-portrait-plate img").evaluate(img=>img.naturalWidth))>200);
    assert.deepEqual(errs,[]);
    return JSON.stringify({viewport:d.width,scrollWidth:d.page});
  });
  await check("Viewport "+width+"px: genuine project explorer and visible app controls",async()=>{
    const state=await page.evaluate(()=>window.__vtOs2QA.state);
    if(width<1200){
      assert.equal(state.desktop,false,JSON.stringify(state));
      for(const id of ["work","about","motion","connect"])
        assert.equal(await page.locator('[data-window="'+id+'"]').getAttribute("aria-hidden"),"false",id);
      assert.equal(await page.locator(".window-controls").first().isVisible(),false);
      assert.notEqual(await page.locator("#story-pin").evaluate(el=>getComputedStyle(el).position),"sticky");
    }else{
      assert(state.desktop,JSON.stringify(state));
      assert(state.pinned,JSON.stringify(state));
    }
    await page.locator('[data-project="4"]').click();
    assert.equal(await page.locator("#canvas-title").innerText(),"Radisson Chandigarh");
    assert.equal(await page.locator("#thumbnail-rail button").count(),3);
    const pres=page.locator("#present-project");await pres.click();
    assert(await page.locator("#presentation").evaluate(el=>el.open));
    await page.locator("#presentation-close").click();
    assert.equal(await page.locator("#presentation").evaluate(el=>el.open),false);
  });
  await check("Viewport "+width+"px: full native page scroll reaches contact with no runtime errors",async()=>{
    await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}));
    await page.waitForTimeout(130);
    const d=await page.evaluate(()=>({pos:scrollY,max:document.documentElement.scrollHeight-innerHeight}));
    assert(Math.abs(d.pos-d.max)<8,JSON.stringify(d));
    assert.deepEqual(errs,[]);
  });
  if(width===390){
    await page.evaluate(()=>scrollTo({top:0,behavior:"instant"}));await page.waitForTimeout(1250);
    await page.screenshot({path:"qa-screenshots/vt-os-next/10-mobile-hero-390.png"});
    await page.locator("#workspace").scrollIntoViewIfNeeded();
    await page.screenshot({path:"qa-screenshots/vt-os-next/11-mobile-workspace-390.png"});
    await page.locator("#stories").scrollIntoViewIfNeeded();
    await page.screenshot({path:"qa-screenshots/vt-os-next/12-mobile-project-stories-390.png"});
  }
  await page.close();
}
for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:width<500?844:900},reducedMotion:"reduce",isMobile:width<500,hasTouch:width<500});
  await page.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
  await check("Reduced-motion at "+width+"px: original work accessible and no pinned film",async()=>{
    const state=await page.evaluate(()=>window.__vtOs2QA.state);
    assert.equal(state.reduced,true,JSON.stringify(state));
    assert.equal(state.pinned,false,JSON.stringify(state));
    assert.equal(await page.locator(".story-card").count(),4);
    assert.notEqual(await page.locator("#story-pin").evaluate(el=>getComputedStyle(el).position),"sticky");
    assert.equal(await page.locator(".reveal").first().evaluate(el=>getComputedStyle(el).opacity),"1");
  });
  await page.close();
}
const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false,isMobile:true,hasTouch:true});
await nojs.goto(BASE+PATH,{waitUntil:"domcontentloaded"});
await check("No-JS fallback: full project archive access, original artwork and all 4 apps remain readable",async()=>{
  for(const id of ["work","about","motion","connect"]){
    const el=nojs.locator('[data-window="'+id+'"]');
    assert(await el.isVisible(),id+" missing");
  }
  const d=await nojs.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth}));
  assert(d.page<=d.viewport+3,JSON.stringify(d));
  assert.equal(await nojs.locator(".project-option").count(),6);
  assert.equal(await nojs.locator(".story-card").count(),4);
  assert.equal(await nojs.locator(".reel-player video").count(),1);
});
await check("Production homepage, portfolio archive and official brand palette are unchanged in preview branch",async()=>{
  const html=await readFile("index.html","utf8");
  const css=await readFile("simple.css","utf8");
  const archive=await readFile("portfolio/index.html","utf8");
  assert(html.includes('href="/simple.css"'));
  assert(html.includes("Graphic &amp; motion <em>designer.</em>"));
  assert(!html.includes("vt-os-next/"));
  assert(css.includes("--primary:#006D77")&&css.includes("--secondary:#B76E79"));
  assert(archive.includes('id="ascott"')&&archive.includes('id="pride"'));
});
await browser.close();
console.log("VT.OS 2.0 QA: "+passed+" passed, "+failed+" failed.");
if(failed)process.exitCode=1;
