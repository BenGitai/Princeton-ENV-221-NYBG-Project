# Garden Escapes: NYBG invasive species guide

A mobile-first guide to the New York Botanical Garden's invasive species. ENV 221 (Princeton) capstone
prototype, with Dr. Evelyn Beaury, NYBG Center for Conservation & Restoration Ecology.

**Live site:** https://bengitai.github.io/Princeton-ENV-221-NYBG-Project/

- **The website:** [`nybg-guide/`](nybg-guide/). Open `nybg-guide/index.html` in a browser (it works
  offline, no install), or use the live site. [`nybg-guide/README.md`](nybg-guide/README.md) explains how it works,
  how to update the content, and lists the open items for NYBG.
- **The content pipeline:** [`guide-build-kit/`](guide-build-kit/). Scripts that copy species text word for
  word from the sources and tag where each piece came from (`python guide-build-kit/tools/build_data.py`).
- **The design reference:** [`claude-code-handoff/`](claude-code-handoff/). The approved mockup the site was built from.

The raw source files (NYBG species list workbook, Forest Plan PDF, info-page decks) are not in this
repository. Regenerating the data needs them next to these folders. The site itself only needs
`nybg-guide/`. See "What is published" in [`nybg-guide/README.md`](nybg-guide/README.md).

Every push to `main` that changes `nybg-guide/` republishes the site (`.github/workflows/pages.yml`).


## Content and credits

The code is MIT-licensed (see [LICENSE](LICENSE)). The content is not: every piece keeps the terms of
its source, and the site cites the source under each section.

- **New York Botanical Garden:** the facts in its 2026 invasive species list (names, synonyms, common names,
  Category 1/2 and the public lists that name each species), and the *Thain Family Forest Plan* (2016),
  Appendix 3, [published by NYBG](https://www.nybg.org/content/uploads/2017/04/Forest-Plan-2016.pdf).
- **Princeton ENV 221 students:** the info pages, the Invasive Species Reference Guide and the garlic mustard cascade page.
- **U.S. government works (public domain):** Swearingen et al. 2010, *Plant Invaders of Mid-Atlantic
  Natural Areas* (National Park Service & U.S. Fish and Wildlife Service); USDA Forest Service 2005,
  *Pest Alert: Hemlock Woolly Adelgid*; USDA Forest Service 2024, *Pest Alert: Beech Leaf Disease*;
  Stone 2009, *Iris pseudacorus*, Fire Effects Information System (USDA Forest Service). Copies are in `guide-build-kit/sources/public/`.
- **NYBG staff quoted on published pages:** short passages, each linked to its page, in
  `guide-build-kit/content/nybg-voices.json` (for example, Michael Hagen on steaming mugwort in the Native Plant Garden).
- **Photos:** only openly licensed photos (CC0, public domain, CC BY or CC BY-SA), each credited on the
  site. They come from Wikimedia Commons (`guide-build-kit/photos/public/credits.json`), plus one info-page
  photo whose slide credits its Commons license. Photos with unknown rights are never published.
- **Map and forest-layer artwork:** made for this project (`guide-build-kit/*.svg`).
