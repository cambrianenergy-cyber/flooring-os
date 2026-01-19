// Firestore data model for jobs, rooms, measurements, materials, and labor

/**
 * Collection: jobs/{jobId}
 * Fields:
 * - workspaceId: string
 * - customerId: string
 * - name: string
 * - status: "estimate" | "scheduled" | "install" | "complete" | "canceled"
 * - createdAt: timestamp
 * - updatedAt: timestamp
 * - scheduledDate: timestamp | null
 * - completedDate: timestamp | null
 * - notes: string
 *
 * Subcollections:
 *   - rooms/{roomId}
 *   - materials/{materialId}
 *   - labor/{laborId}
 */

/**
 * jobs/{jobId}/rooms/{roomId}
 * Fields:
 * - name: string
 * - measurements: map (e.g., { length: number, width: number, ... })
 * - photos: array<string> (URLs)
 * - createdAt, updatedAt
 */

/**
 * jobs/{jobId}/materials/{materialId}
 * Fields:
 * - productId: string
 * - name: string
 * - quantity: number
 * - unit: string
 * - cost: number
 * - sellPrice: number
 * - assignedRoomId: string | null
 * - createdAt, updatedAt
 */

/**
 * jobs/{jobId}/labor/{laborId}
 * Fields:
 * - type: string (e.g., "install", "demo", "prep")
 * - hours: number
 * - rate: number
 * - assignedRoomId: string | null
 * - createdAt, updatedAt
 */
