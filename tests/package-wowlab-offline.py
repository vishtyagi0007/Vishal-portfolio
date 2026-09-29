#!/usr/bin/env python3
"""Make fully offline opening-friendly VT original motion design studies.
Copies the actual unchanged image/video bytes already in the git repository.
DO NOT change the live homepage or original /portfolio files.
"""
from __future__ import annotations
import base64
import re
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "wowlab-2026"
DEST = ROOT / "offline-preview"
ASSETS = ROOT / "portfolio" / "assets"
OUTFILE = ROOT / "VT_2026_WOWLAB_offline_preview.zip"
PAGES = {
    "index.html": SOURCE / "index.html",
    "portal.html": SOURCE / "portal" / "index.html",
    "orbit.html": SOURCE / "orbit" / "index.html",
    "cut.html": SOURCE / "cut" / "index.html",
}

def make():
    if DEST.exists():
        shutil.rmtree(DEST)
    DEST.mkdir()
    (DEST / "assets").mkdir()
    original_sources = {}
    for filename, source in PAGES.items():
        body = source.read_text(encoding="utf-8")
        # This string path appears in static src, SVG images, CSS and JS concatenations.
        body = body.replace("/portfolio/assets/", "./assets/")
        body = body.replace("href=\"/wowlab-2026/\"", "href=\"./index.html\"")
        body = body.replace("href=\"./portal/\"", "href=\"./portal.html\"")
        body = body.replace("href=\"./orbit/\"", "href=\"./orbit.html\"")
        body = body.replace("href=\"./cut/\"", "href=\"./cut.html\"")
        # Deliberately point extra case-study links at already existing unchanged live archive.
        body = body.replace("/portfolio/#", "https://vishal-portfolio-bay.vercel.app/portfolio/#")
        body = body.replace('href="/portfolio/"', 'href="https://vishal-portfolio-bay.vercel.app/portfolio/"')
        # SVG <image href=file://...> commonly has local SVG origin restrictions in browsers.
        # Inline ONLY <image href="./assets/file">; HTML img/video stay local and unmodified.
        def inline_svg(match):
            name = match.group(1)
            path = ASSETS / name
            if not path.exists():
                raise RuntimeError("Missing original SVG-stage asset: " + name)
            mime = "image/webp" if name.lower().endswith(".webp") else "image/png"
            return '<image href="data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode() + '"'
        body = re.sub(r'<image href="\./assets/([A-Za-z0-9_.-]+)"', inline_svg, body)
        if filename == "portal.html":
            assert '<image href="data:image/webp;base64,' in body, "Portal mask has no embedded original artwork"
        if filename == "index.html":
            assert '<image href="data:image/webp;base64,' in body, "Hub original artwork mask not inlined"
        if filename == "orbit.html":
            assert '083-social-media-12.webp' in body, "Latest orbit expressive artwork is missing"
        if filename == "portal.html":
            assert "--full-o" in body, "Latest true full-artwork transition missing"
        (DEST / filename).write_text(body, encoding="utf-8")
        # Only source paths explicitly referenced by the four HTML, not arbitrary original library.
        for asset in re.findall(r'\./assets/([A-Za-z0-9_.-]+)', body):
            original_sources[asset] = ASSETS / asset

    for asset, source in sorted(original_sources.items()):
        if not source.exists():
            raise RuntimeError("Original artwork/video missing: " + str(source))
        shutil.copyfile(source, DEST / "assets" / asset)

    (DEST / "README_FIRST.txt").write_text(
        "VISHAL TYAGI — THREE ORIGINAL MOTION-FIRST STUDIES / 2026\n\n"
        "This is a private experimental preview. The live portfolio has NOT been edited.\n\n"
        "HOW TO OPEN ON WINDOWS OR MAC\n"
        "1. Extract the ZIP completely (right-click / Extract All).\n"
        "2. Double-click index.html to compare all three.\n"
        "3. Click a concept, use your mouse/trackpad wheel to see the actual motion.\n"
        "4. Original case-study links open the existing public portfolio when online.\n\n"
        "The original artworks and videos in this ZIP are copied byte-for-byte from\n"
        "Vishal Tyagi's existing portfolio repository. Original copyrights remain intact.\n"
        "The Google Fonts CSS may display fallback fonts without an Internet connection.\n",
        encoding="utf-8"
    )
    with zipfile.ZipFile(OUTFILE, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for file in sorted(DEST.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(DEST))
    with zipfile.ZipFile(OUTFILE) as archive:
        assert archive.testzip() is None, "Offline archive CRC verification failed"
    for page in PAGES:
        s = (DEST / page).read_text(encoding="utf-8")
        for asset in re.findall(r'\./assets/([A-Za-z0-9_.-]+)', s):
            assert (DEST / "assets" / asset).is_file(), (page, asset)
    print("OFFLINE PREVIEW OK: 4 separate fully usable HTML studies /", len(original_sources),
          "unchanged original assets /", OUTFILE.stat().st_size, "archive bytes")

if __name__ == "__main__":
    make()
