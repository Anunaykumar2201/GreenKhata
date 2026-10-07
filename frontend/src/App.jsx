import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [mobile, setMobile] = useState('7488455057');
  const [consentId, setConsentId] = useState('');
  const [consentUrl, setConsentUrl] = useState('');
  const [statusText, setStatusText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);
  const [search, setSearch] = useState('');

  // 1. Generate Consent
  const handleGenerateConsent = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setStatusText('Generating Consent with Setu OneMoney...');

    try {
      const res = await axios.post(`${API_BASE}/aa/consent`, { mobile });
      setConsentId(res.data.consentId);
      setConsentUrl(res.data.url);
      setStatusText(`Consent created (${res.data.status || 'PENDING'}). Please approve in OneMoney.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.errorMsg || err.response?.data?.error || err.message);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  // 2. Open OneMoney Approval Window
  const handleOpenApproval = () => {
    if (consentUrl) {
      window.open(consentUrl, '_blank', 'width=550,height=720');
    }
  };

  // 3. Fetch Transactions
  const handleFetchTransactions = async () => {
    if (!consentId) {
      setErrorMsg('Please generate a consent ID first.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setStatusText('Fetching encrypted transaction data from Bank...');

    try {
      const res = await axios.post(`${API_BASE}/aa/consent/${consentId}/fetch`);
      if (res.data.success) {
        setTransactions(res.data.transactions || []);
        setSessionStatus(res.data.sessionStatus || 'COMPLETED');
        setStatusText(`Successfully fetched ${res.data.count || res.data.transactions?.length} transactions!`);
      } else {
        setErrorMsg('Failed to fetch data.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.errorMsg || err.response?.data?.error || err.message);
      setStatusText('');
    } finally {
      setLoading(false);
    }
  };

  // Load any previously cached data on startup
  useEffect(() => {
    axios
      .get(`${API_BASE}/aa/transactions`)
      .then((res) => {
        if (res.data.success && res.data.transactions?.length > 0) {
          setTransactions(res.data.transactions);
          setSessionStatus('CACHED');
          setStatusText(`Loaded ${res.data.count} previously fetched transactions.`);
        }
      })
      .catch(() => {});
  }, []);

  // Filter transactions
  const filteredList = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (t.narration && t.narration.toLowerCase().includes(q)) ||
      (t.mode && t.mode.toLowerCase().includes(q)) ||
      (t.amount && t.amount.toString().includes(q)) ||
      (t.type && t.type.toLowerCase().includes(q))
    );
  });

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-badge">🌱 GreenKhata</div>
        <h1>Account Aggregator Transaction Tester</h1>
        <p className="subtitle">
          Test bank statement retrieval via RBI Account Aggregator (Setu × OneMoney)
        </p>
      </header>

      {/* Control Card */}
      <section className="card control-card">
        <h3>1. Bank Connection Setup</h3>

        {errorMsg && <div className="alert alert-error">❌ {errorMsg}</div>}
        {statusText && <div className="alert alert-info">ℹ️ {statusText}</div>}

        <form onSubmit={handleGenerateConsent} className="form-row">
          <div className="input-group">
            <label htmlFor="mobile">Mobile Number:</label>
            <input
              id="mobile"
              type="text"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="e.g. 7488455057"
              className="text-input"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Step 1: Generate Consent'}
          </button>
        </form>

        {consentId && (
          <div className="consent-box">
            <div className="consent-meta">
              <strong>Consent ID:</strong> <code>{consentId}</code>
            </div>

            <div className="action-buttons">
              <button
                type="button"
                className="btn btn-warning"
                onClick={handleOpenApproval}
              >
                Step 2: Open OneMoney Approval (OTP) ↗
              </button>

              <button
                type="button"
                className="btn btn-success"
                onClick={handleFetchTransactions}
                disabled={loading}
              >
                {loading ? 'Fetching...' : 'Step 3: Fetch Transactions 📥'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Transaction History Section */}
      <section className="card history-card">
        <div className="history-header">
          <div>
            <h3>2. Fetched Transaction History</h3>
            <span className="count-tag">
              {transactions.length} total transactions {sessionStatus && `• Status: ${sessionStatus}`}
            </span>
          </div>

          <div className="history-actions">
            {transactions.length > 0 && (
              <>
                <input
                  type="text"
                  placeholder="Filter narration, mode, amount..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowRawJson(!showRawJson)}
                >
                  {showRawJson ? 'Hide JSON' : 'View Raw JSON'}
                </button>
              </>
            )}
          </div>
        </div>

        {showRawJson && (
          <div className="json-preview">
            <pre>{JSON.stringify(transactions, null, 2)}</pre>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions loaded yet.</p>
            <small>Generate a consent and fetch statements above to test.</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Narration</th>
                  <th>Mode</th>
                  <th>Type</th>
                  <th>Current Balance</th>
                  <th className="text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((t, idx) => (
                  <tr key={t.txnId || idx}>
                    <td>
                      <div className="txn-date">
                        {t.transactionTimestamp
                          ? new Date(t.transactionTimestamp).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : t.valueDate || 'N/A'}
                      </div>
                      <small className="txn-id">{t.txnId || t.reference || ''}</small>
                    </td>
                    <td>
                      <div className="txn-narration">{t.narration || 'Bank Transfer'}</div>
                    </td>
                    <td>
                      <span className={`badge-mode mode-${(t.mode || 'other').toLowerCase()}`}>
                        {t.mode || 'OTHER'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge-type type-${(t.type || 'debit').toLowerCase()}`}>
                        {t.type || 'DEBIT'}
                      </span>
                    </td>
                    <td>₹{parseFloat(t.currentBalance || 0).toLocaleString('en-IN')}</td>
                    <td className="text-right">
                      <strong className={t.type === 'CREDIT' ? 'amt-credit' : 'amt-debit'}>
                        {t.type === 'CREDIT' ? '+' : '-'}₹
                        {parseFloat(t.amount || 0).toLocaleString('en-IN')}
                      </strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
