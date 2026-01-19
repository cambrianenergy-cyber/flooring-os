// page.tsx
// Room Photos page for RoomListWithPhotoMeasurement

"use client";
import RoomListWithPhotoMeasurement from "@/components/RoomListWithPhotoMeasurement";



import { useRooms } from "@/lib/useRooms";

export default function RoomPhotosPage() {
  const { rooms, loading, error } = useRooms();
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Room Photos & Measurements</h1>
      {loading && <div>Loading rooms...</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && <RoomListWithPhotoMeasurement rooms={rooms} />}
    </div>
  );
}
