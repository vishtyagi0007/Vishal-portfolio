from pathlib import Path
import re,shutil,zipfile,os

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"vt-shift"
DEST=ROOT/"dist"/"vt-shift"
ASSETS=ROOT/"portfolio"/"assets"
NAMES=[
"vishal-tyagi-mark.svg","vishal-hero-new-portrait.png","Vishal-Tyagi-Resume.pdf",
"motion-selected.mp4","resultbull.svg","gtm.svg",
"001-ascott-discover-asr-india-01.webp","002-ascott-discover-asr-india-02.webp",
"003-ascott-discover-asr-india-03.webp","004-ascott-discover-asr-india-04.webp",
"008-pride-vacation-vibes-with-pride-campaign-creatives-01.webp",
"009-pride-vacation-vibes-with-pride-campaign-creatives-02.webp",
"010-pride-vacation-vibes-with-pride-campaign-creatives-03.webp",
"022-rcz-weekend-buffet-carnival-1.webp","023-rcz-weekend-buffet-carnival-2.webp",
"024-rcz-weekend-buffet-carnival-3.webp"
]
if DEST.exists():shutil.rmtree(DEST)
DEST.mkdir(parents=True)
(DEST/"assets").mkdir()
for name in NAMES:
    src=ASSETS/name
    if not src.is_file():raise FileNotFoundError(src)
    shutil.copy2(src,DEST/"assets"/name)
shutil.copy2(SOURCE/"shift.css",DEST/"shift.css")
html=(SOURCE/"index.html").read_text()
js=(SOURCE/"shift.js").read_text()
html=html.replace("/portfolio/assets/","./assets/")
html=html.replace('href="/portfolio/"','href="https://vishal-portfolio-bay.vercel.app/portfolio/"')
js=js.replace('const BASE="/portfolio/assets/";','const BASE="./assets/";')
js=js.replace('archive:"/portfolio/#','archive:"https://vishal-portfolio-bay.vercel.app/portfolio/#')
(DEST/"index.html").write_text(html)
(DEST/"shift.js").write_text(js)
(DEST/"README.txt").write_text(
"VT/SHIFT / PRIVATE 2026 INTERACTIVE PROTOTYPE\n"
"Extract the ZIP into a folder. Open index.html using Chrome or Edge.\n"
"All original design artwork, photos, reel and resume in this local demo are preserved.\n"
"An internet connection loads the optional Google typography and external original archive links.\n"
"Controls: tap/click one of five projects, swipe artwork on phone, or use 1-5 on keyboard;\n"
"select EXPLORE CASE for fullscreen original image galleries, ESC to close.\n"
"This preview does not update or replace the live production website.\n"
)
zip_path=ROOT/"dist"/"VT_SHIFT_OFFLINE_DEMO.zip"
with zipfile.ZipFile(zip_path,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for file in DEST.rglob("*"):
        if file.is_file():archive.write(file,arcname=str(Path("VT_SHIFT_DEMO")/file.relative_to(DEST)))
size=sum((DEST/"assets"/name).stat().st_size for name in NAMES)
# An independently testable, self-contained one-file alternative.
# Keep all original bytes, including the optional original motion reel and resume.
import base64,mimetypes
css_inline=(DEST/"shift.css").read_text()
js_inline=(DEST/"shift.js").read_text()
one_html=(DEST/"index.html").read_text()
one_html=one_html.replace('<link rel="stylesheet" href="./shift.css">',"<style>\n"+css_inline+"\n</style>")
one_html=one_html.replace('<script src="./shift.js" defer></script>',"")
data={}
for filename in NAMES:
    mime=mimetypes.guess_type(filename)[0] or "application/octet-stream"
    data[filename]="data:"+mime+";base64,"+base64.b64encode((DEST/"assets"/filename).read_bytes()).decode("ascii")
def inline_asset(match):
    filename=match.group(1)
    if filename not in data:raise ValueError("Unexpected local asset: "+filename)
    return data[filename]
one_html=re.sub(r'\./assets/([A-Za-z0-9_.-]+)',inline_asset,one_html)
js_inline=js_inline.replace('const BASE="./assets/";','const BASE="";')
for filename,uri in data.items():
    js_inline=js_inline.replace('"'+filename+'"','"'+uri+'"')
one_html=one_html.replace("</body>","<script>\n"+js_inline+"\n</script>\n</body>")
standalone=ROOT/"dist"/"VT_SHIFT_STANDALONE.html"
standalone.write_text(one_html)
assert "./assets/" not in one_html and "data:video/mp4;base64," in one_html
print("VT SHIFT STANDALONE: "+str(round(standalone.stat().st_size/1e6,2))+" MB one-file HTML with all 16 original media assets.")
print("VT SHIFT OFFLINE PACKAGE: "+str(len(NAMES))+" untouched original media files.")
print("VT SHIFT OFFLINE PACKAGE: "+str(round(size/1e6,2))+" MB original assets, "+str(round(zip_path.stat().st_size/1e6,2))+" MB ZIP.")
