"use client";

import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  QuerySnapshot,
  QueryDocumentSnapshot,
  Timestamp,
  where,
  limit,
  getDocs,
} from "firebase/firestore";

type Appt = {
  id: string;
  customerName: string;
  phone: string;
  fullAddress: string;
  startTime: string;
  createdAt: Timestamp | undefined;
};

const TIME_OPTIONS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
  "6:00 PM", "7:00 PM", "8:00 PM",
];

import WorkflowStepper from "../../../components/WorkflowStepper";
import { useRouter } from "next/navigation";
export default function AppointmentsPage() {
      const router = useRouter();
    // --- Usage metering state ---
    const [usagePercent, setUsagePercent] = useState<number | null>(null);
    const usageCap = 100; // Example cap, replace with real value if needed
  const [items, setItems] = useState<Appt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTimeOption, setStartTimeOption] = useState("");
  const [customTime, setCustomTime] = useState("");
  const [user, setUser] = useState(() => auth.currentUser);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
        // Simulate fetching usage (replace with real backend call if needed)
        // For demo: usage = number of appointments this month / cap
        const fetchUsage = async () => {
          // Count appointments for this user/workspace this month
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
          const qUsage = query(
            collection(db, "appointments"),
            where("workspaceId", "==", FOUNDER_WORKSPACE_ID),
            where("createdBy", "==", user?.uid || ""),
            where("startTime", ">=", monthStart)
          );
          try {
            const snap = await getDocs(qUsage);
            // Example: cap is 100 per month
            setUsagePercent(Math.min(1, snap.size / usageCap));
          } catch {
            setUsagePercent(null);
          }
        };
        if (user && user.uid) fetchUsage();
    // Listen for auth state changes to update user
    const unsubAuth = auth.onAuthStateChanged(setUser);

    // Only allow founder to see appointments; wire in founder workspaceId
    // Replace with your actual founder email and workspaceId
    const FOUNDER_EMAIL = "founder@yourdomain.com";
    const FOUNDER_WORKSPACE_ID = "founder-workspace-id";
    const uid = user?.uid;
    const email = user?.email;
    if (!uid || !email || email !== FOUNDER_EMAIL) return () => unsubAuth();
    const workspaceId = FOUNDER_WORKSPACE_ID;

    // Show upcoming appointments for this workspace and user, ordered by startTime
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10); // YYYY-MM-DD
    const q = query(
      collection(db, "appointments"),
      where("workspaceId", "==", workspaceId),
      where("createdBy", "==", uid),
      where("startTime", ">=", todayIso),
      orderBy("startTime", "asc"),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot) => {
        try {
          const rows = snap.docs
            .map((d: QueryDocumentSnapshot) => {
              const data = d.data() as Partial<Appt>;
              // Validate required fields
              if (
                typeof data.customerName !== "string" ||
                typeof data.phone !== "string" ||
                typeof data.fullAddress !== "string" ||
                typeof data.startTime !== "string"
              ) {
                return null;
              }
              return {
                id: d.id,
                customerName: data.customerName,
                phone: data.phone,
                fullAddress: data.fullAddress,
                startTime: data.startTime,
                createdAt: data.createdAt,
              };
            })
            .filter((a): a is Appt => a !== null);
          setItems(rows);
          setError(null);
        } catch {
          setError("Failed to load appointments.");
        }
        setLoading(false);
      },
      (err) => {
        setError("Error fetching appointments: " + (err?.message || err));
        setLoading(false);
      }
    );
    return () => {
      unsub();
      unsubAuth();
    };
  }, [user, usageCap]);

  async function createAppointment() {
        // Block creation if at 100% usage
        if (usagePercent !== null && usagePercent >= 1) {
          setError("You have reached your appointment limit. Please upgrade your plan to continue.");
          return;
        }
    const chosenTime = startTimeOption === "other" ? customTime.trim() : startTimeOption;
    if (!customerName || !phone || !fullAddress || !startDate || !chosenTime) {
      if (!window.confirm("Some fields are missing or invalid. Do you want to proceed?")) {
        return;
      }
    }

    const startTime = `${startDate} ${chosenTime}`;

    // Only allow founder to create appointments; wire in founder workspaceId
    // Replace with your actual founder workspaceId
    const FOUNDER_WORKSPACE_ID = "founder-workspace-id";
    const workspaceId = FOUNDER_WORKSPACE_ID;
    try {
      await addDoc(collection(db, "appointments"), {
        customerName,
        phone,
        fullAddress,
        startTime,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? null,
        createdByEmail: auth.currentUser?.email ?? null,
        workspaceId,
      });
      setCustomerName("");
      setPhone("");
      setFullAddress("");
      setStartDate("");
      setStartTimeOption("");
      setCustomTime("");
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError("Failed to create appointment: " + errorMsg);
    }
  }

  function navigateTo(address: string) {
    // FREE: no Google Maps API key needed
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, "_blank");
  }

  return (
    <div>
      <WorkflowStepper current="Appointment" />
      <h1 className="text-2xl font-semibold">Appointments</h1>
      <p className="text-sm text-gray-600 mt-2">
        Create appointments and tap Navigate to open directions.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded border border-red-300">
          {error}
        </div>
      )}
      {/* Behavioral Upgrade Triggers */}
      {usagePercent !== null && usagePercent >= 0.7 && usagePercent < 0.9 && (
        <div className="mb-4 p-3 bg-blue-100 text-blue-900 rounded border border-blue-300 font-semibold text-center">
          You’re running smarter than most contractors.
        </div>
      )}
      {usagePercent !== null && usagePercent >= 0.9 && usagePercent < 1 && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-900 rounded border border-yellow-300 font-semibold text-center">
          Your growth is being capped by your plan.
        </div>
      )}
      {usagePercent !== null && usagePercent >= 1 && (
        <div className="mb-4 p-3 bg-red-100 text-red-900 rounded border border-red-300 font-semibold text-center">
          <span>You have hit your appointment limit for this month.</span>
          <button
            className="ml-3 bg-red-600 text-white px-4 py-2 rounded font-bold"
            onClick={() => router.push("/app/billing")}
          >
            Upgrade Plan
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-gray-500">Loading appointments…</div>
      ) : (
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium">New Appointment</h2>

          <label className="block text-xs text-gray-500 mt-3">Customer Name</label>
          <input className="w-full border rounded-md p-2 text-sm mt-1"
            value={customerName} onChange={(e) => setCustomerName(e.target.value)} />

          <label className="block text-xs text-gray-500 mt-3">Phone (any format)</label>
          <input className="w-full border rounded-md p-2 text-sm mt-1"
            value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label className="block text-xs text-gray-500 mt-3">Full Address</label>
          <input className="w-full border rounded-md p-2 text-sm mt-1"
            value={fullAddress} onChange={(e) => setFullAddress(e.target.value)}
            placeholder="123 Main St, Dallas, TX 75201" />

          <label className="block text-xs text-gray-500 mt-3">Scheduled Date</label>
          <div className="flex items-center gap-2 mt-1">
            <input
              ref={dateInputRef}
              type="date"
              className="w-full border rounded-md p-2 text-sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <button
              type="button"
              onClick={() => dateInputRef.current?.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.focus()}
              className="border rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
            >
              Calendar
            </button>
          </div>

          <label className="block text-xs text-gray-500 mt-3">Time</label>
          <div className="mt-1 flex flex-col gap-2">
            <select
              className="w-full border rounded-md p-2 text-sm"
              value={startTimeOption}
              onChange={(e) => setStartTimeOption(e.target.value)}
            >
              <option value="">Select time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="other">Other…</option>
            </select>
            {startTimeOption === "other" && (
              <input
                className="w-full border rounded-md p-2 text-sm"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                placeholder="Enter custom time (e.g., 6:30 PM)"
              />
            )}
          </div>

          <button
            onClick={createAppointment}
            className="mt-4 bg-black text-white rounded-md px-4 py-2 text-sm"
          >
            Create Appointment
          </button>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h2 className="font-medium">Today / Upcoming</h2>
          <div className="mt-3 space-y-2 max-h-[55vh] overflow-auto">
            {items.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments yet.</p>
            ) : (
              items.map((a) => (
                <div key={a.id} className="border rounded-md p-3">
                  <div className="text-sm font-medium">{a.customerName}</div>
                  <div className="text-xs text-gray-600">{a.phone}</div>
                  <div className="text-xs text-gray-600 mt-1">{a.startTime}</div>
                  <div className="text-xs text-gray-600 mt-1">{a.fullAddress}</div>

                  <button
                    onClick={() => navigateTo(a.fullAddress)}
                    className="mt-3 border rounded-md px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Navigate
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
