(() => {
  // Local QA measurements only; no analytics, storage or network transmission.
  if (new URLSearchParams(location.search).has('qa') && 'PerformanceObserver' in window) {
    let cls = 0;
    let lcp = 0;
    let lcpElement = '';
    const capture = () => {
      const nav = performance.getEntriesByType('navigation')[0];
      document.documentElement.dataset.qaStats = JSON.stringify({
        lcp, lcpElement, cls,
        fcp: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime,
        ttfb: nav?.responseStart,
        resources: performance.getEntriesByType('resource').filter(r => r.name.startsWith(location.origin)).map(r => ({
          file:r.name.split('/').pop(),bytes:r.transferSize,duration:Math.round(r.duration),end:Math.round(r.responseEnd)
        }))
      });
    };
    new PerformanceObserver(list => list.getEntries().forEach(entry => {
      if (!entry.hadRecentInput) cls += entry.value;
      document.documentElement.dataset.qaCls = String(cls);
      capture();
    })).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list => list.getEntries().forEach(entry => {
      lcp = entry.startTime;
      lcpElement = entry.element?.tagName + '.' + entry.element?.className;
      document.documentElement.dataset.qaLcp = String(Math.round(entry.startTime));
      capture();
    })).observe({type:'largest-contentful-paint',buffered:true});
    new PerformanceObserver(capture).observe({type:'resource',buffered:true});
    new PerformanceObserver(capture).observe({type:'paint',buffered:true});
    window.addEventListener('load',capture,{once:true});
  }
  const legacy = (location.pathname.startsWith('/portfolio') || location.pathname === '/') && location.hash.slice(1);
  const ids = ['pride','ascott','ginger','rcz','gtm','resultbull','vt','hyatt','radisson-mumbai','namah','oakwood','signum','citadines','archive'];
  const aliases = {identity:'resultbull',campaigns:'ascott',print:'ginger',additional:'archive',radisson:'rcz'};
  const project = aliases[legacy] || legacy;
  if (project && ids.includes(project)) { location.replace('/work/' + project + '/'); return; }
  if (legacy === 'workspace' || legacy === 'home') { location.replace(legacy === 'workspace' ? '/#work' : '/'); return; }
  const dialog = document.querySelector('.lightbox');
  const loadImage = img => {
    if (!img.dataset.src) return;
    if (img.dataset.srcset) {
      img.sizes = img.dataset.sizes;
      img.srcset = img.dataset.srcset;
      delete img.dataset.srcset;
      delete img.dataset.sizes;
    }
    img.src = img.dataset.src;
    delete img.dataset.src;
  };
  if ('IntersectionObserver' in window) {
    const images = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { loadImage(entry.target); images.unobserve(entry.target); }
    }), {rootMargin:'300px 0px'});
    const observeImages = () => document.querySelectorAll('img[data-src]').forEach(img => images.observe(img));
    const critical = document.querySelector('img[fetchpriority="high"]');
    if (critical && critical.getBoundingClientRect().top < innerHeight) critical.decode().catch(() => {}).finally(observeImages);
    else observeImages();
  } else document.querySelectorAll('img[data-src]').forEach(loadImage);
  let source;
  document.querySelectorAll('[data-art]').forEach(button => button.addEventListener('click', () => {
    source = button;
    const img = dialog.querySelector('img');
    img.src = button.dataset.art;
    img.alt = button.dataset.caption;
    img.style.setProperty('--natural-width', (button.querySelector('img').getAttribute('width') || 1500) + 'px');
    dialog.querySelector('.original-link').href = button.dataset.art;
    dialog.querySelector('p').textContent = button.dataset.caption;
    dialog.showModal();
    dialog.scrollTo(0,0);
  }));
  dialog.querySelector('.close-art').addEventListener('click', () => dialog.close());
  const zoom = dialog.querySelector('.zoom-art');
  zoom.addEventListener('click', () => {
    const active = dialog.classList.toggle('is-zoomed');
    zoom.setAttribute('aria-pressed', String(active));
    zoom.textContent = active ? 'Fit artwork' : 'Full size';
    if (!active) dialog.scrollTo(0,0);
  });
  dialog.addEventListener('close', () => {
    dialog.querySelector('img').removeAttribute('src');
    dialog.classList.remove('is-zoomed');
    zoom.setAttribute('aria-pressed','false');
    zoom.textContent = 'Full size';
    source?.focus({preventScroll:true});
  });
  // Load the original reel posters when the motion section approaches the viewport.
  const loadPoster = video => { if (video.dataset.poster) { video.poster = video.dataset.poster; delete video.dataset.poster; } };
  if ('IntersectionObserver' in window) {
    const posters = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { loadPoster(entry.target); posters.unobserve(entry.target); }
    }), {rootMargin:'500px 0px'});
    document.querySelectorAll('video[data-poster]').forEach(video => posters.observe(video));
  } else document.querySelectorAll('video[data-poster]').forEach(loadPoster);
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) { entry.target.classList.add('reveal-in'); observer.unobserve(entry.target); }
    }), {threshold:0.08});
    document.querySelectorAll('.work-card,.chapter-heading,.about-copy').forEach(el => observer.observe(el));
  }
  document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => { if(other !== video) other.pause(); })));
})();
