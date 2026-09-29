import assert from "node:assert/strict";
import {chromium} from "playwright";
import {pathToFileURL} from "node:url";
import {resolve} from "node:path";
import {readFileSync} from "node:fs";

const root=resolve("offline-preview");
const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage","--allow-file-access-from-files"]});
let pass=0;
for (const filename of ["index.html","portal.html","orbit.html","cut.html"]){
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const issues=[];
  page.on("pageerror",e=>issues.push(e.message));
  const response=await page.goto(pathToFileURL(resolve(root,filename)).href,{waitUntil:"load"});
  // Browser-native loading="lazy" keeps offscreen originals unloaded until scrolled; force decode solely for this asset QA.
  await page.locator('img[src*="/assets/"]').evaluateAll(async imgs=>{
    await Promise.all(imgs.map(img=>{img.loading="eager";return img.decode().catch(()=>{})}));
  });
  const info=await page.evaluate(()=>({
    path:location.protocol,doc:document.documentElement.scrollWidth,viewport:innerWidth,
    images:[...document.querySelectorAll('img[src*="/assets/"]')].slice(0,8).map(img=>({src:img.getAttribute("src"),naturalWidth:img.naturalWidth})),
    embedded:[...document.querySelectorAll('svg image')].map(im=>im.getAttribute("href")?.startsWith("data:image/"))
  }));
  assert.equal(info.path,"file:",filename+" did not open via local file");
  assert(info.doc<=info.viewport+3,filename+" overflow "+JSON.stringify(info));
  assert(info.images.every(i=>i.naturalWidth>0),filename+" missing image "+JSON.stringify(info.images));
  assert(info.embedded.every(Boolean),filename+" SVG mask not embedded");
  assert.deepEqual(issues,[],filename+" page JS errors "+JSON.stringify(issues));
  if(filename!=="index.html"){
    assert(["TYPE/PORTAL","ORBIT/WORK","CUT/SHIFT"].includes((await page.evaluate(()=>window.__wowQA?.state?.concept))),filename);
    await page.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight*.35,behavior:"instant"}));
    await page.waitForTimeout(200);
    assert((await page.evaluate(()=>scrollY))>200,filename+" cannot natively scroll");
  }else{
    assert.deepEqual(await page.locator(".world-copy .launch").evaluateAll(es=>es.map(e=>new URL(e.href).pathname.split("/").pop())),["portal.html","orbit.html","cut.html"]);
  }
  pass++;console.log("PASS offline "+filename+": file://, original artwork, CSS layout and browser interactions");
  await page.close();
}
await browser.close();
assert(readFileSync(resolve(root,"README_FIRST.txt"),"utf8").includes("Extract"));
console.log("OFFLINE QA: "+pass+"/4 studies open from local disk without an HTTP server.");
