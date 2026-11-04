#!/usr/bin/env node
/**
 * 連結驗證腳本：掃描遊戲設計文件中的所有 Markdown 連結，
 * 檢查目標檔案是否存在。
 *
 * 用法：node scripts/validate-links.mjs
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';

const GAME_DESIGN_DIR = join(import.meta.dirname, '..', 'docs', '遊戲設計');
const LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

async function findMdFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findMdFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const mdFiles = await findMdFiles(GAME_DESIGN_DIR);
  let totalLinks = 0;
  let brokenLinks = 0;
  let externalLinks = 0;
  const errors = [];

  for (const filePath of mdFiles) {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      let match;
      while ((match = LINK_REGEX.exec(lines[i])) !== null) {
        const [, label, href] = match;
        totalLinks++;

        // Skip external links, anchors, and special schemes
        if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
          externalLinks++;
          continue;
        }

        // Resolve relative path
        const targetPath = resolve(dirname(filePath), href.split('#')[0]);
        if (!await fileExists(targetPath)) {
          brokenLinks++;
          const relativeSrc = filePath.replace(GAME_DESIGN_DIR, '.');
          errors.push({ file: relativeSrc, line: i + 1, label, href, target: targetPath });
        }
      }
    }
  }

  console.log(`\n=== 遊戲設計文件連結驗證 ===\n`);
  console.log(`掃描檔案數：${mdFiles.length}`);
  console.log(`總連結數：  ${totalLinks}`);
  console.log(`外部連結：  ${externalLinks}（已跳過）`);
  console.log(`失效連結：  ${brokenLinks}`);

  if (errors.length > 0) {
    console.log(`\n❌ 失效連結明細：\n`);
    for (const e of errors) {
      console.log(`  ${e.file}:${e.line}`);
      console.log(`    [${e.label}](${e.href})`);
      console.log(`    → ${e.target}\n`);
    }
    process.exit(1);
  } else {
    console.log(`\n✅ 所有本地連結均有效。\n`);
    process.exit(0);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(2);
});
