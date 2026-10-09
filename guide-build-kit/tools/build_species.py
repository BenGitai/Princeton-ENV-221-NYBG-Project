"""Merge every source into one species.json. No text is written or rewritten here:
each field is copied from a source file and tagged with where it came from.

Inputs (paths relative to the build kit):
  NYBG list   ../NYBG Resources/Appendix5_Categories1&2_ForStaffHub_2026.xlsx  -> names, category, regulatory sources
  Forest Plan build/forest_plan.json  (extract_forest_plan.py)                 -> summary, range, first record, threat, control
  Info pages  build/info_pages.json   (extract_info_pages.py) + content/transcribed/*.json -> impact, native alternatives, photos
  Cascades    build/cascade_*.json    (extract_cascade.js)                     -> ID checklist, seasons, plant-instead list
  Checklists  content/id-checklists.json                                       -> spot-it checklists for other species
  Tour        content/tour.json                                                -> which species are on the map

Editions:
  public (default)  only species with page content from published sources (Forest Plan, ENV 221 pages,
                    cascade pages, public-domain documents). The NYBG list is used only to match names;
                    its internal assessment (which species are listed, Category 1/2, list sources) is left out.
  --staff           every species on the NYBG list with its category and list sources. Internal: written to
                    a *_staff.json file that git ignores; never publish it.

Usage: python build_species.py <kit_dir> <xlsx_path> <out.json> [--staff]
"""
import glob, html, json, os, re, sys
import openpyxl

def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
def binomial(name):
    w = name.replace("×", "x").split()
    return " ".join(w[:3]) if len(w) > 2 and w[1] == "x" else " ".join(w[:2])
def same_epithet(a, b):
    """Latin endings vary between sources (perfoliatum / perfoliata)."""
    return a == b or (min(len(a), len(b)) > 5 and len(os.path.commonprefix([a, b])) >= min(len(a), len(b)) - 2)

def load_list(xlsx):
    ws = openpyxl.load_workbook(xlsx, data_only=True)["SpeciesForExport2026"]
    rows = list(ws.iter_rows(values_only=True))[1:]
    out = {}
    for acc, syn, common, cat, srcs, *_ in rows:
        if not acc:
            continue
        key = slug(binomial(acc))
        e = out.setdefault(key, {"id": key, "scientific_name": binomial(acc), "names": [], "synonyms": [],
                                 "common_names": [], "category": None, "list_sources": [], "kind": "plant"})
        e["names"].append(acc.strip())
        e["synonyms"] += [s.strip() for s in re.split(r"[,;]", syn or "") if s.strip() and not s.strip().startswith("'")]
        e["common_names"] += [c.strip() for c in (common or "").split(",") if c.strip()]
        if cat is not None:
            e["category"] = min(int(cat), e["category"] or 9)
        e["list_sources"] += [s.strip() for s in re.split(r"[,;]", srcs or "") if s.strip()]
    for e in out.values():
        for k in ("names", "synonyms", "common_names", "list_sources"):
            e[k] = list(dict.fromkeys(e[k]))
        e["provenance"] = {"names": "NYBG invasive species list 2026", "category": "NYBG invasive species list 2026"}
    return out

def match(species, name):
    """Find the list entry for a scientific name used in another source."""
    b = slug(binomial(name))
    if b in species:
        return species[b]
    g, *rest = name.split()
    ep = rest[0] if rest else ""
    for e in species.values():
        allnames = e["names"] + e["synonyms"]
        if any(n.lower().startswith(name.lower()) for n in allnames):
            return e
        for n in allnames:
            w = n.split()
            if len(w) >= 2 and w[0] == g and same_epithet(w[1], ep):
                return e
            if ep and w[0] == g and ep in w[2:]:  # e.g. "var. brevipedunculata"
                return e
    return None

