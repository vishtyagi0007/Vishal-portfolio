from pathlib import Path
import html,json

root=Path(__file__).resolve().parents[1]
projects=json.loads((root/'data.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n\r '))
sizes=json.loads((root/'art-sizes.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n\r '))
responsive=json.loads((root/'responsive-images.json').read_text(encoding='utf-8')) if (root/'responsive-images.json').exists() else {}
A='/portfolio/assets/'
selected=['pride','ascott','ginger','rcz','gtm']
headings={'pride':'A place. A flavour. A feeling.','ascott':'An invitation to discover.','ginger':'A destination, on paper.','rcz':'A weekend worth gathering for.','gtm':'Built to connect.','resultbull':'A mark with conviction.','vt':'A signature of my own.','hyatt':'Everyday rituals, reimagined.','radisson-mumbai':'Food becomes a destination.','namah':'Room for a little indulgence.','oakwood':'Reasons to celebrate.','signum':'An invitation to get away.','citadines':'An occasion, at full scale.','archive':'Further explorations.'}
chapters={
 'pride':[(0,'Vacation vibes','Destination photography and the folded-corner motif connect a place to the experience inside.'),(5,'At the table','A warmer palette, large food imagery and event-led typography bring the dining collection together.'),(10,'Moments together','Festive greetings and guest communication complete the hospitality collection.')],
 'ascott':[(0,'The India collection','Landmarks, landscapes and travel imagery share a consistent blue backdrop.'),(4,'The next destination','The September pair develops the travel collage into a new composition.')],
 'ginger':[(0,'The destination cover','A sequence of landscape panels leads the eye down the original cover.'),(1,'The destination, opened up','Full destination photography and large typography extend the Srinagar story.')],
 'rcz':[(0,'The buffet carnival','Four compositions explore the same event through food, scale and a saturated yellow field.')],
 'hyatt':[(0,'Wellness & dining','The original seasonal creative collection, from wellness to dining.'),(2,'Shared occasions','Friendship, celebration and the next dining moment.')],
 'radisson-mumbai':[(0,'Regional flavours','The Konkan and Kerala dining compositions.'),(2,'A different perspective','The original photowalk pair.')],
 'archive':[(0,'Hospitality & occasions','Additional original artwork, in supplied order.'),(25,'Social compositions','A wider set of visual explorations.'),(35,'The personal collection','Original Vishal artwork.')]
}
details={
 'pride':('Two worlds, one frame.','The folded corner reveals a second view inside the destination photograph. It is a small change in the image that makes the invitation feel layered.'),
 'ascott':('A destination in a shape.','Travel imagery gathers around one focal composition. The blue field keeps the series connected while the landmarks and landscapes change.'),
 'ginger':('A cover that unfolds.','Overlapping landscape panels create a vertical rhythm. The eye moves from the name and destination into the scenery, then down the page.'),
 'rcz':('Food takes the lead.','A generous food image and oversized weekend typography establish the hierarchy. Yellow holds the campaign family together across the variations.')
}
outcomes={'pride':('From a stay to a celebration.','A hospitality collection spanning destination creatives, food festival posters and festive guest communication.'),'ascott':('Travel, in a connected visual language.','Original campaign compositions spanning the Discover ASR India and September collections.'),'ginger':('A destination with a distinct voice.','A destination cover and supporting launch compositions for Ginger Srinagar.'),'rcz':('A flexible family for a weekend feast.','Four original campaign compositions for the weekend buffet carnival.'),'gtm':('One mark. A point of connection.','An original visual identity for a B2B buyer–seller platform.')}

def esc(value):return html.escape(str(value),quote=True)

