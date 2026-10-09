"""Run the whole content pipeline: source files -> build/*.json -> site data.

Run from the 'NY Botanical Gardens' folder:
    python guide-build-kit/tools/build_data.py            public edition -> nybg-guide/ (what GitHub publishes)
    python guide-build-kit/tools/build_data.py --staff    also the internal edition -> staff-edition/ (git ignores it)

Steps (each step is its own script, so any one can be rerun or replaced):
  1. extract_forest_plan.py  Forest Plan PDF, Appendix 3  -> build/forest_plan.json
  2. extract_info_pages.py   ENV 221 info-page .pptx decks -> build/info_pages.json (+ photos)
     crop_reference_guide.py  Reference Guide PDF photos     -> photos/
  3. extract_cascade.js      every *-cascade.html page     -> build/cascade_<name>.json
  4. fetch_public_photos.py  content/public-sources.json   -> photos/public/ (+ credits.json)
     extract_public_sources.py sources/public/ documents     -> build/public_sources.json
     build_species.py        NYBG list + all of the above  -> build/species.json
  5. make_webs.py            species.json + content/web-rules.json -> build/webs.json
  6. bundle_site_data.py     build/ + content/ -> nybg-guide/data/guide-data.js + nybg-guide/assets/
Nothing in this pipeline writes or paraphrases text: it only copies and tags it.
Needs: Python 3 with openpyxl and python-pptx, poppler's pdftotext, Node.js.
"""
import glob, os, subprocess, sys

# Windows defaults to cp1252; every step reads and writes UTF-8, so rerun in UTF-8 mode
# (child scripts inherit it through PYTHONUTF8).
if not sys.flags.utf8_mode:
    os.environ["PYTHONUTF8"] = "1"
    sys.exit(subprocess.run([sys.executable, "-X", "utf8"] + sys.argv).returncode)

ROOT = os.getcwd()                                   # the NY Botanical Gardens folder
KIT = os.path.join(ROOT, "guide-build-kit")
T = os.path.join(KIT, "tools")
B = os.path.join(KIT, "build")
os.makedirs(B, exist_ok=True)
py = sys.executable
STAFF = "--staff" in sys.argv   # also build the internal edition with the whole NYBG list (never published)

def run(*cmd):
    print("$", " ".join(os.path.relpath(c, ROOT) if os.path.exists(c) else c for c in cmd))
    subprocess.run(cmd, check=True)

run(py, os.path.join(T, "extract_forest_plan.py"), os.path.join(ROOT, "NYBG Resources", "Forest-Plan-2016.pdf"), os.path.join(B, "forest_plan.json"))
decks = glob.glob(os.path.join(ROOT, "*Info Page*.pptx")) + glob.glob(os.path.join(KIT, "content", "info-pages", "*.pptx"))
for i, deck in enumerate(decks):
    run(py, os.path.join(T, "extract_info_pages.py"), deck, os.path.join(B, f"info_pages_{i}.json"), os.path.join(KIT, "photos"))
guide = os.path.join(ROOT, "Invasive Species Reference Guide.pdf")
if os.path.exists(guide):   # image-only PDF: photos are cropped, text lives in content/transcribed/
    run(py, os.path.join(T, "crop_reference_guide.py"), guide, os.path.join(KIT, "photos"))
# merge all info-page extractions into one file
import json
pages = []
for f in sorted(glob.glob(os.path.join(B, "info_pages_*.json"))):
    pages += json.load(open(f))
json.dump(pages, open(os.path.join(B, "info_pages.json"), "w"), indent=2, ensure_ascii=False)
for page in glob.glob(os.path.join(ROOT, "*-cascade.html")):
    name = os.path.basename(page).replace("-cascade.html", "")
    run("node", os.path.join(T, "extract_cascade.js"), page, os.path.join(B, f"cascade_{name}.json"))
# Public sources: photos from Wikimedia Commons (only missing ones are downloaded), text from sources/public/
run(py, os.path.join(T, "fetch_public_photos.py"), KIT)
run(py, os.path.join(T, "extract_public_sources.py"), KIT)
XLSX = os.path.join(ROOT, "NYBG Resources", "Appendix5_Categories1&2_ForStaffHub_2026.xlsx")
run(py, os.path.join(T, "build_species.py"), KIT, XLSX, os.path.join(B, "species.json"))
run(py, os.path.join(T, "make_webs.py"), KIT)
run(py, os.path.join(T, "bundle_site_data.py"), KIT, os.path.join(ROOT, "nybg-guide"))
if STAFF:
    # Internal edition with the whole NYBG list: build/species_staff.json + staff-edition/ (both ignored by git)
    run(py, os.path.join(T, "build_species.py"), KIT, XLSX, os.path.join(B, "species_staff.json"), "--staff")
    run(py, os.path.join(T, "bundle_site_data.py"), KIT, os.path.join(ROOT, "nybg-guide"), "--staff")
    print("Staff edition (internal, do not publish): staff-edition/index.html")
print("Done. Outputs in guide-build-kit/build/ and nybg-guide/data/")
