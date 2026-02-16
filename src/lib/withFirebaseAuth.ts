// Firebase Auth Middleware for Next.js API routes
// Replace x-debug-uid with real token verification for production


import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { getAuth } from 'firebase-admin/auth';
// Server-only code removed for static export
// import { adminDb } from './firebaseAdmin';
const adminDb = () => ({});

export function withFirebaseAuth(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // In development, use x-debug-uid header
    const debugUid = req.headers['x-debug-uid'];
    if (process.env.NODE_ENV !== 'production' && debugUid) {
      (req as any).uid = debugUid;
      return handler(req, res);
    }

    // Production: verify Firebase ID token
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
      }
      const token = authHeader.split('Bearer ')[1];
      adminDb(); // Ensure admin is initialized
      const decoded = await getAuth().verifyIdToken(token);
      (req as any).uid = decoded.uid;
      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };
}
