#!/usr/bin/env node
/**
 * First Breath — Deterministic sanctum scaffolding for delivery-lead.
 *
 * Creates the sanctum folder structure at ~/.claude/memory/delivery-lead/,
 * copies template files with variable substitution, copies capability files
 * and supporting references into the sanctum, and auto-generates CAPABILITIES.md
 * from capability prompt frontmatter.
 *
 * The sanctum is global (per-engineer, not per-repo) so the agent remembers
 * who you are regardless of which repo you're working in.
 *
 * After this script runs, the sanctum is fully self-contained — the agent does
 * not depend on the skill bundle location for normal operation.
 *
 * Modes:
 *   (default)   First Breath — create sanctum from scratch (skips if exists)
 *   --upgrade   Update references, scripts, and CAPABILITIES.md without
 *               touching identity files (PERSONA, BOND, CREED, MEMORY, INDEX)
 *   --check     Validate sanctum integrity — report missing or empty files
 *   --reset     Delete existing sanctum and re-run First Breath from scratch
 */

const { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync, rmSync, copyFileSync } = require('node:fs');
const { resolve, join } = require('node:path');
const { homedir } = require('node:os');
const { parseArgs } = require('node:util');

// --- Agent-specific configuration (set by builder) ---

const SKILL_NAME = 'delivery-lead';
const SANCTUM_DIR = SKILL_NAME;

// Files that stay in the skill bundle (only used during First Breath)
const SKILL_ONLY_FILES = new Set(['first-breath.md']);

const TEMPLATE_FILES = [
  'INDEX-template.md',
  'PERSONA-template.md',
  'CREED-template.md',
  'BOND-template.md',
  'MEMORY-template.md',
];

// Expected sanctum files for health check
const EXPECTED_FILES = [
  'INDEX.md',
  'PERSONA.md',
  'CREED.md',
  'BOND.md',
  'MEMORY.md',
  'CAPABILITIES.md',
];

const EXPECTED_DIRS = [
  'references',
  'sessions',
];

// Whether the owner can teach this agent new capabilities
const EVOLVABLE = true;

// --- End agent-specific configuration ---


function parseFrontmatter(filePath) {
  /** Extract YAML frontmatter from a markdown file. */
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};

  const meta = {};
  for (const line of match[1].trim().split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith("'") && value.endsWith("'")) ||
          (value.startsWith('"') && value.endsWith('"'))) {
        value = value.slice(1, -1);
      }
      meta[key] = value;
    }
  }
  return meta;
}


function copyReferences(sourceDir, destDir) {
  /** Copy all reference files (except skill-only files) into the sanctum. */
  mkdirSync(destDir, { recursive: true });
  const copied = [];

  if (!existsSync(sourceDir)) return copied;

  const files = readdirSync(sourceDir).sort();
  for (const name of files) {
    if (SKILL_ONLY_FILES.has(name)) continue;
    const sourcePath = join(sourceDir, name);
    if (statSync(sourcePath).isFile()) {
      copyFileSync(sourcePath, join(destDir, name));
      copied.push(name);
    }
  }
  return copied;
}


function copyScripts(sourceDir, destDir) {
  /** Copy any scripts the capabilities might use into the sanctum. */
  if (!existsSync(sourceDir)) return [];

  mkdirSync(destDir, { recursive: true });
  const copied = [];

  const files = readdirSync(sourceDir).sort();
  for (const name of files) {
    const sourcePath = join(sourceDir, name);
    if (statSync(sourcePath).isFile() && name !== 'init-sanctum.js') {
      copyFileSync(sourcePath, join(destDir, name));
      copied.push(name);
    }
  }
  return copied;
}


function discoverCapabilities(referencesDir, sanctumRefsPath) {
  /** Scan references/ for capability prompt files with frontmatter. */
  const capabilities = [];

  if (!existsSync(referencesDir)) return capabilities;

  const files = readdirSync(referencesDir).filter(f => f.endsWith('.md')).sort();
  for (const name of files) {
    if (SKILL_ONLY_FILES.has(name)) continue;
    const meta = parseFrontmatter(join(referencesDir, name));
    if (meta.name && meta.code) {
      capabilities.push({
        name: meta.name,
        description: meta.description || '',
        code: meta.code,
        source: `${sanctumRefsPath}/${name}`,
      });
    }
  }
  return capabilities;
}


