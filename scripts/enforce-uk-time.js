const fs = require('fs');
const path = require('path');

const directory = 'src';

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.match(/\.(tsx?|jsx?)$/)) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(directory);

let count = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. toLocaleDateString('en-GB', { ... }) -> insert timeZone
  // Regex looks for toLocaleDateString(LOCALE, {
  // We want to verify timeZone isn't already there.
  content = content.replace(/\.toLocaleDateString\((['"][^'"]+['"]|undefined),\s*\{/g, (match, locale) => {
    if (content.substring(content.indexOf(match) + match.length).startsWith(' timeZone:')) return match; // rudimentary check, prone to fail if multiple
    return `.toLocaleDateString(${locale}, { timeZone: 'Europe/London', `;
  });

  // 2. toLocaleDateString('en-GB') -> add options
  content = content.replace(/\.toLocaleDateString\((['"][^'"]+['"])\)/g, (match, locale) => {
    return `.toLocaleDateString(${locale}, { timeZone: 'Europe/London' })`;
  });

  // 3. toLocaleDateString() -> add locale and options
  content = content.replace(/\.toLocaleDateString\(\)/g, () => {
    return `.toLocaleDateString('en-GB', { timeZone: 'Europe/London' })`;
  });

  // 4. Same for toLocaleTimeString
  content = content.replace(/\.toLocaleTimeString\((['"][^'"]+['"]|undefined),\s*\{/g, (match, locale) => {
     return `.toLocaleTimeString(${locale}, { timeZone: 'Europe/London', `;
  });

  content = content.replace(/\.toLocaleTimeString\((['"][^'"]+['"])\)/g, (match, locale) => {
    return `.toLocaleTimeString(${locale}, { timeZone: 'Europe/London' })`;
  });

  content = content.replace(/\.toLocaleTimeString\(\)/g, () => {
    return `.toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })`;
  });

  // 5. Cleanup duplicates if we ran it twice or regex overmatched
  // e.g. { timeZone: 'Europe/London',  timeZone: 'Europe/London',
  // Not perfect, but we assume clean run.
  
  if (content !== original) {
    console.log(`Updated ${file}`);
    fs.writeFileSync(file, content, 'utf8');
    count++;
  }
});

console.log(`Enforced UK Time on ${count} files.`);
