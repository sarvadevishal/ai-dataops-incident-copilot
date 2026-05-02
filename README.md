<div align="center">
  <img src="https://img.shields.io/badge/Powered_by-Z.AI_GLM--5.1-38bdf8?style=for-the-badge" alt="Z.AI" />
  <img src="https://img.shields.io/badge/Hosted_on-Butterbase-818cf8?style=for-the-badge" alt="Butterbase" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-10b981?style=for-the-badge&logo=react" alt="React" />

  <h1>AI DataOps Incident Copilot</h1>
  <p><strong>Turn raw ETL failures into full incident packages in seconds — not hours.</strong></p>

  <a href="https://ai-dataops-incident-copilot.butterbase.dev"><img src="https://img.shields.io/badge/Live%20Demo-ai--dataops--incident--copilot.butterbase.dev-38bdf8?style=flat-square" /></a>
  <a href="https://youtu.be/l8k16AjH5sE"><img src="https://img.shields.io/badge/Demo%20Video-YouTube-red?style=flat-square&logo=youtube" /></a>
  <a href="https://docs.google.com/presentation/d/1YKm-Xf0rB1Fm_g-7SXOI-19K-Ly9ciVT/edit?usp=sharing"><img src="https://img.shields.io/badge/Pitch%20Deck-Google%20Slides-orange?style=flat-square&logo=google-slides" /></a>
  <a href="https://butterbase.ai"><img src="https://img.shields.io/badge/AI%20Super%20Hackathon-0502-818cf8?style=flat-square" /></a>
</div>

---

## Live Links

| Resource | URL |
|----------|-----|
| **Live App** | https://ai-dataops-incident-copilot.butterbase.dev |
| **Demo Video** | https://youtu.be/l8k16AjH5sE |
| **Pitch Deck** | https://docs.google.com/presentation/d/1YKm-Xf0rB1Fm_g-7SXOI-19K-Ly9ciVT/edit?usp=sharing |

---

## The Problem

Data engineers waste **2–4 hours per ETL incident** manually:
- Deciphering cryptic stack traces across Redshift, Glue, dbt, Airflow, Spark
- Writing root cause analyses, SQL fixes, and validation queries from scratch
- Formatting Jira tickets and customer-facing status updates
- Keeping any audit trail of what happened and how it was fixed

## The Solution

Paste any raw error log → click **Analyze Incident** → get a **complete 11-part incident package in under 60 seconds**. Every analysis is automatically saved to a searchable, persistent audit log.

---

## Features

### 11-Part Incident Package (One Click)
1. Executive Summary
2. Root Cause Analysis
3. Business Impact Assessment
4. Fixed SQL / ETL Logic
5. Validation Queries
6. Jira-Ready Update
7. Customer Status Update
8. Prevention Checklist
9. Underlying Assumptions
10. Confidence Level
11. Recommended Next Steps

### Persistent Audit Log
- Every analysis automatically saved to PostgreSQL
- Search by incident type or keyword
- Click any past entry to instantly restore the full analysis
- Delete entries, export history as JSON
- Type badges: Redshift, AWS Glue, dbt, Airflow, Spark, BigQuery, Snowflake, Kafka

### Supported Incident Types
Amazon Redshift · AWS Glue · Apache Airflow · dbt · Apache Spark · Azure Data Factory · Google BigQuery · Snowflake · Apache Kafka · Custom

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| AI Model | [Z.AI GLM-5.1](https://api.z.ai) — frontier LLM for analysis |
| Backend | [Butterbase](https://butterbase.ai) serverless functions (Deno/TypeScript) |
| Database | Butterbase PostgreSQL — persistent audit log |
| Frontend Hosting | Butterbase static frontend deployment |
| Frontend | React 18 + Vite |

---

## Architecture

```
User Browser
    │
    ▼
React + Vite Frontend (Butterbase CDN hosting)
    │
    ├── POST /fn/analyze      ──► Butterbase Function ──► Z.AI GLM-5.1 + PostgreSQL (save log)
    ├── GET  /fn/get-logs     ──► Butterbase Function ──► PostgreSQL (fetch audit history)
    └── DELETE /fn/delete-log ──► Butterbase Function ──► PostgreSQL (delete entry)
```

---

## Database Schema

```sql
CREATE TABLE incident_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  incident_type     TEXT NOT NULL,
  audience          TEXT NOT NULL,
  issue_text        TEXT NOT NULL,
  executive_summary TEXT,
  confidence_level  TEXT,
  result            JSONB NOT NULL
);
```

---

## Local Development

### Prerequisites
- Node.js 18+
- Z.AI API key

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Backend (original Express server)
```bash
cd backend
npm install
ZAI_API_KEY=your_key_here node index.js
# http://localhost:4000
```

> For the **Butterbase deployment**, backend logic lives in serverless functions — see `frontend/src/App.jsx` for the `API_BASE` constant pointing to the live Butterbase endpoint.

---

## Built By

**Vishal Kumar Sarvade** — Data Engineer & AI Builder

- LinkedIn: [linkedin.com/in/vishalkumarsarvade](https://www.linkedin.com/in/vishalkumarsarvade)
- Email: sarvade1.vishalkumar@gmail.com

*Submitted to the AI Super Hackathon 0502 — powered by [Butterbase](https://butterbase.ai) & [Z.AI](https://api.z.ai)*
