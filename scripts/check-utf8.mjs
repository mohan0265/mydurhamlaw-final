import fs from 'fs';
import path from 'path';

const files = [
  path.join('src', 'components', 'DurmahWidget.tsx'),
  path.join('src', 'pages', 'dashboard.tsx'),
];

const nonAscii = /[^\x09\x0A\x0D\x20-\x7E]/;
let hasError = false;

for (const filePath of files) {
  const text = fs.readFileSync(filePath, 'utf8');
  if (nonAscii.test(text)) {
    hasError = true;
    console.error(`Non-ASCII characters found in ${filePath}`);
  }
}

if (hasError) {
  process.exit(1);
}
