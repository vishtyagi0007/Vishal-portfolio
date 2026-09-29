/* THE EXHIBITION: spatial walk, built on native scroll. No body locks or wheel interception. */
(()=>{"use strict";
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const desktop=matchMedia("(min-width:1000px) and (min-height:700px)");
const roomBox=document.querySelector(".rooms");
const shell=document.querySelector(".gallery-sticky");
const scenes=[...document.querySelectorAll(".room-scene")];
const buttons=[...document.querySelectorAll("[data-room]")];
const roomMeter=document.querySelector("#museum-progress");
const text=document.querySelector("#room-readout");
const siteMeter=document.querySelector("#site-progress");
const portrait=document.querySelector(".portrait-frame");
const entrance=document.querySelector(".entrance");
let enhanced=false,active=-1,top=0,distance=1,frame=0,draws=0;
function updateActive(index){
 if(index===active)return;
 active=index;
 scenes.forEach((scene,i)=>{
  if(enhanced){const selected=i===index;scene.classList.toggle("is-active",selected);scene.inert=!selected;scene.setAttribute("aria-hidden",String(!selected));}
  else{scene.classList.add("is-active");scene.inert=false;scene.removeAttribute("aria-hidden")}
 });
 buttons.forEach((button,i)=>i===index?button.setAttribute("aria-current","true"):button.removeAttribute("aria-current"));
 text.textContent="ROOM "+String(index+1).padStart(2,"0")+" / 03";
}
function measure(){
 const eligible=desktop.matches&&!reduce.matches;
 if(eligible!==enhanced){
  enhanced=eligible;
  roomBox.classList.toggle("js-gallery",enhanced);
  active=-1;
  if(!enhanced){
   scenes.forEach(scene=>{scene.classList.add("is-active");scene.inert=false;scene.removeAttribute("aria-hidden")});
  }
 }
 if(enhanced){
  top=roomBox.getBoundingClientRect().top+scrollY;
  distance=Math.max(1,roomBox.offsetHeight-innerHeight);
  updateActive(0);
 }
 schedule();
}
function paint(){
 frame=0;draws++;
 const y=scrollY||0;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 siteMeter.style.transform="scaleX("+Math.max(0,Math.min(1,y/max)).toFixed(4)+")";
 if(enhanced){
  const p=Math.max(0,Math.min(1,(y-top)/distance));
  const index=Math.min(2,Math.floor(Math.max(0,p*3)));
  updateActive(index);
  roomMeter.style.transform="scaleX("+p.toFixed(4)+")";
  scenes.forEach((scene,i)=>{
   if(i!==index)return;
   const depth=(p*3-index);
   scene.style.setProperty("--art-shift",(-depth*18).toFixed(1)+"px");
   scene.style.setProperty("--art-rot",(depth*1.2-0.6).toFixed(2)+"deg");
  });
 }
 if(!reduce.matches&&portrait){
  const r=entrance.getBoundingClientRect();
  if(r.bottom>0&&r.top<innerHeight){
   const p=Math.max(0,Math.min(1,-r.top/Math.max(r.height,1)));
   portrait.style.setProperty("--frame-y",(-p*22).toFixed(1)+"px");
   portrait.style.setProperty("--frame-tilt",(-2+p*4).toFixed(1)+"deg");
  }
 }
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
buttons.forEach((button,i)=>button.addEventListener("click",()=>{
 if(enhanced){
  const fraction=(i+.12)/scenes.length;
  scrollTo({top:top+distance*fraction,behavior:reduce.matches?"instant":"smooth"});
 }else{
  scenes[i].scrollIntoView({behavior:reduce.matches?"instant":"smooth",block:"start"});
 }
}));
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",measure,{passive:true});
window.addEventListener("load",measure,{once:true});
if(document.fonts?.ready)document.fonts.ready.then(measure);
if(reduce.addEventListener)reduce.addEventListener("change",()=>{
 if(reduce.matches){portrait.style.removeProperty("--frame-y");portrait.style.removeProperty("--frame-tilt");}
 measure();
});
if(desktop.addEventListener)desktop.addEventListener("change",measure);
measure();
window.__vtGalleryQA={get state(){return{mode:"gallery",enhanced,active,rooms:scenes.length,draws,distance}}};
})();