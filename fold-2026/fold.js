/* FOLD: original-art DOM artifact, driven by native scrolling. No wheel hijack. */
(()=>{"use strict";
const BASE="/portfolio/assets/";
const projects=[
{name:"Discover ASR",heading:"Discover<br><i>ASR.</i>",category:"TRAVEL / CAMPAIGN DESIGN",summary:"Original travel and hospitality campaign artwork for Discover ASR / The Ascott Limited.",role:"CAMPAIGN DESIGN",archive:"/portfolio/#ascott",color:"#CED7C6",images:["001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp","003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp","005-ascott-discover-asr-september-1.webp","006-ascott-discover-asr-september-2.webp"]},
{name:"Resultbull.ai",heading:"Result<br><i>bull.ai</i>",category:"IDENTITY / DIGITAL DESIGN",summary:"Original visual identity and digital product design for Resultbull.ai.",role:"IDENTITY & DIGITAL DESIGN",archive:"/portfolio/#resultbull",color:"#DFD5BE",images:["resultbull.svg"]},
{name:"GTM Leads",heading:"GTM<br><i>Leads.</i>",category:"B2B / BRAND IDENTITY",summary:"A visual identity for a B2B buyer–seller platform.",role:"VISUAL IDENTITY",archive:"/portfolio/#gtm",color:"#C1D6CB",images:["gtm.svg"]},
{name:"Pride Hotels",heading:"Pride<br><i>Hotels.</i>",category:"HOSPITALITY / CAMPAIGN",summary:"Original hospitality and vacation campaign artworks for Pride Hotels & Resorts.",role:"HOSPITALITY CAMPAIGN DESIGN",archive:"/portfolio/#pride",color:"#E5D7CC",images:["008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp","009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp","010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp","011-pride-vacation-vibes-with-pride-campaign-creatives-04.webp","012-pride-vacation-vibes-with-pride-campaign-creatives-05.webp"]}
];
const root=document.querySelector(".fold-journey"),sticky=document.querySelector(".fold-sticky"),sculpture=document.querySelector(".fold-sculpture");
const hero=document.querySelector(".hero-voice"),titleZone=document.querySelector(".project-title-zone"),meter=document.querySelector("#page-meter");
const H={count:document.querySelector("#stage-count"),index:document.querySelector("#project-index"),title:document.querySelector("#project-title"),category:document.querySelector("#project-category"),summary:document.querySelector("#project-summary"),stage:document.querySelector("#stage-kicker"),floor:document.querySelector("#floor-label")};
const originals=[...document.querySelectorAll(".fold-half .full-art")],jumps=[...document.querySelectorAll(".stage-dots [data-jump]")];
const dialog=document.querySelector("#work-dialog"),image=document.querySelector("#dialog-image"),count=document.querySelector("#gallery-count");
const D={index:document.querySelector("#dialog-number"),title:document.querySelector("#dialog-title"),category:document.querySelector("#dialog-category"),desc:document.querySelector("#dialog-description"),role:document.querySelector("#dialog-role"),archive:document.querySelector("#dialog-original-link")};
const reduced=matchMedia("(prefers-reduced-motion: reduce)"),desktop=matchMedia("(min-width:1100px) and (min-height:730px)");
const clamp=x=>Math.max(0,Math.min(1,x));const smooth=x=>x*x*(3-2*x);
const intro=.19,step=(1-intro)/4;
let active=-1,gallery=0,viewIndex=0,raf=0,frames=0,stageStart=0,travel=1,enhanced=false,measureCount=0,swaps=0,opening=0;
function choose(i){
 if(i===active)return;
 if(i<0||i>=projects.length)return;
 active=i;swaps++;
 const p=projects[i];sticky.dataset.world=String(i);
 originals.forEach(img=>{img.src=BASE+p.images[0]});
 H.index.textContent=String(i+1).padStart(2,"0");H.title.innerHTML=p.heading;
 H.category.textContent=p.category;H.summary.textContent=p.summary;
 H.count.textContent=String(i+1).padStart(2,"0")+" — 04";
 H.stage.textContent="ONE PRACTICE / FOUR DISTINCT FORMS";H.floor.textContent="ORIGINAL WORK / "+p.role;
 sculpture.setAttribute("aria-label","Original "+p.name+" artwork as a folding design composition");
 jumps.forEach((b,index)=>index===i?b.setAttribute("aria-current","true"):b.removeAttribute("aria-current"));
}
function measure(){
 enhanced=desktop.matches&&!reduced.matches;
 if(enhanced){root.style.setProperty("--journey-height",(innerHeight*5.4).toFixed(1)+"px")}
 else{root.style.removeProperty("--journey-height");sticky.dataset.world="0"}
 stageStart=root.getBoundingClientRect().top+scrollY;travel=Math.max(1,root.offsetHeight-innerHeight);
 measureCount++;schedule();
}
function paint(){
 raf=0;frames++;
 const y=scrollY||0,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 meter.style.transform="scaleX("+clamp(y/max).toFixed(4)+")";
 if(!enhanced){
 sculpture.style.setProperty("--open","1");sculpture.style.setProperty("--canvas-scale","1");
 sculpture.style.setProperty("--canvas-x","0px");hero.style.setProperty("--hero-opacity","1");
 titleZone.style.setProperty("--project-opacity","0");
 return;
 }
 const p=clamp((y-stageStart)/travel);
 if(p<intro){
  opening=clamp(p/intro);const eased=smooth(opening);
  if(active!==0)choose(0);
  sculpture.style.setProperty("--open",(.08+.92*eased).toFixed(4));
  sculpture.style.setProperty("--canvas-scale",(1+.07*eased).toFixed(4));
  sculpture.style.setProperty("--canvas-x",(eased*12).toFixed(1)+"px");
  hero.style.setProperty("--hero-opacity",clamp(1-eased*1.55).toFixed(4));
  hero.style.setProperty("--hero-translate",(-eased*48).toFixed(1)+"px");
  titleZone.style.setProperty("--project-opacity","0");
  H.stage.textContent="ONE PRACTICE / MANY FORMS";H.count.textContent="00 — 04";
  jumps.forEach(b=>b.removeAttribute("aria-current"));return;
 }
 const world=clamp((p-intro)/(1-intro)),unit=Math.min(3.9999,world*4);
 const index=Math.floor(unit),phase=unit-index;
 if(index!==active)choose(index);
 // The first chapter may already be selected during the opening, but its navigation marker must activate when content takes over.
 jumps.forEach((button,n)=>n===index?button.setAttribute("aria-current","true"):button.removeAttribute("aria-current"));
 const opened=Math.min(smooth(clamp(phase/.18)),smooth(clamp((1-phase)/.18)));
 sculpture.style.setProperty("--open",(.12+.88*opened).toFixed(4));
 sculpture.style.setProperty("--canvas-scale",(.99+.05*opened).toFixed(4));
 sculpture.style.setProperty("--canvas-x",(10+4*opened).toFixed(1)+"px");
 hero.style.setProperty("--hero-opacity","0");hero.style.setProperty("--hero-translate","-50px");
 const reveal=clamp((p-intro)/.045),out=clamp((1-phase)/.11),appear=Math.min(reveal,out);
 titleZone.style.setProperty("--project-opacity",appear.toFixed(4));
 titleZone.style.setProperty("--project-y",((1-appear)*26).toFixed(2)+"px");
 H.count.textContent=String(index+1).padStart(2,"0")+" — 04";
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
function jump(i){
 if(!enhanced){document.querySelector('[data-mobile="'+i+'"]')?.scrollIntoView({block:"start",behavior:reduced.matches?"instant":"smooth"});return}
 const p=intro+step*(i+.43);scrollTo({top:stageStart+travel*p,behavior:reduced.matches?"instant":"smooth"});
}
jumps.forEach(b=>b.addEventListener("click",()=>jump(+b.dataset.jump)));
function paintDialog(){
 const p=projects[viewIndex],name=p.images[gallery];image.src=BASE+name;
 image.alt="Original "+p.name+" artwork "+(gallery+1)+" of "+p.images.length;
 document.querySelector(".dialog-art-inner").style.setProperty("--viewer-plate",p.color);
 count.textContent=String(gallery+1).padStart(2,"0")+" — "+String(p.images.length).padStart(2,"0");
 D.index.textContent=String(viewIndex+1).padStart(2,"0")+" / 04";D.title.textContent=p.name;
 D.category.textContent=p.category;D.desc.textContent=p.summary;D.role.textContent=p.role;D.archive.href=p.archive;
 document.querySelector("#gallery-prev").disabled=p.images.length===1;
 document.querySelector("#gallery-next").disabled=p.images.length===1;
}
function present(i){viewIndex=i;gallery=0;paintDialog();if(!dialog.open)dialog.showModal()}
document.querySelector("#open-project").addEventListener("click",()=>present(active<0?0:active));
document.querySelectorAll("[data-mobile-open]").forEach(b=>b.addEventListener("click",()=>present(+b.dataset.mobileOpen)));
document.querySelector("#dialog-close").addEventListener("click",()=>dialog.close());
document.querySelector("#gallery-prev").addEventListener("click",()=>{gallery=(gallery-1+projects[viewIndex].images.length)%projects[viewIndex].images.length;paintDialog()});
document.querySelector("#gallery-next").addEventListener("click",()=>{gallery=(gallery+1)%projects[viewIndex].images.length;paintDialog()});
dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close()});
document.addEventListener("keydown",e=>{
 if(!dialog.open||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==="ArrowRight"){e.preventDefault();document.querySelector("#gallery-next").click()}
 if(e.key==="ArrowLeft"){e.preventDefault();document.querySelector("#gallery-prev").click()}
});
window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",measure,{passive:true});
window.addEventListener("load",measure,{once:true});document.fonts?.ready?.then(measure);
reduced.addEventListener?.("change",measure);desktop.addEventListener?.("change",measure);
choose(0);measure();
window.__foldQA={get state(){return{active,frames,enhanced,measureCount,swaps,opening,open:sculpture.style.getPropertyValue("--open"),currentArt:originals[0].getAttribute("src"),dialog:dialog.open,images:projects[viewIndex].images.length}},get assets(){return projects.map(p=>p.images.map(s=>BASE+s))}};
})();