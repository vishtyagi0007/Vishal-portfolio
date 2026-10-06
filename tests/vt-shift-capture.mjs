import {chromium} from "playwright";
import {mkdir,rename} from "node:fs/promises";
import path from "node:path";
const root="qa-screenshots/vt-shift";
await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:root,size:{width:1280,height:800}}});
const page=await context.newPage();
page.setDefaultTimeout(7000);
await page.goto("http://127.0.0.1:4173/vt-shift/",{waitUntil:"domcontentloaded"});
await page.evaluate(()=>document.fonts.ready);
await page.waitForTimeout(1700);
for(const i of [1,2,3,4,0]){
 await page.locator('[data-index="'+i+'"]').click();
 await page.waitForFunction(i=>window.__shiftQA?.state.selected===i,i);
 await page.waitForTimeout(1200);
}
await page.locator("#open-study").click();
await page.waitForFunction(()=>document.querySelector("#study").open);
await page.waitForTimeout(1200);
await page.evaluate(()=>document.querySelector("#study-scroll").scrollBy({top:600,behavior:"smooth"}));
await page.waitForTimeout(900);
await page.locator("#close-study").click();
await page.waitForTimeout(400);
async function scroll(selector){
 const target=await page.locator(selector).evaluate(el=>el.getBoundingClientRect().top+scrollY);
 const begin=await page.evaluate(()=>scrollY);
 for(let i=1;i<=33;i++){const v=i/33,t=v*v*(3-2*v);await page.evaluate(y=>scrollTo({top:y,behavior:"instant"}),begin+(target-begin)*t);await page.waitForTimeout(30)}
 await page.waitForTimeout(700);
}
await scroll("#manifesto");
await scroll("#motion");
await scroll("#about");
await scroll("#contact");
await page.waitForTimeout(800);
const video=await page.video().path();
await context.close();
await browser.close();
await rename(video,path.join(root,"VT-SHIFT-real-browser-interaction.webm"));
console.log("VT SHIFT real original-artwork animation and scrolling captured by Chromium.");
