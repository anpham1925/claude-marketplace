#!/usr/bin/env node
/**
 * build-plan-view — combine an AI-DLC plan's markdown artifacts into ONE
 * self-contained HTML page: prose rendered to HTML, Mermaid rendered inline as
 * SVG, right where the author put it in the document — instead of asking the
 * user to open several .md files and copy Mermaid into mermaid.live. The output
 * is a single self-contained .html file the user opens locally.
 *
 * The local .md files stay the canonical, version-controlled source of truth.
 * This page is a generated *read-view* — disposable, regenerated each phase.
 *
 * Rendering is server-side:
 *   - prose  → marked (markdown → HTML)
 *   - ```mermaid → beautiful-mermaid SVG (ELK layout — minimal edge crossings)
 * The SVG is embedded inline and its external font @import is stripped, so the
 * page has NO client-side framework or CDN dependency and renders identically
 * behind a corporate proxy / offline. (A tiny vanilla zoom overlay is the only script.)
 *
 * Usage:
 *   node build-plan-view.mjs --in <a.md> [--in <b.md> ...] \
 *        [--out <plan-view.html>] [--title "<plan title>"] [--theme github-light]
 *
 * Pass --in once per artifact, in reading order (e.g. domain-model.md, specs.md,
 * flows.md, ADR-*.md). Each file becomes a navigable section (titled by its
 * first H1, else its filename). Missing files are skipped with a warning, so
 * passing the full list every phase is safe — early phases just have fewer.
 *
 * Output: writes the HTML and prints its absolute path on the last stdout line.
 * Exits non-zero with a one-line reason if nothing could be rendered.
 *
 * Dependencies (beautiful-mermaid, marked) install once into
 * ~/.cache/engineering-toolkit-plan-view/ — stable across plugin updates, never pollutes the
 * plugin dir. First run installs; later runs are instant.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, isAbsolute, dirname, basename, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// Pinned exact (no caret) so renders are reproducible across machines and a
// surprise upstream release can't silently change or compromise the output.
// Bump these deliberately when you want a newer renderer.
const DEPS = { 'beautiful-mermaid': '1.1.3', marked: '18.0.5' };

function die(msg) {
  console.error(`build-plan-view: ${msg}`);
  process.exit(1);
}

// ---- args -----------------------------------------------------------------
function parseArgs(argv) {
  const ins = [];
  let out = null;
  let title = 'Plan View';
  let theme = 'github-light';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (v === undefined) die(`"${a}" expects a value.`);
      return v;
    };
    if (a === '--in') ins.push(value());
    else if (a === '--out') out = value();
    else if (a === '--title') title = value();
    else if (a === '--theme') theme = value();
    else die(`unknown arg "${a}". Use --in/--out/--title/--theme.`);
  }
  if (!ins.length) die('no input. Pass at least one --in <markdown-file>.');
  return { ins, out, title, theme };
}

// ---- ensure deps are available --------------------------------------------
async function loadDeps() {
  const cacheDir = join(homedir(), '.cache', 'engineering-toolkit-plan-view');
  const bmPath = join(cacheDir, 'node_modules', 'beautiful-mermaid', 'dist', 'index.js');
  const markedPath = join(cacheDir, 'node_modules', 'marked', 'lib', 'marked.esm.js');
  if (!existsSync(bmPath) || !existsSync(markedPath)) {
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(
      join(cacheDir, 'package.json'),
      JSON.stringify({ name: 'engineering-toolkit-plan-view', private: true, type: 'module', dependencies: DEPS }, null, 2),
    );
    console.error(`build-plan-view: installing render deps (one-time, into ${cacheDir}) …`);
    try {
      execFileSync('npm', ['install', '--prefix', cacheDir, '--no-audit', '--no-fund', '--loglevel', 'error'], {
        stdio: ['ignore', 'ignore', 'inherit'],
      });
    } catch {
      die('failed to install render deps. If this hung rather than errored, check your npm registry / proxy access, then retry.');
    }
  }
  if (!existsSync(bmPath) || !existsSync(markedPath)) die('render deps did not install correctly.');
  const bm = await import(pathToFileURL(bmPath).href);
  const marked = await import(pathToFileURL(markedPath).href);
  return { bm, marked };
}

// ---- markdown helpers -----------------------------------------------------
// First top-level heading, ignoring any "# ..." that appears inside a fenced
// code block (so an example heading in a code/mermaid fence isn't mistaken for
// the section title).
function firstH1(md, fallback) {
  let inFence = false;
  for (const line of md.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = line.match(/^#\s+(.*\S)\s*$/);
    if (m) return m[1].trim();
  }
  return fallback;
}
function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}
const STRIP_IMPORT = /@import\s+url\([^)]*\)\s*;?/gi;
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Prefix every internal id (and its url(#…) / href="#…" references) so that
// multiple SVGs embedded in one document — and the zoom overlay's extra copy —
// can't collide on shared def ids (e.g. arrowhead/clipPath/gradient). The
// quote/paren delimiters anchor each match, so substring ids (arrowhead vs
// arrowhead-start) don't clash.
function namespaceSvgIds(svg, prefix) {
  const ids = [...new Set([...svg.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]))];
  for (const id of ids) {
    const e = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    svg = svg
      .replace(new RegExp(`\\bid="${e}"`, 'g'), `id="${prefix}${id}"`)
      .replace(new RegExp(`url\\(#${e}\\)`, 'g'), `url(#${prefix}${id})`)
      .replace(new RegExp(`(\\bhref|xlink:href)="#${e}"`, 'g'), `$1="#${prefix}${id}"`);
  }
  return svg;
}

/**
 * Render one markdown file to HTML, with ```mermaid blocks replaced by inline
 * SVG figures, preserving document order.
 */
