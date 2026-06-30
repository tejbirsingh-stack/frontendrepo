import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'src');
const skipFiles = new Set(['src/theme/cssVars.ts', 'src/theme/theme.ts', 'src/context/ThemePreferenceContext.tsx']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, files);
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

const cssVarsImportRe = /^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]*cssVars)['"];\n/gm;
const colorsImportRe = /^import\s+\{[^}]*\}\s+from\s+['"][^'"]*theme\/theme['"];\n/gm;

let changed = 0;
for (const file of walk(srcDir)) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (skipFiles.has(rel)) continue;
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  const needsCv = /\bcv\./.test(content);
  const needsPalette = /\bpalette\./.test(content);
  const usesColors = /\bcolors\./.test(content);

  // Collect cssVars imports
  const names = new Set();
  let cssVarsPath = null;
  let match;
  cssVarsImportRe.lastIndex = 0;
  while ((match = cssVarsImportRe.exec(content)) !== null) {
    cssVarsPath = match[2];
    match[1].split(',').forEach((part) => {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) names.add(name);
    });
  }

  if (needsCv) names.add('cv');
  if (needsPalette) names.add('palette');

  // Remove all cssVars imports
  content = content.replace(cssVarsImportRe, '');

  // Remove colors import if unused
  if (!usesColors) {
    content = content.replace(colorsImportRe, '');
  }

  // Re-add single cssVars import if needed
  if (names.size > 0) {
    const rel = path.relative(path.dirname(file), path.join(srcDir, 'theme/cssVars')).replace(/\\/g, '/');
    const importPath = (rel.startsWith('.') ? rel : `./${rel}`).replace(/\.ts$/, '');
    const sorted = [...names].sort((a, b) => (a === 'cv' ? -1 : b === 'cv' ? 1 : a.localeCompare(b)));
    const importLine = `import { ${sorted.join(', ')} } from '${importPath}';\n`;
    const firstImport = content.match(/^import .+;\n/m);
    if (firstImport) {
      const idx = content.indexOf(firstImport[0]) + firstImport[0].length;
      content = content.slice(0, idx) + importLine + content.slice(idx);
    } else {
      content = importLine + content;
    }
  }

  if (content !== original) {
    fs.writeFileSync(file, content);
    changed += 1;
  }
}

console.log(`Fixed imports in ${changed} files.`);