def image(file,alt,lazy=True,cls='',transition='',context='gallery'):
 w,h=sizes.get(file,[1000,1000]);w,h=int(w),int(h)
 style=f'aspect-ratio:{w}/{h};'+(f'view-transition-name:{transition};' if transition else '')
 common=f'alt="{esc(alt)}" width="{w}" height="{h}" decoding="async" style="{style}"'
 sizes_attr={'card':'(max-width:600px) calc(100vw - 56px), (max-width:900px) calc((100vw - 112px) / 2), 620px','hero':'(max-width:600px) calc(100vw - 60px), 800px','gallery':'(max-width:600px) calc(100vw - 64px), (max-width:900px) calc((100vw - 120px) / 2), 640px'}[context]
 variants=responsive.get(file,{}).get('variants',[])
 srcset=', '.join(v['url']+' '+str(v['width'])+'w' for v in variants if v['width']<w)
 if variants:srcset+=(', ' if srcset else '')+(variants[-1]['url'] if variants[-1]['width']==w else A+file)+f' {w}w'
 res=f'srcset="{srcset}" sizes="{sizes_attr}"' if srcset else ''
 if not lazy:return f'<img class="{cls}" src="{A+file}" {res} {common} loading="eager" fetchpriority="high">'
 placeholder=f'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22{w}%22 height=%22{h}%22%3E%3C/svg%3E'
 deferred=f'data-srcset="{srcset}" data-sizes="{sizes_attr}"' if srcset else ''
 return f'<img class="deferred-image {cls}" src="{placeholder}" data-src="{A+file}" {deferred} {common} loading="lazy" fetchpriority="low"><noscript><img class="{cls}" src="{A+file}" {res} {common} loading="lazy"></noscript>'

def shell(body,title='Vishal Tyagi — Graphic & Motion Designer',first_art=None):
 # Image discovery is immediate in static HTML; source selection stays responsive.
 preload=''
 return f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#006D77">
<meta name="description" content="Original identities, hospitality campaigns, print and motion by Vishal Tyagi. Available for full-time opportunities and freelance projects.">
<title>{esc(title)}</title><link rel="icon" href="{A}vishal-tyagi-mark.svg">{preload}
<script>document.documentElement.classList.add("enhanced")</script>
<link rel="stylesheet" href="/v2.css"><script src="/v2.js" defer></script>
</head><body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
 <a class="brand" href="/" aria-label="Vishal Tyagi home"><img src="{A}vishal-tyagi-mark.svg" width="40" height="40" alt="VT"><span>VISHAL TYAGI<small>GRAPHIC & MOTION DESIGNER</small></span></a>
 <nav aria-label="Main navigation"><a href="/#work">Work</a><a href="/#about" class="nav-about">About</a><a class="contact-link" href="/#contact">Let’s talk <span aria-hidden="true">↗</span></a></nav>
</header>
{body}
<footer class="footer"><a href="/" aria-label="Back to home">VISHAL TYAGI</a><span>NOIDA, INDIA</span><span>VT.OS / CREATIVE PRACTICE · 2026</span><a href="#main">Back to top ↑</a></footer>
<dialog class="lightbox" aria-label="Artwork viewer" aria-describedby="art-caption">
 <div class="lightbox-toolbar"><a class="original-link" href="#" target="_blank" rel="noopener">Open original ↗</a><button class="zoom-art" aria-pressed="false">Full size</button><button class="close-art" autofocus>Close ×</button></div>
 <img alt=""><p id="art-caption"></p>
</dialog>
</body></html>'''

def card(p,i):
 return f'''<article class="work-card card-{p['id']}">
 <a href="/work/{p['id']}/" class="project-link" aria-label="View {esc(p['name'])} project">
  <div class="card-art">{image(p['images'][0],p['name']+' — original artwork',i>0,transition='work-'+p['id'],context='card')}<span class="open-label">View project <span aria-hidden="true">↗</span></span></div>
  <div class="card-caption"><span class="index">{i+1:02d}</span><div><h3>{esc(p['name'])}</h3><p>{esc(p['category'])}</p></div><span class="card-arrow" aria-hidden="true">↗</span></div>
 </a></article>'''

cards=''.join(card(next(p for p in projects if p['id']==id),i) for i,id in enumerate(selected))
archive=''.join(f'<a href="/work/{p["id"]}/"><span>{esc(p["name"])}</span><small>{esc(p["category"])}</small><span aria-hidden="true">↗</span></a>' for p in projects if p['id'] not in selected)
poster_selected=responsive.get('motion-selected.png',{}).get('variants',[{'url':A+'motion-selected.png'}])[-1]['url']
poster_vertical=responsive.get('motion-vertical.jpg',{}).get('variants',[{'url':A+'motion-vertical.jpg'}])[-1]['url']
home=f'''<main id="main" tabindex="-1">
<section class="hero wrap">
 <div class="hero-meta"><span>VISHAL TYAGI / CREATIVE PRACTICE</span><span class="status">OPEN TO FULL-TIME & FREELANCE</span></div>
 <h1>Make it<br><em>mean something.</em><span class="hero-star" aria-hidden="true">✳</span></h1>
 <div class="hero-bottom"><p>I’m Vishal. Graphic & motion designer.<br class="desktop-break"> Identities, campaigns and motion—with a point of view.</p><a class="text-link" href="#work">Explore the work <span aria-hidden="true">↓</span></a></div>
