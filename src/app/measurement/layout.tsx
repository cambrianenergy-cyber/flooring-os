export default function MeasurementLayout({ children }: { children: React.ReactNode }) {
  // Fullscreen layout for measurement tools (no sidebar, no padding)
  return (
    <div className="measurement-layout">
      {children}
    </div>
  );
}
