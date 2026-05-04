require('dotenv').config({ path: '../.env' });
const { execSync } = require('child_process');

const port = process.env.FRONTEND_PORT || 3000;
console.log(`\n🚀 Starting Next.js frontend on port ${port} (Loaded from root .env)...\n`);

try {
  execSync(`npx next dev -p ${port}`, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
