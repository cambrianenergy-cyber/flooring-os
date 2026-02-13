const fs = require('fs');

// Read .env.local
const env = fs.readFileSync('.env.local', 'utf8');

// Find FIREBASE_PRIVATE_KEY value
const match = env.match(/FIREBASE_PRIVATE_KEY="?([^\"]+)"?/);
if (!match) {
  console.error('FIREBASE_PRIVATE_KEY not found.');
  process.exit(1);
}

const key = match[1].replace(/\\n/g, '\n').replace(/\n/g, '\n');
console.log('\nPaste this into Vercel (no quotes):\n');
console.log(key);
