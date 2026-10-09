DESIGN REFERENCE: how to read these files
=========================================

These are the source files of the approved mockup (a design canvas). They are the exact visual and behavioral spec for the site. Port them to plain HTML/CSS/JS. Do not load these files in the site itself.

Format (a small templating language, read it like JSX):
  <x-dc> ... </x-dc>         the markup. Inline style="..." holds the exact colors, sizes and spacing; copy them.
  <helmet><style>            page-level CSS, including the responsive @container rules (copy them).
  {{name}}                   a value computed in renderVals() in the <script> at the bottom.
  <sc-for list="{{xs}}" as="x">   repeat for each item.
  <sc-if value="{{cond}}">   show only when cond is true.
  <dc-import name="X" a="b"> embed the component X.dc.html with props (kebab-case attributes become camelCase props).
  href="Other.dc.html"       a link between screens; in the site it becomes a hash route (see the prompt).
  /_blob/<id>                an uploaded file; ASSET_MAP.json says which local file it is.
  fetch('/_blob/a0f5…')      the data bundle; in the site, read NYBG.data from data/guide-data.js instead.

Screens and components (canvas.json has the full layout):
  Main.dc.html          Home                      -> #/
  Tour.dc.html          Map + stop pages          -> #/map, #/map/N, #/stop/N   (responsive split view at >= 900px)
  Stop.dc.html          Tour opened on stop 4 (a wrapper, not a separate screen)
  SpeciesPage.dc.html   Species page component    -> used by #/stop/N and #/species/<id>
  Lookup.dc.html        Species lookup            -> #/lookup  (list + page side by side at >= 900px)
  Layers.dc.html        Forest layers             -> #/layers/<id>
  Quest.dc.html         Garden Escape Quest       -> #/quest
  HomeHub.dc.html       Take it home              -> #/hub
  NavBar.dc.html        Top bar (>= 900px) and bottom tab bar (< 900px), driven by one list
  Desktop*.dc.html      The same components at 1440px wide (they only wrap the screens above)

Known mockup-only shortcuts (do these properly in the real site):
  - Forest-layer arrows are pre-rendered SVG overlays. Draw them at runtime from build/webs.json.
  - Links from a species page to its forest layers open garlic mustard; real links go to #/layers/<that species>.
  - "Species page" buttons in Forest layers open the lookup list; real buttons go to #/species/<id>.
  - Quest progress and checklist ticks live in component state; persist them in localStorage.
  - The read-aloud is assembled from the same strings the page renders. In the real site, read the DOM text of
    elements marked data-read, so the speech always matches the page exactly.
