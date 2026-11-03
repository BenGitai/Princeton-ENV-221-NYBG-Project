"""Bundle the pipeline outputs into the website (last step of build_data.py).

Writes nybg-guide/data/guide-data.js (a classic script, so the site works from file://):
    NYBG.data = {species, webs, shared_nodes, tour, links, landing, assets}
copies the photos the site uses (all openly licensed) and the two SVGs into nybg-guide/assets/, and refreshes the generated
"open items" list in nybg-guide/README.md (between the GAPS markers).

Usage: python bundle_site_data.py <guide-build-kit dir> <nybg-guide dir>
Nothing here writes species text: it only moves sourced data into the site.
"""
import json, os, re, shutil, sys

GAPS_START, GAPS_END = "<!-- GAPS:START -->", "<!-- GAPS:END -->"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def used_photos(species, plant_photos):
    """The photos the site shows. build_species.py has already dropped every photo without an open license."""
    used = set()
    for e in species:
        ip = e.get("info_page") or {}
        if ip.get("photo"):
            used.add(ip["photo"])
        used.update(a["photo"] for a in ip.get("alternatives") or [] if a.get("photo"))
        if (e.get("public") or {}).get("photo"):
            used.add(e["public"]["photo"]["file"])
    used.update(p["file"] for p in plant_photos.values())
    return used


def copy_assets(kit, site, used):
    out = os.path.join(site, "assets")
    photos_out = os.path.join(out, "photos")
    # Start clean so a photo that is no longer used (or no longer licensed) does not stay in the site.
    shutil.rmtree(photos_out, ignore_errors=True)
    os.makedirs(photos_out, exist_ok=True)
    photos = {}
    src_root = os.path.join(kit, "photos")
    for rel in sorted(used):
        src = os.path.join(src_root, rel)
        if not os.path.exists(src):
            print("  missing photo:", rel)
            continue
        os.makedirs(os.path.dirname(os.path.join(photos_out, rel)), exist_ok=True)
        shutil.copy2(src, os.path.join(photos_out, rel))
        photos[rel] = "assets/photos/" + rel
    # Base map: NYBG's own Garden Map (tour.json "map"), rendered from the PDF in sources/nybg/.
    # The site draws the dashed route and the pins on top of it at runtime.
    map_file = load(os.path.join(kit, "content", "tour.json")).get("map", {}).get("file", "garden-map-2025.png")
    shutil.copy2(os.path.join(kit, map_file), os.path.join(out, map_file))
    shutil.copy2(os.path.join(kit, "forest-layers-bg.svg"), os.path.join(out, "forest-layers-bg.svg"))
    return {"photos": photos, "map": "assets/" + map_file, "layers_bg": "assets/forest-layers-bg.svg"}


