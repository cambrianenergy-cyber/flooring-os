// seedRooms.ts
// Script to seed Firestore with a comprehensive list of room types


import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

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
