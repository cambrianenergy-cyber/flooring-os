// Firestore data model for jobs, rooms, measurements, materials, and labor

/\*\*

- GLOBAL CONVENTIONS (APPLY TO ALL COLLECTIONS)
- - createdAt: timestamp
- - updatedAt: timestamp
- - workspaceId: string (for workspace-scoped docs)
- - ownerUserId: string (where relevant)
- - isDeleted: boolean (soft delete)
- - deletedAt: timestamp | null (soft delete timestamp)
- - amountCents: number (for money, never float)
- - <fieldName>Normalized: string (lowercased for search/sort)
    \*/

/\*\*

- Collection: jobs/{jobId}
- Fields:
- - workspaceId: string
- - customerId: string
- - name: string
- - nameNormalized: string
- - status: "estimate" | "scheduled" | "install" | "complete" | "canceled"
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
- - scheduledDate: timestamp | null
- - completedDate: timestamp | null
- - notes: string
- Subcollections:
- - rooms/{roomId}
- - materials/{materialId}
- - labor/{laborId}
    \*/

/\*\*

- jobs/{jobId}/rooms/{roomId}
- Fields:
- - name: string
- - nameNormalized: string
- - measurements: map (e.g., { length: number, width: number, ... })
- - photos: array<string> (URLs)
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- jobs/{jobId}/materials/{materialId}
- Fields:
- - productId: string
- - name: string
- - nameNormalized: string
- - quantity: number
- - unit: string
- - costCents: number
- - sellPriceCents: number
- - assignedRoomId: string | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/

/\*\*

- jobs/{jobId}/labor/{laborId}
- Fields:
- - type: string (e.g., "install", "demo", "prep")
- - hours: number
- - rateCents: number
- - assignedRoomId: string | null
- - isDeleted: boolean
- - deletedAt: timestamp | null
- - createdAt: timestamp
- - updatedAt: timestamp
    \*/
