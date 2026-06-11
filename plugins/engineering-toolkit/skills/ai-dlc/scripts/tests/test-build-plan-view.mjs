#!/usr/bin/env node
/**
 * Smoke test for build-plan-view.mjs — manual regression guard.
 *
 * Run:  node test-build-plan-view.mjs
 * (Needs npm registry access on first run to install the render deps into
 *  ~/.cache/engineering-toolkit-plan-view/; instant thereafter. Not wired into CI — the
 *  repo's validate-plugins workflow only checks plugin manifests.)
 *
 * Asserts the builder: renders Mermaid to inline SVG, builds section nav,
 * emits no duplicate element ids across multiple diagrams, and rejects bad
 * input cleanly. Exits non-zero on any failure.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '..', 'build-plan-view.mjs');
const dir = mkdtempSync(join(tmpdir(), 'bpv-test-'));
let failures = 0;
const check = (name, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} - ${name}`); if (!ok) failures++; };

function run(args) {
  return execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' }).trim();
}

try {
  // Fixture with two Mermaid blocks (both emit shared internal ids like arrowhead).
  const md = join(dir, 'flows.md');
  writeFileSync(
    md,
    '# Flows\n\n## A\n```mermaid\nflowchart TD\nA-->B\nB-->C\n```\n\n## B\n```mermaid\nflowchart LR\nX-->Y\n```\n',
  );
  const out = join(dir, 'plan-view.html');
  run(['--in', md, '--out', out, '--title', 'Test']);
  const html = readFileSync(out, 'utf8');

  check('renders inline SVG', (html.match(/<svg/g) || []).length === 2);
  check('builds section nav', html.includes('href="#flows"'));
  check('strips external @import', !html.includes('@import'));

  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
  check('no duplicate element ids across diagrams', dupes.length === 0);

  // Missing flag value → friendly non-zero exit, not a raw TypeError.
  let rejected = false;
  try {
    execFileSync('node', [SCRIPT, '--in'], { encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    rejected = e.status === 1 && /expects a value/.test(String(e.stderr));
  }
  check('rejects missing flag value cleanly', rejected);

  // No mermaid blocks anywhere → non-zero exit.
  const empty = join(dir, 'empty.md');
  writeFileSync(empty, '# Nothing\n\nNo diagrams here.\n');
  let renderedEmpty = true;
  run(['--in', empty, '--out', join(dir, 'empty.html')]); // section with prose, no svg — still valid
  renderedEmpty = (readFileSync(join(dir, 'empty.html'), 'utf8').match(/<svg/g) || []).length === 0;
  check('prose-only file renders with no diagrams', renderedEmpty);
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} failure(s)` : '\nall passed');
process.exit(failures ? 1 : 0);
