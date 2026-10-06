import { useState, useEffect } from 'react';
import api from './services/api';

function App() {
  const [connectionData, setConnectionData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'connected' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const testBackendConnection = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const response = await api.get('/test');
      setConnectionData(response.data);
      setStatus('connected');
    } catch (error) {
      console.error('Error connecting to backend:', error);
      setStatus('error');
      setErrorMessage(
        error.response?.data?.message || 
        error.message || 
        'Could not reach backend at http://localhost:5000'
      );
    }
  };

  useEffect(() => {
    testBackendConnection();
  }, []);

  return (
    <div className="container">
      <header className="header">
        <div className="logo-badge">🌱 GreenKhata</div>
        <h1>Frontend ↔ Backend Connection Setup</h1>
        <p className="subtitle">MERN Stack Initial Architecture</p>
      </header>

      <main className="main-card">
        <div className="status-section">
          <h2>Backend Connection Status</h2>

          {status === 'loading' && (
            <div className="status-box loading">
              <div className="spinner"></div>
              <p>Testing connection to backend API (<code>GET /api/test</code>)...</p>
            </div>
          )}

          {status === 'connected' && connectionData && (
            <div className="status-box success">
              <div className="badge success-badge">✅ Connected</div>
              <h3>{connectionData.message}</h3>
              <div className="response-preview">
                <strong>API Response:</strong>
                <pre>{JSON.stringify(connectionData, null, 2)}</pre>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="status-box error">
              <div className="badge error-badge">❌ Connection Failed</div>
              <h3>Backend Not Reachable</h3>
              <p className="error-text">{errorMessage}</p>
              <div className="troubleshoot-tips">
                <p><strong>To start the backend server:</strong></p>
                <ol>
                  <li>Open a terminal in the <code>backend/</code> directory</li>
                  <li>Run: <code>npm run dev</code></li>
                  <li>Ensure backend runs on <code>http://localhost:5000</code></li>
                </ol>
              </div>
            </div>
          )}

          <button 
            type="button" 
            className="retry-btn" 
            onClick={testBackendConnection}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Checking...' : '🔄 Re-test Connection'}
          </button>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h4>🌐 Frontend</h4>
            <p><strong>Port:</strong> 5173</p>
            <p><strong>Framework:</strong> React + Vite</p>
            <p><strong>Client:</strong> Axios</p>
          </div>
          <div className="info-card">
            <h4>⚙️ Backend</h4>
            <p><strong>Port:</strong> 5000</p>
            <p><strong>Server:</strong> Express.js</p>
            <p><strong>Endpoint:</strong> /api/test</p>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>GreenKhata • Base setup established</p>
      </footer>
    </div>
  );
}

export default App;
