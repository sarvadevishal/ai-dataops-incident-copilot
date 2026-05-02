import React, { useState } from 'react';
import { 
  Bot, 
  Send, 
  Copy, 
  Trash2, 
  Database, 
  AlertTriangle, 
  Briefcase, 
  FileCode2, 
  Wrench, 
  CheckCircle2, 
  Trello, 
  MessageSquare, 
  ShieldCheck, 
  HelpCircle,
  Activity
} from 'lucide-react';
import './App.css';

const SAMPLES = [
  {
    title: "1. Redshift integer cast failure",
    type: "redshift",
    audience: "engineering",
    text: "ERROR: Invalid digit, Value ' ', Pos 1, Type: Integer \nDETAIL:  \n  -----------------------------------------------\n  error:  Invalid digit, Value ' ', Pos 1, Type: Integer \n  code:      1207\n  context:   \n  query:     8291038\n  location:  :0\n  process:   query1_112_8291038 [pid=12345]\n  -----------------------------------------------"
  },
  {
    title: "2. Redshift numeric overflow",
    type: "redshift",
    audience: "full",
    text: "ERROR: Numeric data overflow (result precision)\nDETAIL:  \n  -----------------------------------------------\n  error:  Numeric data overflow (result precision)\n  code:      1058\n  context:   128 bit overflow\n  query:     9012341\n  location:  numeric_type.hpp:123\n  process:   query2_22_9012341 [pid=9876]\n  -----------------------------------------------\nCaused by decimal multiplication in fact_sales_daily aggregation."
  },
  {
    title: "3. AS400 Data Discrepancy",
    type: "data_quality",
    audience: "leadership",
    text: "Data reconciliation check failed between source AS400 and target Redshift. Table: `finance_ledger`. Date: 2026-05-01. Source count: 1,500,230. Target count: 1,499,100. Discrepancy of 1,130 records. No failed ETL jobs reported in Airflow."
  }
];

function App() {
  const [issueText, setIssueText] = useState('');
  const [incidentType, setIncidentType] = useState('redshift');
  const [audience, setAudience] = useState('full');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleLoadSample = (sample) => {
    setIssueText(sample.text);
    setIncidentType(sample.type);
    setAudience(sample.audience);
  };

  const handleClear = () => {
    setIssueText('');
    setResult(null);
    setError(null);
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      // Could add a toast notification here
    }
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!issueText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:4000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ issueText, incidentType, audience }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to analyze incident');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyFullAnalysis = () => {
    if (result) {
      const text = JSON.stringify(result, null, 2);
      copyToClipboard(text);
    }
  };

  const renderCard = (title, icon, content, isCode = false, onCopy = null) => {
    if (!content) return null;
    
    return (
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            {icon} {title}
          </div>
          {onCopy && (
            <button className="btn-icon" onClick={() => onCopy(content)} title="Copy">
              <Copy size={16} />
            </button>
          )}
        </div>
        <div className="card-body">
          {isCode ? (
            <pre className="code-block">{content}</pre>
          ) : Array.isArray(content) ? (
            <ul>
              {content.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          ) : (
            <p>{content}</p>
          )}
        </div>
      </div>
    );
  };

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
        {/* Left Column: Input Form */}
        <div className="input-section">
          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label">Incident Type</label>
              <select 
                className="form-control" 
                value={incidentType} 
                onChange={e => setIncidentType(e.target.value)}
              >
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
              <select 
                className="form-control" 
                value={audience} 
                onChange={e => setAudience(e.target.value)}
              >
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
                {isLoading ? <><div className="spinner" style={{width: 16, height: 16, margin: 0, borderWidth: 2}}></div> Analyzing...</> : <><Bot size={16} /> Analyze Incident</>}
              </button>
            </div>
          </form>

          <div className="samples-container">
            <h3 className="samples-title">Try a Sample</h3>
            <div className="sample-buttons">
              {SAMPLES.map((s, i) => (
                <button key={i} className="sample-btn" onClick={() => handleLoadSample(s)}>
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="output-section">
          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="empty-state">
              <Activity size={48} />
              <h3>Awaiting Incident Data</h3>
              <p>Paste your error logs and click Analyze to generate the RCA package.</p>
            </div>
          )}

          {isLoading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <h3>Analyzing Incident</h3>
              <p>Z.AI is processing logs and synthesizing RCA...</p>
            </div>
          )}

          {result && !isLoading && (
            <>
              <div className="results-actions">
                <button className="btn btn-secondary" onClick={copyFullAnalysis}>
                  <Copy size={16} /> Copy Full JSON Analysis
                </button>
              </div>
              
              <div className="output-grid">
                <div className="full-width">
                  <div className="card">
                    <div className="card-header">
                      <div className="card-title">
                        <AlertTriangle size={18} /> Executive Summary
                      </div>
                      {result.confidenceLevel && (
                         <span className={`status-pill status-${result.confidenceLevel.toLowerCase()}`}>
                           {result.confidenceLevel} Confidence
                         </span>
                      )}
                    </div>
                    <div className="card-body">
                      <p style={{fontSize: '1rem', fontWeight: 500}}>{result.executiveSummary}</p>
                    </div>
                  </div>
                </div>

                {renderCard("Business Impact", <Briefcase size={18} />, result.businessImpact)}
                {renderCard("Root Cause", <Database size={18} />, result.rootCause)}
                
                <div className="full-width">
                  {renderCard("Technical Explanation", <FileCode2 size={18} />, result.technicalExplanation)}
                </div>

                <div className="full-width">
                  {renderCard("Fixed SQL / Logic", <Wrench size={18} />, result.fixedSqlOrLogic, true, copyToClipboard)}
                </div>

                <div className="full-width">
                  {renderCard("Validation Query", <CheckCircle2 size={18} />, result.validationQuery, true, copyToClipboard)}
                </div>

                <div className="full-width">
                  {renderCard("Jira-Ready Update", <Trello size={18} />, result.jiraReadyUpdate, false, copyToClipboard)}
                </div>

                <div className="full-width">
                  {renderCard("Customer Status Update", <MessageSquare size={18} />, result.customerStatusUpdate, false, copyToClipboard)}
                </div>

                {renderCard("Prevention Checklist", <ShieldCheck size={18} />, result.preventionChecklist)}
                {renderCard("Assumptions", <HelpCircle size={18} />, result.assumptions)}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
