"""Extract Appendix 3 (Invasive Species Best Management Practices) from the
NYBG Thain Family Forest Plan (2016) into structured JSON.

Deterministic text parsing only: every field is a verbatim excerpt of the PDF.
Usage: python extract_forest_plan.py <Forest-Plan-2016.pdf> <out.json>
Needs `pdftotext` (poppler) on PATH.
"""
import json, os, re, subprocess, sys

def poppler_pdftotext():
    """First pdftotext on PATH that is poppler, not xpdf (Git for Windows ships xpdf,
    which joins wrapped lines and breaks the header parsing)."""
    for d in os.environ.get("PATH", "").split(os.pathsep):
        for name in ("pdftotext", "pdftotext.exe"):
            exe = os.path.join(d, name)
            if os.path.isfile(exe):
                v = subprocess.run([exe, "-v"], capture_output=True, text=True)
                if "poppler" in (v.stdout + v.stderr).lower():
                    return exe
    sys.exit("poppler's pdftotext not found on PATH (xpdf's version does not work)")

PAGES = (85, 97)  # PDF pages holding Appendix 3 (printed pp. 79-91)
HEAD = re.compile(r"^(?P<sci>[A-Z][a-z]+ [^—]+)—(?P<common>[^—]+)—(?P<family>[A-Z][a-z]+(?:aceae|idae|ota))$")
SECTION = re.compile(r"^([abc])\. (.+)$")
FIELDS = {"Native range:": "native_range", "First record at Garden:": "first_record", "First Record at Garden:": "first_record",
          "Threat to Forest:": "threat", "Control:": "control"}

def text(pdf):
    out = subprocess.run([poppler_pdftotext(), "-enc", "UTF-8", "-f", str(PAGES[0]), "-l", str(PAGES[1]), pdf, "-"],
                         capture_output=True, encoding="utf-8", check=True).stdout
    keep = []
    for ln in out.splitlines():
        s = ln.strip().replace("\f", "")
        if not s or re.fullmatch(r"\d{1,3}", s) or s.startswith("Appendix 3:"):
            continue
        if keep and keep[-1].endswith("—"):
            keep[-1] += s  # species headers can wrap onto a second line
        else:
            keep.append(s)
    return keep

def parse(lines):
    species, cur, field, section = [], None, None, None
    for s in lines:
        m = SECTION.match(s)
        if m and len(s) < 60:
            section = m.group(2); continue
        h = HEAD.match(s)
        if h:
            sci = h["sci"].strip()
            names = [x.strip() for x in re.split(r",\s*(?=[A-Z])", sci)]
            cur = {"scientific_name": names[0],
                   "names_in_plan": names,
                   "common_name": h["common"].strip(), "family": h["family"],
                   "plan_section": section, "summary": "", "native_range": "",
                   "first_record": "", "threat": "", "control": ""}
            species.append(cur); field = "summary"; continue
        if cur is None:
            continue
        for label, key in FIELDS.items():
            if s.startswith(label):
                field = key; s = s[len(label):].strip(" :"); break
        cur[field] = (cur[field] + " " + s).strip()
    # A line ending in "-" is either a word split across lines ("dis- persed") or a real
    # suspended hyphen ("mammal- and water-dispersed"). Join only when the joined word
    # appears elsewhere in the appendix.
    vocab = set(re.findall(r"[a-z]+", " ".join(lines).lower()))
    def dehyphen(t):
        return re.sub(r"(\w+)- (\w+)", lambda m: m.group(1) + m.group(2)
                      if (m.group(1) + m.group(2)).lower() in vocab else m.group(0), t)
    for sp in species:
        for k in ("summary", "native_range", "first_record", "threat", "control"):
            sp[k] = dehyphen(re.sub(r"\s+", " ", sp[k])).strip()
        sp["source"] = "Thain Family Forest Plan (NYBG, 2016), Appendix 3"
    return species

if __name__ == "__main__":
    data = parse(text(sys.argv[1]))
    json.dump(data, open(sys.argv[2], "w"), indent=2, ensure_ascii=False)
    print(len(data), "species extracted")
