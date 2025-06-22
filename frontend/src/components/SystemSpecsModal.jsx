export default function SystemSpecsModal({ isOpen, onClose, systemSpecs, setSystemSpecs }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.6)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 1000
    }}>
      <div style={{
        position: "relative",
        background: "#1e1e1e",
        color: "#ddd",
        padding: 20,
        borderRadius: 10,
        border: "1px solid #333",
        width: "90%",
        maxWidth: 500,
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: "0 0 12px rgba(0,0,0,0.5)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box"
      }}>
        <h3 style={{ color: "#a0c4ff", marginBottom: 12 }}>System Specs</h3>

        <textarea
          value={systemSpecs}
          onChange={(e) => setSystemSpecs(e.target.value)}
          placeholder="Describe your system here (e.g. face detection on mobile, etc)"
          rows={5}
          style={{
            flexGrow: 1,
            resize: "vertical",
            maxHeight: 200,
            minHeight: 100,
            backgroundColor: "#1a1a1a",
            color: "#eee",
            border: "1px solid #444",
            borderRadius: 6,
            padding: 8,
            marginBottom: 15,
            fontFamily: "inherit",
            width: "100%",
            boxSizing: "border-box"
          }}
        />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10
        }}>
          <div style={{
            fontSize: "0.75rem",
            color: "#888",
            lineHeight: 1.3,
            maxWidth: "75%"
          }}>
            <p style={{ margin: 0, marginBottom: 4 }}><strong>💡 Some extra info to add for best results:</strong></p>
            <ul style={{ paddingLeft: 16, margin: 0, listStyle: "disc" }}>
              <li>Your testing plan</li>
              <li>Tests you already have</li>
              <li>System inputs & outputs</li>
              <li>Real-world constraints or assumptions</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "#2c3e50",
              color: "#a0c4ff",
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginLeft: 10
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}