function generateCapabilitiesMd(capabilities, evolvable) {
  /** Generate CAPABILITIES.md content from discovered capabilities. */
  const lines = [
    '# Capabilities',
    '',
    '## Built-in',
    '',
    '| Code | Name | Description | Source |',
    '|------|------|-------------|--------|',
  ];

  for (const cap of capabilities) {
    lines.push(`| [${cap.code}] | ${cap.name} | ${cap.description} | \`${cap.source}\` |`);
  }

  if (evolvable) {
    lines.push(
      '',
      '## Learned',
      '',
      '_Capabilities added by the owner over time. Prompts live in `capabilities/`._',
      '',
      '| Code | Name | Description | Source | Added |',
      '|------|------|-------------|--------|-------|',
      '',
      '## How to Add a Capability',
      '',
      'Tell me "I want you to be able to do X" and we\'ll create it together.',
      "I'll write the prompt, save it to `capabilities/`, and register it here.",
      "Next session, I'll know how.",
      'Load `./references/capability-authoring.md` for the full creation framework.',
    );
  }

  lines.push(
    '',
    '## Tools',
    '',
    '### Required',
    '- **Issue tracker MCP** — ticket read/write, project/epic management (default: Atlassian MCP for Jira/Confluence)',
    '- **Source control CLI** — PR creation, CI status checks (default: GitHub CLI `gh`)',
    '',
    'Specific MCP server names and tool configurations are discovered during First Breath and recorded in BOND.md.',
    '',
    '### User-Provided Tools',
    '',
    '_MCP servers, APIs, or services the engineer has made available. Document them here._',
  );

  return lines.join('\n') + '\n';
}


function substituteVars(content, variables) {
  /** Replace {var_name} placeholders with values from the variables dict. */
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}


function checkSanctum(sanctumPath, referencesDir) {
  /** Validate sanctum integrity. Returns a health report object. */
  if (!existsSync(sanctumPath)) {
    return {
      status: 'error',
      healthy: false,
      sanctum_path: sanctumPath,
      message: 'Sanctum does not exist. Run First Breath to create it.',
    };
  }

  const missingFiles = [];
  const emptyFiles = [];
  for (const name of EXPECTED_FILES) {
    const p = join(sanctumPath, name);
    if (!existsSync(p)) {
      missingFiles.push(name);
    } else if (statSync(p).size === 0) {
      emptyFiles.push(name);
    }
  }

  const missingDirs = [];
  for (const name of EXPECTED_DIRS) {
    const p = join(sanctumPath, name);
    if (!existsSync(p) || !statSync(p).isDirectory()) {
      missingDirs.push(name);
    }
  }

  // Check reference files are present in sanctum
  const staleRefs = [];
  const sanctumRefs = join(sanctumPath, 'references');
  if (existsSync(referencesDir) && existsSync(sanctumRefs) && statSync(sanctumRefs).isDirectory()) {
    const files = readdirSync(referencesDir).filter(f => f.endsWith('.md')).sort();
    for (const name of files) {
      if (SKILL_ONLY_FILES.has(name)) continue;
      const sanctumRef = join(sanctumRefs, name);
      if (!existsSync(sanctumRef)) {
        staleRefs.push(name);
      } else if (readFileSync(join(referencesDir, name), 'utf-8') !== readFileSync(sanctumRef, 'utf-8')) {
        staleRefs.push(name);
      }
    }
  }

  const healthy = missingFiles.length === 0 && missingDirs.length === 0 && emptyFiles.length === 0;
  const issues = [];
  if (missingFiles.length) issues.push(`Missing files: ${missingFiles.join(', ')}`);
  if (emptyFiles.length) issues.push(`Empty files: ${emptyFiles.join(', ')}`);
  if (missingDirs.length) issues.push(`Missing directories: ${missingDirs.join(', ')}`);
  if (staleRefs.length) issues.push(`Stale references (run --upgrade): ${staleRefs.join(', ')}`);

  let message;
  if (healthy && staleRefs.length === 0) message = 'Sanctum is healthy.';
  else if (healthy && staleRefs.length > 0) message = 'Sanctum is healthy but has stale references.';
  else message = `Sanctum has issues: ${issues.join('; ')}`;

  return {
    status: healthy ? 'ok' : 'degraded',
    healthy,
    sanctum_path: sanctumPath,
    missing_files: missingFiles,
    empty_files: emptyFiles,
    missing_dirs: missingDirs,
    stale_references: staleRefs,
    issues,
    message,
  };
}


