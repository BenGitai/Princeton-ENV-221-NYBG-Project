"""Fill gaps from public sources: copies spans word for word out of the public-domain documents in
guide-build-kit/sources/public/, as listed in content/public-sources.json, and tags each with its citation.

Each text field in public-sources.json names a source, its pages (PDF) and a short `from` phrase and `to`
phrase; this script copies everything from the start of `from` to the end of `to`. If a phrase is not found
the build stops, so nothing is ever retyped or paraphrased.

Cleaning applied before matching (listed per source in public-sources.json, so it is visible):
  drop_lines  regexes for whole lines to drop (page numbers, the booklet's side tabs)
  drop_text   strings removed wherever they appear (photo credits printed inside the text column)
  drop_regex  regexes removed (reference numbers like "[21]", "(figure 1)")
  joins       line-break hyphenations to rejoin when the word is not used elsewhere in the source
Usage:
  python extract_public_sources.py <guide-build-kit dir>            -> build/public_sources.json
  python extract_public_sources.py <guide-build-kit dir> --dump <source id> [first page] [last page]
"""
import html, json, os, re, subprocess, sys

def poppler_pdftotext():
    for d in os.environ.get("PATH", "").split(os.pathsep):
        for name in ("pdftotext", "pdftotext.exe"):
            exe = os.path.join(d, name)
            if os.path.isfile(exe):
                v = subprocess.run([exe, "-v"], capture_output=True, text=True)
                if "poppler" in (v.stdout + v.stderr).lower():
                    return exe
    sys.exit("poppler's pdftotext not found on PATH")

def norm(t):
    return re.sub(r"\s+", " ", t).strip()

class Source:
    def __init__(self, kit, sid, cfg):
        self.id, self.cfg = sid, cfg
        self.path = os.path.join(kit, cfg["file"])
        self.cache = {}
        self.vocab = None

    def _clean_lines(self, lines):
        out = []
        for ln in lines:
            if any(re.search(p, ln) for p in self.cfg.get("drop_lines", [])):
                continue
            for t in self.cfg.get("drop_text", []):
                ln = ln.replace(t, " ")
            out.append(ln.rstrip())
        return out

    def _finish(self, text):
        for p in self.cfg.get("drop_regex", []):
            text = re.sub(p, "", text)
        text = norm(text)
        for a, b in self.cfg.get("joins", {}).items():
            text = text.replace(a, b)
        if self.cfg.get("dehyphenate"):
            if self.vocab is None:
                # words split by a line-break hyphen stay split here, so they only count if used whole elsewhere
                self.vocab = set(re.findall(r"[a-z]+", re.sub(r"-\s*\n\s*", "-", self.raw_all()).lower()))
            def rejoin(m):
                a, b = m.group(1), m.group(2)
                if (a + b).lower() in self.vocab:
                    return a + b          # a word split across lines: "ter- minal" -> "terminal"
                if b in ("and", "or", "to"):
                    return m.group(0)     # a suspended hyphen: "mammal- and water-dispersed"
                return a + "-" + b        # a hyphenated word broken at its hyphen: "wind- pollinated"
            text = re.sub(r"\b([A-Za-z]+)- ([a-z]+)\b", rejoin, text)
        return text

    def raw_all(self):
        if self.cfg["type"] == "pdf":
            # -layout keeps line-break hyphens as printed, so the word list only holds words the source really uses
            return subprocess.run([poppler_pdftotext(), "-enc", "UTF-8", "-layout", self.path, "-"], capture_output=True, encoding="utf-8").stdout
        return self.html_text()

    def html_text(self):
        with open(self.path, "rb") as f:
            raw = f.read().decode(self.cfg.get("encoding", "utf-8"), errors="replace")
        raw = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", raw)
        raw = re.sub(r"<[^>]+>", " ", raw)
        return html.unescape(raw)

    def text(self, pages=None):
        key = tuple(pages or ())
        if key in self.cache:
            return self.cache[key]
        if self.cfg["type"] == "pdf":
            lines = []
            for p in pages:
                out = subprocess.run([poppler_pdftotext(), "-enc", "UTF-8", "-layout", "-f", str(p), "-l", str(p), self.path, "-"],
                                     capture_output=True, encoding="utf-8").stdout
                lines += self._clean_lines(out.splitlines())
            text = self._finish("\n".join(lines))
        else:
            text = self._finish(self.html_text())
            text = re.sub(r"\s+([,.;:)])", r"\1", text)
            text = re.sub(r"([(\[])\s+", r"\1", text)   # tag stripping leaves "( Adelges"
        self.cache[key] = text
        return text

    def cite(self, pages=None):
        c = self.cfg["cite"]
        if pages and self.cfg["type"] == "pdf":
            off = self.cfg.get("printed_page_offset", 0)
            printed = sorted({p + off for p in pages})
            c += ", p. " + "-".join(str(x) for x in (printed if len(printed) == 1 else [printed[0], printed[-1]]))
        return c + " (" + self.cfg["rights"] + ")"

