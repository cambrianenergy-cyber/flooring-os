import type { NextApiRequest, NextApiResponse } from 'next';

// Import DocuSign SDK (make sure to install: npm install docusign-esign)
import docusign from 'docusign-esign';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Replace with your DocuSign credentials and config
  // DocuSign API route temporarily disabled due to incompatible module format with Next.js (Turbopack).
  // To re-enable, move DocuSign integration to a serverless function or external service.

  // import type { NextApiRequest, NextApiResponse } from 'next';
  // import docusign from 'docusign-esign';

  // export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  //   if (req.method !== 'POST') {
  //     return res.status(405).json({ error: 'Method not allowed' });
  //   }
  //
  //   // TODO: Replace with your DocuSign credentials and config
  //   const integratorKey = process.env.DOCUSIGN_INTEGRATOR_KEY;
  //   const userId = process.env.DOCUSIGN_USER_ID;
  //   const privateKey = process.env.DOCUSIGN_PRIVATE_KEY;
  //   const basePath = process.env.DOCUSIGN_BASE_PATH || 'https://demo.docusign.net/restapi';
  //   const oauthBasePath = process.env.DOCUSIGN_OAUTH_BASE_PATH || 'account-d.docusign.com';
  //
  //   // Example: Envelope creation logic
  //   try {
  //     const apiClient = new docusign.ApiClient();
  //     apiClient.setBasePath(basePath);
  //     apiClient.setOAuthBasePath(oauthBasePath);
  //
  //     // Authenticate (JWT)
  //     const results = await apiClient.requestJWTUserToken(
  //       integratorKey,
  //       userId,
  //       ['signature'],
  //       privateKey,
  //       3600
  //     );
  //     const accessToken = results.body.access_token;
  //     apiClient.addDefaultHeader('Authorization', 'Bearer ' + accessToken);
  //
  //     // Get user info
  //     const userInfo = await apiClient.getUserInfo(accessToken);
  //     const accountId = userInfo.accounts[0].accountId;
  //
  //     // Prepare envelope definition (replace with your document and recipient info)
  //     const envelopeDefinition = new docusign.EnvelopeDefinition();
  //     envelopeDefinition.emailSubject = 'Please sign this estimate';
  //     envelopeDefinition.status = 'sent';
  //     // Add document and recipient logic here
  //
  //     // Send envelope
  //     const envelopesApi = new docusign.EnvelopesApi(apiClient);
  //     const envelopeSummary = await envelopesApi.createEnvelope(accountId, { envelopeDefinition });
  //
  //     res.status(200).json({ envelopeId: envelopeSummary.envelopeId });
  //   } catch (error: any) {
  //     res.status(500).json({ error: error.message || 'DocuSign error' });
  //   }
  // }
}
