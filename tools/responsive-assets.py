from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1]
projects=json.loads((root/'data.js').read_text(encoding='utf-8').split('=',1)[1].rstrip(';\n\r '))
files={p['images'][0] for p in projects}
files.update(['vishal-hero-new-portrait.png','motion-selected.png','motion-vertical.jpg'])
dest=root/'media';dest.mkdir(exist_ok=True)
result={}
for name in sorted(files):
 source=root/'portfolio/assets'/name
 if source.suffix=='.svg':continue
 original=source.read_bytes()
 with Image.open(source) as im:
  variants=[]
  widths=sorted({min(640,im.width),min(1000,im.width)})
  for width in widths:
   height=round(im.height*width/im.width)
   scaled=im.resize((width,height),Image.Resampling.LANCZOS) if width<im.width else im.copy()
   output=dest/(source.stem+f'-{width}.webp')
   options={'quality':90,'method':6}
   if im.info.get('icc_profile'):options['icc_profile']=im.info['icc_profile']
   scaled.save(output,'WEBP',**options)
   if output.stat().st_size<len(original):
    variants.append({'width':width,'url':'/media/'+output.name,'bytes':output.stat().st_size})
  if variants:result[name]={'sourceSha256':hashlib.sha256(original).hexdigest(),'originalBytes':len(original),'variants':variants}
  assert source.read_bytes()==original
(root/'responsive-images.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps({'sources':len(result),'copies':sum(len(v['variants']) for v in result.values()),'firstArtwork':result['008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp'],'poster':result['motion-selected.png']},indent=2))