def main(kit, xlsx, out, *flags):
    staff = "--staff" in flags
    sp = load_list(xlsx)
    # Forest Plan Appendix 3
    for fp in json.load(open(os.path.join(kit, "build/forest_plan.json"))):
        e = match(sp, fp["scientific_name"])
        if e is None:
            key = slug(binomial(fp["scientific_name"]))
            kind = "disease" if fp["family"].endswith(("ota", "aceae")) and "Pests" in (fp["plan_section"] or "") else \
                   "pest" if "Pests" in (fp["plan_section"] or "") else "plant"
            e = sp.setdefault(key, {"id": key, "scientific_name": fp["scientific_name"], "names": fp["names_in_plan"],
                                    "synonyms": [], "common_names": [fp["common_name"]], "category": None,
                                    "list_sources": [], "kind": kind, "provenance": {}})
        e["forest_plan"] = {k: fp[k] for k in ("common_name", "family", "plan_section", "summary", "native_range",
                                               "first_record", "threat", "control")}
        e["provenance"]["forest_plan"] = fp["source"]
    # Info pages (pptx extraction + transcriptions)
    pages = json.load(open(os.path.join(kit, "build/info_pages.json")))
    for f in glob.glob(os.path.join(kit, "content/transcribed/*.json")):
        pages += json.load(open(f))["pages"]
    for pg in pages:
        e = match(sp, pg["scientific_name"])
        if e:
            e["info_page"] = {k: pg.get(k) for k in ("origin_line", "native_range", "impact", "impact_source",
                                                     "photo", "photo_credit", "alternatives")}
            e["provenance"]["info_page"] = pg["source"]
    # Cascade pages
    for f in glob.glob(os.path.join(kit, "build/cascade_*.json")):
        c = json.load(open(f)); C = c["cascade"]
        inv = next(s for s in C["species"] if s["id"] == C["invader"])
        e = match(sp, inv["sci"])
        x = C.get("invaderExtra", {})
        plant = []
        for sec in C.get("end", {}).get("sections", []):
            if sec["h"].lower().startswith("plant these"):
                plant = [{"name": html.unescape(a), "sci": b} for a, b in re.findall(r"<b>(.+?)</b>\s*<i>(.+?)</i>", sec["html"])]
        e["cascade"] = {"file": c["source"], "headline": inv.get("headline"), "body": inv.get("body"), "nybg": inv.get("nybg"),
                        "id_checklist": x.get("id", []), "seasons": x.get("seasons", []), "origin": x.get("origin"),
                        "management": x.get("management"), "plant_instead": plant,
                        "inat_count": inv.get("inatCount"), "inat_as_of": C.get("inatAsOf")}
        e["provenance"]["cascade"] = c["source"]
    # Spot-it checklists added by hand (verbatim, sourced) for species without a cascade page
    extra = json.load(open(os.path.join(kit, "content/id-checklists.json"))).get("checklists", {})
    for sid, ck in extra.items():
        if sid in sp and not sp[sid].get("cascade"):
            sp[sid]["checklist"] = {"items": ck.get("items", []), "seasons": ck.get("seasons", []), "source": ck.get("source", "")}
            sp[sid]["provenance"]["checklist"] = ck.get("source", "")
    # Public sources (U.S. government works, copied word for word by extract_public_sources.py) fill gaps
    pub_path = os.path.join(kit, "build/public_sources.json")
    if os.path.exists(pub_path):
        for sid, rec in json.load(open(pub_path, encoding="utf-8"))["species"].items():
            if sid in sp and rec:
                sp[sid]["public"] = rec
                cites = []
                for v in rec.values():
                    for item in (v if isinstance(v, list) else [v]):
                        if isinstance(item, dict) and item.get("source") and item["source"] not in cites:
                            cites.append(item["source"])
                sp[sid]["provenance"]["public"] = cites
    # Tour membership
    tour = json.load(open(os.path.join(kit, "content/tour.json")))
    for st in tour["stops"]:
        if st.get("species") in sp:
            sp[st["species"]]["tour_stop"] = st["n"]
    # Completeness score drives the "full page / basic page" label
    for e in sp.values():
        e["completeness"] = sum(k in e for k in ("forest_plan", "info_page", "cascade"))
    data = sorted(sp.values(), key=lambda e: (e.get("tour_stop") or 99, -e["completeness"], e["scientific_name"]))
    sources = ["Thain Family Forest Plan 2016, Appendix 3", "ENV 221 info pages", "garlic-mustard-cascade.html",
               "public-domain U.S. government publications"]
    if staff:
        sources.insert(0, "NYBG invasive species list 2026 (internal)")
    else:
        # Public edition: keep species that have published page content, drop the internal list's assessment.
        data = [e for e in data if e["completeness"] or e.get("tour_stop") or e.get("public")]
        for e in data:
            e.pop("category", None)
            e.pop("list_sources", None)
            e["provenance"].pop("names", None)
            e["provenance"].pop("category", None)
    json.dump({"edition": "staff" if staff else "public", "generated_from": sources, "species": data},
              open(out, "w"), indent=1, ensure_ascii=False)
    print(len(data), "species (" + ("staff edition, internal" if staff else "public edition") + ");",
          sum(1 for e in data if e["completeness"]), "with page content;",
          sum(1 for e in data if "tour_stop" in e), "on the tour")

if __name__ == "__main__":
    main(*sys.argv[1:])
