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
print("VT SHIFT OFFLINE PACKAGE: "+str(len(NAMES))+" untouched original media files.")
print("VT SHIFT OFFLINE PACKAGE: "+str(round(size/1e6,2))+" MB original assets, "+str(round(zip_path.stat().st_size/1e6,2))+" MB ZIP.")
