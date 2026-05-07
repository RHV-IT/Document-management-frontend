const fs = require('fs');
const mapPath = 'C:/Users/user/Downloads/dms-frontend/.next/dev/static/chunks/_0pf0tzu._.js.map';

try {
  const data = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  console.log('Total sources:', data.sources.length);
  const matches = data.sources.filter(s => s.includes('files/page.tsx'));
  console.log('Matches count:', matches.length);
  if (matches.length > 0) {
    console.log('First match:', matches[0]);
  }
} catch (err) {
  console.error('Error:', err.message);
}
