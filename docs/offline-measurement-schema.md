# Offline-first measurement schema

This maps the required entities to Firestore (existing workspace-scoped layout) and adds offline/sync expectations.

## Top-level collections (workspace scoped)
- customers/{customerId}
  - workspaceId, name, contacts[], addresses[], createdAt, updatedAt.
- jobs/{jobId}
  - workspaceId, customerId, title, propertyAddress { line1, city, state, postal }, status, schedule, assignedCrew, createdAt, updatedAt.
- products/{productId}
  - workspaceId, sku, name, category/materialType, uom, cost, price, vendor, tags[], archived, updatedAt.
- priceBooks/{priceBookId}
  - workspaceId, name, effectiveFrom, rules { labor, material, addons }, updatedAt.
- workflow_runs/{runId} (reports/export runs)
  - workspaceId, jobId?, type, status, payload, createdAt, updatedAt.
- auditLogs/{logId}
  - workspaceId, jobId?, roomId?, segmentId?, action, actorId, deviceId, timestamp, payloadDiff/summary.

## Job subcollections
- jobs/{jobId}/rooms/{roomId}
  - name, status (Pending|Measured|Needs Photos), areaSqFt, ceilingHeight, floorType, tags[], updatedAt.
  - geometry (single doc: jobs/{jobId}/rooms/{roomId}/geometry/current)
    - mode: points | numbers
    - points: [{ id, x, y, z?, seq }]
    - segments: [{ id, startPointId, endPointId, length, angle, wallLabel, fromLaser }]
    - labels: [{ id, text, pointId?, segmentId? }]
    - version, updatedAt, updatedBy.
  - measurements (collection: jobs/{jobId}/rooms/{roomId}/measurements/{measurementId})
    - segmentId?, deviceId, timestamp, captureMode (single|walk), reading { length, angle, tilt }, userId, source (laser|manual), qualityFlags.
  - photos (collection: jobs/{jobId}/rooms/{roomId}/photos/{photoId})
    - uri/cloudUrl, localUri, annotations[], capturedAt, userId, deviceId.
- jobs/{jobId}/estimates/{estimateId}
  - status, totals, tax, version, priceBookId, updatedAt.
  - lineItems (collection: jobs/{jobId}/estimates/{estimateId}/lineItems/{lineItemId})
    - productId, qty, waste, priceOverride, roomRefs[], notes.
- jobs/{jobId}/proposals/{proposalId}
  - estimateId, pdfUrl, version, signerSlots[], createdAt.
  - signatures (collection: jobs/{jobId}/proposals/{proposalId}/signatures/{signatureId})
    - signer, role, signedAt, hash/blobRef.
- jobs/{jobId}/orders/{orderId}
  - vendor, poNumber, lineItems, status, deliveryWindows, updatedAt.

## Offline-first expectations
- Deterministic client IDs (UUID v4) for all new records; include workspaceId/jobId/roomId on each record to simplify merges.
- Local mirror (SQLite/IndexedDB) for jobs, rooms, geometry, measurements, photos (with localUri), estimates/lineItems, products, priceBooks.
- Change markers: updatedAt, updatedBy on mutable docs; append-only for measurements and auditLogs.
- Sync queue with lamport/vector clock per record; idempotent server writes keyed by record ID.
- Resumable uploads for photos; mark dirty/clean per record; background retry with backoff.
- Offline banner + manual "sync now"; no dependency on live auth refresh for capture.

## Audit/history guarantees
- Every measurement write also appends auditLogs entry with roomId, segmentId, userId, deviceId, timestamp, mode, reading.
- Geometry updates bump version and log before/after summary or patch.
- Photos keep immutable originals; annotations stored as overlays.

## Minimal indexes
- jobs by workspaceId
- rooms by jobId
- products by workspaceId
- measurements by roomId (timestamp)
- auditLogs by workspaceId, jobId
- workflow_runs by workspaceId, jobId
