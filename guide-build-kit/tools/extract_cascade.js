// Pull the data model (window.PHOTOS + window.CASCADE) out of a cascade page such as
// garlic-mustard-cascade.html, without rendering it. Deterministic: runs the page's own
// data scripts in a sandbox and saves what they define.
// Usage: node extract_cascade.js <page.html> <out.json>
const fs = require('fs'), vm = require('vm');
const [, , src, out] = process.argv;
const html = fs.readFileSync(src, 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const code of scripts) {
  if (!/window\.(PHOTOS|CASCADE)\s*=/.test(code)) continue;   // data scripts only
  vm.runInContext(code, sandbox);
}
const { PHOTOS, CASCADE } = sandbox.window;
if (!CASCADE) throw new Error('No window.CASCADE found in ' + src);
// drop inline data: URIs (illustrations) to keep the JSON small; keep everything else
const strip = o => JSON.parse(JSON.stringify(o, (k, v) => typeof v === 'string' && v.startsWith('data:') ? '[inline image]' : v));
fs.writeFileSync(out, JSON.stringify({ source: src.split(/[\\/]/).pop(), photos: strip(PHOTOS || {}), cascade: strip(CASCADE) }, null, 2));
console.log('species:', CASCADE.species.length, 'edges:', CASCADE.edges.length, 'sources:', Object.keys(CASCADE.sources || {}).length);
