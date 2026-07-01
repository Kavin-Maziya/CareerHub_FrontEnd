# CareerHub Rich UI & Form Patterns

## Assignment 3.1 - Demo Walkthrough

---

## 1. Application Overview

This walkthrough demonstrates the Week 3 Day 1 rich UI patterns added to CareerHub:

- System-wide toast feedback with Sonner
- A multi-step candidate application wizard
- Local draft persistence and discard confirmation
- AlertDialog confirmation for closing job listings
- Skeleton loaders that match the jobs page layout
- Distinct empty states for no jobs vs no filter matches

---

## 2. Setup Checklist

Before starting the demo:

- Run the backend API.
- Run the frontend with `npm run dev`.
- Confirm `.env.local` contains `NEXT_PUBLIC_API_URL`.
- Use one employer account for dashboard flows.
- Use one candidate account for application flows.
- Keep browser DevTools open for checking `localStorage`.

---

## 3. Toast Notifications

### 3.1 Toaster placement

Demo steps:

1. Open any page in the app.
2. Confirm toast notifications render from the bottom-right of the viewport.
3. Confirm the navbar/header area is not covered by toast messages.

Implementation points:

- `sonner` is installed.
- `<Toaster position="bottom-right" richColors />` is rendered in the root layout.
- Toasts are used for mutation responses, not field validation.

### 3.2 Close job toast

Demo steps:

1. Sign in as an employer.
2. Navigate to `/dashboard/listings`.
3. Click `Close` on an active listing.
4. Confirm the AlertDialog opens.
5. Click `Close listing`.
6. Confirm a success toast appears.
7. Confirm the listing updates after the mutation.

Expected result:

- Success appears as a toast.
- No inline success banner is shown.

### 3.3 Error toast

Demo steps:

1. Trigger a backend/API error by stopping the backend or using invalid API configuration.
2. Attempt a mutation such as closing a listing or submitting an application.
3. Confirm an error toast appears.

Expected result:

- API or mutation errors appear as toasts.
- Field-level validation still appears inline beside fields.

---

## 4. Application Wizard

### 4.1 Candidate happy path

Demo steps:

1. Sign in as a candidate.
2. Navigate to `/jobs`.
3. Open an active job detail page.
4. Confirm the application UI is a three-step wizard:
   - Step 1: Your Details
   - Step 2: Your Application
   - Step 3: Review & Submit
5. Fill Step 1 and click `Next`.
6. Fill Step 2 and click `Next`.
7. Confirm the review step displays every field.
8. Confirm empty optional fields show `Not provided`.
9. Submit the application.

Expected result:

- Success toast appears.
- Wizard resets to Step 1.
- The draft is removed from `localStorage`.

### 4.2 Current-step validation

Demo steps:

1. Open the wizard as a candidate.
2. Click `Next` on Step 1 without filling required fields.
3. Confirm inline errors appear for Step 1.
4. Fill Step 1 correctly and click `Next`.
5. Enter an invalid LinkedIn URL on Step 2, such as `https://example.com/me`.
6. Click `Next`.

Expected result:

- The wizard does not advance past invalid current-step fields.
- Future-step fields do not block earlier steps.
- LinkedIn validation attaches to the LinkedIn URL field.

### 4.3 Back button behavior

Demo steps:

1. Fill Step 1.
2. Advance to Step 2.
3. Type partial Step 2 information.
4. Click `Back`.
5. Confirm Step 1 values are still present.

Expected result:

- Back navigation does not validate Step 2.
- Previously entered values remain intact.

### 4.4 Signed-out user

Demo steps:

1. Sign out.
2. Open an active job detail page.
3. Confirm Step 1 renders.
4. Click `Next`.

Expected result:

- The wizard does not advance.
- Inline message appears: "You need to be signed in as a candidate to apply. Sign in here."
- The user is not redirected automatically.

### 4.5 Employer user

Demo steps:

1. Sign in as an employer.
2. Open an active job detail page.

Expected result:

- The wizard does not render.
- The page displays "Employers cannot apply for jobs."

---

## 5. Draft Persistence

### 5.1 Auto-save and restore

Demo steps:

1. Open an active job detail page as a candidate.
2. Fill part of the application.
3. Open DevTools and confirm `localStorage` contains `careerhub-application-${jobId}`.
4. Refresh the page.

Expected result:

- Values are restored automatically.
- A dismissible banner appears: "You have a saved draft for this application. Restored automatically."

### 5.2 Discard draft confirmation

Demo steps:

1. Create a draft.
2. Refresh and confirm the draft restores.
3. Click `Discard draft`.
4. Confirm the AlertDialog opens.
5. Click `Keep draft`.
6. Confirm the draft remains.
7. Open the dialog again and click `Discard draft`.

Expected result:

- `localStorage` draft is removed.
- Wizard resets to Step 1.
- Form fields are empty.
- Restored-draft banner disappears.

---

## 6. AlertDialog Close Listing Flow

Demo steps:

1. Sign in as an employer.
2. Navigate to `/dashboard/listings`.
3. Click `Close` on an active listing.
4. Confirm the dialog title is "Close this listing?"
5. Confirm the description explains the listing will be closed and removed from the public board.
6. Click `Keep listing`.
7. Confirm the listing remains unchanged.
8. Open the dialog again.
9. Click `Close listing`.

Expected result:

- The destructive action does not happen on the first click.
- Cancel leaves the listing unchanged.
- Confirm calls the Server Action through `useTransition`.
- Success toast appears after the listing closes.

Implementation point:

- The confirm button does not rely on `type="submit"` inside the dialog portal.
- The client constructs `FormData` and calls the Server Action programmatically.

---

## 7. Jobs Page Loading and Empty States

### 7.1 Skeleton loader

Demo steps:

1. Navigate to `/jobs`.
2. Observe the page while data is loading.

Expected result:

- Six `JobCardSkeleton` cards appear.
- The loading UI resembles the real card grid.
- No spinner or blank loading area is used.

### 7.2 Filter-empty state

Demo steps:

1. Navigate to `/jobs?q=zzzzzzzzz`.
2. Confirm the page shows "No jobs match your search."
3. Confirm the active filter summary appears.
4. Click `Clear all filters`.

Expected result:

- URL search params reset.
- The real jobs list renders again.

### 7.3 Database-empty state

Demo steps:

1. Use an empty backend jobs dataset.
2. Navigate to `/jobs`.

Expected result:

- The page shows "No jobs are currently listed."
- No action button appears because the user cannot fix an empty database.

---

## 8. Build Verification

Command:

```bash
npm run build
```

Expected result:

- Production build compiles successfully.
- TypeScript finishes with zero errors.
- The only noted warning is the Next.js middleware-to-proxy deprecation warning.

---

## Assignment 2.3 - Demo Walkthrough

# CareerHub Dashboard 

## Assignment 2.3 - Demo Walkthrough

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
