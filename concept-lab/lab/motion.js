/* VT Creative Lab — genuine horizontal storytelling from native vertical scroll. No wheel interception, no 3D library. */
(()=>{"use strict";
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const canPin=matchMedia("(min-width:1024px) and (min-height:680px)");
const pointer=matchMedia("(hover:hover) and (pointer:fine)");
const root=document.documentElement;
const hero=document.querySelector(".playground");
const float=[...document.querySelectorAll(".lab-float")];
const spotlight=document.querySelector(".spotlight");
const star=document.querySelector(".lab-title .dot");
const interlude=document.querySelector(".interlude-asterisk");
const section=document.querySelector(".lab-scroll");
const track=document.querySelector(".project-track");
const sticky=document.querySelector(".rail-sticky");
const cards=[...document.querySelectorAll(".experiment")];
const progress=document.querySelector("#page-progress");
const railProgress=document.querySelector("#rail-progress");
const railCounter=document.querySelector("#rail-count");
const prev=document.querySelector("#prev-project");
const next=document.querySelector("#next-project");
const reveals=[...document.querySelectorAll(".reveal")];
let enhanced=false,start=0,travel=1,offset=0,active=-1,raf=0,renderCount=0;

function enableReveals(){
 if(reduce.matches||!("IntersectionObserver" in window)){
   root.classList.remove("js-reveal");
   reveals.forEach(e=>e.classList.add("entered"));return;
 }
 root.classList.add("js-reveal");
 const io=new IntersectionObserver(entries=>{
   entries.forEach(e=>{
     if(e.isIntersecting){e.target.classList.add("entered");io.unobserve(e.target)}
   });
 },{threshold:.08,rootMargin:"0px 0px -3% 0px"});
 reveals.forEach(el=>{
   if(el.getBoundingClientRect().top<innerHeight*.94)el.classList.add("entered");
   else io.observe(el);
 });
}
function setActive(index){
 if(index===active&&enhanced)return;
 active=index;
 railCounter.textContent=String(index+1).padStart(2,"0")+" / "+String(cards.length).padStart(2,"0");
 cards.forEach((card,i)=>{
   if(enhanced){
     const current=i===index;
     card.setAttribute("aria-hidden",String(!current));
     card.inert=!current;
   }else{
     card.removeAttribute("aria-hidden");
     card.inert=false;
   }
 });
}
function measure(){
 const should=canPin.matches&&!reduce.matches;
 if(should!==enhanced){
   enhanced=should;
   section.classList.toggle("js-hscroll",enhanced);
   if(enhanced)active=-1;
   if(!enhanced){
     section.style.removeProperty("--lab-height");
     track.style.removeProperty("--track-x");
     if(railProgress)railProgress.style.transform="scaleX(0)";
     setActive(0);
   }
 }
 if(enhanced){
   // The rail is wider than the screen and horizontally progresses while native page scrolls.
   offset=Math.max(0,track.scrollWidth-sticky.clientWidth);
   const total=innerHeight+offset+innerHeight*.45;
   section.style.setProperty("--lab-height",total.toFixed(1)+"px");
   start=section.getBoundingClientRect().top+scrollY;
   travel=Math.max(1,section.offsetHeight-innerHeight);
 }
 schedule();
}
function paint(){
 raf=0;renderCount++;
 const y=scrollY||0;
 if(progress){
   const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
   progress.style.transform="scaleX("+Math.max(0,Math.min(1,y/max)).toFixed(4)+")";
 }
 if(enhanced){
   const p=Math.max(0,Math.min(1,(y-start)/travel));
   const left=-offset*p;
   track.style.setProperty("--track-x",left.toFixed(1)+"px");
   railProgress.style.transform="scaleX("+p.toFixed(4)+")";
   const index=Math.max(0,Math.min(cards.length-1,Math.round(p*(cards.length-1))));
   if(index!==active)setActive(index);
 }
 if(!reduce.matches&&interlude){
   const r=interlude.parentElement.getBoundingClientRect();
   if(r.top<innerHeight&&r.bottom>0){
     const t=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
     interlude.style.setProperty("--interlude-r",(t*74).toFixed(1)+"deg");
   }
 }
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",measure,{passive:true});
window.addEventListener("load",measure,{once:true});
if(document.fonts?.ready)document.fonts.ready.then(measure);

function jump(delta){
 if(enhanced){
   const targetIndex=Math.max(0,Math.min(cards.length-1,active+delta));
   const p=targetIndex/(cards.length-1);
   scrollTo({top:start+travel*p,behavior:reduce.matches?"auto":"smooth"});
 }else{
   const max=document.documentElement.scrollHeight-innerHeight;
   const y=scrollY||0;
   let nextIndex=0;
   for(let i=0;i<cards.length;i++){
     if(cards[i].getBoundingClientRect().top<innerHeight*.48)nextIndex=i;
   }
   const target=Math.min(cards.length-1,Math.max(0,nextIndex+delta));
   cards[target].scrollIntoView({block:"center",behavior:reduce.matches?"instant":"smooth"});
 }
}
prev?.addEventListener("click",()=>jump(-1));
next?.addEventListener("click",()=>jump(1));

if(hero&&pointer.matches){
 let px=0,py=0,pending=0;
 hero.addEventListener("pointermove",e=>{
   if(reduce.matches)return;
   px=e.clientX;py=e.clientY;
   if(pending)return;
   pending=requestAnimationFrame(()=>{
     pending=0;
     const r=hero.getBoundingClientRect();
     const nx=Math.max(-1,Math.min(1,2*((px-r.left)/r.width-.5)));
     const ny=Math.max(-1,Math.min(1,2*((py-r.top)/r.height-.5)));
     hero.style.setProperty("--spot-x",((nx+1)*40+10).toFixed(1)+"%");
     hero.style.setProperty("--spot-y",((ny+1)*35+12).toFixed(1)+"%");
     spotlight?.style.setProperty("--orbit-x",(nx*17).toFixed(1)+"px");
     spotlight?.style.setProperty("--orbit-y",(ny*12).toFixed(1)+"px");
     star?.style.setProperty("--star-r",(nx*20-12).toFixed(1)+"deg");
     float.forEach(el=>{
       const d=parseFloat(el.dataset.depth||".5");
       el.style.setProperty("--float-x",(nx*9*d).toFixed(1)+"px");
       el.style.setProperty("--float-y",(ny*11*d).toFixed(1)+"px");
     });
   });
 },{passive:true});
 hero.addEventListener("pointerleave",()=>{
   hero.style.removeProperty("--spot-x");hero.style.removeProperty("--spot-y");
   float.forEach(el=>{el.style.removeProperty("--float-x");el.style.removeProperty("--float-y")});
   spotlight?.style.removeProperty("--orbit-x");
   spotlight?.style.removeProperty("--orbit-y");
   star?.style.removeProperty("--star-r");
 },{passive:true});
}
function preferenceChanged(){
 if(reduce.matches){
   root.classList.remove("js-reveal");reveals.forEach(el=>el.classList.add("entered"));
   float.forEach(el=>{el.style.removeProperty("--float-x");el.style.removeProperty("--float-y")});
   spotlight?.style.removeProperty("--orbit-x");spotlight?.style.removeProperty("--orbit-y");
 }
 else enableReveals();
 measure();
}
if(reduce.addEventListener)reduce.addEventListener("change",preferenceChanged);
if(canPin.addEventListener)canPin.addEventListener("change",measure);
enableReveals();measure();
window.__vtLabQA={get state(){return{mode:"lab",enhanced,reduced:reduce.matches,active,offset,travel,renderCount,count:cards.length}}};
})();