/* VT.OS: intentionally playable. Pointer events only for drag handles; never hijacks document scroll. */
(()=>{"use strict";
const root=document.documentElement,desktop=matchMedia("(min-width:1000px)"),reduced=matchMedia("(prefers-reduced-motion: reduce)");
const workspace=document.querySelector("#workspace"),stage=document.querySelector(".os-stage");
const wins=[...document.querySelectorAll("[data-window]")],projects=[...document.querySelectorAll("[data-panel]")],tabs=[...document.querySelectorAll("[data-project]")];
const overlay=document.querySelector("#command"),input=document.querySelector("#command-input"),results=document.querySelector("#command-results");
const pageProgress=document.querySelector("#progress"),activity=document.querySelector(".activity"),activityMeter=document.querySelector("#activity-progress");
let front=20,currentProject=0,activeWin="about",priorFocus=null,frame=0,draws=0,dragCount=0,keys=0;
const openState={work:true,about:true,motion:false,contact:false};
const commandItems=[
 {label:"Open Work.app",hint:"projects · originals",window:"work",terms:"work design projects"},
 {label:"Open Profile.app",hint:"designer · portrait",window:"about",terms:"about profile vishal"},
 {label:"Open Motion.player",hint:"original video",window:"motion",terms:"motion reel video"},
 {label:"New Connection",hint:"linkedin · opportunities",window:"contact",terms:"connect hire contact freelance"},
 {label:"Resultbull",hint:"identity · product",window:"work",project:0,terms:"resultbull identity"},
 {label:"GTM Leads",hint:"brand system",window:"work",project:1,terms:"gtm b2b"},
 {label:"Discover ASR",hint:"hospitality",window:"work",project:2,terms:"ascott discover asr"},
 {label:"Pride Hotels",hint:"campaign",window:"work",project:3,terms:"pride hotel"},
 {label:"VT Mark",hint:"personal identity",window:"work",project:4,terms:"vt logo"}
];
function renderWindows(){
 const big=desktop.matches;
 wins.forEach(win=>{
  const id=win.dataset.window;
  const show=!big||!!openState[id];
  win.classList.toggle("is-open",show);
  if(big){win.inert=!show;win.setAttribute("aria-hidden",String(!show));}
  else{win.inert=false;win.removeAttribute("aria-hidden");}
 });
}
function focusWin(id){
 const w=wins.find(x=>x.dataset.window===id);if(!w)return;
 activeWin=id;
 wins.forEach(x=>x.classList.remove("is-front"));
 w.classList.add("is-front");
 w.style.zIndex=String(++front);
}
function openApp(id){
 if(!(id in openState))return;
 openState[id]=true;renderWindows();focusWin(id);
 if(!desktop.matches){wins.find(w=>w.dataset.window===id)?.scrollIntoView({behavior:reduced.matches?"instant":"smooth",block:"start"});}
 else if(stage.getBoundingClientRect().bottom<innerHeight*.2||stage.getBoundingClientRect().top<-innerHeight*.65)stage.scrollIntoView({behavior:reduced.matches?"instant":"smooth",block:"start"});
}
function closeApp(id){
 if(!desktop.matches)return;
 openState[id]=false;renderWindows();
 const remaining=wins.filter(w=>openState[w.dataset.window]);
 if(remaining.length)focusWin(remaining[remaining.length-1].dataset.window);
}
function selectProject(i){
 if(i<0||i>=projects.length)return;
 currentProject=i;
 tabs.forEach((tab,n)=>n===i?tab.setAttribute("aria-current","true"):tab.removeAttribute("aria-current"));
 projects.forEach((panel,n)=>{
  panel.classList.toggle("is-selected",n===i);
  panel.setAttribute("aria-hidden",String(n!==i));
  panel.inert=n!==i;
 });
}
document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>openApp(b.dataset.open)));
document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeApp(b.dataset.close)));
document.querySelectorAll("[data-focus]").forEach(b=>b.addEventListener("click",()=>focusWin(b.dataset.focus)));
tabs.forEach(b=>b.addEventListener("click",()=>selectProject(+b.dataset.project)));
wins.forEach(w=>w.addEventListener("pointerdown",()=>{if(desktop.matches&&openState[w.dataset.window])focusWin(w.dataset.window)}));

/* Native, clamped window dragging. Works without pointer-lock or body overflow toggles. */
document.querySelectorAll("[data-handle]").forEach(handle=>{
 const w=handle.closest(".app-window");
 let drag=null;
 handle.addEventListener("pointerdown",e=>{
  if(!desktop.matches||e.button!==0||e.target.closest("button,a"))return;
  e.preventDefault();focusWin(w.dataset.window);
  const ws=workspace.getBoundingClientRect(),r=w.getBoundingClientRect();
  const left=r.left-ws.left,top=r.top-ws.top;
  w.style.left=left+"px";w.style.top=top+"px";
  drag={x:e.clientX,y:e.clientY,left,top};
  handle.setPointerCapture(e.pointerId);
 });
 handle.addEventListener("pointermove",e=>{
  if(!drag||!desktop.matches)return;
  const ws=workspace.getBoundingClientRect();
  const maxLeft=Math.max(0,ws.width-w.offsetWidth),maxTop=Math.max(0,ws.height-w.offsetHeight);
  w.style.left=Math.max(0,Math.min(maxLeft,drag.left+e.clientX-drag.x))+"px";
  w.style.top=Math.max(0,Math.min(maxTop,drag.top+e.clientY-drag.y))+"px";
  dragCount++;
 });
 function stop(e){if(drag){drag=null;if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId)}}
 handle.addEventListener("pointerup",stop);handle.addEventListener("pointercancel",stop);
});

