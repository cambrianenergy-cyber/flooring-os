# MeasurementCore (Swift Package)

A lightweight shared module for the iPad app:
- Models matching the Firestore schema (jobs, rooms, geometry, measurements, photos, estimates, audit).
- Repository protocols for Core Data/GRDB implementations.
- Sync envelope types for push/pull with idempotent upserts.

Getting started:
1) `cd ios/MeasurementCore && swift package resolve`
2) Add the package to your Xcode workspace and implement repositories in the app target.
3) Keep deterministic UUIDs for all new entities to align with Firestore merges.
