# Garden Escapes: NYBG invasive species guide

A mobile-first guide to the New York Botanical Garden's invasive species. ENV 221 (Princeton) capstone
prototype, with Dr. Evelyn Beaury, NYBG Center for Conservation & Restoration Ecology.

**Live site:** https://bengitai.github.io/Princeton-ENV-221-NYBG-Project/

- **The website:** [`nybg-guide/`](nybg-guide/). Open `nybg-guide/index.html` in a browser (it works
  offline), or use the live site. [`nybg-guide/README.md`](nybg-guide/README.md) explains how it works,
  how to update the content, and lists the open items for NYBG.
- **The content pipeline:** [`guide-build-kit/`](guide-build-kit/). Scripts that copy species text word for
  word from the sources and tag where each piece came from (`python guide-build-kit/tools/build_data.py`).
- **The design reference:** [`claude-code-handoff/`](claude-code-handoff/). The approved mockup the site was built from.

The raw source files (NYBG species list, Forest Plan PDF, info-page decks) are not in this repository.
Regenerating the data needs them next to these folders. The site itself only needs `nybg-guide/`.
NYBG's 2026 species list is an internal staff document, so the published site leaves it out (see
"Public and staff editions" in [`nybg-guide/README.md`](nybg-guide/README.md)).

Every push to `main` that changes `nybg-guide/` republishes the site (`.github/workflows/pages.yml`).

## Content and credits

The code is MIT-licensed (see [LICENSE](LICENSE)). The content is not: every piece keeps the terms of
its source, and the site cites the source under each section.

- **New York Botanical Garden:** the *Thain Family Forest Plan* (2016), Appendix 3, [published by NYBG](https://www.nybg.org/content/uploads/2017/04/Forest-Plan-2016.pdf).
- **Princeton ENV 221 students:** the info pages, the Invasive Species Reference Guide and the garlic mustard cascade page.
- **U.S. government works (public domain):** Swearingen et al. 2010, *Plant Invaders of Mid-Atlantic
  Natural Areas* (National Park Service & U.S. Fish and Wildlife Service); USDA Forest Service 2005,
  *Pest Alert: Hemlock Woolly Adelgid*; Stone 2009, *Iris pseudacorus*, Fire Effects Information System
  (USDA Forest Service). Copies are in `guide-build-kit/sources/public/`.
- **Photos:** the info-page photos carry the credits printed on their slides. Wikimedia Commons photos
  carry their author and license (CC0, public domain, CC BY or CC BY-SA), listed in
  `guide-build-kit/photos/public/credits.json` and shown on the site.
- **Map and forest-layer artwork:** made for this project (`guide-build-kit/*.svg`).
