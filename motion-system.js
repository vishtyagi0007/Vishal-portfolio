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
        lerp:.105,
        smoothWheel:true,
        wheelMultiplier:.82,
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


  // QA v12 — smoothed single-stage project stack.
  // Scroll position creates a target; visual progress eases toward it every frame.
  // This removes wheel-step jerk while keeping the card and artwork mechanically connected.
  (function initProjectStackV12(){
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
    story.style.setProperty('--stack-height',(100+(scenes.length-1)*132)+'svh');

    var ticking=false;
    var visualProgress=0;
    var targetProgress=0;
    var firstPaint=true;

    var scaleEnd=reduce?.94:.885;
    var rotateEnd=reduce?.65:1.95;
    var yEnd=reduce?-4:-10;

    function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
    function mix(a,b,t){return a+(b-a)*t}
    function smooth(t){return t*t*(3-2*t)}

    function readTarget(){
      var rect=story.getBoundingClientRect();
      var vh=innerHeight||1;
      var travel=Math.max(1,rect.height-vh);
      targetProgress=clamp((-rect.top)/travel,0,1);
      if(firstPaint){
        visualProgress=targetProgress;
        firstPaint=false;
      }
    }

    function setSceneY(scene,value){
      scene.style.setProperty('--scene-y',value.toFixed(3)+'%');
    }

    function setCard(surface,p){
      surface.style.setProperty('--card-scale',mix(1,scaleEnd,p).toFixed(4));
      surface.style.setProperty('--card-rotate',mix(0,rotateEnd,p).toFixed(3)+'deg');
      surface.style.setProperty('--card-y',mix(0,yEnd,p).toFixed(2)+'px');
      surface.style.setProperty('--card-brightness',mix(1,.965,p).toFixed(4));
      surface.style.setProperty('--card-radius',mix(0,4,p).toFixed(2)+'px');
      surface.style.setProperty('--card-shadow',mix(0,.20,p).toFixed(3));
    }

    function setImage(image,outgoing,incoming){
      if(!image)return;

      // Outgoing: image stays at the exact same card angle because it is a child
      // of the rotating surface, while its content slowly pushes forward.
      var scale=1 + outgoing*.055 - incoming*.018;
      var y=-outgoing*2.2 + (1-incoming)*3.0;
      if(incoming<=0.001)y=-outgoing*2.2;

      image.style.setProperty('--image-scale',scale.toFixed(4));
      image.style.setProperty('--image-y',y.toFixed(3)+'%');
      image.style.setProperty('--image-sat',mix(1,1.035,outgoing).toFixed(3));
      image.style.setProperty('--image-contrast',mix(1,1.025,outgoing).toFixed(3));
    }

    function paint(progress){
      var segments=scenes.length-1;
      var position=progress*segments;
      var current=Math.min(segments,Math.floor(position));
      var local=current>=segments?1:position-current;

      // Reference-like choreography:
      // 0–28%  : full-screen hold
      // 28–58% : back card visibly shrinks + tilts
      // 46–100%: next card rises, giving a long overlap
      var shrink=smooth(clamp((local-.28)/.30,0,1));
      var incoming=smooth(clamp((local-.46)/.54,0,1));

      scenes.forEach(function(scene,i){
        var surface=surfaces[i];

        if(i<current){
          setSceneY(scene,0);
          setCard(surface,1);
          setImage(images[i],1,1);
        }else if(i===current){
          setSceneY(scene,0);
          var out=current===segments?0:shrink;
          setCard(surface,out);
          setImage(images[i],out,1);
        }else if(i===current+1){
          setSceneY(scene,mix(100,0,incoming));
          setCard(surface,0);
          setImage(images[i],0,incoming);
        }else{
          setSceneY(scene,100);
          setCard(surface,0);
          setImage(images[i],0,0);
        }
      });

      if(current===segments){
        setCard(surfaces[segments],0);
        setSceneY(scenes[segments],0);
        setImage(images[segments],0,1);
      }
    }

    function frame(){
      ticking=false;
      readTarget();

      // Frame interpolation is separate from Lenis, so even stepped mouse-wheel
      // input produces a continuous premium visual transition.
      var damping=reduce?.28:.115;
      visualProgress += (targetProgress-visualProgress)*damping;

      if(Math.abs(targetProgress-visualProgress)<0.00008){
        visualProgress=targetProgress;
      }

      paint(visualProgress);

      if(Math.abs(targetProgress-visualProgress)>=0.00008){
        ticking=true;
        requestAnimationFrame(frame);
      }
    }

    function requestRender(){
      readTarget();
      if(ticking)return;
      ticking=true;
      requestAnimationFrame(frame);
    }

    window.addEventListener('scroll',requestRender,{passive:true});
    window.addEventListener('resize',function(){
      firstPaint=true;
      requestRender();
    },{passive:true});

    if(window.__vtLenis&&window.__vtLenis.on){
      try{window.__vtLenis.on('scroll',requestRender)}catch(e){}
    }

    requestRender();
    setTimeout(requestRender,100);
    setTimeout(requestRender,500);
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