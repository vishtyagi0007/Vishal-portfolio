/* VT.OS 2.0 — real portfolio interactions. Progressive enhancement, native document scrolling, no external dependencies. */
(()=>{
"use strict";

const BASE="/portfolio/assets/";
const JOB="https://wa.me/917409219402?text=Hi%20Vishal%2C%20I%20have%20a%20design%20job%20opportunity%20to%20discuss.";
const FREELANCE="https://wa.me/917409219402?text=Hi%20Vishal%2C%20I%27d%20like%20to%20discuss%20a%20freelance%20design%20project.";
const PROJECTS=[
  {name:"Resultbull.ai",group:"identity",eyebrow:"BRAND IDENTITY · WEBSITE UI",description:"Logo design and website UI for Resultbull.ai.",archive:"/portfolio/#resultbull",tone:"tone-sand",images:["resultbull.svg"]},
  {name:"GTM Leads",group:"identity",eyebrow:"B2B BRAND IDENTITY",description:"A visual identity for a B2B buyer–seller platform.",archive:"/portfolio/#gtm",tone:"tone-sage",images:["gtm.svg"]},
  {name:"Discover ASR",group:"campaign",eyebrow:"TRAVEL & REWARDS CAMPAIGN",description:"Travel and rewards digital campaign artwork for Discover ASR.",archive:"/portfolio/#ascott",tone:"tone-rose",images:["001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp","003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp"]},
  {name:"Pride Hotels",group:"campaign",eyebrow:"HOSPITALITY CAMPAIGN DESIGN",description:"Vacation, hospitality and food-promotion campaign creatives.",archive:"/portfolio/#pride",tone:"tone-lime",images:["008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp","009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp","010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp"]},
  {name:"Radisson Chandigarh",group:"campaign",eyebrow:"HOSPITALITY CAMPAIGN DESIGN",description:"Hospitality and weekend buffet campaign artwork.",archive:"/portfolio/#rcz",tone:"tone-blue",images:["022-rcz-weekend-buffet-carnival-1.webp","023-rcz-weekend-buffet-carnival-2.webp","024-rcz-weekend-buffet-carnival-3.webp"]},
  {name:"Vishal Tyagi",group:"identity",eyebrow:"PERSONAL VT VISUAL IDENTITY",description:"A personal VT monogram and visual identity.",archive:"/portfolio/#vt",tone:"tone-violet",images:["vishal-tyagi-logo.svg"]}
];
const qs=s=>document.querySelector(s);
const qsa=s=>[...document.querySelectorAll(s)];
const root=document.documentElement;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const desktop=matchMedia("(min-width:1200px) and (min-height:730px)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
const stage=qs("#os-stage");
const windows=qsa("[data-window]");
const appButtons=qsa("[data-app]");
const projectOptions=qsa("[data-project]");
const filterButtons=qsa("[data-filter]");
const canvas=qs("#canvas-visual");
const canvasImage=qs("#canvas-image");
const thumbRail=qs("#thumbnail-rail");
const projectSearch=qs("#project-search");
const noResults=qs("#no-results");
const pageProgress=qs("#page-progress");
const storySection=qs(".scroll-stories");
const storyPin=qs("#story-pin");
const storyTrack=qs("#story-track");
const storyCards=qsa(".story-card");
const storyMeter=qs("#story-meter");
const storyIndex=qs("#story-index");
const presentation=qs("#presentation");
const commands=qs("#commands");
const commandInput=qs("#command-input");
const commandList=qs("#commands-list");
const portrait=qs(".hero-portrait-plate img");
const video=qs("#window-video");

let currentProject=0,currentImage=0,currentFilter="all",query="";
let z=10,focused="work",isWide=false;
let pinned=false,storyTop=0,storyDistance=1,storyOffset=0,storyActive=-1;
let raf=0,frames=0,dragMoves=0,projectChanges=0,viewOpens=0;
let previousFocus=null,commandSelection=0;
const openState={work:true,about:true,motion:false,connect:false};

function selectedProject(){return PROJECTS[currentProject]}
function visibleProjectIndexes(){
  return PROJECTS.map((p,i)=>({p,i})).filter(({p})=>
    (currentFilter==="all"||p.group===currentFilter)&&
    (p.name+" "+p.eyebrow+" "+p.description).toLowerCase().includes(query)
  ).map(({i})=>i);
}
function setCanvasImage(){
  const p=selectedProject();
  const src=BASE+p.images[currentImage];
  canvasImage.src=src;
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
    const b=document.createElement("button");b.type="button";b.className="thumb";
    b.setAttribute("aria-label","Show original "+p.name+" artwork "+(i+1));
    if(i===currentImage)b.setAttribute("aria-current","true");
    const im=document.createElement("img");
    im.src=BASE+file;im.alt="";im.loading="lazy";
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
  if(presentation.open)updatePresentation();
}
function selectProject(index,{keepSearch=false}={}){
  if(index<0||index>=PROJECTS.length)return;
  if(!keepSearch){
    currentFilter="all";query="";
    projectSearch.value="";
    filterButtons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.filter==="all")));
    updateProjectList();
  }
  currentProject=index;currentImage=0;projectChanges++;
  projectOptions.forEach(b=>b.dataset.project===String(index)?b.setAttribute("aria-current","true"):b.removeAttribute("aria-current"));
  // Browser-native document and accessible tab UI stay in sync; no client-side re-render of artwork.
  setCanvasImage();
  if(presentation.open)updatePresentation();
}
function updateProjectList(){
 const visible=visibleProjectIndexes();
 projectOptions.forEach((b,i)=>b.hidden=!visible.includes(i));
 noResults.hidden=visible.length!==0;
 if(visible.length&&!visible.includes(currentProject))selectProject(visible[0],{keepSearch:true});
}
projectOptions.forEach(button=>button.addEventListener("click",()=>selectProject(+button.dataset.project,{keepSearch:true})));
filterButtons.forEach(button=>button.addEventListener("click",()=>{
 currentFilter=button.dataset.filter;
 filterButtons.forEach(b=>b.setAttribute("aria-pressed",String(b===button)));
 updateProjectList();
}));
projectSearch.addEventListener("input",()=>{query=projectSearch.value.trim().toLowerCase();updateProjectList()});
function stepProject(delta){
 const filtered=visibleProjectIndexes();
 if(!filtered.length)return;
 let at=filtered.indexOf(currentProject);
 if(at<0)at=0;
 selectProject(filtered[(at+delta+filtered.length)%filtered.length],{keepSearch:true});
}
qs("#project-prev").addEventListener("click",()=>stepProject(-1));
qs("#project-next").addEventListener("click",()=>stepProject(1));

