# Impact-Quantifying Bullet Rewriter

A resume engineering toolkit for writing stronger, evidence-preserving resume bullets and maintaining role-specific resume variants — without fabricating metrics, achievements, or business impact.

The project includes two workflows:

1. **Impact-Quantifying Bullet Rewriter** — transforms duty-based resume bullets into concise, outcome-oriented bullets while enforcing evidence safety.
2. **Role-Family Resume Matrix** — maintains one canonical master resume and synchronized role-specific variants for different job families.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Core Workflows](#core-workflows)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [API](#api)
- [Evidence Safety](#evidence-safety)
- [Role-Family Resume Matrix](#role-family-resume-matrix)
- [Testing](#testing)
- [Production Build](#production-build)
- [Example](#example)
- [Design Principles](#design-principles)
- [Security](#security)
- [Project Status](#project-status)
- [License](#license)

---

## Features

### Impact-Quantifying Bullet Rewriter

- Rewrite resume bullets using the SuperDocs API
- Preserve factual claims from the original bullet
- Prevent fabricated metrics and unsupported impact claims
- Accept user-provided evidence/metrics
- Review proposed document changes before approval
- Approve or reject proposed changes
- Detect unsupported metrics and impact claims on the client
- Validate changes server-side
- Automated evidence-guard test suite

### Role-Family Resume Matrix

- Maintain a single master resume as the source of truth
- Create multiple role-specific resume variants
- Support Full Stack, Backend, Frontend, and dynamically added roles
- Detect changes made to the master resume
- Synchronize master changes across role variants
- Preserve role-specific tailoring during synchronization
- Include or exclude individual bullets from each role variant
- Add and remove role variants dynamically
- Preview role-specific resume wording
- Keep role-specific customization isolated from the canonical master resume

---

## Architecture

```text
impact-quantifying-bullet-rewriter/
├── client/                       # React + Vite frontend
│   └── src/
│       ├── components/
│       │   └── RoleFamilyMatrix.jsx
│       ├── services/
│       └── utils/
│           ├── evidenceGuard.js
│           └── evidenceGuard.test.js
│
├── server/                       # Node.js + Express backend
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── prompts/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
│
├── examples/                     # Example inputs and expected behavior
├── tests/                        # Additional project tests
└── package.json
```

---

## Core Workflows

### 1. Impact-Quantifying Bullet Rewriter

```text
Input
  ↓
AI Rewrite
  ↓
Evidence Guard
  ↓
Human Review
  ↓
Approve / Reject
  ↓
Approved Change
```

The rewriter is designed to improve clarity and impact without allowing the AI to invent achievements. If a proposed rewrite introduces an unsupported metric, impact claim, responsibility, or qualitative modifier, the change is flagged for evidence.

### 2. Role-Family Resume Matrix

```text
                 ┌─────────────────────┐
                 │   Master Resume     │
                 │  Source of Truth    │
                 └──────────┬──────────┘
                            │
              ┌─────────────┼─────────────┐
              ↓             ↓             ↓
       Full Stack       Backend       Frontend
        Variant         Variant        Variant
              │             │             │
              └─────────────┼─────────────┘
                            ↓
                    Role-specific
                     customization
```

The master resume acts as the canonical source of truth. When master bullets change, the application can synchronize those changes across role variants while preserving each role's local tailoring and inclusion/exclusion choices.

---

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript
- Lucide React
- Vitest

**Backend**
- Node.js
- Express
- CORS
- dotenv
- SuperDocs API

---

## Prerequisites

- Node.js 22+
- npm
- A SuperDocs API key

---

## Environment Variables

Create `server/.env` with:

```env
SUPERDOCS_API_KEY=your_superdocs_api_key
PORT=5000
```

> **Note:** Do not commit the `.env` file.

---

## Installation

### Backend

```bash
cd server
npm install
```

### Frontend

Open another terminal:

```bash
cd client
npm install
```

---

## Running the Application

### Start the backend

```bash
cd server
npm run dev
```

The API runs on `http://localhost:5000`.

### Start the frontend

In another terminal:

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173`. Open the frontend URL in your browser.

---

## API

### Create a rewrite job

```
POST /api/rewrite
```

Example request body:

```json
{
  "bullet": "Developed REST APIs using Node.js and Express.",
  "metric": ""
}
```

Returns a job ID and session ID.

### Check job status

```
GET /api/rewrite/jobs/:jobId
```

### Review a proposed change

```
POST /api/rewrite/:sessionId/review
```

Example request body:

```json
{
  "jobId": "job-id",
  "changeId": "change-id",
  "approved": true
}
```

---

## Evidence Safety

The application is intentionally conservative. It does not allow the rewriter to invent:

- Percentages
- Counts
- Performance improvements
- Time savings
- Revenue figures
- Adoption figures
- Users or customers
- Scale numbers
- Unsupported qualitative claims such as *scalable*, *robust*, or *high-performance*

If a measurable result is unavailable, the application prefers an accurate, factual rewrite over an impressive but unsupported claim. User-provided metrics can be supplied as additional evidence to support a stronger rewrite.

**Example:**

```text
Developed REST APIs using Node.js and Express.
```

does **not** automatically become:

```text
Improved API performance by 40%.
```

However, if the user provides verified evidence such as:

```text
Handled 10,000 API requests per day.
```

that evidence can be used to support a stronger, measurable rewrite.

---

## Role-Family Resume Matrix

The Role-Family Resume Matrix solves a different resume-maintenance problem. Instead of maintaining several completely independent resumes, the application allows the user to maintain:

```text
                Master Resume
                     │
       ┌─────────────┼─────────────┐
       ↓             ↓             ↓
   Full Stack      Backend      Frontend
    Resume         Resume        Resume
```

### Master Resume

The master resume contains the canonical bullets. Changes made to the master are detected automatically.

### Role Variants

Each role variant can:

- Include or exclude master bullets
- Add role-specific tailoring instructions
- Preview the resulting role-specific bullet
- Maintain customization independently from other variants

### Synchronization

When the master resume changes, the user can synchronize the changes across all role variants. Synchronization updates the master source text while deliberately preserving:

- Bullet inclusion/exclusion state
- Role-specific tailoring
- Role-specific customization

This prevents changes to the canonical resume from destroying role-specific customization.

---

## Testing

Run the evidence-guard unit tests:

```bash
cd client
npx vitest run
```

The current evidence-guard suite contains 16 tests covering:

- Safe paraphrasing
- Unsupported impact claims
- Existing metrics
- User-provided metrics
- Unsupported metrics
- Unresolved placeholders
- Unsupported responsibility claims
- Impact synonyms
- Reordered impact claims
- Different impact subjects
- Changed percentages
- Evidence-backed request metrics
- Unsupported qualitative modifiers
- Existing qualitative modifiers
- Grammatical variants of *reduce*
- Grammatical variants of *improve*

All 16 evidence-guard tests currently pass.

---

## Production Build

Build the frontend with:

```bash
cd client
npm run build
```

Production files are generated in `client/dist/`.

---

## Example

**Input:**

```text
Developed REST APIs using Node.js and Express.
```

The application preserves the factual content of the bullet and does not invent a performance improvement or metric when none is provided.

**With verified evidence:**

User-provided evidence:

```text
Handled 10,000 API requests per day.
```

The evidence can support a stronger, measurable rewrite without requiring the AI to invent the metric.

---

## Design Principles

**Evidence over exaggeration**
A weaker but defensible bullet is preferable to a stronger bullet containing fabricated claims.

**One source of truth**
The master resume acts as the canonical source for role-family variants.

**Preserve customization**
Synchronizing the master resume must not erase role-specific tailoring.

**Human approval**
AI-generated resume changes remain subject to human review before approval.

**Conservative automation**
The system should prefer detecting uncertainty or unsupported claims rather than silently accepting them.

---

## Security

- API credentials are loaded from environment variables.
- `.env` files are excluded from Git.
- `node_modules` and production build artifacts are excluded from Git.
- The SuperDocs API key is never sent to the browser.

---

## Project Status

The repository currently contains two completed workflows:

- [x] Impact-Quantifying Bullet Rewriter
- [x] Role-Family Resume Matrix
- [x] Evidence-guard unit tests
- [x] Master-to-role synchronization
- [x] Role-specific tailoring preservation
- [x] Dynamic role variants
- [x] Production frontend build

---

## License

This project was created as a software engineering take-home assignment.
