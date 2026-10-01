/* VT.OS award pass — focused portfolio interactions; original media is never modified. */
(()=>{
"use strict";

const BASE="/portfolio/assets/";
const PROJECTS=[
  {name:"Resultbull.ai",group:"identity",eyebrow:"BRAND IDENTITY · WEBSITE UI",description:"Logo design and website UI for Resultbull.ai.",role:"Identity / UI Design",focus:"Recognition / Digital Clarity",archive:"/portfolio/#resultbull",tone:"tone-sand",images:["resultbull.svg"]},
  {name:"GTM Leads",group:"identity",eyebrow:"B2B BRAND IDENTITY",description:"A visual identity for a B2B buyer–seller platform.",role:"Brand Identity",focus:"Trust / Fast Recognition",archive:"/portfolio/#gtm",tone:"tone-sage",images:["gtm.svg"]},
  {name:"Discover ASR",group:"campaign",eyebrow:"TRAVEL & REWARDS CAMPAIGN",description:"Travel and rewards digital campaign artwork for Discover ASR.",role:"Campaign Design",focus:"Travel / Rewards / Digital",archive:"/portfolio/#ascott",tone:"tone-rose",images:["001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp","003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp","005-ascott-discover-asr-september-1.webp","006-ascott-discover-asr-september-2.webp"]},
  {name:"Pride Hotels",group:"campaign",eyebrow:"HOSPITALITY CAMPAIGN DESIGN",description:"Vacation, hospitality and food-promotion campaign creatives.",role:"Campaign / Art Direction",focus:"Hospitality / Multi-format",archive:"/portfolio/#pride",tone:"tone-lime",images:["008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp","009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp","010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp","011-pride-vacation-vibes-with-pride-campaign-creatives-04.webp","012-pride-vacation-vibes-with-pride-campaign-creatives-05.webp","013-pride-malabar-food-festival-round-1-vt-2.webp"]},
  {name:"Radisson Chandigarh",group:"campaign",eyebrow:"HOSPITALITY CAMPAIGN DESIGN",description:"Hospitality and weekend buffet campaign artwork.",role:"Campaign Design",focus:"Hospitality / Promotion",archive:"/portfolio/#rcz",tone:"tone-blue",images:["022-rcz-weekend-buffet-carnival-1.webp","023-rcz-weekend-buffet-carnival-2.webp","024-rcz-weekend-buffet-carnival-3.webp","025-rcz-weekend-buffet-carnival-new-3.webp"]},
  {name:"Vishal Tyagi",group:"identity",eyebrow:"PERSONAL VT VISUAL IDENTITY",description:"A personal VT monogram and visual identity.",role:"Personal Identity",focus:"Designer Brand / Monogram",archive:"/portfolio/#vt",tone:"tone-violet",images:["vishal-tyagi-logo.svg","vishal-tyagi-mark.svg","vishal-tyagi-favicon.svg"]}
];

const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
const presentation=qs("#presentation");
const canvas=qs("#canvas-visual");
const canvasImage=qs("#canvas-image");
const thumbRail=qs("#thumbnail-rail");
const projectOptions=qsa("[data-project]");
const pageProgress=qs("#page-progress");
const portrait=qs(".hero-portrait-plate img");
let currentProject=0,currentImage=0,presentImage=0,previousFocus=null,projectChanges=0,viewOpens=0,frames=0,raf=0;

const selectedProject=()=>PROJECTS[currentProject];

function setCanvasImage(){
  const p=selectedProject();
  canvasImage.src=BASE+p.images[currentImage];
  canvasImage.alt="Original "+p.name+" artwork "+(currentImage+1)+" of "+p.images.length;
  canvasImage.classList.toggle("campaign-art",p.group==="campaign");
  canvas.className="canvas-visual "+p.tone;
  qs("#canvas-crumb").textContent=p.name.toUpperCase();
  qs("#project-count").textContent=String(currentProject+1).padStart(2,"0")+" / "+String(PROJECTS.length).padStart(2,"0");
  qs("#canvas-category").textContent=p.eyebrow;
  qs("#canvas-title").textContent=p.name;
  qs("#canvas-description").textContent=p.description;
  qs("#open-project-archive").href=p.archive;
  thumbRail.replaceChildren();
  p.images.forEach((file,i)=>{
    const b=document.createElement("button");
    b.type="button"; b.className="thumb";
    b.setAttribute("aria-label","Show original "+p.name+" artwork "+(i+1));
    if(i===currentImage)b.setAttribute("aria-current","true");
    const im=document.createElement("img");
    im.src=BASE+file; im.alt=""; im.loading="lazy";
    b.append(im);
    b.addEventListener("click",()=>setImage(i));
    thumbRail.append(b);
  });
}
function setImage(index){
  const p=selectedProject();
  if(index<0||index>=p.images.length)return;
  currentImage=index;
  setCanvasImage();
  if(presentation.open){presentImage=index;updatePresentation();}
}
function selectProject(index){
  if(index<0||index>=PROJECTS.length)return;
  currentProject=index; currentImage=0; projectChanges++;
  projectOptions.forEach(b=>b.dataset.project===String(index)?b.setAttribute("aria-current","true"):b.removeAttribute("aria-current"));
  setCanvasImage();
  if(presentation.open){presentImage=0;updatePresentation();}
}
function stepProject(delta){
  selectProject((currentProject+delta+PROJECTS.length)%PROJECTS.length);
}
projectOptions.forEach(b=>b.addEventListener("click",()=>selectProject(+b.dataset.project)));
qs("#project-prev").addEventListener("click",()=>stepProject(-1));
qs("#project-next").addEventListener("click",()=>stepProject(1));

function updatePresentation(){
  const p=selectedProject();
  presentImage=Math.max(0,Math.min(presentImage,p.images.length-1));
  presentation.dataset.tone=p.tone;
  qs("#present-image").src=BASE+p.images[presentImage];
  qs("#present-image").alt="Original "+p.name+" artwork "+(presentImage+1)+" of "+p.images.length;
  qs("#presentation-title").textContent=p.name;
  qs("#present-description").textContent=p.description;
  qs("#present-meta").textContent=p.eyebrow;
  qs("#present-role").textContent=p.role;
  qs("#present-focus").textContent=p.focus;
  qs("#present-art-count").textContent="ARTWORK "+String(presentImage+1).padStart(2,"0")+" / "+String(p.images.length).padStart(2,"0");
  qs("#present-project-no").textContent="PROJECT / "+String(currentProject+1).padStart(2,"0")+" OF "+String(PROJECTS.length).padStart(2,"0");
  const prev=PROJECTS[(currentProject-1+PROJECTS.length)%PROJECTS.length];
  const next=PROJECTS[(currentProject+1)%PROJECTS.length];
  qs("#present-prev").textContent="← "+prev.name.toUpperCase();
  qs("#present-next").textContent=next.name.toUpperCase()+" →";
  qs("#present-archive").href=p.archive;
  const dots=qs("#present-dots");
  dots.replaceChildren();
  p.images.forEach((file,i)=>{
    const b=document.createElement("button");
    b.type="button";
    b.setAttribute("aria-label","Show original "+p.name+" artwork "+(i+1));
    if(i===presentImage)b.setAttribute("aria-current","true");
    b.addEventListener("click",()=>{presentImage=i;updatePresentation();});
    dots.append(b);
  });
}
function present(){
  presentImage=currentImage;
  updatePresentation();
  previousFocus=document.activeElement;
  if(!presentation.open){presentation.showModal();viewOpens++;}
}
qs("#present-project").addEventListener("click",present);
qs("#presentation-close").addEventListener("click",async()=>{
  if(document.fullscreenElement===presentation){try{await document.exitFullscreen();}catch(e){}}
  presentation.close();
});
const fullscreenButton=qs("#presentation-fullscreen");
fullscreenButton.addEventListener("click",async()=>{
  try{
    if(document.fullscreenElement===presentation)await document.exitFullscreen();
    else await presentation.requestFullscreen();
  }catch(e){}
});
document.addEventListener("fullscreenchange",()=>{
  fullscreenButton.textContent=document.fullscreenElement===presentation?"EXIT FULLSCREEN ✕":"FULLSCREEN ⛶";
});
qs("#present-next").addEventListener("click",()=>{stepProject(1);presentImage=0;updatePresentation();});
qs("#present-prev").addEventListener("click",()=>{stepProject(-1);presentImage=0;updatePresentation();});
qs("#presentation").addEventListener("close",()=>previousFocus?.focus?.());
qs("#present-contact").addEventListener("click",()=>presentation.close());
document.addEventListener("keydown",e=>{
  if(!presentation.open||e.altKey||e.ctrlKey||e.metaKey)return;
  if(e.key==="ArrowRight"){e.preventDefault();qs("#present-next").click();}
  if(e.key==="ArrowLeft"){e.preventDefault();qs("#present-prev").click();}
});
presentation.addEventListener("click",e=>{if(e.target===presentation)presentation.close();});

const mainMotion=qs("#main-motion-video");
let mainMotionVertical=false;
qs("#launch-motion").addEventListener("click",()=>{
  mainMotion.pause();
  mainMotionVertical=!mainMotionVertical;
  const src=mainMotion.querySelector("source");
  src.src=BASE+(mainMotionVertical?"motion-vertical.mp4":"motion-selected.mp4");
  mainMotion.poster=BASE+(mainMotionVertical?"motion-vertical.jpg":"motion-selected.png");
  mainMotion.setAttribute("aria-label",mainMotionVertical?"Original vertical motion work":"Original selected motion work");
  mainMotion.load();
  qs("#launch-motion").textContent=mainMotionVertical?"VIEW SELECTED REEL ↗":"VIEW VERTICAL REEL ↗";
});

function paint(){
  raf=0; frames++;
  const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
  const p=Math.max(0,Math.min(1,(scrollY||0)/max));
  pageProgress.style.transform="scaleX("+p.toFixed(4)+")";
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint);}
addEventListener("scroll",schedule,{passive:true});
addEventListener("resize",schedule,{passive:true});

function intro(){
  if(reduced.matches||!Element.prototype.animate)return;
  qsa(".hero-line").forEach((el,i)=>el.animate([
    {opacity:0,transform:"translate3d(0,72px,0)"},
    {opacity:1,transform:"translate3d(0,0,0)"}
  ],{duration:1050,delay:90+i*150,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
  qsa(".hero-copy>p,.hero-ctas,.hero-notes").forEach((el,i)=>el.animate([
    {opacity:0,transform:"translate3d(0,20px,0)"},
    {opacity:1,transform:"translate3d(0,0,0)"}
  ],{duration:720,delay:300+i*110,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
}
if(fine.matches&&portrait){
  let pRAF=0,mouseX=0,mouseY=0;
  const hero=qs(".boot-hero");
  hero.addEventListener("pointermove",e=>{
    if(reduced.matches||innerWidth<1200)return;
    mouseX=e.clientX;mouseY=e.clientY;
    if(pRAF)return;
    pRAF=requestAnimationFrame(()=>{
      pRAF=0;
      const r=hero.getBoundingClientRect();
      const nx=Math.max(-1,Math.min(1,2*((mouseX-r.left)/r.width-.5)));
      const ny=Math.max(-1,Math.min(1,2*((mouseY-r.top)/r.height-.5)));
      portrait.style.setProperty("--portrait-x",(nx*-6).toFixed(1)+"px");
      portrait.style.setProperty("--portrait-y",(ny*-5).toFixed(1)+"px");
    });
  },{passive:true});
  hero.addEventListener("pointerleave",()=>{
    portrait.style.removeProperty("--portrait-x");
    portrait.style.removeProperty("--portrait-y");
  },{passive:true});
}
function reveal(){
  const els=qsa(".reveal");
  if(reduced.matches||!("IntersectionObserver" in window)){els.forEach(x=>x.classList.add("in-view"));return;}
  document.documentElement.classList.add("js-ready");
  const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add("in-view");obs.unobserve(entry.target);}
  }),{threshold:.08,rootMargin:"0px 0px -3% 0px"});
  els.forEach(el=>el.getBoundingClientRect().top<innerHeight*.95?el.classList.add("in-view"):obs.observe(el));
}

selectProject(0);
reveal();
intro();
schedule();
window.__vtOsAwardQA={
  get state(){return{project:currentProject,image:currentImage,viewOpens,presenting:presentation.open,fullscreen:document.fullscreenElement===presentation,frames,reduced:reduced.matches};},
  get assets(){return PROJECTS.map(p=>({name:p.name,archive:p.archive,images:p.images.slice()}));}
};
})();