"""Generate build/webs.json: one 'forest layers' web for EVERY tour stop species.

No hand-drawn webs. For each species on the tour (content/tour.json):
  - if it has a cascade page, its web is the cascade's own species web;
  - otherwise the web is generated from its sourced text with content/web-rules.json:
    each rule that matches adds a node whose quote is the matching sentence, word for word;
    the Forest Plan 'Control' text adds an 'NYBG forest team' node;
    other species whose Forest Plan entry names this one (or that this one names) are added
    as linked nodes, so webs connect to species pages.
Layout is automatic: helpers on the left, harmed species on the right, by forest layer.
Shared nodes (same 'shared' id in several webs) become 'Also in' links between webs.

Usage: python make_webs.py <kit_dir>
"""
import json, os, re, sys

STRATUM_Y = {"canopy": 110, "understory": 225, "floor": 320, "soil": 465}
LEFT_X, RIGHT_X = [72, 120], [318, 270]
GRP = {'plant': 'plant', 'tree': 'tree', 'fungus': 'fungus', 'annelid': 'worm', 'amphibian': 'salamander',
       'mammal': 'deer', 'insect': 'insect', 'bird': 'bird'}
CASCADE_LAYOUT = {'garlic-mustard-cascade.html': {
    'pos': {'gm': (188, 318), 'amf': (290, 462), 'maple': (196, 214), 'sol': (322, 300), 'jw': (64, 296),
            'cw': (92, 96), 'worms': (160, 452), 'sal': (74, 410), 'deer': (300, 150)},
    'labels': {'sol': 'Solomon’s seal', 'sal': 'Salamander'},
    'shared': {'maple': 'native-tree-seedlings', 'jw': 'native-wildflowers', 'sol': 'native-wildflowers'}}}

def get(e, path):
    a, b = path.split(".")
    return (e.get(a) or {}).get(b) or ""

def sentences(text):
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]

def cap(s): return s[:1].upper() + s[1:]

