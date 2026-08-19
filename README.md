# Impact-Quantifying Bullet Rewriter

An evidence-preserving resume bullet rewriter that transforms duty-based resume bullets into concise, outcome-oriented bullets — without fabricating metrics, achievements, or business impact.

## Features

- Rewrite resume bullets using the SuperDocs API
- Preserve factual claims from the original bullet
- Prevent fabricated metrics and unsupported impact claims
- Accept user-provided evidence/metrics
- Review proposed document changes before approval
- Approve or reject proposed changes
- Detect unsupported metrics and impact claims on the client
- Validate all changes server-side (backend API validation)
- Automated evidence-guard test suite

## Architecture

```text
impact-quantifying-bullet-rewriter/
├── client/                 # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── services/
│       └── utils/
├── server/                 # Node.js + Express backend
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── prompts/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── validators/
├── examples/                # Example inputs and expected behavior
├── tests/                   # Additional project tests
└── package.json
```

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

## Prerequisites

- Node.js 22+
- npm
- A SuperDocs API key

## Environment Variables

Create `server/.env` with:

```env
SUPERDOCS_API_KEY=your_superdocs_api_key
PORT=5000
```

> **Note:** Do not commit the `.env` file.

## Installation

**Backend**

```bash
cd server
npm install
```

**Frontend**

Open another terminal:

```bash
cd client
npm install
```

## Running the Application

**Start the backend**

```bash
cd server
npm run dev
```

The API runs on `http://localhost:5000`.

**Start the frontend**

In another terminal:

```bash
cd client
npm run dev
```

The frontend runs on `http://localhost:5173`.

Open the frontend URL in your browser.

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
- Unsupported qualitative claims such as "scalable," "robust," or "high-performance"

If a measurable result is unavailable, the application prefers an accurate factual rewrite over an impressive but unsupported claim.

User-provided metrics can be supplied as additional evidence to support a stronger rewrite.

## Testing

Run the evidence-guard unit tests:

```bash
cd client
npm test
```

The current evidence-guard suite contains **8 tests** covering:

1. Safe paraphrasing
2. Unsupported impact claims
3. Existing metrics
4. User-provided metrics
5. Unsupported metrics
6. Unresolved placeholders
7. Unsupported responsibility claims
8. Impact synonyms

## Production Build

Build the frontend with:

```bash
cd client
npm run build
```

Production files are generated in `client/dist/`.

## Example

**Input:**

```
Developed REST APIs using Node.js and Express.
```

The application preserves the factual content of the bullet and does not invent a performance improvement or metric when none is provided.

If the user has verified evidence — for example:

```
Handled 10,000 API requests per day.
```

that evidence can be supplied to support a measurable, defensible rewrite.

## Security

- API credentials are loaded from environment variables.
- `.env` files are excluded from Git.
- `node_modules` and production build artifacts are excluded from Git.
- The SuperDocs API key is never sent to the browser.

## License

This project was created as a software engineering take-home assignment.