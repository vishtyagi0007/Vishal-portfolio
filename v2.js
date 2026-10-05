(() => {
  // Local QA measurements only; no analytics, storage or network transmission.
  if (new URLSearchParams(location.search).has('qa') && 'PerformanceObserver' in window) {
    let cls = 0;
    new PerformanceObserver(list => list.getEntries().forEach(entry => {
      if (!entry.hadRecentInput) cls += entry.value;
      document.documentElement.dataset.qaCls = String(cls);
    })).observe({type:'layout-shift',buffered:true});
    new PerformanceObserver(list => list.getEntries().forEach(entry => {
      document.documentElement.dataset.qaLcp = String(Math.round(entry.startTime));
    })).observe({type:'largest-contentful-paint',buffered:true});
  }
  const legacy = location.pathname.startsWith('/portfolio') && location.hash.slice(1);
  const ids = ['pride','ascott','ginger','rcz','gtm','resultbull','vt','hyatt','radisson-mumbai','namah','oakwood','signum','citadines','archive'];
  if (legacy && ids.includes(legacy)) { location.replace('/work/' + legacy + '/'); return; }
  const dialog = document.querySelector('.lightbox');
  let source;
  document.querySelectorAll('[data-art]').forEach(button => button.addEventListener('click', () => {
    source = button;
    const img = dialog.querySelector('img');
    img.src = button.dataset.art;
    img.alt = button.dataset.caption;
    dialog.querySelector('p').textContent = button.dataset.caption;
    dialog.showModal();
  }));
  dialog.querySelector('.close-art').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { dialog.querySelector('img').removeAttribute('src'); source?.focus({preventScroll:true}); });
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if(entry.isIntersecting) { entry.target.classList.add('reveal-in'); observer.unobserve(entry.target); }
    }), {threshold:0.08});
    document.querySelectorAll('.work-card,.chapter-heading,.about-copy').forEach(el => observer.observe(el));
  }
  document.querySelectorAll('video').forEach(video => video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => { if(other !== video) other.pause(); })));
})();
