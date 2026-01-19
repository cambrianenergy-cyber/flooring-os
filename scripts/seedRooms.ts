// seedRooms.ts
// Script to seed Firestore with a comprehensive list of room types

import { db } from "../src/lib/firebase";
import { collection, setDoc, doc } from "firebase/firestore";

const roomNames = [
  "Primary Bedroom", "Primary Bathroom", "Primary Closet", "Bedroom Closets", "Hallway",
  "Bedroom #1", "Bedroom #2", "Bedroom #3", "Bedroom #4", "Bedroom #5",
  "Bath #1", "Bath #2", "Bath #3", "Bath #4", "Bath #5",
  "Powder Room", "Sewing Room", "Craftroom", "Living Room", "Dining Room",
  "Den", "Great Room", "Family Room", "Gameroom", "Foyer", "Entry",
  "Study Room", "Office", "Utility Room", "Understair", "Hall Closets",
  "Breakfast Rm", "Pantry", "Bonus Room"
];

export async function seedRooms() {
  for (const name of roomNames) {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await setDoc(doc(collection(db, "rooms"), id), { name });
  }
  console.log("Rooms seeded!");
}

// To run: import and call seedRooms() from a script or use Node.js
