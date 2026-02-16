import { NextResponse } from "next/server";
import * as docusign from "docusign-esign";

export async function POST(req: Request) {
  try {
    const { signerEmail, signerName, documentBase64, documentName } = await req.json();

    // Configure DocuSign API
    const apiClient = new docusign.ApiClient();
    apiClient.setBasePath("https://demo.docusign.net/restapi");
    apiClient.addDefaultHeader("Authorization", "Bearer " + process.env.DOCUSIGN_ACCESS_TOKEN);

    // Envelope definition
    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = "Please sign this document";
    envelopeDefinition.documents = [
      {
        documentBase64,
        name: documentName,
        fileExtension: "pdf",
        documentId: "1",
      },
    ];
    envelopeDefinition.recipients = {
      signers: [
        {
          email: signerEmail,
          name: signerName,
          recipientId: "1",
          routingOrder: "1",
          tabs: {
            signHereTabs: [
              {
                anchorString: "[SIGN_HERE]",
                anchorYOffset: "0",
                anchorUnits: "pixels",
                anchorXOffset: "0",
              },
            ],
          },
        },
      ],
    };
    envelopeDefinition.status = "sent";

    // Send envelope
    const envelopesApi = new docusign.EnvelopesApi(apiClient);
    const results = await envelopesApi.createEnvelope(process.env.DOCUSIGN_ACCOUNT_ID, { envelopeDefinition });

    return NextResponse.json({ envelopeId: results.envelopeId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "DocuSign error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
