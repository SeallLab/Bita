import React, { useState } from 'react';

const GeminiChat = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/query-papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query }),
      });
      console.log(res)
      const data = await res.json();
      console.log(data)
      setResponse(data.response);
    } catch (err) {
      setResponse(`Error connecting to Gemini API: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto', fontFamily: 'Arial' }}>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        rows={4}
        style={{ width: '100%', padding: '10px' }}
        placeholder="Ask a question..."
      />
      <button onClick={handleAsk} disabled={loading} style={{ marginTop: '10px' }}>
        {loading ? 'Asking...' : 'Ask'}
      </button>
      {response && (
        <div style={{ marginTop: '20px', background: '#f2f2f2', padding: '15px' }}>
          <p style={{ color: '#000000' }}>{response}</p>
        </div>
      )}
    </div>
  );
};

export default GeminiChat;