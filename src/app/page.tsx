'use client';
import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [proxyUrl, setProxyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [directLink, setDirectLink] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setIsLoading(true);
    try {
      const encodedUrl = encodeURIComponent(url);
      const proxyUrlString = `/api/proxy?url=${encodedUrl}`;
      setProxyUrl(proxyUrlString);
      setDirectLink(proxyUrlString);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>🌐 Web Proxy</h1>
      <p>Enter the URL you want to browse through the proxy:</p>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            style={{
              flex: '1',
              minWidth: '300px',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '16px'
            }}
            required
          />
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: '12px 24px',
              backgroundColor: isLoading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Loading...' : 'Browse'}
          </button>
        </div>
      </form>

      {proxyUrl && (
        <div style={{ marginTop: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <h2>Proxied Content:</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <a
                href={directLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Open in New Tab
              </a>
              <button
                onClick={() => {
                  setProxyUrl('');
                  setUrl('');
                  setDirectLink('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <iframe
              src={proxyUrl}
              style={{
                width: '100%',
                height: '60vh',
                border: '2px solid #0070f3',
                borderRadius: '8px',
                backgroundColor: 'white'
              }}
              title="Proxied Content"
            />
            
            <div style={{ 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Direct Link:</strong>{' '}
              <a href={directLink} target="_blank" rel="noopener noreferrer">
                {directLink}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}