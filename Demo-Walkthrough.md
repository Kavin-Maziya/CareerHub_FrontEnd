# CareerHub Dashboard — Demo Walkthrough

---

## 1. Application Overview

The CareerHub dashboard is an employer-facing interface that allows:
- Viewing job listings in table or grid format
- Filtering active vs closed jobs
- Tracking application counts per job
- Closing job postings via server mutation

---

## 2. System Architecture

### Data Flow Model

Next.js Server Component
↓
Backend API (C# / REST)
↓
Zustand Client Store (UI state only)
↓
ListingsTable (pure render component)

---

## 3. Key Implementation Areas

---

### 3.1 Dashboard Toolbar (UI State Controller)

The toolbar controls two global UI states:

- View mode (table/grid)
- Show closed jobs toggle

#### Implementation Summary:
- Zustand store used instead of prop drilling
- Each selector is isolated:
  - `useView()`
  - `useSetView()`
  - `useShowClosedJobs()`
  - `useToggleShowClosedJobs()`

#### Why this matters:
This prevents unnecessary re-renders across unrelated components.

---

### 3.2 Listings Table System

The ListingsTable supports two rendering modes:

#### Table Mode:
- Structured data layout
- Optimized for scanning job metadata

#### Grid Mode:
- Card-based layout
- Optimized for visual browsing

---

### 3.3 Filtering Logic

Filtering occurs client-side:

```ts
const visibleJobs = showClosedJobs
  ? jobs
  : jobs.filter(job => job.isActive);
```
Reason:
Backend does not expose filtering endpoints, so filtering is handled in-memory after fetch.

### 3.4 Stats Mapping

Application counts are passed as a precomputed Map:

new Map(statsMap)
Benefit:
O(1) lookup per row
Avoids repeated array scans
Keeps render logic efficient

## 4. Server Actions — Close Job Flow

Execution Pipeline
User clicks “Close Job”
Client triggers server action
Backend receives PATCH request
Job status updated to inactive
revalidateTag("jobs") invalidates cached job data
UI automatically reflects updated state

## 5. Implementation Summary

* **Core Design Decisions**
### 5.1 Server-first architecture
Data fetching handled in Server Components
Reduces client bundle size
Improves SEO and initial load performance

### 5.2 Client-only UI state
Zustand used exclusively for:
View mode
Filtering preferences
Prevents unnecessary server re-fetching

### 5.3 Separation of concerns
Layer	Responsibility
Server Components	Data fetching
Zustand Store	UI state
ListingsTable	Presentation logic
Server Actions	Mutations

### 5.4 Performance Characteristics
Jobs page: single fetch, tag cached
Dashboard: parallel fetch (jobs + stats)
Stats lookup: O(1) via Map
Rendering: progressive via Suspense boundaries

### 5.5 User Experience Flow
Employer opens dashboard
Summary loads first (fast endpoint)
Job table streams in after
User toggles grid/table instantly (no refetch)
User filters closed jobs locally
Closing a job triggers instant UI update via revalidation

### 8. Conclusion

The system prioritizes:

Server-side efficiency (cached jobs)
Client-side responsiveness (Zustand UI state)
Progressive rendering (Suspense boundaries)
Consistent data integrity (tag revalidation)

---