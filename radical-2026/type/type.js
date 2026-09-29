/* TYPE/CTRL — original native-scroll typography engine. Never intercept wheel or touch. */
(()=>{"use strict";
const root=document.documentElement;
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const slider=document.querySelector("#stretch");
const value=document.querySelector("#value");
const lines=[...document.querySelectorAll(".massive>span")];
const jobs=[...document.querySelectorAll(".job")];
const meter=document.querySelector("#work-progress");
const work=document.querySelector(".works");
const intro=document.querySelector(".opener");
const output=document.querySelector("#progress");
const image=document.querySelector(".me-image img");
let frame=0,scans=0;
function updateType(){
 const v=+slider.value;
 root.style.setProperty("--axis",v);
 value.textContent=v+"%";
}
slider.addEventListener("input",updateType);
updateType();
function reveal(){
 if(reduce.matches||!("IntersectionObserver" in window)){
  root.classList.remove("js-type");jobs.forEach(x=>x.classList.add("appeared"));return;
 }
 root.classList.add("js-type");
 const obs=new IntersectionObserver(items=>items.forEach(item=>{
  if(item.isIntersecting){item.target.classList.add("appeared");obs.unobserve(item.target);}
 }),{threshold:.15,rootMargin:"0px 0px -8% 0px"});
 jobs.forEach(job=>job.getBoundingClientRect().top<innerHeight*.88?job.classList.add("appeared"):obs.observe(job));
}
function entry(){
 if(reduce.matches||!Element.prototype.animate)return;
 lines.forEach((line,n)=>line.animate([
  {opacity:0,transform:"translate3d(0,120%,0) rotate(2deg)"},
  {opacity:1,transform:"translate3d(0,0,0) rotate(0deg)"}
 ],{duration:1100,delay:90+n*135,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
}
function paint(){
 frame=0;scans++;
 const y=scrollY||0,max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 output.style.transform="scaleX("+Math.min(1,Math.max(0,y/max)).toFixed(4)+")";
 const top=work.getBoundingClientRect().top+y;
 const part=Math.max(0,Math.min(1,(y-top+innerHeight*.32)/Math.max(1,work.offsetHeight-innerHeight*.35)));
 meter.style.transform="scaleX("+part.toFixed(3)+")";
 if(!reduce.matches){
  const burst=Math.max(0,Math.min(1,y/intro.offsetHeight));
  intro.style.setProperty("--burst-rotation",(burst*130-14).toFixed(1)+"deg");
  const r=image.parentElement.parentElement.getBoundingClientRect();
  if(r.bottom>0&&r.top<innerHeight){
   const t=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
   image.style.setProperty("--me-y",((t-.5)*35).toFixed(1)+"px");
  }
 }
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",schedule,{passive:true});
if(reduce.addEventListener)reduce.addEventListener("change",()=>{
 if(reduce.matches){root.classList.remove("js-type");jobs.forEach(x=>x.classList.add("appeared"));intro.style.removeProperty("--burst-rotation");image.style.removeProperty("--me-y");}
 else reveal();
 schedule();
});
reveal();entry();schedule();
window.__vtTypeQA={get state(){return{mode:"type",value:+slider.value,jobs:jobs.length,draws:scans,reduced:reduce.matches}}};
})();