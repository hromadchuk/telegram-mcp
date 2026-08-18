import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url) {
    req.url = req.url.replace(/^\/api(?=\/|$)/, '') || '/';
  }

  const { getVercelHandler } = await import('../backend/dist/vercel-handler.js');
  const app = await getVercelHandler();

  return app(req, res);
}
