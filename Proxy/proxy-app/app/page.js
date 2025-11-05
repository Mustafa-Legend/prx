'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url) {
      const encodedUrl = encodeURIComponent(url);
      setProxyUrl(`/api/proxy?url=${encodedUrl}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Web Proxy</h1>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL to proxy"
          style={{
            width: '300px',
            padding: '8px',
            marginRight: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Proxy
        </button>
      </form>

      {proxyUrl && (
        <div>
          <h2>Proxied Content:</h2>
          <iframe
            src={proxyUrl}
            style={{
              width: '100%',
              height: '600px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
            title="Proxied Content"
          />
        </div>
      )}
    </div>
  );
}