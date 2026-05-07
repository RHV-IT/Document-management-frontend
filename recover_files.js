const fs = require('fs');
const path = require('path');

const mapPath = 'C:/Users/user/Downloads/dms-frontend/.next/dev/static/chunks/_0pf0tzu._.js.map';
const outPath = 'C:/Users/user/Downloads/dms-frontend/app/dashboard/files/page.tsx';

try {
  const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  const idx = data.sources.findIndex(s => s.includes('app/dashboard/files/page.tsx'));
  if (idx >= 0) {
    const content = data.sourcesContent[idx];
    // The content is a string with \n escaped. We need to unescape it.
    const unescaped = content.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    fs.writeFileSync(outPath, unescaped, 'utf8');
    console.log('Recovered file with', unescaped.length, 'characters');
  } else {
    console.error('File not found in sources');
    process.exit(1);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
