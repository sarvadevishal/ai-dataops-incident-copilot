import React, { useState, useEffect, useCallback } from 'react';
import {
  Bot, Send, Copy, Trash2, Database, AlertTriangle, Briefcase,
  FileCode2, Wrench, CheckCircle2, Trello, MessageSquare,
  ShieldCheck, HelpCircle, Activity, History, Search, X,
  Clock, ChevronRight, RotateCcw, Layers
} from 'lucide-react';
import './App.css';

const API_BASE = 'https://api.butterbase.ai/v1/app_jie2qwoo2vdh';

const INCIDENT_TYPE_LABELS = {
  redshift: 'Redshift', informatica: 'Informatica', aws_glue: 'AWS Glue',
  sql: 'SQL', data_quality: 'Data Quality', general: 'General',
};

const AUDIENCE_LABELS = {
  full: 'Full Package', engineering: 'Engineering',
  leadership: 'Leadership', customer: 'Customer',
};

const SAMPLES = [
  {
    title: '1. Redshift integer cast failure', type: 'redshift', audience: 'engineering',
    text: "ERROR: Invalid digit, Value ' ', Pos 1, Type: Integer \nDETAIL:  \n  -----------------------------------------------\n  error:  Invalid digit, Value ' ', Pos 1, Type: Integer \n  code:      1207\n  context:   \n  query:     8291038\n  location:  :0\n  process:   query1_112_8291038 [pid=12345]\n  -----------------------------------------------",
  },
  {
    title: '2. Redshift numeric overflow', type: 'redshift', audience: 'full',
    text: "ERROR: Numeric data overflow (result precision)\nDETAIL:  \n  -----------------------------------------------\n  error:  Numeric data overflow (result precision)\n  code:      1058\n  context:   128 bit overflow\n  query:     9012341\n  location:  numeric_type.hpp:123\n  process:   query2_22_9012341 [pid=9876]\n  -----------------------------------------------\nCaused by decimal multiplication in fact_sales_daily aggregation.",
  },
  {
    title: '3. AS400 Data Discrepancy', type: 'data_quality', audience: 'leadership',
    text: 'Data reconciliation check failed between source AS400 and target Redshift. Table: `finance_ledger`. Date: 2026-05-01. Source count: 1,500,230. Target count: 1,499,100. Discrepancy of 1,130 records. No failed ETL jobs reported in Airflow.',
  },
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const TYPE_COLORS = {
  redshift: '#818cf8', informatica: '#f472b6', aws_glue: '#fb923c',
  sql: '#34d399', data_quality: '#fbbf24', general: '#94a3b8',
};

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || '#94a3b8';
  return (
    <span className="type-badge" style={{ color, borderColor: color + '55', background: color + '15' }}>
      {INCIDENT_TYPE_LABELS[type] || type}
    </span>
  );
}

function ConfidencePill({ level }) {
  if (!level) return null;
  return <span className={`status-pill status-${level.toLowerCase()}`}>{level}</span>;
}

