import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './lib/app.js';
import { geminiConfigured, geminiModel, loadEnv, portNumber } from './lib/env.js';

const root = dirname(fileURLToPath(import.meta.url));
loadEnv(root);

const invoked = process.argv[1] && process.argv[1].endsWith('server.js');
if (invoked) {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 20) {
    console.error('Node.js 20 or newer is required.');
    process.exit(1);
  }
  const app = createApp({ root });
  const port = portNumber();
  app.listen(port, () => {
    console.log(`Whiteboard tutor at http://localhost:${port}`);
    console.log(`Health check: http://localhost:${port}/api/health`);
    if (!geminiConfigured()) console.log('GEMINI_API_KEY is not set. Add it to .env and restart.');
    else console.log(`Gemini model: ${geminiModel() || '(invalid GEMINI_MODEL)'}`);
  });
}