</section>
<section id="work" class="work wrap">
 <div class="section-heading"><div><span class="eyebrow">01 / THE PORTFOLIO</span><h2>Selected work.</h2></div><p>Campaigns / Identity / Print</p></div>
 <div class="work-grid">{cards}</div>
 <details class="archive"><summary>More from the studio <span aria-hidden="true">＋</span></summary><div class="archive-grid">{archive}</div></details>
</section>
<section id="motion" class="motion-section"><div class="wrap">
 <div class="section-heading"><div><span class="eyebrow">02 / MOTION REEL</span><h2>Ideas don’t<br>stand still.</h2></div><p>Colour, rhythm and a little personality.<br>Selected original motion work.</p></div>
 <div class="motion-grid"><figure><video controls playsinline preload="none" data-poster="{poster_selected}" aria-label="Selected motion work"><source src="{A}motion-selected.mp4" type="video/mp4"></video><figcaption><span>01 / SELECTED MOTION</span><span>Play with sound, if you like.</span></figcaption></figure>
 <figure class="vertical-reel"><video controls playsinline preload="none" data-poster="{poster_vertical}" aria-label="Vertical motion work"><source src="{A}motion-vertical.mp4" type="video/mp4"></video><figcaption>02 / VERTICAL MOTION</figcaption></figure></div>
</div></section>
<section id="about" class="about wrap">
 <div class="portrait">{image('vishal-hero-new-portrait.png','Vishal Tyagi — original portrait')}<span>THE HUMAN BEHIND THE WORK</span></div>
 <div class="about-copy"><span class="eyebrow">03 / ABOUT</span><h2>Vishal, in person.</h2><p class="lead">Senior Graphic & Motion Designer.<br>Based in Noida, India.</p><p>8+ years of design practice across visual identities, hospitality campaigns, print and motion. I care about the idea as much as the finish.</p><ul class="capabilities"><li>Visual identity <span>01</span></li><li>Campaign & print design <span>02</span></li><li>Art direction <span>03</span></li><li>Motion design <span>04</span></li></ul><a class="text-link" href="{A}Vishal-Tyagi-Resume.pdf" target="_blank" rel="noopener" aria-label="View résumé PDF in a new tab">View résumé <span aria-hidden="true">↗</span></a></div>
</section>
<section id="contact" class="contact"><div class="wrap">
 <span class="eyebrow">04 / LET’S WORK TOGETHER</span><span class="status">FULL-TIME OPPORTUNITIES & FREELANCE PROJECTS</span>
 <h2>Good things<br>start with <em>a hello.</em></h2>
 <div class="contact-bottom"><p>A role, a brief, an idea.<br>I’d love to hear what you have in mind.</p><a class="contact-button" href="https://wa.me/917409219402?text=Hi%20Vishal%2C%20I%27d%20like%20to%20discuss%20a%20design%20opportunity%20or%20project." target="_blank" rel="noopener">Let’s talk <span aria-hidden="true">↗</span><small>CONTACT ON WHATSAPP</small></a></div>
