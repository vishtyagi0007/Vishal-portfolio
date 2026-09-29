/* Editorial Infinite Canvas — lightweight native-scroll interactions, no external libs. */
(()=>{"use strict";
const reduce=matchMedia("(prefers-reduced-motion: reduce)");
const fine=matchMedia("(hover:hover) and (pointer:fine)");
const progress=document.querySelector("#progress");
const portrait=document.querySelector(".cover-portrait");
const quote=document.querySelector(".pullquote-inner");
const art=[...document.querySelectorAll(".scroll-art")];
const ticker=document.querySelector(".ticker-track");
const sticker=document.querySelector(".sticker");
const reveal=[...document.querySelectorAll(".reveal,.scroll-card")];
let raf=0,paused=false,events=0;

function initReveals(){
 if(reduce.matches||!("IntersectionObserver" in window)){
   document.documentElement.classList.remove("js-reveal");
   reveal.forEach(e=>e.classList.add("entered"));return;
 }
 document.documentElement.classList.add("js-reveal");
 const io=new IntersectionObserver(entries=>{
   entries.forEach(({target,isIntersecting})=>{
     if(isIntersecting){target.classList.add("entered");io.unobserve(target)}
   });
 },{threshold:.06,rootMargin:"0px 0px -4% 0px"});
 reveal.forEach(e=>{
   if(e.getBoundingClientRect().top<innerHeight*.93)e.classList.add("entered");
   else io.observe(e);
 });
}

function paint(){
 raf=0;events++;
 const y=scrollY||0;
 const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);
 progress.style.transform="scaleX("+Math.min(1,Math.max(0,y/max)).toFixed(4)+")";
 if(reduce.matches||innerWidth<761){return}
 const heroY=Math.min(y,document.querySelector(".cover").offsetHeight);
 if(portrait)portrait.style.setProperty("--portrait-y",(heroY*.043).toFixed(1)+"px");
 for(const container of art){
   const rect=container.getBoundingClientRect();
   if(rect.bottom<0||rect.top>innerHeight)continue;
   const mid=(rect.top+rect.height*.5)-innerHeight*.5;
   const speed=parseFloat(container.dataset.speed||".06");
   const movement=Math.max(-50,Math.min(50,-mid*speed));
   container.style.setProperty("--scroll-y",movement.toFixed(1)+"px");
 }
 if(quote){
   const r=quote.parentElement.getBoundingClientRect();
   if(r.bottom>0&&r.top<innerHeight){
     const t=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
     quote.style.setProperty("--quote-x",(-15+19*t).toFixed(2)+"%");
   }
 }
}
function schedule(){if(!raf)raf=requestAnimationFrame(paint)}
window.addEventListener("scroll",schedule,{passive:true});
window.addEventListener("resize",schedule,{passive:true});
if(document.fonts?.ready)document.fonts.ready.then(schedule);
window.addEventListener("load",schedule,{once:true});
if(sticker&&fine.matches){
 const card=document.querySelector(".asym-graphic");
 card.addEventListener("pointermove",e=>{
   if(reduce.matches)return;
   const rect=card.getBoundingClientRect();
   const dx=((e.clientX-rect.left)/rect.width-.5)*2;
   sticker.style.setProperty("--sticker-r",(15+dx*16).toFixed(1)+"deg");
 },{passive:true});
 card.addEventListener("pointerleave",()=>sticker.style.setProperty("--sticker-r","15deg"),{passive:true});
}
function onPreference(){
 if(reduce.matches){
   document.documentElement.classList.remove("js-reveal");
   reveal.forEach(e=>e.classList.add("entered"));
   for(const el of art)el.style.removeProperty("--scroll-y");
   if(portrait)portrait.style.removeProperty("--portrait-y");
   if(quote)quote.style.removeProperty("--quote-x");
 }else initReveals();
 schedule();
}
if(reduce.addEventListener)reduce.addEventListener("change",onPreference);
initReveals();schedule();
window.__vtEditorialQA={get state(){return{mode:"editorial",reduced:reduce.matches,renderCount:events,spreadCount:document.querySelectorAll(".spread").length,artCount:art.length}}};
})();