def span(src, spec):
    t = src.text(spec.get("pages"))
    i = t.find(spec["from"])
    if i < 0:
        sys.exit(f"[{src.id} p{spec.get('pages')}] start phrase not found: {spec['from']!r}")
    j = t.find(spec["to"], i)
    if j < 0:
        sys.exit(f"[{src.id} p{spec.get('pages')}] end phrase not found after start: {spec['to']!r}")
    return t[i:j + len(spec["to"])]

def main(kit, *args):
    cfg = json.load(open(os.path.join(kit, "content/public-sources.json"), encoding="utf-8"))
    sources = {k: Source(kit, k, v) for k, v in cfg["sources"].items()}
    if args and args[0] == "--dump":
        s = sources[args[1]]
        pages = list(range(int(args[2]), int(args[3]) + 1)) if len(args) > 3 else None
        print(s.text(pages)); return
    credits_path = os.path.join(kit, "photos", "public", "credits.json")
    credits = json.load(open(credits_path, encoding="utf-8")) if os.path.exists(credits_path) else {}

    def text_field(spec):
        src = sources[spec["source"]]
        return {"text": span(src, spec), "source": src.cite(spec.get("pages"))}

    def photo(spec):
        c = credits.get(spec["file"])
        if not c:
            print("  photo not downloaded yet (run fetch_public_photos.py):", spec["file"]); return None
        return {"file": "public/" + spec["file"], "credit": c["credit"]}

    out = {"species": {}, "swap_photos": {}}
    for sid, entry in cfg["species"].items():
        rec = {}
        for key in ("summary", "impact"):
            if key in entry:
                rec[key] = text_field(entry[key])
        if "checklist" in entry:
            ck = entry["checklist"]; src = sources[ck["source"]]
            rec["checklist"] = {"items": [span(src, dict(it, pages=ck.get("pages"))) for it in ck["items"]],
                                "source": src.cite(ck.get("pages"))}
        if "seasons" in entry:
            rec["seasons"] = [{"months": s["months"], "look": span(sources[s["source"]], s),
                               "source": sources[s["source"]].cite(s.get("pages"))} for s in entry["seasons"]]
        if "natives" in entry:
            rec["natives"] = text_field(entry["natives"])
        if "photo" in entry:
            p = photo(entry["photo"])
            if p: rec["photo"] = p
        out["species"][sid] = rec
    for name, spec in cfg.get("swap_photos", {}).items():
        p = photo(spec)
        if p: out["swap_photos"][name] = p
    dst = os.path.join(kit, "build", "public_sources.json")
    json.dump(out, open(dst, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    n = sum(len(v) for v in out["species"].values())
    print(f"public sources: {n} fields for {len(out['species'])} species, {len(out['swap_photos'])} swap photos")

if __name__ == "__main__":
    main(*sys.argv[1:])
