import {chromium} from "playwright";
import {mkdir,rename} from "node:fs/promises";
import {join} from "node:path";
const root="qa-screenshots/vform";
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
const context=await browser.newContext({
 viewport:{width:1440,height:900},
 deviceScaleFactor:1,
 recordVideo:{dir:root,size:{width:1280,height:800}}
});
const page=await context.newPage();
page.setDefaultTimeout(6000);
await page.goto("http://127.0.0.1:4173/vform/",{waitUntil:"domcontentloaded"});
await page.evaluate(()=>document.fonts.ready);
await page.waitForTimeout(1800);
async function scrollToY(y,steps=38,dwell=35){
 const start=await page.evaluate(()=>scrollY);
 for(let i=1;i<=steps;i++){
  const t=i/steps,eased=t*t*(3-2*t);
  await page.evaluate(next=>scrollTo({top:next,behavior:"instant"}),start+(y-start)*eased);
  await page.waitForTimeout(dwell);
 }
 await page.waitForTimeout(350);
}
const opening=await page.evaluate(()=>{
 const el=document.querySelector("#opening");
 return {start:el.getBoundingClientRect().top+scrollY,travel:el.offsetHeight-innerHeight};
});
await scrollToY(opening.start+opening.travel*.9,65,37);
const intro=await page.locator(".work-intro").evaluate(e=>e.getBoundingClientRect().top+scrollY);
await scrollToY(intro,27,37);
await page.waitForTimeout(1200);
const film=await page.evaluate(()=>{
 const el=document.querySelector("#project-film");
 return {start:el.getBoundingClientRect().top+scrollY,travel:el.offsetHeight-innerHeight};
});
for(const p of [.1,.35,.60,.86]){
 await scrollToY(film.start+film.travel*p,49,39);
 await page.waitForTimeout(830);
}
const motion=await page.locator("#motion").evaluate(el=>el.getBoundingClientRect().top+scrollY);
await scrollToY(motion,33,34);
await page.waitForTimeout(650);
const contact=await page.locator("#contact").evaluate(el=>el.getBoundingClientRect().top+scrollY);
await scrollToY(contact,40,38);
await page.waitForTimeout(1300);
const actualPath=await page.video().path();
await context.close();
await browser.close();
await rename(actualPath,join(root,"VFORM-real-browser-scroll-capture.webm"));
console.log("V/FORM motion video generated from real Chromium scroll and untouched original assets.");