def cascade_web(sp, c, src):
    C = c["cascade"]; lay = CASCADE_LAYOUT.get(src, {})
    nodes = []
    for i, s in enumerate(C["species"]):
        x, y = lay.get('pos', {}).get(s["id"], (60 + (i % 4) * 90, 80 + (i // 4) * 140))
        n = {"id": s["id"], "name": s["name"], "short": lay.get('labels', {}).get(s["id"], s.get("short") or s["name"]),
             "group": "invader" if s["id"] == C["invader"] else GRP.get(s["group"], "plant"), "x": x, "y": y,
             "quote": s.get("headline", ""), "source": src, "step": s.get("step", "")}
        if s["id"] == C["invader"]:
            n["species"] = sp["id"]
        if s["id"] in lay.get('shared', {}):
            n["shared"] = lay['shared'][s["id"]]
        nodes.append(n)
    edges = [{"from": e["from"], "to": e["to"], "sign": e["sign"], "label": e["label"], "source": src} for e in C["edges"]]
    return {"id": sp["id"], "title": cap(sp["common_names"][0]), "generated_from": src, "nodes": nodes, "edges": edges}

def rule_web(sp, all_species, R):
    name = cap(sp["common_names"][0] if sp["common_names"] else sp["forest_plan"]["common_name"])
    prov = sp["provenance"]
    srcname = lambda path: prov.get("forest_plan") if path.startswith("forest_plan") else prov.get("info_page")
    nodes = [{"id": "invader", "name": name, "short": name, "group": "invader", "x": 196, "y": 300,
              "quote": (sentences(get(sp, "forest_plan.summary") or get(sp, "info_page.impact")) or [""])[0],
              "source": srcname("forest_plan.summary" if get(sp, "forest_plan.summary") else "info_page.impact"),
              "species": sp["id"], "step": "The invader"}]
    edges, hit = [], set()
    used = {"left": [], "right": []}
    def place(side, stratum):
        xs = LEFT_X if side == "left" else RIGHT_X
        y = STRATUM_Y[stratum]
        for dy in (0, 50, -50, 100, -100):
            for x in xs:
                if all(abs(x - a) > 60 or abs(y + dy - b) > 70 for a, b in used[side]) and 60 <= y + dy <= 480:
                    used[side].append((x, y + dy)); return x, y + dy
        used[side].append((xs[0], y)); return xs[0], y
    for r in R["rules"]:
        if any(u in hit for u in r.get("unless", [])):
            continue
        for path in R["fields"][r["role"]]:
            m = next((s for s in sentences(get(sp, path)) if re.search(r["pattern"], s, re.I)), None)
            if m:
                side = "left" if r["role"] == "helper" else "right"
                x, y = place(side, r["stratum"])
                n = {"id": r["id"], "name": r["name"], "short": r["name"], "group": r["group"], "x": x, "y": y,
                     "quote": m, "source": srcname(path), "step": "Helps it spread" if r["role"] == "helper" else "Harmed"}
                if r.get("shared"): n["shared"] = r["shared"]
                nodes.append(n); hit.add(r["id"])
                edges.append({"from": r["id"], "to": "invader", "sign": "help", "label": r["label"], "source": srcname(path)}
                             if r["role"] == "helper" else
                             {"from": "invader", "to": r["id"], "sign": "harm", "label": r["label"], "source": srcname(path)})
                break
    ctrl = get(sp, R["manager"]["field"])
    if ctrl:
        M = R["manager"]
        nodes.append({"id": "manager", "name": M["name"], "short": M["name"], "group": M["group"], "x": 196, "y": 470,
                      "quote": sentences(ctrl)[0], "source": prov.get("forest_plan"), "shared": M["shared"], "step": "Holds it back"})
        edges.append({"from": "manager", "to": "invader", "sign": "harm", "label": M["label"], "source": prov.get("forest_plan")})
    # cross-links: species whose Forest Plan text names this one, or that this one names
    me = [n.lower() for n in sp["common_names"] + [get(sp, "forest_plan.common_name")] if n]
    slots = [(196, 96), (300, 60), (92, 60)]
    for other in all_species:
        if other["id"] == sp["id"] or not other.get("forest_plan"):
            continue
        theirs = [n.lower() for n in [other["forest_plan"]["common_name"]] if n]
        hit_s = None
        for path in R["mentions"]["fields"]:
            hit_s = next((s for s in sentences(get(other, path)) if any(n in s.lower() for n in me)), None) \
                 or next((s for s in sentences(get(sp, path)) if any(n in s.lower() for n in theirs)), None)
            if hit_s: break
        if hit_s and slots:
            x, y = slots.pop(0)
            nid = "x-" + other["id"]
            oname = cap(other["forest_plan"]["common_name"])
            nodes.append({"id": nid, "name": oname, "short": oname, "group": "invader", "x": x, "y": y, "quote": hit_s,
                          "source": prov.get("forest_plan"), "species": other["id"], "step": "Named together in the Forest Plan"})
            edges.append({"from": nid, "to": "invader", "sign": "link", "label": R["mentions"]["label"], "source": prov.get("forest_plan")})
    return {"id": sp["id"], "title": name, "generated_from": "content/web-rules.json", "nodes": nodes, "edges": edges}

if __name__ == "__main__":
    kit = sys.argv[1]
    species = json.load(open(os.path.join(kit, "build/species.json")))["species"]
    R = json.load(open(os.path.join(kit, "content/web-rules.json")))
    tour = json.load(open(os.path.join(kit, "content/tour.json")))
    by_id = {s["id"]: s for s in species}
    webs = []
    for stop in tour["stops"]:
        sp = by_id.get(stop.get("species"))
        if not sp:
            continue
        if sp.get("cascade"):
            src = sp["cascade"]["file"]
            c = json.load(open(os.path.join(kit, "build", "cascade_" + src.replace("-cascade.html", "") + ".json")))
            webs.append(cascade_web(sp, c, src))
        else:
            webs.append(rule_web(sp, species, R))
    shared = {}
    for w in webs:
        for n in w["nodes"]:
            if n.get("shared"):
                shared.setdefault(n["shared"], []).append(w["id"])
    shared = {k: v for k, v in shared.items() if len(v) > 1}
    json.dump({"shared_nodes": shared, "webs": webs}, open(os.path.join(kit, "build/webs.json"), "w"), indent=1, ensure_ascii=False)
    print(len(webs), "webs (one per tour species); cross-links:", {k: len(v) for k, v in shared.items()})
    for w in webs:
        print(" ", w["title"], "->", [n["short"] for n in w["nodes"][1:]] if w["generated_from"] != w["nodes"][0].get("source") else "")