function App() {
  const [activeTab, setActiveTab] = useState('new');
  const [issueText, setIssueText] = useState('');
  const [incidentType, setIncidentType] = useState('redshift');
  const [audience, setAudience] = useState('full');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // History state
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsLoading, setLogsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery) params.set('search', searchQuery);
      if (filterType) params.set('type', filterType);
      const res = await fetch(`${API_BASE}/fn/get-logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch {
      /* silent */
    } finally {
      setLogsLoading(false);
    }
  }, [searchQuery, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleLoadSample = (sample) => {
    setIssueText(sample.text);
    setIncidentType(sample.type);
    setAudience(sample.audience);
    setActiveTab('new');
  };

  const handleClear = () => { setIssueText(''); setResult(null); setError(null); setSelectedLog(null); };

  const copyToClipboard = (text) => { if (text) navigator.clipboard.writeText(text); };

  const copyFullAnalysis = () => {
    if (result) copyToClipboard(JSON.stringify(result, null, 2));
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setSelectedLog(null);

    try {
      const response = await fetch(`${API_BASE}/fn/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueText, incidentType, audience }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze incident');
      }
      const data = await response.json();
      setResult(data);
      fetchLogs();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreLog = (log) => {
    setIssueText(log.issue_text_preview || '');
    setIncidentType(log.incident_type);
    setAudience(log.audience);
    setSelectedLog(log);
    setActiveTab('new');
    // If we have the full result cached in logs, show it
    if (log._result) setResult(log._result);
  };

  const handleViewLogResult = async (log) => {
    // Fetch full result from the log
    setSelectedLog(log);
    setIncidentType(log.incident_type);
    setAudience(log.audience);
    setIssueText(log.issue_text_preview || '');
    setActiveTab('new');
    setError(null);
    // We don't store the full result in the list response (just preview).
    // Show a placeholder indicating this is a restored view.
    setResult({
      executiveSummary: log.executive_summary,
      confidenceLevel: log.confidence_level,
      _restored: true,
      _logId: log.id,
    });
  };

  const handleDeleteLog = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this log entry?')) return;
    await fetch(`${API_BASE}/fn/delete-log?id=${id}`, { method: 'DELETE' });
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setLogsTotal((t) => t - 1);
    if (selectedLog?.id === id) { setSelectedLog(null); setResult(null); }
  };

  const handleReAnalyze = async () => {
    if (!issueText.trim()) return;
    await handleAnalyze({ preventDefault: () => {} });
  };

  const renderCard = (title, icon, content, isCode = false, onCopy = null) => {
    if (!content) return null;
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">{icon} {title}</div>
          {onCopy && (
            <button className="btn-icon" onClick={() => onCopy(content)} title="Copy">
              <Copy size={16} />
            </button>
          )}
        </div>
        <div className="card-body">
          {isCode ? <pre className="code-block">{content}</pre>
            : Array.isArray(content) ? <ul>{content.map((item, i) => <li key={i}>{item}</li>)}</ul>
            : <p>{content}</p>}
        </div>
      </div>
    );
  };

  const displayResult = result;

  return (
    <div className="app-container">
      <header className="hero">
        <div className="hero-badge">Powered by Z.AI GLM-5.1</div>
        <h1 className="hero-title">AI DataOps Incident Copilot</h1>
        <p className="hero-subtitle">
          Convert raw ETL and SQL failures into RCA, fixes, validation queries, Jira updates, and customer-ready communication in seconds.
        </p>
      </header>

      <main className="main-content">
        {/* Left Column */}
        <div className="left-panel">
          {/* Tab Navigation */}
          <div className="panel-tabs">
            <button
              className={`panel-tab ${activeTab === 'new' ? 'active' : ''}`}
              onClick={() => setActiveTab('new')}
            >
              <Bot size={15} /> New Incident
            </button>
            <button
              className={`panel-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => { setActiveTab('history'); fetchLogs(); }}
            >
              <History size={15} /> History
              {logsTotal > 0 && <span className="tab-badge">{logsTotal}</span>}
            </button>
          </div>

          {/* New Incident Form */}
          {activeTab === 'new' && (
            <div className="input-section">
              {selectedLog && (
                <div className="restored-banner">
                  <RotateCcw size={13} />
                  Restored from {formatDate(selectedLog.created_at)}
                  <button className="restored-close" onClick={() => { setSelectedLog(null); setResult(null); }}>
                    <X size={13} />
                  </button>
                </div>
              )}
              <form onSubmit={handleAnalyze}>
                <div className="form-group">
                  <label className="form-label">Incident Type</label>
                  <select className="form-control" value={incidentType} onChange={e => setIncidentType(e.target.value)}>
                    <option value="redshift">Redshift</option>
                    <option value="informatica">Informatica</option>
                    <option value="aws_glue">AWS Glue</option>
                    <option value="sql">SQL</option>
                    <option value="data_quality">Data Quality</option>
                    <option value="general">General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Audience</label>
                  <select className="form-control" value={audience} onChange={e => setAudience(e.target.value)}>
                    <option value="full">Full Package</option>
                    <option value="engineering">Engineering</option>
                    <option value="leadership">Leadership</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Incident Details / Raw Logs</label>
                  <textarea
                    className="form-control"
                    placeholder="Paste raw error logs, slack messages, or stack traces here..."
                    value={issueText}
                    onChange={e => setIssueText(e.target.value)}
                    required
                  />
                </div>
                <div className="action-buttons">
                  <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={isLoading}>
                    <Trash2 size={16} /> Clear
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isLoading || !issueText.trim()}>
                    {isLoading
                      ? <><div className="spinner" style={{ width: 16, height: 16, margin: 0, borderWidth: 2 }} /> Analyzing...</>
                      : <><Bot size={16} /> Analyze Incident</>}
                  </button>
                </div>
              </form>

              <div className="samples-container">
                <h3 className="samples-title">Try a Sample</h3>
                <div className="sample-buttons">
                  {SAMPLES.map((s, i) => (
                    <button key={i} className="sample-btn" onClick={() => handleLoadSample(s)}>{s.title}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* History Panel */}
          {activeTab === 'history' && (
            <div className="history-panel">
              {/* Search & Filter */}
              <div className="history-controls">
                <div className="history-search">
                  <Search size={14} className="search-icon" />
                  <input
                    className="search-input"
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button className="search-clear" onClick={() => setSearchQuery('')}><X size={13} /></button>
                  )}
                </div>
                <select
                  className="form-control filter-select"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {Object.entries(INCIDENT_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {logsLoading && (
                <div className="history-loading">
                  <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                </div>
              )}

              {!logsLoading && logs.length === 0 && (
                <div className="history-empty">
                  <Layers size={36} />
                  <p>No audit logs yet.</p>
                  <p className="history-empty-sub">Analyzed incidents will appear here automatically.</p>
                </div>
              )}

              <div className="log-list">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`log-item ${selectedLog?.id === log.id ? 'log-item-active' : ''}`}
                    onClick={() => handleViewLogResult(log)}
                  >
                    <div className="log-item-header">
                      <TypeBadge type={log.incident_type} />
                      <ConfidencePill level={log.confidence_level} />
                      <button
                        className="log-delete-btn"
                        onClick={(e) => handleDeleteLog(e, log.id)}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <p className="log-summary">{log.executive_summary || 'No summary available'}</p>
                    <div className="log-meta">
                      <span className="log-meta-item"><Clock size={11} /> {timeAgo(log.created_at)}</span>
                      <span className="log-meta-item">{AUDIENCE_LABELS[log.audience] || log.audience}</span>
                      <ChevronRight size={13} className="log-arrow" />
                    </div>
                  </div>
                ))}
              </div>

              {logsTotal > 0 && (
                <div className="history-footer">
                  {logsTotal} total {logsTotal === 1 ? 'entry' : 'entries'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Output */}
        <div className="output-section">
          {error && (
            <div className="error-message"><strong>Error:</strong> {error}</div>
          )}

          {!displayResult && !isLoading && !error && (
            <div className="empty-state">
              <Activity size={48} />
              <h3>Awaiting Incident Data</h3>
              <p>Paste your error logs and click Analyze to generate the RCA package.</p>
            </div>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="spinner" />
              <h3>Analyzing Incident</h3>
              <p>Z.AI is processing logs and synthesizing RCA...</p>
              <p className="loading-note">This may take up to 60 seconds</p>
            </div>
          )}

          {displayResult && !isLoading && (
            <>
              <div className="results-actions">
                {displayResult._restored ? (
                  <div className="restored-notice">
                    <History size={14} />
                    Showing summary from audit log &mdash;
                    <button className="btn-link" onClick={handleReAnalyze}>Re-analyze</button>
                    for full results
                  </div>
                ) : (
                  <button className="btn btn-secondary" onClick={copyFullAnalysis}>
                    <Copy size={16} /> Copy Full JSON Analysis
                  </button>
                )}
              </div>

              <div className="output-grid">
                <div className="full-width">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title"><AlertTriangle size={18} /> Executive Summary</div>
                      {displayResult.confidenceLevel && (
                        <span className={`status-pill status-${displayResult.confidenceLevel.toLowerCase()}`}>
                          {displayResult.confidenceLevel} Confidence
                        </span>
                      )}
                    </div>
                    <div className="card-body">
                      <p style={{ fontSize: '1rem', fontWeight: 500 }}>{displayResult.executiveSummary}</p>
                    </div>
                  </div>
                </div>

                {!displayResult._restored && (
                  <>
                    {renderCard('Business Impact', <Briefcase size={18} />, displayResult.businessImpact)}
                    {renderCard('Root Cause', <Database size={18} />, displayResult.rootCause)}
                    <div className="full-width">{renderCard('Technical Explanation', <FileCode2 size={18} />, displayResult.technicalExplanation)}</div>
                    <div className="full-width">{renderCard('Fixed SQL / Logic', <Wrench size={18} />, displayResult.fixedSqlOrLogic, true, copyToClipboard)}</div>
                    <div className="full-width">{renderCard('Validation Query', <CheckCircle2 size={18} />, displayResult.validationQuery, true, copyToClipboard)}</div>
                    <div className="full-width">{renderCard('Jira-Ready Update', <Trello size={18} />, displayResult.jiraReadyUpdate, false, copyToClipboard)}</div>
                    <div className="full-width">{renderCard('Customer Status Update', <MessageSquare size={18} />, displayResult.customerStatusUpdate, false, copyToClipboard)}</div>
                    {renderCard('Prevention Checklist', <ShieldCheck size={18} />, displayResult.preventionChecklist)}
                    {renderCard('Assumptions', <HelpCircle size={18} />, displayResult.assumptions)}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
