import {chromium} from 'playwright';
import {mkdir,rename,stat} from 'node:fs/promises';
const base='http://127.0.0.1:4173/wowlab-2026/';
const out='qa-videos/wowlab-2026';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
for(const [name,section,frames] of [
 ['01-typographic-portal','portal',88],
 ['02-spatial-orbit','orbit',104],
 ['03-kinetic-shutter','cut',94]
]){
 const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1280,height:800}}});
 const page=await context.newPage();
 const path=section+'/';
 const response=await page.goto(base+path,{waitUntil:'domcontentloaded'});
 if(response.status()!==200)throw Error('Preview path failed '+path);
 await page.evaluate(()=>document.fonts.ready);
 // Ensure selected first original artwork is decoded before a visual capture.
 const sample=section==='portal'?'.work-piece img':section==='orbit'?'.orbit-panel img':'.frame img';
 await page.locator(sample).first().evaluate(img=>img.decode());
 await page.waitForTimeout(900);
 const target=section==='portal'?'#portal':section==='orbit'?'#orbit':'#studio';
 const current=page.locator(target);
 const geometry=await current.evaluate(el=>({height:el.offsetHeight}));
 for(let i=0;i<=frames;i++){
   const p=i/frames;
   const easing=p<.07?0:p>.95?1:(p-.07)/.88;
   await page.evaluate(({target,p})=>{
     const el=document.querySelector(target);
     const dist=Math.max(1,el.offsetHeight-innerHeight);
     scrollTo({top:el.getBoundingClientRect().top+scrollY+dist*p,behavior:'instant'});
   },{target,p:easing});
   await page.waitForTimeout(75);
 }
 await page.waitForTimeout(420);
 const video=page.video();
 await page.close();await context.close();
 const src=await video.path(),dst=out+'/'+name+'.webm';
 await rename(src,dst);
 const bytes=(await stat(dst)).size;
 if(bytes<12000)throw Error('Suspiciously small video '+name+': '+bytes);
 console.log('MOTION VIDEO OK '+name+' '+bytes+' bytes, original artwork, '+geometry.height+'px stage.');
}
await browser.close();
