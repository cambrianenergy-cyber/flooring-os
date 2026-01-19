"use client";
import WorkflowStepper from "../../../components/WorkflowStepper";
import ManualMeasureMode from "../../../components/ManualMeasureMode";
import LeicaConnectButton from "../../../components/LeicaConnectButton";
import RoomDrawingCanvas from "../../../components/RoomDrawingCanvas";
import DistoFloorPlanEditor from "../../../components/DistoFloorPlanEditor";
import TakeoffGenerator from "../../../components/TakeoffGenerator";
import { useEffect, useState } from "react";
import PhotoMeasurement from "../../../components/PhotoMeasurement";
import { useRouter } from "next/navigation";


export default function MeasurePage() {
  const [manualResult, setManualResult] = useState<any>(null);
  const [leicaDistance, setLeicaDistance] = useState<number | null>(null);
  const [leicaHistory, setLeicaHistory] = useState<number[]>([]);
  const [drawingPoints, setDrawingPoints] = useState<{ x: number; y: number }[]>([]);
  const [takeoff, setTakeoff] = useState<any>(null);
  const [waste, setWaste] = useState(10);
  const router = useRouter();
  const [showPhotoMeasurement, setShowPhotoMeasurement] = useState(false);
  const [photoData, setPhotoData] = useState<any | null>(null);

  // Load persisted measurement artifacts
  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedLeica = localStorage.getItem("leicaMeasurements");
    if (savedLeica) {
      try { setLeicaHistory(JSON.parse(savedLeica)); } catch {}
    }
    const savedPhoto = localStorage.getItem("photoMeasurement");
    if (savedPhoto) {
      try { setPhotoData(JSON.parse(savedPhoto)); } catch {}
    }
  }, []);

  const persistLeica = (val: number) => {
    setLeicaDistance(val);
    setLeicaHistory(prev => {
      const next = [val, ...prev].slice(0, 5);
      if (typeof window !== "undefined") {
        localStorage.setItem("leicaMeasurements", JSON.stringify(next));
      }
      return next;
    });
  };

  return (
    <div className="text-[#e8edf7]">
      <WorkflowStepper current="Measure" />
      <h1 className="text-2xl font-semibold mb-4 text-[#e8edf7]">Measure</h1>
      <div className="mb-4 flex items-center gap-4">
        <ManualMeasureMode onComplete={setManualResult} />
        <button
          className="px-3 py-1 bg-[#59f2c2] text-[#0c111a] rounded font-medium"
          onClick={() => setShowPhotoMeasurement(v => !v)}
        >
          {showPhotoMeasurement ? "Hide" : "Photo Measurement"}
        </button>
      </div>
      {showPhotoMeasurement && (
        <div className="mb-4">
          <PhotoMeasurement
            roomId={"general"}
            onChange={data => {
              setPhotoData(data);
              if (typeof window !== "undefined") {
                localStorage.setItem("photoMeasurement", JSON.stringify(data));
              }
              setShowPhotoMeasurement(false);
            }}
          />
          {photoData && (
            <div className="mt-2 text-sm text-[#c7d2ff]">Last saved photo measurement stored locally.</div>
          )}
        </div>
      )}
      <div className="mb-4">
        <LeicaConnectButton onMeasurement={persistLeica} />
        {leicaDistance && <div className="text-green-700">Last Leica measurement: {leicaDistance} ft</div>}
        {leicaHistory.length > 0 && (
          <div className="mt-2 text-xs text-[#e8edf7]">
            Recent: {leicaHistory.join(", ")} ft
          </div>
        )}
      </div>
      <div className="mb-4">
        <DistoFloorPlanEditor
          roomId="main"
          onSave={async data => {
            // You can wire this to auto-fill estimate or takeoff as needed
            setDrawingPoints(data.points);
          }}
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Waste (%)</label>
        <select value={waste} onChange={e => setWaste(Number(e.target.value))} className="border rounded px-2 py-1">
          {[5, 10, 12, 15].map(w => <option key={w} value={w}>{w}%</option>)}
        </select>
      </div>
      {manualResult && (
        <TakeoffGenerator
          shape={manualResult.shape}
          distances={manualResult.distances}
          wastePct={waste}
          onResult={(result) => {
            setTakeoff(result);
            // Pass takeoff data to estimate page via query string (or state if using app router)
            router.push(`/app/estimate?autoFill=${encodeURIComponent(JSON.stringify(result))}`);
          }}
        />
      )}
      {takeoff && (
        <div className="mt-4 p-2 border rounded bg-green-50">
          <div className="font-bold">Takeoff sent to Estimate!</div>
          <div>Sqft: {takeoff.sqft.toFixed(2)}, Waste: {takeoff.waste.toFixed(2)}, Linear Ft: {takeoff.linearFt.toFixed(2)}</div>
        </div>
      )}
    </div>
  );
}