/* Command palette is a functional searchable and keyboard-accessible app launcher. */
function renderCommands(q=""){
 const needle=q.toLowerCase().trim();
 const list=commandItems.filter(item=>(item.label+" "+item.terms).toLowerCase().includes(needle));
 results.replaceChildren();
 if(!list.length){const empty=document.createElement("p");empty.textContent="NO MATCHES · TRY WORK / MOTION / ABOUT";results.append(empty);return}
 list.forEach((item,index)=>{
  const button=document.createElement("button");
  button.type="button";button.dataset.command=String(commandItems.indexOf(item));
  button.setAttribute("aria-selected",String(index===0));
  const name=document.createElement("span"),hint=document.createElement("span");
  name.textContent=item.label;hint.textContent=item.hint+" ↗";
  button.append(name,hint);
  button.addEventListener("click",()=>execute(item));
  results.append(button);
 });
}
function launchCommand(){priorFocus=document.activeElement;renderCommands();input.value="";overlay.hidden=false;input.focus();keys++;}
function dismiss(){overlay.hidden=true;priorFocus?.focus?.();}
function execute(item){
 dismiss();if(item.project!==undefined)selectProject(item.project);openApp(item.window);
}
document.querySelector("#search-open").addEventListener("click",launchCommand);
document.querySelector("#command-close").addEventListener("click",dismiss);
overlay.addEventListener("click",e=>{if(e.target===overlay)dismiss()});
input.addEventListener("input",()=>renderCommands(input.value));
input.addEventListener("keydown",e=>{
 const buttons=[...results.querySelectorAll("[data-command]")];
 if(e.key==="ArrowDown"||e.key==="ArrowUp"){
  e.preventDefault();
  let i=buttons.findIndex(b=>b.getAttribute("aria-selected")==="true");
  buttons.forEach(b=>b.setAttribute("aria-selected","false"));
  i=(i+(e.key==="ArrowDown"?1:-1)+buttons.length)%buttons.length;
  buttons[i]?.setAttribute("aria-selected","true");buttons[i]?.scrollIntoView({block:"nearest"});
 }else if(e.key==="Enter"){
  e.preventDefault();const selected=buttons.find(b=>b.getAttribute("aria-selected")==="true")||buttons[0];selected?.click();
 }
});
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();if(overlay.hidden)launchCommand();else dismiss();}
 if(e.key==="Escape"&&!overlay.hidden){e.preventDefault();dismiss()}
 if(!overlay.hidden&&e.key==="Tab"){
  // Focus trap: palette has close button, search field, and results.
  const controls=[document.querySelector("#command-close"),input,...results.querySelectorAll("button")];
  const index=controls.indexOf(document.activeElement);
  if(e.shiftKey&&index<=0){e.preventDefault();controls[controls.length-1].focus()}
  else if(!e.shiftKey&&index===controls.length-1){e.preventDefault();controls[0].focus()}
 }
});

/* Native scroll: progress bars and reveal once; no custom scroll engine. */
const logs=[...document.querySelectorAll(".log-event")];
if(!reduced.matches&&"IntersectionObserver" in window){
 const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(entry.isIntersecting){
   if(entry.target.animate)entry.target.animate([
    {transform:"translate3d(0,42px,0)",opacity:.7},
    {transform:"translate3d(0,0,0)",opacity:1}
   ],{duration:950,easing:"cubic-bezier(.16,1,.3,1)"});
   io.unobserve(entry.target);
  }
 }),{threshold:.08});
 logs.forEach(el=>io.observe(el));
}
function paint(){
 frame=0;draws++;
 const y=scrollY||0,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 pageProgress.style.transform="scaleX("+Math.max(0,Math.min(1,y/max)).toFixed(4)+")";
 const r=activity.getBoundingClientRect();
 const part=Math.max(0,Math.min(1,(innerHeight*.65-r.top)/Math.max(1,activity.offsetHeight)));
 activityMeter.style.transform="scaleX("+part.toFixed(4)+")";
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",schedule,{passive:true});
desktop.addEventListener?.("change",()=>{renderWindows();schedule()});
root.classList.add("js-os");
selectProject(0);renderWindows();focusWin("about");schedule();
window.__vtOsQA={get state(){return{mode:"os",desktop:desktop.matches,project:currentProject,active:activeWin,open:Object.keys(openState).filter(x=>openState[x]),renders:draws,drags:dragCount,commands:keys,commandOpen:!overlay.hidden}}};
})();