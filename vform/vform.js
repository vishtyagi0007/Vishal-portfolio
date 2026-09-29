/* V/FORM private concept. One scroll-native narrative; no wheel hijacking or duplicated component libraries. */
(()=>{
"use strict";
const doc=document.documentElement;
const hero=document.querySelector("#opening");
const portal=document.querySelector(".hero-transition");
const portalArt=document.querySelector(".hero-transition-art");
const portrait=document.querySelector(".hero-photo");
const heroWords=[...document.querySelectorAll(".hero-title .reveal-word")];
const film=document.querySelector("#project-film");
const filmSticky=document.querySelector("#film-sticky");
const scenes=[...document.querySelectorAll("[data-scene]")];
const progress=document.querySelector("#reading-progress");
const filmBar=document.querySelector("#film-progress");
const filmNum=document.querySelector("#film-number");
const reduced=matchMedia("(prefers-reduced-motion:reduce)");
const wide=matchMedia("(min-width:1100px) and (min-height:730px)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
let raf=0,frames=0,active=0,enhanced=false,heroStart=0,heroDistance=1,filmStart=0,filmDistance=1,metrics=0;

function clamp(x){return Math.max(0,Math.min(1,x))}
function setActive(index){
 if(index===active&&scenes[index].classList.contains("is-active"))return;
 active=index;
 scenes.forEach((scene,i)=>{
   const show=i===index;
   scene.classList.toggle("is-active",show);
   if(enhanced){
     scene.inert=!show;
     scene.setAttribute("aria-hidden",String(!show));
   }else{
     scene.inert=false;scene.removeAttribute("aria-hidden");
   }
 });
 filmNum.textContent=String(index+1).padStart(2,"0")+" / 04";
}
function measure(){
 enhanced=wide.matches&&!reduced.matches;
 heroStart=hero.getBoundingClientRect().top+scrollY;
 heroDistance=Math.max(1,hero.offsetHeight-innerHeight);
 film.classList.toggle("is-enhanced",enhanced);
 if(enhanced){
   film.style.setProperty("--film-height",(innerHeight*5.1).toFixed(1)+"px");
   filmStart=film.getBoundingClientRect().top+scrollY;
   filmDistance=Math.max(1,film.offsetHeight-innerHeight);
   active=-1;setActive(0);
 }else{
   film.style.removeProperty("--film-height");
   scenes.forEach(x=>{x.inert=false;x.removeAttribute("aria-hidden");x.classList.add("is-active");x.style.removeProperty("--art-lift");x.style.removeProperty("--pride-rotate")});
   active=0;filmNum.textContent="01—04";
 }
 metrics++;
 schedule();
}
function render(){
 raf=0;frames++;
 const y=scrollY||0;
 const total=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 progress.style.transform="scaleX("+clamp(y/total).toFixed(4)+")";
 if(!reduced.matches){
   const h=clamp((y-heroStart)/heroDistance);
   // Scene gradually takes over the same viewport as the original portrait/type.
   const portalP=clamp((h-.35)/.58);
   portal.style.clipPath="inset("+((1-portalP)*100).toFixed(2)+"% 0 0 0)";
   const artProgress=clamp((portalP-.05)/.9);
   portalArt.style.clipPath="inset("+((1-artProgress)*13).toFixed(2)+"% "+((1-artProgress)*21).toFixed(2)+"% "+((1-artProgress)*13).toFixed(2)+"% "+((1-artProgress)*21).toFixed(2)+"%)";
   portalArt.style.setProperty("--portal-scale",(1.18-.18*artProgress).toFixed(4));
   portal.style.setProperty("--portal-type-y",((1-artProgress)*50).toFixed(2)+"px");
   portal.style.setProperty("--portal-type-opacity",clamp((artProgress-.3)*2).toFixed(3));
   portrait.style.setProperty("--photo-scale",(1+h*.14).toFixed(4));
   portrait.style.setProperty("--photo-y",(h*-39).toFixed(2)+"px");
 }else{
   portal.style.clipPath="inset(100% 0 0 0)";
   portal.style.setProperty("--portal-type-opacity","0");
   portrait.style.removeProperty("--photo-scale");
   portrait.style.removeProperty("--photo-y");
 }
 if(enhanced){
   const p=clamp((y-filmStart)/filmDistance);
   // The original DOM layouts remain separate. The scroll-position chooses the current chapter.
   const sceneFloat=Math.min(3.999,p*4);
   const index=Math.floor(sceneFloat);
   setActive(index);
   const within=sceneFloat-index;
   filmBar.style.transform="scaleX("+p.toFixed(4)+")";
   const art=scenes[index].querySelector(".scene-art");
   art?.style.setProperty("--art-lift",((within-.5)*-26).toFixed(2)+"px");
   scenes[index].style.setProperty("--pride-rotate",((within-.5)*5).toFixed(2)+"deg");
 }else{
   const begin=film.getBoundingClientRect().top+scrollY;
   const end=begin+film.offsetHeight;
   const p=clamp((y+innerHeight*.2-begin)/Math.max(1,end-begin));
   filmBar.style.transform="scaleX("+p.toFixed(4)+")";
   const visible=scenes.filter(s=>s.getBoundingClientRect().top<innerHeight*.7);
   const next=visible.at(-1);
   if(next){active=+next.dataset.scene;filmNum.textContent=String(active+1).padStart(2,"0")+" / 04"}
 }
}
function schedule(){if(!raf)raf=requestAnimationFrame(render)}
function onViewportChange(){measure()}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",onViewportChange,{passive:true});
window.addEventListener("load",onViewportChange,{once:true});
reduced.addEventListener?.("change",onViewportChange);
wide.addEventListener?.("change",onViewportChange);
document.fonts?.ready?.then(onViewportChange);
if(!reduced.matches && Element.prototype.animate){
 heroWords.forEach((word,i)=>word.animate([
   {opacity:0,transform:"translateY(102%) rotate(2deg)"},
   {opacity:1,transform:"translateY(0) rotate(0)"}
 ],{duration:1250,delay:110+i*160,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"}));
 document.querySelector(".hero-description")?.animate([
   {opacity:0,transform:"translateY(35px)"},
   {opacity:1,transform:"none"}
 ],{duration:800,delay:550,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
}
if(fine.matches){
 let xyRAF=0,mouseX=0,mouseY=0;
 document.querySelector(".hero-sticky").addEventListener("pointermove",e=>{
   if(reduced.matches||innerWidth<1100||scrollY>heroStart+heroDistance*.25)return;
   mouseX=e.clientX;mouseY=e.clientY;
   if(xyRAF)return;
   xyRAF=requestAnimationFrame(()=>{
     xyRAF=0;const r=hero.getBoundingClientRect();
     const x=(mouseX-r.left)/Math.max(1,r.width)-.5;
     const y=(mouseY-r.top)/Math.max(1,r.height)-.5;
     portrait.style.setProperty("--photo-x",(x*-11).toFixed(2)+"px");
     portrait.style.setProperty("--photo-y",(y*-8).toFixed(2)+"px");
   });
 },{passive:true});
 document.querySelector(".hero-sticky").addEventListener("pointerleave",()=>{portrait.style.removeProperty("--photo-x");schedule()},{passive:true});
}
measure();
window.__vformQA={get state(){return{enhanced,active,frames,metrics,portal:portal.style.clipPath,film:film.style.getPropertyValue("--film-height"),scrollY,sceneCount:scenes.length,reduced:reduced.matches}},get originalArt(){return scenes.flatMap(x=>[...x.querySelectorAll("img")].map(i=>i.getAttribute("src")))}};
})();