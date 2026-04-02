# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mongolia OpenData SQL Engine — a Next.js web app providing a Power BI-like interface for querying Mongolia's open government statistical data from [1212.mn](https://data.1212.mn). Users write SQL queries or use a checkbox-based dimension explorer to query datasets, with automatic charting (Recharts) and CSV export.

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router, not Pages Router)
- **Language:** TypeScript (strict mode)
- **SQL Engine:** DuckDB 1.4.4 (in-memory, per-request instances via `@duckdb/node-api`)
- **Charts:** Recharts 2.12.7
- **Styling:** Tailwind CSS with custom brand colors (green `#22c55e`) and fonts (JetBrains Mono, Plus Jakarta Sans)
- **Package Manager:** npm

## Commands

```bash
npm run dev       # Dev server on localhost:3000
npm run build     # Production build
npm run start     # Start production server
npm run lint      # ESLint (next lint)
node scripts/fetch-tables.js  # Re-crawl 1212.mn → public/tables.json (~1282 tables, takes 5-10 min)
```

No environment variables needed — the 1212.mn API is public with no auth.

## Architecture

### Data Flow

1. User writes SQL or selects dimensions in the checkbox explorer
2. Client POSTs to Next.js API routes
3. Server fetches data from `https://data.1212.mn:443/api/v1/mn/NSO` (PX-Web API, json-stat2 format)
4. Server normalizes json-stat2 → flat `DataRow[]`, loads into in-memory DuckDB, executes SQL
5. Client renders results via DataChart (auto-detected chart type) + DataTable

### API Routes (`app/api/`)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/run` | POST | Single table data fetch from 1212.mn |
| `/api/sqlrun` | POST | Multi-table SQL execution via DuckDB (extracts tables from FROM/JOIN, resolves aliases, fetches each, executes) |
| `/api/meta` | GET | Table dimension metadata (1-hour server cache) |
| `/api/itms` | GET | List all ~1282 tables from `public/tables.json` |
| `/api/itms/[id]` | GET | Single table metadata by ID |

### Key Libraries (`lib/`)

- **apiClient.ts** — 1212.mn PX-Web API client with 3-attempt exponential backoff retry and 1-hour in-memory cache
- **duckdb-engine.ts** — `runSQL(userSQL, tableData)` creates per-request `:memory:` DuckDB instance, auto-infers column types (DOUBLE vs VARCHAR), 60-120s timeout
- **transform.ts** — json-stat2 ↔ `DataRow[]` conversion, chart data formatting, CSV export, column type detection, chart type suggestion
- **sqlParser.ts** — Parses WHERE/BETWEEN/IN clauses; expands `BETWEEN 2020 AND 2024` into year arrays; resolves dimension labels → codes
- **dimensionMap.ts** — Mongolian ↔ English dimension aliases (Хүйс → Gender, Он → Year, Нас → Age)
- **tableAliases.ts** — Short alias system (e.g., `gdp`, `inflation`, `population`) resolved before API calls; aliases defined in `public/aliases.json`

### Components (`components/`)

All are client components loaded via `dynamic(() => import(...), { ssr: false })` to prevent DuckDB from bundling into client code.

- **page.tsx** (741 lines) — Main container, all app state management, mode switching
- **SQLEditor.tsx** — SQL editor with autocomplete + syntax highlighting
- **CheckboxExplorer.tsx** — Dimension selector UI (mirrors 1212.mn interface)
- **DataChart.tsx** — Smart auto-charting (line, bar, area, pie based on data shape)
- **DataTable.tsx** — Sortable table view
- **RMode.tsx** — Advanced R-like query mode

### Static Data (`public/`)

- **tables.json** — Pre-crawled catalog of ~1282 statistical tables from 1212.mn
- **aliases.json** — Short alias mappings for popular tables

## Build Configuration

- `next.config.js` externalizes `@duckdb/node-api` and `@duckdb/node-bindings` via webpack (server only); disables Node.js module fallbacks (fs, path, crypto, os) on client side; adds CORS headers (`Access-Control-Allow-Origin: *`) on all `/api/*` routes
- `tsconfig.json` uses `@/*` path alias pointing to project root

## Conventions

- Mixed Mongolian/English in variable names, UI text, and error messages — error messages are typically in Mongolian
- Table names with spaces must be quoted in SQL: `FROM "My Table"`
- Query history stored in localStorage under key `mn_sql_history` (last 30 entries)
- URL-encoded query sharing via search params
- Node.js 18+ required (DuckDB dependency)