/* Real accessible workspace window manager: desktop drag/maximize, mobile natural stacked apps. */
function focusWindow(id){
 const el=windows.find(w=>w.dataset.window===id);
 if(!el)return;
 focused=id;
 windows.forEach(w=>w.classList.remove("is-front"));
 el.classList.add("is-front");
 el.style.zIndex=String(++z);
}
function applyWindows(){
 const should=desktop.matches;
 if(should!==isWide){
  isWide=should;
  root.classList.toggle("js-window",isWide);
  if(!isWide){
   windows.forEach(w=>{w.style.removeProperty("left");w.style.removeProperty("top");w.classList.remove("is-maximized")});
  }
 }
 windows.forEach(w=>{
   const id=w.dataset.window;
   const visible=!isWide || openState[id];
   w.hidden=!visible;
   w.inert=!visible;
   w.setAttribute("aria-hidden",String(!visible));
 });
 appButtons.forEach(b=>b.setAttribute("aria-pressed",String(!isWide||!!openState[b.dataset.app])));
}
function openApp(id){
 if(!(id in openState))return;
 openState[id]=true;
 applyWindows();
 focusWindow(id);
 const w=windows.find(w=>w.dataset.window===id);
 if(!w)return;
 if(!isWide){
   w.scrollIntoView({behavior:reduced.matches?"instant":"smooth",block:"center"});
 }else if(stage.getBoundingClientRect().bottom<innerHeight*.2 || stage.getBoundingClientRect().top<-innerHeight*.65){
   qs("#workspace").scrollIntoView({behavior:reduced.matches?"instant":"smooth",block:"start"});
 }
}
function minimize(id){
 if(!isWide)return;
 openState[id]=false;
 const w=windows.find(w=>w.dataset.window===id);
 w?.classList.remove("is-maximized");
 applyWindows();
 const remaining=windows.filter(x=>openState[x.dataset.window]);
 if(remaining.length)focusWindow(remaining[remaining.length-1].dataset.window);
}
function maximize(id){
 if(!isWide)return;
 const w=windows.find(w=>w.dataset.window===id);
 if(!w)return;
 const before=w.classList.contains("is-maximized");
 // Remember user-dragged position before maximizing. Style is preserved when toggled back.
 w.classList.toggle("is-maximized",!before);
 if(!before){windows.filter(x=>x!==w).forEach(x=>x.classList.remove("is-maximized"));}
 focusWindow(id);
}
appButtons.forEach(b=>b.addEventListener("click",()=>openApp(b.dataset.app)));
qsa("[data-minimize]").forEach(b=>b.addEventListener("click",()=>minimize(b.dataset.minimize)));
qsa("[data-maximize]").forEach(b=>b.addEventListener("click",()=>maximize(b.dataset.maximize)));
windows.forEach(w=>w.addEventListener("pointerdown",e=>{
 if(isWide&&openState[w.dataset.window]&&!e.target.closest(".window-controls"))focusWindow(w.dataset.window);
}));
qsa("[data-drag]").forEach(handle=>{
 const win=handle.closest(".window");
 let drag=null;
 handle.addEventListener("pointerdown",e=>{
   if(!isWide||e.button!==0||win.classList.contains("is-maximized")||e.target.closest("button,a"))return;
   e.preventDefault();
   focusWindow(win.dataset.window);
   const area=stage.getBoundingClientRect(),rect=win.getBoundingClientRect();
   const left=rect.left-area.left,top=rect.top-area.top;
   win.style.left=left+"px";win.style.top=top+"px";
   drag={x:e.clientX,y:e.clientY,left,top,id:e.pointerId};
   handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener("pointermove",e=>{
   if(!drag||!isWide)return;
   const bounds=stage.getBoundingClientRect();
   const maxL=Math.max(0,bounds.width-win.offsetWidth);
   const maxT=Math.max(0,bounds.height-win.offsetHeight);
   win.style.left=Math.max(0,Math.min(maxL,drag.left+e.clientX-drag.x))+"px";
   win.style.top=Math.max(0,Math.min(maxT,drag.top+e.clientY-drag.y))+"px";
   dragMoves++;
 });
 function end(e){
   if(!drag)return;
   drag=null;
   if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);
 }
 handle.addEventListener("pointerup",end);
 handle.addEventListener("pointercancel",end);
 handle.addEventListener("dblclick",e=>{if(isWide&&!e.target.closest("button,a"))maximize(win.dataset.window)});
});
function responsive(){
 applyWindows();
 measureStories();
 schedule();
}
window.addEventListener("resize",responsive,{passive:true});
desktop.addEventListener?.("change",responsive);

/* Original showreel switcher: never autoplays. */
const reels=[
 {file:"motion-selected.mp4",poster:"motion-selected.png",alt:"Original selected motion work"},
 {file:"motion-vertical.mp4",poster:"motion-vertical.jpg",alt:"Original vertical motion work"}
];
qsa("[data-reel]").forEach(b=>b.addEventListener("click",()=>{
 const index=+b.dataset.reel,item=reels[index];
 video.pause();
 video.querySelector("source").src=BASE+item.file;
 video.poster=BASE+item.poster;
 video.setAttribute("aria-label",item.alt);
 video.load();
 qsa("[data-reel]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));
}));
qsa('[data-minimize="motion"]').forEach(b=>b.addEventListener("click",()=>video.pause()));
qs("#launch-motion").addEventListener("click",()=>openApp("motion"));

/* Fullscreen original-artwork presentation. A native dialog, no spoofed fullscreen request. */
let presentImage=0;
function updatePresentation(){
 const p=selectedProject();
 presentImage=Math.min(presentImage,p.images.length-1);
 const src=BASE+p.images[presentImage];
 qs("#present-image").src=src;
 qs("#present-image").alt="Original "+p.name+" artwork "+(presentImage+1)+" of "+p.images.length;
 qs("#presentation-title").textContent=p.name;
 qs("#present-description").textContent=p.description;
 qs("#present-meta").textContent=p.eyebrow;
 qs("#present-project-no").textContent="PROJECT / "+String(currentProject+1).padStart(2,"0")+" OF 06";
 qs("#present-archive").href=p.archive;
 const dots=qs("#present-dots");dots.replaceChildren();
 p.images.forEach((file,i)=>{
   const b=document.createElement("button");b.type="button";
   b.setAttribute("aria-label","Show original "+p.name+" artwork "+(i+1));
   if(i===presentImage)b.setAttribute("aria-current","true");
   b.addEventListener("click",()=>{presentImage=i;updatePresentation()});
   dots.append(b);
 });
}
function present(){
 if(commands.open)commands.close();
 presentImage=currentImage;
 updatePresentation();
 previousFocus=document.activeElement;
 if(!presentation.open){presentation.showModal();viewOpens++;}
}
qs("#present-project").addEventListener("click",present);
qs("#dock-present").addEventListener("click",present);
qs("#presentation-close").addEventListener("click",()=>presentation.close());
qs("#present-next").addEventListener("click",()=>{selectProject((currentProject+1)%PROJECTS.length);presentImage=0;updatePresentation()});
qs("#present-prev").addEventListener("click",()=>{selectProject((currentProject-1+PROJECTS.length)%PROJECTS.length);presentImage=0;updatePresentation()});
qs("#presentation").addEventListener("close",()=>previousFocus?.focus?.());
qs("#present-contact").addEventListener("click",()=>presentation.close());
qs("#presentation-copy").addEventListener("click",async()=>{
 const b=qs("#presentation-copy");
 try{
   await navigator.clipboard.writeText(new URL(selectedProject().archive,location.origin).href);
   b.textContent="COPIED ✓";
 }catch(e){b.textContent="COPY UNAVAILABLE";}
 b.setAttribute("aria-label",b.textContent);
 b.addEventListener("blur",()=>{b.textContent="COPY LINK ↗";b.setAttribute("aria-label","Copy link to original project")},{once:true});
});

/* Keyboard-controlled action search: projects, apps, sections, resume and recruitment. */
const ACTIONS=[
 ...PROJECTS.map((p,i)=>({name:p.name,category:p.eyebrow,search:p.group+" "+p.description,run:()=>{selectProject(i);openApp("work")}})),
 {name:"Projects Explorer",category:"OPEN APP",search:"work design files",run:()=>openApp("work")},
 {name:"About Vishal",category:"OPEN APP",search:"profile resume about",run:()=>openApp("about")},
 {name:"Motion Player",category:"OPEN APP",search:"reels video showreel",run:()=>openApp("motion")},
 {name:"Get In Touch",category:"OPEN APP",search:"contact hire freelance job",run:()=>openApp("connect")},
 {name:"Present Selected Project",category:"ACTION",search:"fullscreen presentation mode",run:present},
 {name:"Scroll to Original Work",category:"GO TO",search:"cases projects artwork gallery",run:()=>qs("#projects").scrollIntoView({behavior:reduced.matches?"instant":"smooth"})},
 {name:"Scroll to Contact",category:"GO TO",search:"recruiter freelance hire",run:()=>qs("#contact").scrollIntoView({behavior:reduced.matches?"instant":"smooth"})},
 {name:"View Resume PDF",category:"DOCUMENT",search:"cv resume download",run:()=>window.open(BASE+"Vishal-Tyagi-Resume.pdf","_blank","noopener")}
];
let shownActions=[];
function renderCommands(){
 const term=commandInput.value.trim().toLowerCase();
 shownActions=ACTIONS.filter(a=>(a.name+" "+a.category+" "+a.search).toLowerCase().includes(term));
 commandSelection=0;
 commandList.replaceChildren();
 if(!shownActions.length){const p=document.createElement("p");p.textContent="No results. Try: work, motion, contact or resume.";commandList.append(p);return}
 shownActions.forEach((a,i)=>{
   const b=document.createElement("button");b.type="button";
   b.setAttribute("aria-selected",String(i===0));
   const title=document.createElement("span");title.textContent=a.name;
   const category=document.createElement("small");category.textContent=a.category+" ↗";
   b.append(title,category);
   b.addEventListener("click",()=>execute(a));
   commandList.append(b);
 });
}
function execute(action){
 commands.close();
 action.run();
}
function openCommands(){
 if(presentation.open)presentation.close();
 if(commands.open){commands.close();return}
 renderCommands();
 commands.showModal();
 commandInput.value="";
 renderCommands();
 commandInput.focus();
}
qsa(["#open-commands","#rail-commands","#dock-search"].join(",")).forEach(b=>b.addEventListener("click",openCommands));
qs("#commands-close").addEventListener("click",()=>commands.close());
commandInput.addEventListener("input",renderCommands);
commandInput.addEventListener("keydown",e=>{
 if(e.key==="ArrowDown"||e.key==="ArrowUp"){
   e.preventDefault();
   if(!shownActions.length)return;
   commandSelection=(commandSelection+(e.key==="ArrowDown"?1:-1)+shownActions.length)%shownActions.length;
   [...commandList.querySelectorAll("button")].forEach((b,i)=>{
     b.setAttribute("aria-selected",String(i===commandSelection));
     if(i===commandSelection)b.scrollIntoView({block:"nearest"});
   });
 }else if(e.key==="Enter"){
   e.preventDefault();shownActions[commandSelection]&&execute(shownActions[commandSelection]);
 }
});
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openCommands();return}
 // Search inputs consume the first Escape to clear their text; explicitly close this dialog.
 if(e.key==="Escape"&&commands.open){e.preventDefault();commands.close();return}
 if(presentation.open&&!e.altKey&&!e.ctrlKey&&!e.metaKey){
   if(e.key==="ArrowRight"){e.preventDefault();qs("#present-next").click()}
   if(e.key==="ArrowLeft"){e.preventDefault();qs("#present-prev").click()}
 }
});
// Native dialogs already handle Esc, pointer focus trapping and backdrop inertness.
commands.addEventListener("click",e=>{if(e.target===commands)commands.close()});
presentation.addEventListener("click",e=>{if(e.target===presentation)presentation.close()});

