#!/usr/bin/env node

const defaultBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3008';
const base = process.env.DEV_SEED_BASE_URL || defaultBase;
const url = `${base.replace(/\/$/, '')}/api/dev/seed-today`;

async function main() {
  try {
    const response = await fetch(url, { method: 'POST' });
    const bodyText = await response.text();

    if (!response.ok) {
      console.error(`[dev-seed] request failed (${response.status})`);
      console.error(bodyText);
      process.exit(1);
    }

    try {
      const data = JSON.parse(bodyText);
      console.log(
        `[dev-seed] inserted ${data.inserted ?? 0} items for ${data.dayKey} (${data.timezone})`
      );
    } catch (err) {
      console.log('[dev-seed] response:', bodyText);
    }
  } catch (error) {
    console.error('[dev-seed] request error');
    console.error(error);
    process.exit(1);
  }
}

main();
