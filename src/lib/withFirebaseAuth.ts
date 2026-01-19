// Firebase Auth Middleware for Next.js API routes
// Replace x-debug-uid with real token verification for production

import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';

export function withFirebaseAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // In development, use x-debug-uid header
    const debugUid = req.headers['x-debug-uid'];
    if (process.env.NODE_ENV !== 'production' && debugUid) {
      (req as any).uid = debugUid;
      return handler(req, res);
    }

    // TODO: Replace with Firebase token verification for production
    // Example:
    // const token = req.headers.authorization?.split('Bearer ')[1];
    // const decoded = await admin.auth().verifyIdToken(token);
    // (req as any).uid = decoded.uid;
    // return handler(req, res);

    res.status(401).json({ error: 'Unauthorized' });
  };
}
