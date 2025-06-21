export default function SystemSpecsModal({ isOpen, onClose, systemSpecs, setSystemSpecs }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#1e1e1e",
        color: "#ddd",
        padding: 20,
        borderRadius: 10,
        border: "1px solid #333",
        width: 450,
        boxShadow: "0 0 12px rgba(0,0,0,0.5)"
      }}>
        <h3 style={{ color: "#a0c4ff", marginBottom: 12 }}>System Specs</h3>
        <textarea
          value={systemSpecs}
          onChange={(e) => setSystemSpecs(e.target.value)}
          placeholder="Describe your system here (e.g. face detection on mobile, etc)"
          rows={5}
          style={{
            width: "96%",
            backgroundColor: "#1a1a1a",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: 6,
            padding: 8,
            marginBottom: 15,
            fontFamily: "inherit"
          }}
        />
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#2c3e50",
            color: "#a0c4ff",
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            float: "right"
          }}
        >
          Save
        </button>
      </div>
    </div>
  );
}