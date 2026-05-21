#!/usr/bin/env node
/**
 * Tests for init-sanctum.js
 *
 * Uses Node.js built-in test runner (node:test).
 * Run with: node --test skills/delivery-lead/scripts/tests/test_init_sanctum.js
 *
 * Test count: 13 (source had 13; 3 config-loading tests deleted per ADR-002,
 * replaced by ADR-aware coverage including the default-user_name test below):
 *   - "missing config uses defaults" — config loading no longer exists; default
 *     friend/English is now unconditional and covered implicitly by every test.
 *   - "project-local config overrides global config" — the project-local config
 *     override (_<memory-dir>/ pattern) is removed per ADR-002; no project-local
 *     config is consulted.
 *   - "YAML parser skips nested lines and handles quoted values" — the YAML parser
 *     function is removed entirely per ADR-002; no config files are read.
 */

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

const SCRIPT = join(__dirname, '..', 'init-sanctum.js');

function runInit(skillPath, memoryDir, { cwd, extraArgs } = {}) {
  /** Run init-sanctum.js with a custom --memory-dir and return { exitCode, stdout, stderr }. */
  const args = [SCRIPT, skillPath, '--memory-dir', memoryDir];
  if (extraArgs) args.push(...extraArgs);

  try {
    const stdout = execFileSync('node', args, {
      cwd: cwd || undefined,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { exitCode: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout?.toString() ?? '',
      stderr: err.stderr?.toString() ?? '',
    };
  }
}

function makeSkill(tmp) {
  /** Create a minimal skill structure for testing. */
  const skill = join(tmp, 'skill');
  mkdirSync(join(skill, 'references'), { recursive: true });
  mkdirSync(join(skill, 'assets'), { recursive: true });
  mkdirSync(join(skill, 'scripts'), { recursive: true });

  writeFileSync(join(skill, 'references', 'implementation.md'),
    '---\nname: Implementation\ndescription: Implement a ticket\ncode: IM\n---\n# Implementation\n');
  writeFileSync(join(skill, 'references', 'memory-guidance.md'),
    '---\nname: memory-guidance\ndescription: Memory guidance\n---\n# Memory\n');
  writeFileSync(join(skill, 'references', 'first-breath.md'),
    '# First Breath\n');

  for (const name of ['INDEX-template.md', 'PERSONA-template.md', 'CREED-template.md',
                       'BOND-template.md', 'MEMORY-template.md']) {
    writeFileSync(join(skill, 'assets', name),
      `# Template\nuser: {user_name}\nborn: {birth_date}\n`);
  }
  return skill;
}

function makeMemoryDir(tmp) {
  /** Create a memory dir (empty — no config files per ADR-002). */
  const memory = join(tmp, 'memory');
  mkdirSync(memory, { recursive: true });
  return memory;
}

function makeTmp() {
  return mkdtempSync(join(tmpdir(), 'sanctum-test-'));
}


describe('init-sanctum', () => {
  const tmpDirs = [];

  function makeTmpTracked() {
    const tmp = makeTmp();
    tmpDirs.push(tmp);
    return tmp;
  }

  afterEach(() => {
    while (tmpDirs.length) {
      const dir = tmpDirs.pop();
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('fresh init creates sanctum with all expected files', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    const { exitCode, stdout, stderr } = runInit(skill, memory, { cwd: tmp });
    assert.equal(exitCode, 0, `Expected exit 0, got ${exitCode}. stderr: ${stderr}`);

    const result = JSON.parse(stdout);
    assert.equal(result.status, 'success');
    assert.equal(result.capabilities_discovered, 1);
    assert.ok(result.capability_codes.includes('IM'));

    const sanctum = join(memory, 'delivery-lead');
    assert.ok(existsSync(sanctum));
    assert.ok(existsSync(join(sanctum, 'INDEX.md')));
    assert.ok(existsSync(join(sanctum, 'PERSONA.md')));
    assert.ok(existsSync(join(sanctum, 'CREED.md')));
    assert.ok(existsSync(join(sanctum, 'BOND.md')));
    assert.ok(existsSync(join(sanctum, 'MEMORY.md')));
    assert.ok(existsSync(join(sanctum, 'CAPABILITIES.md')));
    assert.ok(existsSync(join(sanctum, 'sessions')));
    assert.ok(existsSync(join(sanctum, 'capabilities')));
    assert.ok(!existsSync(join(sanctum, 'references', 'first-breath.md')));
    assert.ok(existsSync(join(sanctum, 'references', 'implementation.md')));

    const persona = readFileSync(join(sanctum, 'PERSONA.md'), 'utf-8');
    // Default user_name is 'friend' — First Breath captures the real name at runtime
    assert.ok(persona.includes('friend'));
    assert.ok(!persona.includes('{user_name}'));
  });

  it('default user_name is "friend" and default language is "English"', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    const { exitCode, stdout } = runInit(skill, memory, { cwd: tmp });
    assert.equal(exitCode, 0);
    const sanctum = join(memory, 'delivery-lead');
    const bond = readFileSync(join(sanctum, 'BOND.md'), 'utf-8');
    // Templates substitute {user_name} → friend, {communication_language} → English
    assert.ok(bond.includes('friend') || !bond.includes('{user_name}'));
    const persona = readFileSync(join(sanctum, 'PERSONA.md'), 'utf-8');
    assert.ok(!persona.includes('{user_name}'));
  });

  it('existing sanctum skips', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    runInit(skill, memory, { cwd: tmp });
    const { exitCode, stdout } = runInit(skill, memory);
    assert.equal(exitCode, 0);
    const result = JSON.parse(stdout);
    assert.equal(result.status, 'skipped');
    assert.equal(result.reason, 'sanctum_exists');
  });

  it('-o flag writes JSON to a file instead of stdout', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);
    const outFile = join(tmp, 'result.json');

    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['-o', outFile] });
    assert.equal(exitCode, 0);
    assert.equal(stdout.trim(), '');
    assert.ok(existsSync(outFile));
    const result = JSON.parse(readFileSync(outFile, 'utf-8'));
    assert.equal(result.status, 'success');
  });

  it('CAPABILITIES.md contains discovered capability', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    runInit(skill, memory, { cwd: tmp });
    const caps = readFileSync(join(memory, 'delivery-lead', 'CAPABILITIES.md'), 'utf-8');
    assert.ok(caps.includes('[IM]'));
    assert.ok(caps.includes('Implementation'));
    assert.ok(caps.includes('Learned'));
  });

  it('--help prints usage and exits cleanly', () => {
    const { exitCode, stdout } = runInit('dummy', 'dummy', { extraArgs: ['--help'] });
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('First Breath scaffolding'));
    assert.ok(stdout.includes('skill_path'));
  });

  it('--upgrade updates references without touching identity files', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    // First: create sanctum
    const init = runInit(skill, memory, { cwd: tmp });
    assert.equal(init.exitCode, 0);

    const sanctum = join(memory, 'delivery-lead');

    // Modify PERSONA.md (identity file — should NOT be overwritten)
    const personaPath = join(sanctum, 'PERSONA.md');
    writeFileSync(personaPath, '# My evolved persona\nI am unique.\n');

    // Update a reference in the skill bundle (should be copied on upgrade)
    writeFileSync(join(skill, 'references', 'implementation.md'),
      '---\nname: Implementation\ndescription: Updated description\ncode: IM\n---\n# Implementation v2\n');

    // Add a new reference
    writeFileSync(join(skill, 'references', 'new-cap.md'),
      '---\nname: New Capability\ndescription: Something new\ncode: NC\n---\n# New\n');

    // Run upgrade
    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['--upgrade'] });
    assert.equal(exitCode, 0);
    const result = JSON.parse(stdout);
    assert.equal(result.status, 'success');
    assert.equal(result.mode, 'upgrade');
    assert.equal(result.capabilities_discovered, 2);
    assert.ok(result.capability_codes.includes('NC'));

    // Identity file untouched
    assert.equal(readFileSync(personaPath, 'utf-8'), '# My evolved persona\nI am unique.\n');

    // Reference updated
    const impl = readFileSync(join(sanctum, 'references', 'implementation.md'), 'utf-8');
    assert.ok(impl.includes('Implementation v2'));

    // New reference present
    assert.ok(existsSync(join(sanctum, 'references', 'new-cap.md')));

    // CAPABILITIES.md regenerated
    const caps = readFileSync(join(sanctum, 'CAPABILITIES.md'), 'utf-8');
    assert.ok(caps.includes('[NC]'));
    assert.ok(caps.includes('New Capability'));
  });

  it('--upgrade fails without sanctum', () => {
    const tmp = makeTmpTracked();
    const memory = join(tmp, 'empty_memory');
    mkdirSync(memory);
    const skill = makeSkill(tmp);

    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['--upgrade'] });
    assert.equal(exitCode, 1);
    const result = JSON.parse(stdout);
    assert.equal(result.status, 'error');
  });

  it('--check on healthy sanctum returns ok', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    runInit(skill, memory, { cwd: tmp });

    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['--check'] });
    assert.equal(exitCode, 0);
    const result = JSON.parse(stdout);
    assert.equal(result.healthy, true);
    assert.equal(result.status, 'ok');
  });

  it('--check detects missing files', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    runInit(skill, memory, { cwd: tmp });

    // Delete a required file
    const sanctum = join(memory, 'delivery-lead');
    unlinkSync(join(sanctum, 'BOND.md'));

    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['--check'] });
    assert.equal(exitCode, 1);
    const result = JSON.parse(stdout);
    assert.equal(result.healthy, false);
    assert.ok(result.missing_files.includes('BOND.md'));
  });

  it('--check detects stale references', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    runInit(skill, memory, { cwd: tmp });

    // Update a reference in the skill bundle (sanctum copy is now stale)
    writeFileSync(join(skill, 'references', 'implementation.md'),
      '---\nname: Implementation\ndescription: Updated\ncode: IM\n---\n# v2\n');

    const { stdout } = runInit(skill, memory, { extraArgs: ['--check'] });
    const result = JSON.parse(stdout);
    assert.ok(result.stale_references.includes('implementation.md'));
  });

  it('--check on non-existent sanctum returns error', () => {
    const tmp = makeTmpTracked();
    const memory = join(tmp, 'empty_memory');
    mkdirSync(memory);
    const skill = makeSkill(tmp);

    const { exitCode, stdout } = runInit(skill, memory, { extraArgs: ['--check'] });
    assert.equal(exitCode, 1);
    const result = JSON.parse(stdout);
    assert.equal(result.healthy, false);
  });

  it('--reset recreates sanctum', () => {
    const tmp = makeTmpTracked();
    const memory = makeMemoryDir(tmp);
    const skill = makeSkill(tmp);

    // Create initial sanctum
    runInit(skill, memory, { cwd: tmp });

    const sanctum = join(memory, 'delivery-lead');
    // Add a custom file that should be deleted on reset
    writeFileSync(join(sanctum, 'sessions', '2026-04-01.md'), '# Old session\n');

    // Reset
    const { exitCode, stdout } = runInit(skill, memory, { cwd: tmp, extraArgs: ['--reset'] });
    assert.equal(exitCode, 0);
    const result = JSON.parse(stdout);
    assert.equal(result.status, 'success');

    // Sanctum exists but old session is gone
    assert.ok(existsSync(sanctum));
    assert.ok(!existsSync(join(sanctum, 'sessions', '2026-04-01.md')));
  });

});