async function renderFile(md, { parse, renderSVG, theme, fileIdx }) {
  const lines = md.split('\n');
  const parts = [];
  let prose = [];
  let diagramIdx = 0;
  const flushProse = () => {
    const text = prose.join('\n').trim();
    if (text) parts.push(parse(text));
    prose = [];
  };
  let i = 0;
  while (i < lines.length) {
    const fence = lines[i].match(/^\s*```mermaid\s*$/i);
    if (fence) {
      flushProse();
      const body = [];
      i++;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) body.push(lines[i++]);
      i++; // closing fence
      const code = body.join('\n').trim();
      if (code) {
        try {
          let svg = (await renderSVG(code, { theme })).replace(STRIP_IMPORT, '');
          svg = namespaceSvgIds(svg, `pv${fileIdx}-${diagramIdx++}-`);
          parts.push(`<figure class="diagram"><div class="pan">${svg}</div><button class="zoom" title="Zoom">⤢</button></figure>`);
        } catch (e) {
          parts.push(`<figure class="diagram err"><pre>${esc(e.message || e)}\n\n${esc(code)}</pre></figure>`);
        }
      }
      continue;
    }
    prose.push(lines[i++]);
  }
  flushProse();
  return parts.join('\n');
}

// ---- page shell -----------------------------------------------------------
function page({ title, sections }) {
  const nav = sections.map((s) => `      <a href="#${s.id}">${esc(s.title)}</a>`).join('\n');
  const body = sections
    .map((s) => `    <section id="${s.id}" class="doc">\n${s.html}\n    </section>`)
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
         color: #1f2328; background: #f6f7f9; line-height: 1.55; }
  .top { padding: 18px 24px; background: #fff; border-bottom: 1px solid #e2e4e8; position: sticky; top: 0; z-index: 5; }
  .top h1 { margin: 0; font-size: 18px; font-weight: 650; }
  .wrap { display: grid; grid-template-columns: 220px minmax(0,1fr); gap: 28px; max-width: 1180px; margin: 0 auto; padding: 24px; }
  nav { position: sticky; top: 78px; align-self: start; font-size: 13px; display: flex; flex-direction: column; gap: 4px; }
  nav a { color: #57606a; text-decoration: none; padding: 5px 10px; border-radius: 6px; border-left: 2px solid transparent; }
  nav a:hover { background: #eef1f4; color: #1f2328; }
  main { min-width: 0; }
  .doc { background: #fff; border: 1px solid #e2e4e8; border-radius: 10px; padding: 8px 28px 24px; margin: 0 0 22px; }
  .doc h1 { font-size: 20px; border-bottom: 1px solid #eef0f3; padding-bottom: 10px; }
  .doc h2 { font-size: 16px; margin-top: 26px; }
  .doc h3 { font-size: 14px; }
  .doc code { background: #f0f2f4; padding: 1px 5px; border-radius: 4px; font-size: 90%; }
  .doc pre { background: #0d1117; color: #e6edf3; padding: 14px; border-radius: 8px; overflow: auto; }
  .doc pre code { background: none; padding: 0; }
  .doc table { border-collapse: collapse; width: 100%; font-size: 13.5px; margin: 12px 0; }
  .doc th, .doc td { border: 1px solid #e2e4e8; padding: 7px 10px; text-align: left; }
  .doc th { background: #f6f8fa; }
  .doc blockquote { border-left: 3px solid #d0d7de; margin: 12px 0; padding: 2px 14px; color: #57606a; }
  figure.diagram { margin: 18px 0; border: 1px solid #e2e4e8; border-radius: 8px; background:
    repeating-linear-gradient(45deg,#fafbfc,#fafbfc 10px,#f4f6f8 10px,#f4f6f8 20px);
    padding: 16px; position: relative; overflow: auto; max-height: 70vh; }
  figure.diagram .pan svg { display: block; max-width: 100%; height: auto; margin: 0 auto; }
  figure.diagram.err pre { background: #fff5f5; color: #b00; border: 1px solid #f3c2c2; }
  figure.diagram .zoom { position: absolute; top: 8px; right: 8px; border: 1px solid #d0d7de; background: #fff;
    border-radius: 6px; cursor: pointer; font-size: 14px; line-height: 1; padding: 4px 7px; color: #57606a; }
  figure.diagram .zoom:hover { background: #eef1f4; }
  /* fullscreen zoom overlay */
  .overlay { position: fixed; inset: 0; background: rgba(13,17,23,.82); display: none; z-index: 50; cursor: grab; }
  .overlay.on { display: block; }
  .overlay.grabbing { cursor: grabbing; }
  .overlay .vp { position: absolute; transform-origin: 0 0; }
  .overlay .vp svg { display: block; }
  .overlay .close { position: fixed; top: 14px; right: 18px; color: #fff; font-size: 26px; cursor: pointer; }
  .overlay .tip { position: fixed; bottom: 14px; left: 0; right: 0; text-align: center; color: #c9d1d9; font-size: 12px; }
  footer { text-align: center; font-size: 12px; color: #98a0aa; padding: 6px 0 30px; }
  @media (max-width: 760px) { .wrap { grid-template-columns: 1fr; } nav { position: static; flex-direction: row; flex-wrap: wrap; } }
</style>
</head>
<body>
<div class="top"><h1>${esc(title)}</h1></div>
<div class="wrap">
  <nav>
${nav}
  </nav>
  <main>
${body}
    <footer>Generated by AI-DLC · build-plan-view — local .md files remain the source of truth</footer>
  </main>
</div>
<div class="overlay" id="ov"><span class="close" id="ovClose">×</span><div class="vp" id="ovVp"></div><div class="tip">scroll = zoom · drag = pan · Esc / × to close</div></div>
<script>
  (function () {
    var ov = document.getElementById('ov'), vp = document.getElementById('ovVp');
    var scale = 1, tx = 0, ty = 0, drag = false, sx = 0, sy = 0;
    function apply() { vp.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')'; }
    function open(svg) {
      vp.innerHTML = svg; scale = 1; tx = 60; ty = 60; apply(); ov.classList.add('on');
    }
    function close() { ov.classList.remove('on'); vp.innerHTML = ''; }
    document.querySelectorAll('figure.diagram .zoom').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var svg = btn.parentElement.querySelector('svg');
        if (svg) open(svg.outerHTML);
      });
    });
    document.getElementById('ovClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    ov.addEventListener('wheel', function (e) {
      if (!ov.classList.contains('on')) return;
      e.preventDefault();
      var f = e.deltaY < 0 ? 1.1 : 1 / 1.1, ns = Math.min(8, Math.max(0.15, scale * f));
      tx = e.clientX - (e.clientX - tx) * (ns / scale); ty = e.clientY - (e.clientY - ty) * (ns / scale);
      scale = ns; apply();
    }, { passive: false });
    ov.addEventListener('mousedown', function (e) { if (e.target === document.getElementById('ovClose')) return; drag = true; sx = e.clientX - tx; sy = e.clientY - ty; ov.classList.add('grabbing'); });
    window.addEventListener('mousemove', function (e) { if (!drag) return; tx = e.clientX - sx; ty = e.clientY - sy; apply(); });
    window.addEventListener('mouseup', function () { drag = false; ov.classList.remove('grabbing'); });
  })();
</script>
</body>
</html>
`;
}

// ---- main -----------------------------------------------------------------
const { ins, out, title, theme } = parseArgs(process.argv.slice(2));
const { bm, marked } = await loadDeps();
const renderSVG = bm.renderMermaidSVGAsync;
const parse = (t) => marked.parse(t);
if (Array.isArray(bm.THEMES) && !bm.THEMES.includes(theme)) {
  die(`unknown --theme "${theme}". Available: ${bm.THEMES.join(', ')}`);
}

const sections = [];
const usedIds = new Set();
let fileIdx = 0;
for (const f of ins) {
  const abs = isAbsolute(f) ? f : resolve(process.cwd(), f);
  if (!existsSync(abs)) {
    console.error(`build-plan-view: skipping missing input ${abs}`);
    continue;
  }
  const md = readFileSync(abs, 'utf8');
  const secTitle = firstH1(md, basename(abs).replace(/\.md$/i, ''));
  let id = slug(secTitle);
  while (usedIds.has(id)) id += '-x';
  usedIds.add(id);
  const html = await renderFile(md, { parse, renderSVG, theme, fileIdx: fileIdx++ });
  sections.push({ id, title: secTitle, html });
}
if (!sections.length) die(`no readable input files among: ${ins.join(', ')}`);

const baseFile = isAbsolute(ins[0]) ? ins[0] : resolve(process.cwd(), ins[0]);
const outPath = out
  ? (isAbsolute(out) ? out : resolve(process.cwd(), out))
  : resolve(dirname(baseFile), 'plan-view.html');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, page({ title, sections }));
console.error(`build-plan-view: combined ${sections.length} section(s) into one page.`);
console.log(outPath);