def gaps(data):
    """Every placeholder the site will show, and every stop marked verify."""
    sp = {s["id"]: s for s in data["species"]}
    webs = {w["id"] for w in data["webs"]}
    lines = []
    lines.append("### Stops to confirm with Eve (\"Spot to confirm\")\n")
    for st in data["tour"]["stops"]:
        if st.get("verify"):
            e = sp.get(st.get("species"), {})
            name = (e.get("common_names") or [e.get("scientific_name", "")])[0] or ("Take it home" if st.get("kind") == "hub" else "Welcome")
            lines.append(f"- Stop {st['n']}: {name}, {st['place']} (map position x={st['x']}, y={st['y']})")
    lines.append("\n### Tour species: what is still missing from their pages\n")
    lines.append("Sections with no source are left off the page; a missing photo, checklist or natives list shows a dashed placeholder.\n")
    for st in data["tour"]["stops"]:
        e = sp.get(st.get("species"))
        if not e:
            continue
        ip, fp, cs, ck = e.get("info_page") or {}, e.get("forest_plan") or {}, e.get("cascade") or {}, e.get("checklist") or {}
        pub = e.get("public") or {}
        missing = []
        if not (ip.get("photo") or pub.get("photo")):
            missing.append("photo (add an openly licensed Wikimedia Commons photo under \"photo\" in guide-build-kit/content/public-sources.json)")
        if not (cs.get("id_checklist") or ck.get("items") or (pub.get("checklist") or {}).get("items")):
            missing.append("spot-it checklist (guide-build-kit/content/id-checklists.json)")
        if not (cs.get("seasons") or ck.get("seasons") or pub.get("seasons")):
            missing.append("seasonal \"Right now\" notes (seasons in guide-build-kit/content/id-checklists.json)")
        if e.get("kind") == "plant" and not (ip.get("alternatives") or cs.get("plant_instead") or pub.get("natives")):
            missing.append("\"Plant these instead\" natives (its info-page slide)")
        if not (ip.get("native_range") or fp.get("native_range")):
            missing.append("native range")
        if not fp:
            missing.append("Forest Plan text: Threat to the Thain Forest / How NYBG manages it (not in Appendix 3)")
        if not (ip.get("impact") or pub.get("impact")):
            missing.append("\"Why it matters\" (its info-page slide)")
        if not cs:
            missing.append("\"Below the surface\" and \"At the Garden\" (a <name>-cascade.html page)")
        if e["id"] not in webs:
            missing.append("forest-layers web")
        name = (e.get("common_names") or [e["scientific_name"]])[0]
        lines.append(f"- **Stop {st['n']}, {name}** (`{e['id']}`): " + ("; ".join(missing) if missing else "nothing missing"))
    lines.append("\n### Filled from public sources (please review)\n")
    lines.append("Copied word for word from U.S. government publications in guide-build-kit/sources/public/ "
                 "(listed in content/public-sources.json); photos from Wikimedia Commons with their licenses.\n")
    for e in data["species"]:
        if e.get("public"):
            name = (e.get("common_names") or [e["scientific_name"]])[0]
            label = {"summary": "What it is", "impact": "Why it matters", "checklist": "spot-it checklist",
                     "seasons": "\"Right now\" notes", "natives": "Plant these instead", "photo": "photo"}
            lines.append(f"- {name} (`{e['id']}`): " + ", ".join(label.get(k, k) for k in e["public"]))
    lines.append("\n### Placeholders elsewhere on the site\n")
    lines.append("- Home, \"The hunt\": walk time `[~75 min]` (to measure on the ground)")
    lines.append("- Home, \"Look for it this month\": shows a placeholder in any month that no tour species has a seasonal note for")
    lines.append("- Quest, \"Visitor impact this week\": `[###] sightings` (needs a live count from the NYBG iNaturalist project)")
    lines.append("- Take it home: the nurseries in `nybg-guide/data/nurseries.js` are placeholders (\"Nursery data source to decide with NYBG\")")
    hub = next((s for s in data["tour"]["stops"] if s.get("kind") == "hub"), None)
    if hub:
        for sw in hub.get("swaps", []):
            for side in ("invasive", "native"):
                if not (find_photo(data, sw[side]) or sw[side].lower() in {k.lower() for k in data.get("plant_photos", {})}):
                    lines.append(f"- Take it home, native swap photo: {sw[side]} (add it under plant_photos in content/public-sources.json)")
    thin = sorted((e for e in data["species"] if not e.get("completeness") and not e.get("public") and not e.get("voices")),
                  key=lambda e: e["scientific_name"])
    if not thin:
        return "\n".join(lines)
    lines.append(f"\n### Species with list data only ({len(thin)} of {len(data['species'])})\n")
    lines.append("Their pages show the \"[Only the NYBG list covers this species so far…]\" placeholder, no photo and no checklist.\n")
    lines.append("<details><summary>Show all</summary>\n")
    lines.append(", ".join(f"*{e['scientific_name']}*" for e in thin))
    lines.append("\n</details>")
    return "\n".join(lines)


def find_photo(data, name):
    """Same rule as the site (js/store.js swapPhoto): an info page whose species or alternative carries that name."""
    n = name.lower()
    words = n.split()
    for e in data["species"]:
        ip = e.get("info_page")
        if not ip:
            continue
        photo = ip.get("photo") or ((e.get("public") or {}).get("photo") or {}).get("file")
        if photo and any(all(w in c.lower().split() for w in words) for c in e.get("common_names", [])):
            return photo
        for a in ip.get("alternatives") or []:
            if a["name"].lower() == n and a.get("photo"):
                return a["photo"]
    return ""


def update_readme(site, text):
    path = os.path.join(site, "README.md")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8") as f:
        readme = f.read()
    if GAPS_START not in readme or GAPS_END not in readme:
        return
    head, rest = readme.split(GAPS_START, 1)
    _, tail = rest.split(GAPS_END, 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(head + GAPS_START + "\n" + text + "\n" + GAPS_END + tail)


def main(kit, site):
    species = load(os.path.join(kit, "build", "species.json"))
    webs = load(os.path.join(kit, "build", "webs.json"))
    pub_path = os.path.join(kit, "build", "public_sources.json")
    pub = load(pub_path) if os.path.exists(pub_path) else {}
    plant_photos = pub.get("plant_photos") or pub.get("swap_photos") or {}
    data = {
        "generated_from": species.get("generated_from"),
        "species": species["species"],
        "webs": webs["webs"],
        "shared_nodes": webs["shared_nodes"],
        "tour": load(os.path.join(kit, "content", "tour.json")),
        "links": load(os.path.join(kit, "content", "links.json")),
        "landing": (load(os.path.join(kit, "content", "landing.json"))
                    if os.path.exists(os.path.join(kit, "content", "landing.json")) else {}),
        "plant_photos": plant_photos,
        "assets": copy_assets(kit, site, used_photos(species["species"], plant_photos)),
    }
    os.makedirs(os.path.join(site, "data"), exist_ok=True)
    with open(os.path.join(site, "data", "guide-data.js"), "w", encoding="utf-8") as f:
        f.write("/* Generated by guide-build-kit/tools/bundle_site_data.py. Do not edit: change a source\n"
                "   or a guide-build-kit/content/ file and rerun build_data.py. */\n")
        f.write("window.NYBG = window.NYBG || {};\nNYBG.data = ")
        json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    update_readme(site, gaps(data))
    print(f"site data: {len(data['species'])} species, {len(data['webs'])} webs, {len(data['assets']['photos'])} photos"
          " -> nybg-guide/data/guide-data.js")


if __name__ == "__main__":
    main(*sys.argv[1:])
