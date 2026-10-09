"""Crop the photos out of 'Invasive Species Reference Guide.pdf' (an image-only PDF).
Each species slide uses the same layout, so fixed boxes work. Outputs go to photos/.
Usage: python crop_reference_guide.py <guide.pdf> <photo_dir>
Needs pdfimages (poppler) and Pillow.
"""
import os, subprocess, sys, tempfile
from PIL import Image

BOXES = {"main": (91, 319, 708, 1284), "a1": (1656, 514, 2050, 773), "a2": (2074, 514, 2467, 773),
         "a3": (1656, 984, 2050, 1243), "a4": (2074, 984, 2467, 1243)}   # on the 2560x1440 slide image
NAMES = [  # slide order in the guide -> file names used in content/transcribed/reference-guide.json
    ["loosestrife", "blue-vervain", "blazing-star", "obedient-plant", "swamp-milkweed"],
    ["periwinkle", "wild-blue-phlox", "partridgeberry", "allegheny-pachysandra", None],
]

pdf, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
tmp = tempfile.mkdtemp()
subprocess.run(["pdfimages", "-all", pdf, os.path.join(tmp, "p")], check=True)
for slide, names in enumerate(NAMES):
    im = Image.open(os.path.join(tmp, f"p-{slide:03d}.jpg"))
    for box, name in zip(BOXES.values(), names):
        if name:
            c = im.crop(box); c.thumbnail((800, 800)); c.save(os.path.join(out, name + ".jpg"), quality=82)
print("cropped", sum(1 for n in sum(NAMES, []) if n), "photos")
