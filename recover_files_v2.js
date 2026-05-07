const fs = require('fs');
const path = require('path');

const mapPath = 'C:/Users/user/Downloads/dms-frontend/.next/dev/static/chunks/_0pf0tzu._.js.map';
const outPath = 'C:/Users/user/Downloads/dms-frontend/app/dashboard/files/page.tsx';

try {
  const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  let foundContent = null;

  if (data.sections && Array.isArray(data.sections)) {
    for (const section of data.sections) {
      const sources = section.map?.sources;
      const contents = section.map?.sourcesContent;
      if (sources && contents && sources.length > 0) {
        for (let i = 0; i < sources.length; i++) {
          const src = sources[i];
          if (src.includes('app/dashboard/files/page.tsx')) {
            foundContent = contents[i];
            break;
          }
        }
      }
      if (foundContent) break;
    }
  }

  if (foundContent) {
    // Unescape \n etc.
    const unescaped = foundContent.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
    fs.writeFileSync(outPath, unescaped, 'utf8');
    console.log('Recovered file with', unescaped.length, 'characters');
  } else {
    console.error('File not found in any section');
    process.exit(1);
  }
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