function upgradeSanctum(sanctumPath, skillPath, logFn) {
  /** Update references, scripts, and CAPABILITIES.md without touching identity files. */
  const referencesDir = join(skillPath, 'references');
  const scriptsDir = join(skillPath, 'scripts');
  const sanctumRefs = join(sanctumPath, 'references');
  const sanctumScripts = join(sanctumPath, 'scripts');
  const sanctumRefsPath = './references';

  const copiedRefs = copyReferences(referencesDir, sanctumRefs);
  logFn(`Updated ${copiedRefs.length} reference files`);

  const copiedScripts = copyScripts(scriptsDir, sanctumScripts);
  if (copiedScripts.length) logFn(`Updated ${copiedScripts.length} scripts`);

  const capabilities = discoverCapabilities(referencesDir, sanctumRefsPath);
  const capabilitiesContent = generateCapabilitiesMd(capabilities, EVOLVABLE);
  writeFileSync(join(sanctumPath, 'CAPABILITIES.md'), capabilitiesContent);
  logFn(`Regenerated CAPABILITIES.md (${capabilities.length} capabilities)`);

  return {
    status: 'success',
    mode: 'upgrade',
    sanctum_path: sanctumPath,
    references_updated: copiedRefs,
    scripts_updated: copiedScripts,
    capabilities_discovered: capabilities.length,
    capability_codes: capabilities.map(c => c.code),
    message: 'Sanctum upgraded. References, scripts, and CAPABILITIES.md updated. '
           + 'Identity files (PERSONA, BOND, CREED, MEMORY, INDEX) untouched.',
  };
}


function outputJson(data, outputPath) {
  /** Write JSON to file or stdout. */
  const jsonStr = JSON.stringify(data, null, 2);
  if (outputPath) {
    writeFileSync(outputPath, jsonStr + '\n');
  } else {
    console.log(jsonStr);
  }
}


