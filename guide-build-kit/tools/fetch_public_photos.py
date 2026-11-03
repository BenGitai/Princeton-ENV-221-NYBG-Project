"""Download the openly licensed photos listed in content/public-sources.json (Wikimedia Commons) into
guide-build-kit/photos/public/, and record each one's author, license and page in photos/public/credits.json.
The credit line shown on the site is built from that Commons metadata, never typed by hand.

Only files not already downloaded are fetched, so this runs offline once everything is in place.
Usage: python fetch_public_photos.py <guide-build-kit dir>
"""
import json, os, re, sys, time, urllib.error, urllib.parse, urllib.request

UA = {"User-Agent": "NYBG-Garden-Escapes-guide/1.0 (ENV 221 student project)"}
WIDTH = 1280

def strip(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s or "")).strip()

def fetch(url, timeout):
    """GET with a polite retry when Wikimedia rate-limits (HTTP 429)."""
    for attempt in range(5):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout).read()
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 4:
                raise
            time.sleep(15 * (attempt + 1))

def main(kit):
    cfg = json.load(open(os.path.join(kit, "content/public-sources.json"), encoding="utf-8"))
    out_dir = os.path.join(kit, "photos", "public")
    os.makedirs(out_dir, exist_ok=True)
    cpath = os.path.join(out_dir, "credits.json")
    credits = json.load(open(cpath, encoding="utf-8")) if os.path.exists(cpath) else {}
    wanted = [e["photo"] for e in cfg["species"].values() if "photo" in e] + list(cfg.get("plant_photos", {}).values())
    todo = [w for w in wanted if not (w["file"] in credits and os.path.exists(os.path.join(out_dir, w["file"])))]
    if not todo:
        print("public photos: all", len(wanted), "present"); return
    for w in todo:
        q = urllib.parse.urlencode({"action": "query", "titles": w["commons"], "prop": "imageinfo", "format": "json",
                                    "iiprop": "url|extmetadata", "iiurlwidth": WIDTH,
                                    "iiextmetadatafilter": "Artist|LicenseShortName|LicenseUrl|Credit"})
        try:
            data = json.loads(fetch("https://commons.wikimedia.org/w/api.php?" + q, 30))
        except OSError as e:
            print("  offline? could not reach Wikimedia Commons:", e); break
        page = next(iter(data["query"]["pages"].values()))
        if "imageinfo" not in page:
            sys.exit("not found on Commons: " + w["commons"])
        ii = page["imageinfo"][0]; m = ii.get("extmetadata", {})
        artist = strip(m.get("Artist", {}).get("value")) or "unknown author"
        lic = strip(m.get("LicenseShortName", {}).get("value"))
        img = fetch(ii.get("thumburl") or ii["url"], 60)
        with open(os.path.join(out_dir, w["file"]), "wb") as f:
            f.write(img)
        credits[w["file"]] = {"commons": w["commons"], "page": ii["descriptionurl"], "artist": artist, "license": lic,
                              "license_url": m.get("LicenseUrl", {}).get("value", ""),
                              "credit": "Photo: " + artist + ", " + lic + ", via Wikimedia Commons (" + ii["descriptionurl"] + ")"}
        print(f"  {w['file']}: {len(img) // 1024} KB, {lic}, {artist}")
        json.dump(credits, open(cpath, "w", encoding="utf-8"), indent=1, ensure_ascii=False)  # after each photo
        time.sleep(2)

if __name__ == "__main__":
    main(sys.argv[1])
