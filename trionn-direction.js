/* VT cinematic enhancements: native scroll first, no extra runtime or WebGL. */
(function(){
  "use strict";
  function init(){
    var root=document.documentElement;
    if(root.dataset.trVtInit==="1")return;
    root.dataset.trVtInit="1";
    var reduce=window.matchMedia("(prefers-reduced-motion: reduce)");
    var fine=window.matchMedia("(hover: hover) and (pointer: fine)");
    var hero=document.querySelector("#home.hero");
    var bridge=document.querySelector(".tr-bridge");
    if(!hero)return;

    // Reuse the authored Illustrator VT SVG; no regenerated photo or 3D download.
    var orb=document.createElement("div");
    orb.className="tr-orb";
    orb.setAttribute("aria-hidden","true");
    var art=document.createElement("img");
    art.src="/portfolio/assets/vishal-tyagi-mark.svg";
    art.alt="";
    art.decoding="async";
    var label=document.createElement("span");
    label.className="tr-orb-label";
    label.textContent="VT / VISUAL IDENTITY";
    orb.append(art,label);
    hero.appendChild(orb);

    // Pointer updates only one compositor-friendly element, at most once per frame.
    var queued=false,px=0,py=0,rect;
    function paint(){
      queued=false;
      if(reduce.matches||!fine.matches)return;
      var box=rect||hero.getBoundingClientRect();
      var x=((px-box.left)/Math.max(box.width,1)-.5)*2;
      var y=((py-box.top)/Math.max(box.height,1)-.5)*2;
      orb.style.setProperty("--tr-ry",(Math.max(-1,Math.min(1,x))*8).toFixed(2)+"deg");
      orb.style.setProperty("--tr-rx",(-Math.max(-1,Math.min(1,y))*7).toFixed(2)+"deg");
    }
    function move(e){
      if(reduce.matches||!fine.matches)return;
      px=e.clientX;py=e.clientY;
      if(!queued){queued=true;requestAnimationFrame(paint);}
    }
    function reset(){
      rect=null;
      orb.style.setProperty("--tr-rx","0deg");
      orb.style.setProperty("--tr-ry","0deg");
    }
    hero.addEventListener("pointerenter",function(){rect=hero.getBoundingClientRect();},{passive:true});
    hero.addEventListener("pointermove",move,{passive:true});
    hero.addEventListener("pointerleave",reset,{passive:true});
    window.addEventListener("resize",reset,{passive:true});

    // A single decorative scene handoff. Never trap or take over document scroll.
    if(bridge){
      if(!("IntersectionObserver" in window)||reduce.matches){
        bridge.classList.add("is-visible");
      }else{
        var observer=new IntersectionObserver(function(entries){
          entries.forEach(function(entry){
            if(entry.isIntersecting){
              bridge.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },{threshold:.1});
        observer.observe(bridge);
      }
    }
    root.classList.add("tr-ready");
    function motionChange(){
      if(reduce.matches){reset();if(bridge)bridge.classList.add("is-visible")}
    }
    if(reduce.addEventListener)reduce.addEventListener("change",motionChange);
    else if(reduce.addListener)reduce.addListener(motionChange);
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
