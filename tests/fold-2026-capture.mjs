import {chromium} from "playwright";import {mkdir,rename} from "node:fs/promises";import path from "node:path";
const root="qa-evidence/fold-2026";await mkdir(root,{recursive:true});
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,recordVideo:{dir:root,size:{width:1280,height:800}}});
const page=await context.newPage();page.setDefaultTimeout(6000);await page.goto("http://127.0.0.1:4173/fold-2026/",{waitUntil:"domcontentloaded"});
await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1300);
const range=await page.evaluate(()=>{const e=document.querySelector(".fold-journey");return{start:e.getBoundingClientRect().top+scrollY,distance:e.offsetHeight-innerHeight}});
async function travel(p,steps=37){const target=range.start+range.distance*p,start=await page.evaluate(()=>scrollY);
for(let i=1;i<=steps;i++){const t=i/steps,ease=t*t*(3-2*t);await page.evaluate(y=>scrollTo({top:y,behavior:"instant"}),start+(target-start)*ease);await page.waitForTimeout(25)}
await page.waitForTimeout(430)}
await travel(.16,39);
for(const p of [.19+.81/4*.43,.19+.81/4*1.43,.19+.81/4*2.43,.19+.81/4*3.43])await travel(p,55);
const about=await page.locator("#about").evaluate(x=>x.getBoundingClientRect().top+scrollY);
const contact=await page.locator("#contact").evaluate(x=>x.getBoundingClientRect().top+scrollY);
for(const target of [about,contact]){const start=await page.evaluate(()=>scrollY);for(let i=1;i<=42;i++){let t=i/42;await page.evaluate(y=>scrollTo({top:y,behavior:"instant"}),start+(target-start)*(t*t*(3-2*t)));await page.waitForTimeout(19)}await page.waitForTimeout(550)}
const video=await page.video().path();await context.close();await browser.close();
await rename(video,path.join(root,"FOLD-live-original-art-scroll.webm"));
console.log("FOLD visual capture completed: real Chromium, native scroll and original project assets.");