(function(){
  var root=document.documentElement;
  root.classList.add('motion-v2');
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=window.matchMedia&&window.matchMedia('(pointer:fine)').matches;

  function addTransition(){
    if(document.querySelector('.vt-page-transition')) return document.querySelector('.vt-page-transition');
    var el=document.createElement('div');
    el.className='vt-page-transition';
    el.setAttribute('aria-hidden','true');
    el.innerHTML='<span></span><span></span><span></span>';
    document.body.appendChild(el);
    return el;
  }
  var transition=addTransition();

  if(reduce){
    if(transition) transition.remove();
    root.classList.add('reduced-motion');
  }

  if(!reduce&&window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
  }

  var lenis=null;
  if(!reduce&&window.Lenis){
    try{
      lenis=new Lenis({
        lerp:.19,
        smoothWheel:true,
        wheelMultiplier:.92,
        touchMultiplier:1,
        syncTouch:false,
        anchors:{offset:-92},
        stopInertiaOnNavigate:true,
        respectReducedMotion:true
      });
      window.__vtLenis=lenis;
      if(window.gsap&&window.ScrollTrigger){
        lenis.on('scroll',ScrollTrigger.update);
        gsap.ticker.add(function(time){lenis.raf(time*1000)});
        gsap.ticker.lagSmoothing(0);
      }else{
        (function raf(t){lenis.raf(t);requestAnimationFrame(raf)})(performance.now());
      }
    }catch(e){}
  }


  // QA v14 — cached transform-only stack; Lenis is the sole scroll smoother.
  // Lenis owns scroll smoothing. This engine maps Lenis' animated scroll directly to transforms.
  // No second easing loop = no catch-up lag.
  (function initProjectStackV13(){
    if(innerWidth<=640) return;

    var story=document.querySelector('.story-stack');
    if(!story) return;
    var stage=story.querySelector('.story-stage');
    var scenes=[].slice.call(story.querySelectorAll('.scene'));
    if(!stage||scenes.length<2) return;

    var surfaces=scenes.map(function(scene){return scene.querySelector('.scene-surface')});
    var images=scenes.map(function(scene){return scene.querySelector('.scene-art img')});
    if(surfaces.some(function(x){return !x})) return;

    story.classList.add('stack-enhanced');

    // 4 project-to-project transitions + a dedicated final-project exit tail.
    var transitionUnits=scenes.length-1;
    var tailUnits=.72;
    var totalUnits=transitionUnits+tailUnits;
    story.style.setProperty('--stack-height',(100+transitionUnits*118+82)+'svh');

    var storyTop=0;
    var storyTravel=1;
    var pendingScroll=window.scrollY||0;
    var ticking=false;

    var scaleEnd=reduce?.94:.865;
    var rotateEnd=reduce?.65:2.35;
    var yEnd=reduce?-4:-14;

    function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
    function mix(a,b,t){return a+(b-a)*t}

    function measure(){
      var r=story.getBoundingClientRect();
      storyTop=r.top+(window.scrollY||0);
      storyTravel=Math.max(1,story.offsetHeight-innerHeight);
    }

    // One compositor transform per element instead of multiple inherited CSS
    // variables. Cache unchanged values so idle panels never cause style work.
    function updateTransform(el,value){
      if(!el||el.__vtStackTransform===value)return;
      el.__vtStackTransform=value;
      el.style.setProperty('transform',value,'important');
    }

    function setSceneY(scene,value){
      updateTransform(scene,'translateY('+value.toFixed(2)+'%)');
    }

    function setCard(surface,p,tail){
      var scale=tail!=null?mix(1,.952,tail):mix(1,scaleEnd,p);
      var rotate=tail!=null?mix(0,.85,tail):mix(0,rotateEnd,p);
      var y=tail!=null?mix(0,-7,tail):mix(0,yEnd,p);

      updateTransform(surface,
        'translate3d(0,'+y.toFixed(1)+'px,0) scale('+
        scale.toFixed(4)+') rotate('+rotate.toFixed(3)+'deg)');
    }

    function setImage(image,outgoing,incoming,tail){
      if(!image)return;
      var scale,y;
      if(tail!=null){
        scale=mix(1,1.025,tail);
        y=mix(0,-1.5,tail);
      }else{
        // The picture inherits its parent's tilt; internal zoom/drift stays subtle.
        scale=1+outgoing*.045+(1-incoming)*.022;
        y=-outgoing*2.0+(1-incoming)*2.6;
      }
      updateTransform(image,
        'translate3d(0,'+y.toFixed(2)+'%,0) scale('+scale.toFixed(4)+')');
    }

    function markActive(scene,surface,image,active){
      if(scene.__vtStackActive===active)return;
      scene.__vtStackActive=active;
      var priority='important';
      scene.style.setProperty('will-change',active?'transform':'auto',priority);
      surface.style.setProperty('will-change',active?'transform':'auto',priority);
      if(image)image.style.setProperty('will-change',active?'transform':'auto',priority);
    }

    function paintFromScroll(scroll){
      var progress=clamp((scroll-storyTop)/storyTravel,0,1);
      var units=progress*totalUnits;

      // Final Project 5 tail: continuous recede -> sticky stage releases naturally.
      if(units>=transitionUnits){
        var tailLocal=clamp((units-transitionUnits)/tailUnits,0,1);
        var tail=clamp((tailLocal-.10)/.88,0,1);

        scenes.forEach(function(scene,i){
          markActive(scene,surfaces[i],images[i],i===transitionUnits);
          // Final card is updated once below; don't reset then re-animate it
          // during every scroll frame (that caused a visible Project 5 hitch).
          if(i===transitionUnits)return;
          setSceneY(scene,0);
          setCard(surfaces[i],1,null);
          setImage(images[i],1,1,null);
        });

        setSceneY(scenes[transitionUnits],0);
        setCard(surfaces[transitionUnits],0,tail);
        setImage(images[transitionUnits],0,1,tail);
        return;
      }

      var current=Math.floor(units);
      var local=units-current;

      // Full-screen hold first, then shrink/tilt, then the next project rises.
      var shrink=clamp((local-.10)/.80,0,1);
      var incoming=clamp((local-.30)/.68,0,1);

      scenes.forEach(function(scene,i){
        markActive(scene,surfaces[i],images[i],i===current||i===current+1);
        if(i<current){
          setSceneY(scene,0);
          setCard(surfaces[i],1,null);
          setImage(images[i],1,1,null);
        }else if(i===current){
          setSceneY(scene,0);
          setCard(surfaces[i],shrink,null);
          setImage(images[i],shrink,1,null);
        }else if(i===current+1){
          setSceneY(scene,mix(100,0,incoming));
          setCard(surfaces[i],0,null);
          setImage(images[i],0,incoming,null);
        }else{
          setSceneY(scene,100);
          setCard(surfaces[i],0,null);
          setImage(images[i],0,0,null);
        }
      });
    }

    function frame(){
      ticking=false;
      paintFromScroll(pendingScroll);
    }

    function requestRender(scroll){
      if(typeof scroll==='number')pendingScroll=scroll;
      else pendingScroll=window.scrollY||0;
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(frame);
    }

    function bind(){
      if(window.__vtLenis&&window.__vtLenis.on){
        // Animated Lenis position is already smooth: use it directly.
        window.__vtLenis.on('scroll',function(e){
          requestRender(typeof e.animatedScroll==='number'?e.animatedScroll:(window.scrollY||0));
        });
      }else{
        // Native fallback only when Lenis is unavailable.
        window.addEventListener('scroll',function(){
          requestRender(window.scrollY||0);
        },{passive:true});
      }
    }

    window.addEventListener('resize',function(){
      measure();
      requestRender(window.scrollY||0);
    },{passive:true});

    measure();
    bind();
    requestRender(window.scrollY||0);
    setTimeout(function(){measure();requestRender(window.scrollY||0)},250);
  })();

  if(reduce) return;

  if(!window.gsap||!window.ScrollTrigger) return;

  var q=gsap.utils.toArray;
  var ease='power4.out';

  // First paint: a soft curtain instead of a hard page appearance.
  if(transition){
    var panels=q('.vt-page-transition span');
    gsap.set(panels,{yPercent:0});
    gsap.to(panels,{
      yPercent:-105,
      duration:1.05,
      stagger:.075,
      ease:'power4.inOut',
      delay:.04,
      onComplete:function(){transition.style.display='none'}
    });
  }

  // Hero entrance — same motion language on both pages.
  var homeTitle=q('.hero-title .title-line > span');
  if(homeTitle.length){
    gsap.set(homeTitle,{yPercent:115,opacity:0});
    var tl=gsap.timeline({defaults:{ease:ease}});
    tl.fromTo('.hero-kicker',{y:22,opacity:0},{y:0,opacity:1,duration:.85})
      .to(homeTitle,{yPercent:0,opacity:1,duration:1.2,stagger:.11},'-=.62')
      .fromTo('.hero-mark',{scale:.78,rotation:-4,opacity:0},{scale:1,rotation:13,opacity:1,duration:1.15},'-=.95')
      .fromTo('.hero-bottom > *',{y:24,opacity:0},{y:0,opacity:1,duration:.85,stagger:.07},'-=.7');
  }

  if(document.querySelector('.hero-showreel')){
    var ptl=gsap.timeline({defaults:{ease:ease}});
    ptl.fromTo('.hero .eyebrow',{y:20,opacity:0},{y:0,opacity:1,duration:.8})
       .fromTo('.hero h1',{y:56,opacity:0,clipPath:'inset(0 0 100% 0)'},{y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:1.15},'-=.5')
       .fromTo('.hero-foot > *',{y:24,opacity:0},{y:0,opacity:1,duration:.8,stagger:.08},'-=.72')
       .fromTo('.hero-reel-head',{y:18,opacity:0},{y:0,opacity:1,duration:.7},'-=.6')
       .fromTo('.hero-card',{y:46,opacity:0,scale:.94},{y:0,opacity:1,scale:1,duration:1.05,stagger:.1},'-=.62');
  }

  // Hero moves away gradually as the next section arrives.
  q('.hero').forEach(function(hero){
    var title=hero.querySelector('.hero-title')||hero.querySelector('h1');
    var mark=hero.querySelector('.hero-mark');
    var reel=hero.querySelector('.hero-showreel');
    var foot=hero.querySelector('.hero-bottom')||hero.querySelector('.hero-foot');
    var st={trigger:hero,start:'top top',end:'bottom top',scrub:1.25};
    if(title) gsap.to(title,{y:-70,opacity:.46,ease:'none',scrollTrigger:st});
    if(mark) gsap.to(mark,{y:95,rotation:27,scale:.88,ease:'none',scrollTrigger:st});
    if(reel) gsap.to(reel,{y:-48,x:24,scale:.965,opacity:.62,ease:'none',scrollTrigger:st});
    if(foot) gsap.to(foot,{y:-18,opacity:.58,ease:'none',scrollTrigger:st});
  });

  // One reveal rhythm across the entire site.
  var headlineSelectors=[
    '.intro h2','.brand-top h2','.services-head h2','.motion-head h2','.contact h2',
    '.intro-section h2','.about-sticky h2','.process-head h2','.showreel-head h2','.contact-copy h2',
    '.project-copy h2'
  ].join(',');
  q(headlineSelectors).forEach(function(el){
    gsap.fromTo(el,
      {y:46,opacity:0,clipPath:'inset(0 0 26% 0)'},
      {y:0,opacity:1,clipPath:'inset(0 0 0% 0)',duration:1.05,ease:ease,
       scrollTrigger:{trigger:el,start:'top 88%',toggleActions:'play none none none'}}
    );
  });

  var softSelectors=[
    '.intro-foot','.services-head p','.brand-kicker','.section-label','.process-head p',
    '.showreel-head p','.contact-copy p','.experience-row','.proof-item'
  ].join(',');
  ScrollTrigger.batch(softSelectors,{
    start:'top 92%',
    once:true,
    onEnter:function(batch){
      gsap.fromTo(batch,{y:30,opacity:0},{y:0,opacity:1,duration:.85,stagger:.055,ease:ease,overwrite:'auto'});
    }
  });

  // Project chapters flow into view instead of snapping on.
  q('.project').forEach(function(project){
    var head=project.querySelector('.project-head');
    var copy=project.querySelector('.project-copy');
    var media=project.querySelector('.project-media');
    var tl=gsap.timeline({
      scrollTrigger:{trigger:project,start:'top 82%',toggleActions:'play none none none'}
    });
    if(head) tl.fromTo(head,{y:20,opacity:0},{y:0,opacity:1,duration:.62,ease:ease});
    if(copy) tl.fromTo(copy,{y:38,opacity:0},{y:0,opacity:1,duration:.9,ease:ease},'-=.38');
    if(media) tl.fromTo(media,{y:54,scale:.975,opacity:0},{y:0,scale:1,opacity:1,duration:1.12,ease:ease},'-=.72');
    if(media){
      gsap.fromTo(media,{y:18},{y:-18,ease:'none',scrollTrigger:{trigger:project,start:'top bottom',end:'bottom top',scrub:1.45}});
    }
  });

  // Project stack handled by QA v10 engine above.
  q('.showreel-card,.motion-frame').forEach(function(box){
    gsap.fromTo(box,{clipPath:'inset(8% 5% 8% 5% round 12px)',scale:.985},
      {clipPath:'inset(0% 0% 0% 0% round 0px)',scale:1,ease:'none',
       scrollTrigger:{trigger:box,start:'top 88%',end:'top 48%',scrub:1.05}});
  });

  q('.process-step,.service-row,.index-item').forEach(function(row){
    var title=row.querySelector('h3,.index-name');
    if(title){
      gsap.fromTo(title,{x:-12,opacity:.78},{x:0,opacity:1,ease:'none',
        scrollTrigger:{trigger:row,start:'top 92%',end:'top 68%',scrub:.8}});
    }
  });

  // Marquee / ticker gets subtle continuous scroll-linked drift.
  q('.marquee-inner,.ticker').forEach(function(track){
    gsap.fromTo(track,{xPercent:0},{xPercent:-3.5,ease:'none',
      scrollTrigger:{trigger:track,start:'top bottom',end:'bottom top',scrub:1.4}});
  });

  // Portfolio sticky navigation glides out/in with direction.
  var stickyNav=document.querySelector('.nav');
  if(stickyNav&&lenis){
    var navY=gsap.quickTo(stickyNav,'y',{duration:.55,ease:'power3.out'});
    lenis.on('scroll',function(e){
      if(e.animatedScroll<110){navY(0);return}
      navY(e.direction===1?-105:0);
    });
  }

  // Magnetic interactions: small movement, never cartoonish.
  if(fine){
    q('.head-cta,.nav-right .contact,.project-link,.inline-link,.see-all,.form-submit,.contact-circle,.about-actions a').forEach(function(el){
      el.addEventListener('pointermove',function(e){
        var r=el.getBoundingClientRect();
        gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.08,y:(e.clientY-r.top-r.height/2)*.12,duration:.45,ease:'power3.out',overwrite:'auto'});
      });
      el.addEventListener('pointerleave',function(){
        gsap.to(el,{x:0,y:0,duration:.75,ease:'elastic.out(1,.42)',overwrite:'auto'});
      });
    });
  }

  // Cross-page navigation transition.
  document.addEventListener('click',function(e){
    if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey) return;
    var a=e.target.closest('a[href]');
    if(!a||a.target==='_blank'||a.hasAttribute('download')) return;
    var href=a.getAttribute('href');
    if(!href||href.charAt(0)==='#'||href.indexOf('mailto:')===0||href.indexOf('tel:')===0||href.indexOf('javascript:')===0) return;
    var url;
    try{url=new URL(a.href,location.href)}catch(err){return}
    if(url.origin!==location.origin) return;
    if(url.pathname===location.pathname&&url.hash) return;
    if(!transition) return;
    e.preventDefault();
    transition.style.display='grid';
    transition.classList.add('is-covering');
    var panels=q('.vt-page-transition span');
    gsap.set(panels,{yPercent:105});
    gsap.to(panels,{yPercent:0,duration:.72,stagger:.065,ease:'power4.inOut',
      onComplete:function(){location.href=url.href}});
  });

  window.addEventListener('pageshow',function(){
    if(transition&&transition.classList.contains('is-covering')){
      transition.classList.remove('is-covering');
      transition.style.display='none';
    }
  });

  setTimeout(function(){ScrollTrigger.refresh()},250);
})();