function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      'memory-dir': { type: 'string' },
      output: { type: 'string', short: 'o' },
      verbose: { type: 'boolean', default: false },
      upgrade: { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
      reset: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
  });

  if (values.help || positionals.length === 0) {
    console.log(`First Breath scaffolding for delivery-lead.

Creates the sanctum at ~/.claude/memory/delivery-lead/, copies templates,
and auto-generates CAPABILITIES.md.

Usage: node init-sanctum.js <skill_path> [options]

Arguments:
  skill_path    Path to the skill directory (where SKILL.md, references/, assets/ live)

Options:
  --memory-dir  Override ~/.claude/memory/ location (default: ~/.claude/memory/). Useful for testing.
  -o, --output  Write JSON result to this file instead of stdout
  --verbose     Print detailed progress to stderr
  --upgrade     Update references, scripts, and CAPABILITIES.md without touching identity files
  --check       Validate sanctum integrity — report missing or empty files
  --reset       Delete existing sanctum and re-run First Breath from scratch
  -h, --help    Show this help message`);
    process.exit(0);
  }

  // Validate mutually exclusive modes
  const modeCount = [values.upgrade, values.check, values.reset].filter(Boolean).length;
  if (modeCount > 1) {
    console.error('Error: --upgrade, --check, and --reset are mutually exclusive.');
    process.exit(2);
  }

  const skillPath = resolve(positionals[0]);
  if (!existsSync(skillPath) || !statSync(skillPath).isDirectory()) {
    console.error(`Error: skill_path does not exist or is not a directory: ${skillPath}`);
    process.exit(2);
  }
  const home = homedir();

  const logFn = (msg) => {
    if (values.verbose) process.stderr.write(msg + '\n');
  };

  // Paths — sanctum is global at ~/.claude/memory/ (overridable for testing)
  const memoryDir = values['memory-dir'] || join(home, '.claude', 'memory');
  const sanctumPath = join(memoryDir, SANCTUM_DIR);
  const assetsDir = join(skillPath, 'assets');
  const referencesDir = join(skillPath, 'references');
  const scriptsDir = join(skillPath, 'scripts');

  // Sanctum subdirectories
  const sanctumRefs = join(sanctumPath, 'references');
  const sanctumScripts = join(sanctumPath, 'scripts');

  // Fully qualified path for CAPABILITIES.md references
  const sanctumRefsPath = './references';

  // --- Mode: check ---
  if (values.check) {
    const result = checkSanctum(sanctumPath, referencesDir);
    outputJson(result, values.output);
    process.exit(result.healthy ? 0 : 1);
  }

  // --- Mode: upgrade ---
  if (values.upgrade) {
    if (!existsSync(sanctumPath)) {
      const result = {
        status: 'error',
        mode: 'upgrade',
        sanctum_path: sanctumPath,
        message: 'Cannot upgrade — sanctum does not exist. Run without --upgrade first.',
      };
      outputJson(result, values.output);
      process.exit(1);
    }

    const result = upgradeSanctum(sanctumPath, skillPath, logFn);
    outputJson(result, values.output);
    process.exit(0);
  }

  // --- Mode: reset ---
  if (values.reset && existsSync(sanctumPath)) {
    rmSync(sanctumPath, { recursive: true, force: true });
    logFn(`Deleted existing sanctum at ${sanctumPath}`);
  }

  // --- Mode: default (First Breath) ---

  // Check if sanctum already exists (unless --reset cleared it)
  if (existsSync(sanctumPath)) {
    const result = {
      status: 'skipped',
      reason: 'sanctum_exists',
      sanctum_path: sanctumPath,
      message: 'This agent has already been born. Skipping First Breath scaffolding. '
             + 'Use --upgrade to update references, or --reset to start over.',
    };
    outputJson(result, values.output);
    logFn(`Sanctum already exists at ${sanctumPath}`);
    process.exit(0);
  }

  // Build variable substitution map — user_name and communication_language default unconditionally.
  // First Breath captures the actual values via Save-As-You-Go writes at runtime.
  const today = new Date().toISOString().split('T')[0];
  const variables = {
    user_name: 'friend',
    communication_language: 'English',
    birth_date: today,
    project_root: process.cwd(),
    sanctum_path: sanctumPath,
  };

  // Create sanctum structure
  mkdirSync(memoryDir, { recursive: true });
  mkdirSync(sanctumPath, { recursive: true });
  mkdirSync(join(sanctumPath, 'capabilities'), { recursive: true });
  mkdirSync(join(sanctumPath, 'sessions'), { recursive: true });
  logFn(`Created sanctum at ${sanctumPath}`);

  // Copy reference files (capabilities + techniques + guidance) into sanctum
  const copiedRefs = copyReferences(referencesDir, sanctumRefs);
  logFn(`Copied ${copiedRefs.length} reference files to sanctum/references/`);

  // Copy any supporting scripts into sanctum
  const copiedScripts = copyScripts(scriptsDir, sanctumScripts);
  if (copiedScripts.length) {
    logFn(`Copied ${copiedScripts.length} scripts to sanctum/scripts/`);
  }

  // Copy and substitute template files
  const templatesCreated = [];
  for (const templateName of TEMPLATE_FILES) {
    const templatePath = join(assetsDir, templateName);
    if (!existsSync(templatePath)) {
      logFn(`Warning: template ${templateName} not found, skipping`);
      continue;
    }

    // Remove "-template" from the output filename and uppercase it
    let outputName = templateName.replace('-template', '').toUpperCase();
    // Fix extension casing: .MD -> .md
    outputName = outputName.slice(0, -3) + '.md';

    let content = readFileSync(templatePath, 'utf-8');
    content = substituteVars(content, variables);

    writeFileSync(join(sanctumPath, outputName), content);
    templatesCreated.push(outputName);
    logFn(`Created ${outputName}`);
  }

  // Auto-generate CAPABILITIES.md from references/ frontmatter
  const capabilities = discoverCapabilities(referencesDir, sanctumRefsPath);
  const capabilitiesContent = generateCapabilitiesMd(capabilities, EVOLVABLE);
  writeFileSync(join(sanctumPath, 'CAPABILITIES.md'), capabilitiesContent);
  logFn(`Created CAPABILITIES.md (${capabilities.length} built-in capabilities discovered)`);

  const result = {
    status: 'success',
    sanctum_path: sanctumPath,
    skill_name: SKILL_NAME,
    references_copied: copiedRefs,
    scripts_copied: copiedScripts,
    templates_created: templatesCreated,
    capabilities_discovered: capabilities.length,
    capability_codes: capabilities.map(c => c.code),
  };
  outputJson(result, values.output);
}

if (require.main === module) {
  main();
}

module.exports = { parseFrontmatter, copyReferences, copyScripts, discoverCapabilities, generateCapabilitiesMd, substituteVars, checkSanctum, upgradeSanctum, main };