/* Functional light/dark preview toggle, intentionally no user data stored. */
qs("#theme-toggle").addEventListener("click",()=>{
 const light=root.dataset.theme!=="light";
 root.dataset.theme=light?"light":"dark";
 const b=qs("#theme-toggle");
 b.setAttribute("aria-pressed",String(light));
 b.setAttribute("aria-label",light?"Switch to dark mode":"Switch to light mode");
});

/* Native scroll-to-horizontal project stories, only at wide screen sizes without reduced motion. */
const storyDesktop=matchMedia("(min-width:1200px) and (min-height:730px)");
let measureRAF=0;
function measureStories(){
 const eligible=storyDesktop.matches&&!reduced.matches;
 if(!eligible){
   pinned=false;
   storySection.classList.remove("is-pinned");
   storySection.style.removeProperty("--stories-height");
   storyTrack.style.removeProperty("--stories-x");
   storyMeter.style.transform="scaleX(0)";
   storyCards.forEach(c=>{c.inert=false;c.removeAttribute("aria-hidden")});
   storyActive=-1;
   storyIndex.textContent="01 / 04";
   return;
 }
 pinned=true;
 storySection.classList.add("is-pinned");
 // First measure fixed card widths after pin layout, then set vertical distance to match.
 const width=storyPin.clientWidth;
 storyOffset=Math.max(0,storyTrack.scrollWidth-width);
 const targetHeight=innerHeight+storyOffset*1.08+innerHeight*.25;
 storySection.style.setProperty("--stories-height",targetHeight.toFixed(1)+"px");
 storyTop=storySection.getBoundingClientRect().top+scrollY;
 storyDistance=Math.max(1,storySection.offsetHeight-innerHeight);
 schedule();
}
function renderStories(y){
 if(!pinned)return;
 const p=Math.max(0,Math.min(1,(y-storyTop)/storyDistance));
 storyTrack.style.setProperty("--stories-x",(-storyOffset*p).toFixed(1)+"px");
 storyMeter.style.transform="scaleX("+p.toFixed(4)+")";
 const index=Math.min(storyCards.length-1,Math.floor(p*storyCards.length));
 if(index!==storyActive){
   storyActive=index;
   storyIndex.textContent=String(index+1).padStart(2,"0")+" / 04";
   // Avoid inerting horizontally adjacent cases: they are real document links and
   // must remain usable for keyboard and assistive technology.
 }
}
function paint(){
 raf=0;frames++;
 const y=scrollY||0;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 pageProgress.style.transform="scaleX("+Math.max(0,Math.min(1,y/max)).toFixed(4)+")";
 renderStories(y);
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",()=>{if(!measureRAF)measureRAF=requestAnimationFrame(()=>{measureRAF=0;measureStories();schedule()})},{passive:true});
window.addEventListener("load",()=>{measureStories();schedule()},{once:true});
document.fonts?.ready?.then(()=>{measureStories();schedule()});
storyDesktop.addEventListener?.("change",()=>{measureStories();schedule()});

/* Hero entrance and small parallax only. Keeps original image pixels untouched. */
function intro(){
 if(reduced.matches||!Element.prototype.animate)return;
 qsa(".hero-line").forEach((el,i)=>el.animate([
   {opacity:0,transform:"translate3d(0,95px,0) skewY(6deg)"},
   {opacity:1,transform:"translate3d(0,0,0) skewY(0deg)"}
 ],{duration:1250,delay:110+i*175,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
 qsa(".hero-copy>p,.hero-ctas,.hero-notes").forEach((el,i)=>el.animate([
   {opacity:0,transform:"translate3d(0,25px,0)"},
   {opacity:1,transform:"translate3d(0,0,0)"}
 ],{duration:820,delay:360+i*130,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
}
if(fine.matches){
 let pRAF=0,mouseX=0,mouseY=0;
 qs(".boot-hero").addEventListener("pointermove",e=>{
   if(reduced.matches||innerWidth<1200)return;
   mouseX=e.clientX;mouseY=e.clientY;
   if(pRAF)return;
   pRAF=requestAnimationFrame(()=>{
     pRAF=0;const r=qs(".boot-hero").getBoundingClientRect();
     const nx=Math.max(-1,Math.min(1,2*((mouseX-r.left)/r.width-.5)));
     const ny=Math.max(-1,Math.min(1,2*((mouseY-r.top)/r.height-.5)));
     portrait.style.setProperty("--portrait-x",(nx*-7).toFixed(1)+"px");
     portrait.style.setProperty("--portrait-y",(ny*-6).toFixed(1)+"px");
   });
 },{passive:true});
 qs(".boot-hero").addEventListener("pointerleave",()=>{
   portrait.style.removeProperty("--portrait-x");portrait.style.removeProperty("--portrait-y");
 },{passive:true});
}
function reveal(){
 const els=qsa(".reveal");
 if(reduced.matches||!("IntersectionObserver" in window)){
   root.classList.remove("js-ready");
   els.forEach(el=>el.classList.add("in-view"));return;
 }
 root.classList.add("js-ready");
 const obs=new IntersectionObserver(entries=>entries.forEach(entry=>{
   if(entry.isIntersecting){entry.target.classList.add("in-view");obs.unobserve(entry.target)}
 }),{threshold:.07,rootMargin:"0px 0px -2% 0px"});
 els.forEach(el=>{
   if(el.getBoundingClientRect().top<innerHeight*.95)el.classList.add("in-view");
   else obs.observe(el);
 });
}
reduced.addEventListener?.("change",()=>{
 if(reduced.matches){
   root.classList.remove("js-ready");
   qsa(".reveal").forEach(x=>x.classList.add("in-view"));
   portrait.style.removeProperty("--portrait-x");portrait.style.removeProperty("--portrait-y");
 }
 measureStories();schedule();
});
applyWindows();focusWindow("about");selectProject(0,{keepSearch:true});reveal();intro();measureStories();schedule();
window.__vtOs2QA={
 get state(){return{project:currentProject,image:currentImage,filter:currentFilter,query,desktop:isWide,open:Object.keys(openState).filter(x=>openState[x]),focused,dragMoves,projectChanges,viewOpens,presenting:presentation.open,commandOpen:commands.open,theme:root.dataset.theme||"dark",pinned,storyActive,storyOffset,frames,projectCount:PROJECTS.length,reduced:reduced.matches}},
 get assets(){return PROJECTS.map(p=>({name:p.name,archive:p.archive,images:p.images.slice()}))}
};
})();