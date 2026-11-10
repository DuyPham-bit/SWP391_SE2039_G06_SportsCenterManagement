// Read every source file of an FSD slice (e.g. 'pages/coach-professional-hub') as one string,
// so source-text assertions keep working when a slice is split into smaller ui/lib/model modules.
const fs = require('node:fs');
const path = require('node:path');

const SRC = path.resolve(__dirname, '../../src');

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap(entry => entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}

function readSlice(slice) {
  return listFiles(path.join(SRC, slice))
    .filter(file => /\.(jsx?)$/.test(file))
    .map(file => fs.readFileSync(file, 'utf8'))
    .join('\n');
}

module.exports = { readSlice };
