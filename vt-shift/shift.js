/* VT/SHIFT — artwork drives the interface. Original files are referenced, never regenerated. */
(()=>{
"use strict";
const BASE="/portfolio/assets/";
const WORK=[
 {slug:"ascott",title:"Discover ASR",caseTitle:"Discover ASR",type:"HOSPITALITY / CAMPAIGN",sub:"Travel & rewards campaign design",description:"Original digital campaign artwork for Discover ASR / The Ascott Limited. This selection shows the visual execution across the existing original creative series.",gallery:["001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp","003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp"],archive:"/portfolio/#ascott",tone:"#C7DBCF"},
 {slug:"resultbull",title:"Resultbull.ai",caseTitle:"Resultbull.ai",type:"BRAND IDENTITY / DIGITAL",sub:"Brand identity & website UI",description:"Original Resultbull.ai logo design and website UI work. The preserved identity artwork is presented without invented concepts, mockups or performance claims.",gallery:["resultbull.svg"],archive:"/portfolio/#resultbull",tone:"#E2DAD0"},
 {slug:"gtm",title:"GTM Leads",caseTitle:"GTM Leads",type:"B2B / VISUAL IDENTITY",sub:"Visual identity for a B2B platform",description:"Original visual identity for a B2B buyer–seller platform. This project presentation uses the existing logo artwork without redesigning or altering it.",gallery:["gtm.svg"],archive:"/portfolio/#gtm",tone:"#BFDCD1"},
 {slug:"pride",title:"Pride Hotels",caseTitle:"Pride Hotels",type:"HOSPITALITY / CAMPAIGN",sub:"Vacation and hospitality campaigns",description:"An original selection of vacation and hospitality campaign creatives for Pride Hotels & Resorts. The gallery displays existing campaign pieces as originally supplied.",gallery:["008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp","009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp","010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp"],archive:"/portfolio/#pride",tone:"#D9C0B4"},
 {slug:"radisson",title:"Radisson",caseTitle:"Radisson",type:"HOSPITALITY / CAMPAIGN",sub:"Chandigarh hospitality campaign design",description:"Original campaign design artwork for Radisson Chandigarh Zirakpur, including its existing weekend buffet creative series.",gallery:["022-rcz-weekend-buffet-carnival-1.webp","023-rcz-weekend-buffet-carnival-2.webp","024-rcz-weekend-buffet-carnival-3.webp"],archive:"/portfolio/#rcz",tone:"#C9D8D8"}
];
const root=document.documentElement;
const selectors=[...document.querySelectorAll("[data-index]")];
const stage=document.querySelector("#artboard");
const artStage=document.querySelector("#art-stage");
const scenes=[...document.querySelectorAll(".visual-scene")];
const artTitle=document.querySelector("#art-title");
const artKind=document.querySelector("#art-kind");
const artDetail=document.querySelector("#art-detail");
const openBtn=document.querySelector("#open-study");
const study=document.querySelector("#study");
const studyScroll=document.querySelector("#study-scroll");
const studyCover=document.querySelector("#study-cover");
const studyCoverArt=document.querySelector("#study-cover-art");
const studyImage=document.querySelector("#study-image");
const studyTitle=document.querySelector("#study-title");
const studyIntro=document.querySelector("#study-intro");
const studyTag=document.querySelector("#study-tag");
const studyNumber=document.querySelector("#study-number");
const studyGallery=document.querySelector("#study-gallery");
const studyOriginal=document.querySelector("#study-original");
const nextStudy=document.querySelector("#next-study");
const progress=document.querySelector("#page-progress i");
const motion=document.querySelector("#motion");
const motionFrame=document.querySelector("#motion-container");
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
let selected=0,lastFocused=null,opening=false,frame=0,switches=0,flights=0;
const state=()=>({selected,slug:WORK[selected].slug,viewer:study.open,switches,flights,frames:frame,sceneCount:scenes.length,artwork:WORK[selected].gallery.length});
const inRange=(v,min,max)=>Math.max(min,Math.min(max,v));
const activeImage=()=>scenes[selected]?.querySelector("[data-hero-image]");
const runTransition=mutate=>{
 if(!reduced.matches&&typeof document.startViewTransition==="function"){
   const vt=document.startViewTransition(mutate);
   vt.finished.catch(()=>{});
   return vt;
 }
 mutate();return null;
};
function applyScene(index){
 selected=index;
 const project=WORK[selected];
 stage.dataset.tone=project.slug;
 artTitle.textContent=project.title;
 artKind.textContent=project.type;
 artDetail.textContent=project.sub;
 openBtn.setAttribute("aria-label","Open "+project.title+" project presentation");
 selectors.forEach((button,i)=>{
   if(i===selected)button.setAttribute("aria-current","true");
   else button.removeAttribute("aria-current");
 });
 scenes.forEach((scene,i)=>{
   const current=i===selected;
   scene.classList.toggle("is-active",current);
   scene.setAttribute("aria-hidden",String(!current));
   scene.inert=!current;
 });
 if(study.open)renderStudy();
}
function choose(index){
 if(index<0||index>=WORK.length||opening)return;
 if(index===selected)return;
 switches++;
 const change=()=>applyScene(index);
 if(study.open)change();else runTransition(change);
}
selectors.forEach(b=>b.addEventListener("click",()=>choose(Number(b.dataset.index))));
function renderStudy(){
 const project=WORK[selected];
 studyTag.textContent=project.type;
 studyTitle.textContent=project.caseTitle;
 studyIntro.textContent=project.description;
 studyNumber.textContent="ORIGINAL PROJECT 0"+(selected+1)+" / 05";
 studyOriginal.href=project.archive;
 studyImage.src=BASE+project.gallery[0];
 studyImage.alt="Original "+project.title+" project visual";
 studyCoverArt.style.background=project.tone;
 studyCover.style.background=project.tone;
 studyGallery.replaceChildren();
 if(project.gallery.length===1){
   const note=document.createElement("p");
   note.className="study-gallery-empty";
   note.textContent="One original identity artwork is currently available in the portfolio. No additional work has been invented for this presentation.";
   studyGallery.append(note);
 }else{
   project.gallery.slice(1).forEach((file,i)=>{
     const fig=document.createElement("figure");
     const img=document.createElement("img");
     const label=document.createElement("figcaption");
     img.src=BASE+file;img.alt="Original "+project.title+" artwork "+(i+2)+" of "+project.gallery.length;
     img.loading=i===0?"eager":"lazy";img.decoding="async";
     label.textContent="ORIGINAL ARTWORK / 0"+(i+2);
     fig.append(img,label);studyGallery.append(fig);
   });
 }
 studyScroll.scrollTop=0;
}
function returnFocus(){
 document.querySelector(".visual-scene .art-main[style*='hidden']")?.style.removeProperty("visibility");
 if(lastFocused?.isConnected)lastFocused.focus({preventScroll:true});
 else openBtn.focus({preventScroll:true});
}
function cleanFlight(){
 document.querySelectorAll("[data-flying-image]").forEach(el=>el.remove());
 activeImage()?.style.removeProperty("visibility");
 studyImage.style.removeProperty("visibility");
 opening=false;
}
function openStudy(withHistory=true){
 if(study.open||opening)return;
 opening=true;
 lastFocused=document.activeElement;
 const source=activeImage();
 const from=source?.getBoundingClientRect();
 renderStudy();
 study.showModal();
 if(withHistory&&location.hash!=="#case-"+WORK[selected].slug){
   history.pushState({vtCase:WORK[selected].slug},"","#case-"+WORK[selected].slug);
 }
 const to=studyImage.getBoundingClientRect();
 const canFly=!reduced.matches&&source&&from?.width>0&&to.width>0&&source.animate;
 if(!canFly){opening=false;document.querySelector("#close-study").focus();return}
 flights++;
 // A genuine shared-element flight using the identical original artwork; no image resampling or new visuals.
 const flyer=document.createElement("img");
 flyer.src=source.currentSrc||source.src;
 flyer.alt="";
 flyer.setAttribute("data-flying-image","");
 Object.assign(flyer.style,{
   position:"fixed",pointerEvents:"none",zIndex:"10000",left:from.left+"px",top:from.top+"px",
   width:from.width+"px",height:from.height+"px",objectFit:"contain",
   margin:"0",maxWidth:"none",transformOrigin:"0 0",willChange:"transform,opacity"
 });
 document.body.append(flyer);
 studyImage.style.visibility="hidden";
 const dx=to.left-from.left,dy=to.top-from.top;
 const sx=to.width/from.width,sy=to.height/from.height;
 const anim=flyer.animate([
   {transform:"translate3d(0,0,0) scale(1,1)",opacity:1,filter:"drop-shadow(0 12px 34px rgba(0,0,0,.12))"},
   {transform:"translate3d("+dx+"px,"+dy+"px,0) scale("+sx+","+sy+")",opacity:1,filter:"drop-shadow(0 0 0 rgba(0,0,0,0))"}
 ],{duration:880,easing:"cubic-bezier(.16,1,.3,1)",fill:"forwards"});
 anim.finished.then(()=>{cleanFlight();document.querySelector("#close-study").focus({preventScroll:true})}).catch(cleanFlight);
}
function closeStudy(fromBack=false){
 if(!study.open)return;
 cleanFlight();
 study.close();
 if(!fromBack&&location.hash.startsWith("#case-")){
   history.replaceState(null,"",location.pathname+location.search+"#work");
 }
 returnFocus();
}
openBtn.addEventListener("click",()=>openStudy());
document.querySelector("#close-study").addEventListener("click",()=>closeStudy());
nextStudy.addEventListener("click",()=>{
 const n=(selected+1)%WORK.length;
 choose(n);renderStudy();
 history.replaceState({vtCase:WORK[n].slug},"","#case-"+WORK[n].slug);
});
study.addEventListener("cancel",e=>{e.preventDefault();closeStudy()});
study.addEventListener("click",e=>{if(e.target===study)closeStudy()});
study.addEventListener("close",cleanFlight);
window.addEventListener("popstate",()=>{
 const slug=location.hash.replace(/^#case-/,"");
 const index=WORK.findIndex(x=>x.slug===slug);
 if(index<0){if(study.open)closeStudy(true);return}
 if(index!==selected)choose(index);
 if(!study.open)openStudy(false);
});
document.addEventListener("keydown",e=>{
 if(["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)||e.altKey||e.metaKey||e.ctrlKey)return;
 if(study.open){if(e.key==="ArrowRight"){e.preventDefault();nextStudy.click()}if(e.key==="ArrowLeft"){e.preventDefault();const n=(selected-1+WORK.length)%WORK.length;choose(n);history.replaceState({vtCase:WORK[n].slug},"","#case-"+WORK[n].slug)}return}
 const i=Number(e.key)-1;
 if(i>=0&&i<WORK.length&&e.key.length===1){choose(i);return}
 if(document.activeElement===stage||document.activeElement?.closest("#index-controls")){
   if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();choose((selected+(e.key==="ArrowRight"?1:-1)+WORK.length)%WORK.length)}
   if(e.key==="Enter"&&document.activeElement===stage){e.preventDefault();openStudy()}
 }
});
stage.tabIndex=0;
stage.setAttribute("aria-label","Interactive original project canvas. Use number keys one to five, arrow keys, or swipe to change the work. Press Enter for the selected case.");
let startTouch=null;
artStage.addEventListener("touchstart",e=>{
 if(e.touches.length!==1)return;
 startTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
artStage.addEventListener("touchend",e=>{
 if(!startTouch||!e.changedTouches[0])return;
 const dx=e.changedTouches[0].clientX-startTouch.x,dy=e.changedTouches[0].clientY-startTouch.y;
 startTouch=null;
 if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.6){choose((selected+(dx<0?1:-1)+WORK.length)%WORK.length)}
},{passive:true});
if(fine.matches){
 let pointerFrame=0,px=0,py=0;
 artStage.addEventListener("pointermove",e=>{
   if(reduced.matches)return;
   const r=artStage.getBoundingClientRect();
   px=(e.clientX-r.left)/Math.max(1,r.width)-.5;
   py=(e.clientY-r.top)/Math.max(1,r.height)-.5;
   if(pointerFrame)return;
   pointerFrame=requestAnimationFrame(()=>{
     pointerFrame=0;
     const img=activeImage();
     img?.style.setProperty("--px",(px*11).toFixed(2)+"px");
     img?.style.setProperty("--py",(py*9).toFixed(2)+"px");
   });
 },{passive:true});
 artStage.addEventListener("pointerleave",()=>{
   activeImage()?.style.removeProperty("--px");
   activeImage()?.style.removeProperty("--py");
 },{passive:true});
}
let raf=0,frames=0;
function paint(){
 raf=0;frames++;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 progress.style.transform="scaleX("+inRange((scrollY||0)/max,0,1).toFixed(4)+")";
 if(!reduced.matches&&innerWidth>600){
   const r=motion.getBoundingClientRect();
   if(r.top<innerHeight&&r.bottom>0){
     const t=inRange((innerHeight-r.top)/(innerHeight+r.height*.7),0,1);
     motionFrame.style.setProperty("--motion-scale",(.88+.12*t).toFixed(4));
     motionFrame.style.setProperty("--motion-cut",((1-t)*5).toFixed(3)+"%");
   }
 }else{
   motionFrame.style.setProperty("--motion-scale","1");
   motionFrame.style.setProperty("--motion-cut","0%");
 }
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
addEventListener("scroll",schedule,{passive:true});
addEventListener("resize",schedule,{passive:true});
reduced.addEventListener?.("change",schedule);
if(!reduced.matches&&Element.prototype.animate){
 const headline=document.querySelector(".stage-intro h1");
 headline?.animate([{opacity:0,transform:"translate3d(0,34px,0)",clipPath:"inset(0 0 100% 0)"},{opacity:1,transform:"translate3d(0,0,0)",clipPath:"inset(0 0 0% 0)"}],{duration:1250,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
 document.querySelector(".stage-art")?.animate([{opacity:0,transform:"translate3d(0,24px,0) scale(.973)"},{opacity:1,transform:"translate3d(0,0,0) scale(1)"}],{duration:1250,delay:150,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
 const observer=new IntersectionObserver(entries=>{
   for(const item of entries){
     if(!item.isIntersecting)continue;
     observer.unobserve(item.target);
     item.target.animate([{opacity:.34,transform:"translateY(34px)"},{opacity:1,transform:"none"}],{duration:980,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
   }
 },{threshold:.13});
 for(const el of document.querySelectorAll(".manifesto-body>p,.about-copy h2,.contact h2"))observer.observe(el);
}
applyScene(0);schedule();
const direct=WORK.findIndex(item=>location.hash==="#case-"+item.slug);
if(direct>=0){
 applyScene(direct);
 requestAnimationFrame(()=>openStudy(false));
}
window.__shiftQA={get state(){return{...state(),frames,dialog:study.open,artboard:stage.dataset.tone,hash:location.hash}},get assets(){return WORK.map(x=>({slug:x.slug,files:x.gallery.map(f=>BASE+f),archive:x.archive}))}};
})();