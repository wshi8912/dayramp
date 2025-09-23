#!/usr/bin/env node
// Concatenate split seed SQL files into supabase/seed.sql
// Keeps entries & tasks in separate files while satisfying Supabase CLI (no psql \ir)

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const header = path.join(root, 'supabase', 'seeds', '_header.sql');
const entries = path.join(root, 'supabase', 'seeds', 'entries.sql');
const tasks = path.join(root, 'supabase', 'seeds', 'tasks.sql');
const footer = path.join(root, 'supabase', 'seeds', '_footer.sql');
const out = path.join(root, 'supabase', 'seed.sql');

function read(file) {
  if (!fs.existsSync(file)) {
    console.error(`[seed:build] Missing file: ${file}`);
    process.exit(1);
  }
  return fs.readFileSync(file, 'utf8').replace(/\s+$/g, '') + '\n';
}

try {
  const parts = [
    '-- GENERATED FILE. Do not edit directly.\n-- Run `npm run seed:build` to regenerate from supabase/seeds/*.sql\n',
    read(header),
    '\n-- ---------------------------------------------------------------------------\n-- Seed: entries and tasks (inlined by build-seed.js)\n-- ---------------------------------------------------------------------------\n',
    read(entries),
    '\n',
    read(tasks),
    '\n',
    read(footer),
  ];

  fs.writeFileSync(out, parts.join('\n'));
  console.log(`[seed:build] Wrote ${path.relative(root, out)}`);
} catch (err) {
  console.error('[seed:build] Failed to build seed.sql');
  console.error(err);
  process.exit(1);
}