</div></section></main>'''
first=next(p for p in projects if p['id']==selected[0])['images'][0]
(root/'index.html').write_text(shell(home,first_art=first),encoding='utf-8')
(root/'portfolio/index.html').write_text(shell(home,first_art=first),encoding='utf-8')

def artwork(p,n,opening=False):
 file=p['images'][n];alt=f'{p["name"]} — original artwork {n+1}'
 transition='work-'+p['id'] if opening and p['id'] in selected else ''
 return f'''<figure class="exhibit-art {'opening-art' if opening else ''}"><button class="art-button" data-art="{A+file}" data-caption="{esc(alt)}" aria-label="Enlarge {esc(alt)}">{image(file,alt,not opening,transition=transition,context='hero' if opening else 'gallery')}<span class="enlarge">Enlarge ↗</span></button><figcaption><span>{n+1:02d} / {esc(p['category'])}</span><span>ORIGINAL ARTWORK</span></figcaption></figure>'''

for idx,p in enumerate(projects):
 id=p['id'];segments=chapters.get(id,[(0,'The collection',p['description'])]);exhibits=[]
 for j,(start,title,context) in enumerate(segments):
  end=segments[j+1][0] if j+1<len(segments) else len(p['images'])
  figures=[artwork(p,n) for n in range(max(1,start),end)]
  if figures:exhibits.append(f'<section class="chapter"><div class="chapter-heading"><span class="eyebrow">{j+1:02d} / {esc(title)}</span><p>{esc(context)}</p></div><div class="art-grid {"single" if len(figures)==1 else ""}">{"".join(figures)}</div></section>')
  if j==0 and id in details:
   title,note=details[id];file=p['images'][0]
   exhibits.append(f'<section class="detail-study"><div><span class="eyebrow">THE VISUAL APPROACH</span><h2>{title}</h2><p>{note}</p><a class="text-link" href="{A+file}" target="_blank" rel="noopener">View complete artwork ↗</a></div><figure><div class="detail-crop">{image(file,p["name"]+" — enlarged composition detail")}</div><figcaption>DETAIL / ORIGINAL COMPOSITION</figcaption></figure></section>')
 if id in ['gtm','resultbull','vt']:
  note={'gtm':'A lowercase wordmark becomes a meeting of human forms. Blue and burgundy separate the figures, while the LEADS line anchors the name.','resultbull':'A compact symbol, a wordmark and the original “Built For Growth” signature. The same original mark is shown at different presentation scales.','vt':'A personal monogram with the clarity to work as a small signature and a large graphic. The original logo is shown at both scales.'}[id]
  exhibits.append(f'<section class="identity-study"><div><span class="eyebrow">FORM / SCALE</span><h2>A mark, in proportion.</h2><p>{note}</p></div><div class="identity-applications"><figure class="identity-sheet">{image(p["images"][0],p["name"]+" — original logo, large scale")}<figcaption>01 / LARGE SCALE</figcaption></figure><figure class="identity-card">{image(p["images"][0],p["name"]+" — original logo, small scale")}<figcaption>02 / SMALL SCALE</figcaption></figure></div><p class="study-note">Scale studies of the original identity. Presentation only.</p></section>')
 nextp=projects[(idx+1)%len(projects)];out_title,out_copy=outcomes.get(id,(headings[id],p['description']))
 body=f'''<main id="main" tabindex="-1" class="case project-{id}">
<div class="case-top wrap"><a class="text-link" href="/#work">← Selected work</a><span class="eyebrow">VT.OS / PROJECT EXHIBITION</span></div>
<section class="case-intro wrap"><span class="eyebrow">{esc(p['category'])} / {idx+1:02d}</span><h1>{esc(headings[id])}</h1><div class="case-context"><h2>{esc(p['name'])}</h2><p>{esc(p['description'])}</p><dl><dt>DISCIPLINE</dt><dd>{esc(p['category'])}</dd><dt>FORMAT</dt><dd>{len(p['images'])} original composition{'s' if len(p['images'])!=1 else ''}</dd></dl></div></section>
<div class="exhibition wrap">{artwork(p,0,True)}{''.join(exhibits)}</div>
<section class="outcome wrap"><span class="eyebrow">THE OUTCOME / DESIGN OUTPUT</span><h2>{esc(out_title)}</h2><p>{esc(out_copy)}</p></section>
<a class="next-project" href="/work/{nextp['id']}/"><div class="wrap"><span class="eyebrow">NEXT PROJECT</span><h2>{esc(nextp['name'])}<span aria-hidden="true">↗</span></h2>{image(nextp['images'][0],nextp['name']+' preview')}</div></a>
<div class="case-contact wrap"><p>Have a project or opportunity in mind?</p><a class="text-link" href="/#contact">Let’s talk ↗</a></div>
</main>'''
 dest=root/'work'/id;dest.mkdir(parents=True,exist_ok=True)
 (dest/'index.html').write_text(shell(body,p['name']+' — Vishal Tyagi',p['images'][0]),encoding='utf-8')
print('Generated artwork-first home and',len(projects),'static exhibitions')
