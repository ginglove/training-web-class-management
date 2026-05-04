const fs = require('fs');
const code = fs.readFileSync('backend/booking-service/src/controllers/booking.controller.js', 'utf8');

// A very simple regex-based check for rows usage vs definition
const definitions = [];
const usages = [];

const lines = code.split('\n');
lines.forEach((line, idx) => {
  const lineNum = idx + 1;
  
  // Definition: const { rows ... } or let { rows ... }
  const defMatch = line.match(/(const|let)\s*{\s*rows\s*(:\s*(\w+))?\s*}\s*=\s*/);
  if (defMatch) {
    definitions.push({ name: defMatch[3] || 'rows', line: lineNum });
  }

  // Usage: rows[0], rows.length, rows.map, etc.
  // But not inside a definition
  if (!defMatch) {
    const usageMatch = line.match(/\brows\b/);
    if (usageMatch) {
      usages.push({ line: lineNum, content: line.trim() });
    }
  }
});

console.log('Definitions:', definitions);
console.log('Usages:', usages);
