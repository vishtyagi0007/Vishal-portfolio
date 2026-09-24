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
    return;
  }

  if(window.gsap&&window.ScrollTrigger){
    gsap.registerPlugin(ScrollTrigger);
  }

  var lenis=null;
  if(window.Lenis){
    try{
      lenis=new Lenis({
        lerp:.085,
        smoothWheel:true,
        wheelMultiplier:.88,
        touchMultiplier:1,
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

  // QA v3 — full-screen enter -> pin/set -> shrink/tilt only while the next scene covers it.
  var scenes=q('.story-stack .scene');
  scenes.forEach(function(scene,i){
    var surface=scene.querySelector('.scene-surface')||scene;
    var title=scene.querySelector('.scene-title-group h3');
    var number=scene.querySelector('.scene-number');
    var copy=scene.querySelector('.scene-copy');
    var art=scene.querySelector('.scene-art');
    var img=scene.querySelector('.scene-art img');

    gsap.set(surface,{transformOrigin:'50% 50%',force3D:true});

    // Incoming panel stays essentially full-screen while it travels up the viewport.
    gsap.fromTo(surface,
      {scale:1.018,rotation:0,y:0},
      {scale:1,rotation:0,y:0,ease:'none',
       scrollTrigger:{trigger:scene,start:'top bottom',end:'top top',scrub:1.15}}
    );

    // Content resolves as the panel approaches its pinned position.
    var enter=gsap.timeline({
      scrollTrigger:{trigger:scene,start:'top 78%',end:'top 18%',scrub:1.05}
    });
    if(title) enter.fromTo(title,{y:58,opacity:.28},{y:0,opacity:1,ease:'none'},0);
    if(number) enter.fromTo(number,{y:34,opacity:.35},{y:0,opacity:1,ease:'none'},0);
    if(copy) enter.fromTo(copy,{y:42,opacity:.25},{y:0,opacity:1,ease:'none'},.06);
    if(art) enter.fromTo(art,{y:54,opacity:.35,scale:.975},{y:0,opacity:1,scale:1,ease:'none'},.03);

    // Artwork has its own slower movement, creating depth inside the fixed panel.
    if(img){
      gsap.fromTo(img,
        {scale:1.07,yPercent:5},
        {scale:1.018,yPercent:-4,ease:'none',
         scrollTrigger:{trigger:scene,start:'top bottom',end:'bottom top',scrub:1.6}}
      );
    }

    // Only AFTER this panel has settled does the next panel make it recede.
    // The next panel itself remains full-screen and physically covers it from below.
    if(i<scenes.length-1){
      var next=scenes[i+1];
      gsap.fromTo(surface,
        {scale:1,rotation:0,y:0,filter:'brightness(1)',borderRadius:'0px'},
        {
          scale:.935,
          rotation:i%2===0?-1.35:1.35,
          y:-24,
          filter:'brightness(.78)',
          borderRadius:'16px',
          ease:'none',
          scrollTrigger:{
            trigger:next,
            start:'top bottom',
            end:'top 8%',
            scrub:1.45,
            invalidateOnRefresh:true
          }
        }
      );
      if(title) gsap.to(title,{
        y:-22,opacity:.68,ease:'none',
        scrollTrigger:{trigger:next,start:'top bottom',end:'top 18%',scrub:1.35}
      });
      if(copy) gsap.to(copy,{
        y:-12,opacity:.58,ease:'none',
        scrollTrigger:{trigger:next,start:'top bottom',end:'top 18%',scrub:1.35}
      });
      if(art) gsap.to(art,{
        y:-15,scale:.975,opacity:.82,ease:'none',
        scrollTrigger:{trigger:next,start:'top bottom',end:'top 12%',scrub:1.35}
      });
    }
  });

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