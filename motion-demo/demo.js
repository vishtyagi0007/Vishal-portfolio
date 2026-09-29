/* VT CINEMATIC DEMO. Native document scroll only. No scroll hijacking, no external libraries. */
(function(){
  "use strict";
  var root=document.documentElement;
  var mqReduce=window.matchMedia("(prefers-reduced-motion: reduce)");
  var mqDesktop=window.matchMedia("(min-width: 900px) and (min-height: 700px)");
  var mqPointer=window.matchMedia("(hover:hover) and (pointer:fine)");
  var hero=document.querySelector(".hero");
  var portrait=document.querySelector(".hero-portrait");
  var glow=document.querySelector(".hero-glow");
  var orbit=document.querySelector(".orbit");
  var intro=document.querySelector(".intro");
  var strip=document.querySelector(".statement");
  var film=document.querySelector(".project-film");
  var scenes=[].slice.call(document.querySelectorAll(".film-scene"));
  var rail=[].slice.call(document.querySelectorAll("[data-scene-jump]"));
  var filmCounter=document.querySelector("#film-number");
  var filmProgress=document.querySelector("#film-progress");
  var progress=document.querySelector("#page-progress");
  var nav=document.querySelector("#nav");
  var menuToggle=document.querySelector("#menu-toggle");
  var navLinks=document.querySelectorAll("#navigation a");
  var reel=document.querySelector("#demo-reel");
  var reelScreen=document.querySelector("#reel-screen");
  var reelPlay=document.querySelector("#reel-play");
  var reduce=mqReduce.matches;
  var desktop=false;
  var filmTop=0,filmTravel=1,active=-1;
  var raf=0;
  var px=0,py=0;
  var pointerRAF=0;
  var revealed=false;
  var scrollEvents=0;

  // Show content by default. Enhance only when observing is supported.
  function setReveal(){
    if(reduce||!("IntersectionObserver" in window)){
      document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("in-view")});
      root.classList.remove("js-motion");
      return;
    }
    if(revealed)return;
    revealed=true;
    root.classList.add("js-motion");
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:0.08,rootMargin:"0px 0px -4% 0px"});
    document.querySelectorAll(".reveal").forEach(function(el){
      var rect=el.getBoundingClientRect();
      if(rect.top<window.innerHeight*.94)el.classList.add("in-view");
      else observer.observe(el);
    });
  }

  // First-screen kinetic lines, respecting system motion preferences.
  function introSequence(){
    if(reduce||!Element.prototype.animate)return;
    var lines=[].slice.call(document.querySelectorAll(".hero-title .line>span"));
    lines.forEach(function(line,i){
      line.animate([
        {opacity:0,transform:"translate3d(0,105%,0) skewY(7deg)"},
        {opacity:1,transform:"translate3d(0,0,0) skewY(0deg)"}
      ],{duration:1150,delay:150+i*185,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
    });
    var heroIndex=document.querySelector(".hero-index");
    var heroText=document.querySelector(".hero-text");
    var actions=document.querySelector(".hero-actions");
    [heroIndex,heroText,actions].forEach(function(el,i){
      if(!el)return;
      el.animate([{opacity:0,transform:"translateY(20px)"},{opacity:1,transform:"translateY(0)"}],
        {duration:920,delay:180+i*220,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
    });
    if(orbit)orbit.animate([{opacity:0,scale:.8,rotate:"-12deg"},{opacity:1,scale:1,rotate:"0deg"}],
      {duration:1400,delay:490,easing:"cubic-bezier(.16,1,.3,1)",fill:"both"});
  }

  function measureFilm(){
    var rect=film.getBoundingClientRect();
    filmTop=rect.top+(window.scrollY||0);
    filmTravel=Math.max(1,film.offsetHeight-window.innerHeight);
  }
  function setActive(next){
    if(next===active)return;
    active=next;
    scenes.forEach(function(scene,i){
      var chosen=i===next;
      scene.classList.toggle("is-active",chosen);
      if(desktop){
        scene.setAttribute("aria-hidden",String(!chosen));
        scene.inert=!chosen;
      }else{
        scene.removeAttribute("aria-hidden");
        scene.inert=false;
      }
    });
    rail.forEach(function(btn,i){
      if(i===next)btn.setAttribute("aria-current","true");
      else btn.removeAttribute("aria-current");
    });
    if(filmCounter)filmCounter.textContent=String(next+1).padStart(2,"0");
  }

  function enableFilm(){
    var should=mqDesktop.matches&&!mqReduce.matches;
    if(should!==desktop){
      desktop=should;
      film.classList.toggle("film-ready",desktop);
      if(!desktop){
        scenes.forEach(function(scene){
          scene.classList.add("is-active");
          scene.removeAttribute("aria-hidden");
          scene.inert=false;
        });
        rail.forEach(function(btn){btn.removeAttribute("aria-current")});
        if(filmProgress)filmProgress.style.transform="scaleX(0)";
        active=-1;
      }else{
        active=-1;
      }
    }
    measureFilm();
    schedule();
  }
  rail.forEach(function(btn,index){
    btn.addEventListener("click",function(){
      if(!desktop)return;
      measureFilm();
      var part=(index+.16)/scenes.length;
      var target=filmTop+filmTravel*part;
      window.scrollTo({top:target,behavior:reduce?"auto":"smooth"});
    });
  });

  // One throttled native scroll listener animates transforms only.
  function render(){
    raf=0;scrollEvents++;
    var y=window.scrollY||0;
    var max=Math.max(1,document.documentElement.scrollHeight-window.innerHeight);
    if(progress)progress.style.transform="scaleX("+(Math.max(0,Math.min(1,y/max))).toFixed(4)+")";
    if(!reduce){
      if(hero){
        var heroEnd=hero.offsetHeight;
        if(y<heroEnd+window.innerHeight){
          if(portrait&&window.innerWidth>760){
            portrait.style.setProperty("--portrait-y",(Math.min(y,heroEnd)*.087).toFixed(1)+"px");
          }
          if(glow)glow.style.setProperty("--hero-glow-y",(Math.min(y,heroEnd)*-.05).toFixed(1)+"px");
        }
      }
      if(strip){
        var r=strip.getBoundingClientRect();
        if(r.top<window.innerHeight && r.bottom>0){
          var t=Math.min(1,Math.max(0,(window.innerHeight-r.top)/(window.innerHeight+r.height)));
          strip.style.setProperty("--marquee-x",(-15+t*23).toFixed(2)+"%");
          strip.style.setProperty("--wipe-shift",(-8+t*32).toFixed(1)+"px");
        }
      }
    }
    if(desktop){
      var p=Math.max(0,Math.min(1,(y-filmTop)/filmTravel));
      var next=Math.min(scenes.length-1,Math.floor(p*scenes.length));
      setActive(next);
      if(filmProgress)filmProgress.style.transform="scaleX("+p.toFixed(4)+")";
      if(film.getBoundingClientRect().bottom<0 && filmProgress)filmProgress.style.transform="scaleX(1)";
    }
  }
  function schedule(){
    if(!raf)raf=requestAnimationFrame(render);
  }
  window.addEventListener("scroll",schedule,{passive:true});
  window.addEventListener("resize",function(){
    enableFilm();schedule();
  },{passive:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){measureFilm();schedule()});
  window.addEventListener("load",function(){measureFilm();schedule()},{once:true});

  // Subtle mouse-dependent VT emblem: isolated from portrait and actual artwork.
  if(hero&&mqPointer.matches&&!reduce){
    hero.addEventListener("pointermove",function(e){
      px=e.clientX;py=e.clientY;
      if(pointerRAF)return;
      pointerRAF=requestAnimationFrame(function(){
        pointerRAF=0;
        var bounds=hero.getBoundingClientRect();
        var nx=Math.max(-1,Math.min(1,((px-bounds.left)/bounds.width-.5)*2));
        var ny=Math.max(-1,Math.min(1,((py-bounds.top)/bounds.height-.5)*2));
        if(portrait){
          portrait.style.setProperty("--portrait-x",(nx*-7).toFixed(1)+"px");
        }
        if(orbit)orbit.style.setProperty("--orbit-rotate",(nx*13+ny*-6).toFixed(1)+"deg");
      });
    },{passive:true});
    hero.addEventListener("pointerleave",function(){
      if(portrait)portrait.style.setProperty("--portrait-x","0px");
      if(orbit)orbit.style.setProperty("--orbit-rotate","0deg");
    },{passive:true});
  }

  // Real, keyboard-accessible navigation on small screens.
  if(nav&&menuToggle){
    nav.classList.add("menu-enhanced");
    function toggle(open){
      nav.classList.toggle("menu-open",open);
      menuToggle.setAttribute("aria-expanded",String(open));
      menuToggle.textContent=open?"CLOSE −":"MENU +";
    }
    menuToggle.addEventListener("click",function(){toggle(!nav.classList.contains("menu-open"))});
    navLinks.forEach(function(a){a.addEventListener("click",function(){toggle(false)})});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"&&nav.classList.contains("menu-open")){toggle(false);menuToggle.focus()}});
    window.addEventListener("resize",function(){if(window.innerWidth>760)toggle(false)},{passive:true});
  }

  // Video is user-initiated, no auto play, original encoded file remains untouched.
  if(reel&&reelPlay&&reelScreen){
    reel.addEventListener("play",function(){reelScreen.classList.add("playing")});
    ["pause","ended"].forEach(function(ev){reel.addEventListener(ev,function(){reelScreen.classList.remove("playing")})});
    reelPlay.addEventListener("click",function(){
      var playing=reel.play();
      if(playing&&playing.catch)playing.catch(function(){reelScreen.classList.remove("playing")});
    });
  }

  function preferenceChanged(){
    reduce=mqReduce.matches;
    if(reduce){
      root.classList.remove("js-motion");
      document.querySelectorAll(".reveal").forEach(function(el){el.classList.add("in-view")});
      if(portrait){portrait.style.removeProperty("--portrait-y");portrait.style.removeProperty("--portrait-x")}
      if(orbit)orbit.style.removeProperty("--orbit-rotate");
    }else setReveal();
    enableFilm();
    schedule();
  }
  if(mqReduce.addEventListener)mqReduce.addEventListener("change",preferenceChanged);
  else if(mqReduce.addListener)mqReduce.addListener(preferenceChanged);
  if(mqDesktop.addEventListener)mqDesktop.addEventListener("change",enableFilm);
  else if(mqDesktop.addListener)mqDesktop.addListener(enableFilm);

  setReveal();
  introSequence();
  enableFilm();
  schedule();

  // Read-only QA diagnostics. No timers or persistent storage.
  window.__vtDemoQA={
    get state(){return {desktop:desktop,reduced:reduce,active:active,scrollEvents:scrollEvents,sceneCount:scenes.length}}
  };
})();