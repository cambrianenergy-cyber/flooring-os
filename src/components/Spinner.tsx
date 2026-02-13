export default function Spinner() {
  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Loading spinner"
      >
        <circle
          cx="20"
          cy="20"
          r="18"
          stroke="#888"
          strokeWidth="4"
          opacity="0.2"
        />
        <path
          d="M38 20a18 18 0 1 1-18-18"
          stroke="#555"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 20 20"
            to="360 20 20"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      </svg>
      <div style={{ marginTop: "1rem", color: "#555" }}>Loading...</div>
    </div>
  );
}
