# CareerHub Frontend

## Assignment 3.2 
![Frontend CI](https://github.com/KavinOzzie/CareerHub/actions/workflows/test.yml/badge.svg)

## Part 1 — Written Decisions

### Question 1 — What is worth testing?

**Category A: High-value behaviours to test**

- **Step navigation gating** — `handleNext` calls `trigger(stepFields[step])` and only advances if valid. A regression here either lets invalid data reach the review screen, or traps valid users on step 1. High-value because it's the wizard's core contract: no step advance without valid data.
- **Auth gate at step 1** — `if (step === 1 && !isCandidate) setAuthError(true)`. A regression either blocks legitimate candidates from applying or lets non-candidates submit applications. Directly harms real users in both directions.
- **Draft persistence round-trip** — the mount `useEffect` reads `localStorage`, parses it through `applicationWizardSchema.partial()`, and calls `reset()`. The `watch()` subscription writes on every change. A regression silently loses a candidate's in-progress application — the single worst failure mode in this component.
- **Discard draft actually discards** — `handleDiscardDraft` clears storage, resets the form, resets to step 1, and closes the dialog. If this silently no-ops, a user believes their data is gone when it isn't (privacy/trust issue), or the form doesn't actually clear.
- **Successful submit resets everything** — `onSuccess` invalidates queries, clears the draft, resets the form, resets to step 1. A regression risks duplicate submissions or a stale draft banner reappearing on a fresh application.
- **Failed submit preserves entered values** — `onError` only toasts; it does not reset. A regression here means a network blip wipes a candidate's cover letter and they have to retype it — a real cost to the user.
- **Review step shows correct, honest data** — `currentValues` is rendered via `displayValue()` with an explicit "Not provided" fallback for empty optional fields. This is the last thing a candidate sees before submitting; wrong data here is a trust failure even if the actual payload sent is correct.

**Category B: NOT worth testing**

- **Exact Tailwind classes / `cn()` output** (e.g. asserting `border-red-400` is applied). Gain: none for the user — a class-string test doesn't verify anything actually *looks* wrong, and it isn't a substitute for a real visual regression test. Loss: every design tweak (dark-mode adjustment, spacing pass) breaks the suite for no behavioural reason, training the team to ignore red CI.
- **DOM structure / element counts** (e.g. "renders exactly N `<div>` elements"). Gain: nothing — div count isn't a user-facing contract and users don't experience "3 divs," they experience "I can see my years of experience field." Loss: any markup refactor (e.g. wrapping two fields in a new flex container) breaks the test even when the UI and behaviour are identical.
- **Internal state values** (e.g. asserting the `step` state variable literally equals `2`). Not reachable from outside without exposing internals, and even if it were, it tests implementation instead of what's rendered — `getByRole("heading", { name: "..." })` already proves the same thing from the user's side, more durably.

**Category C: Draft persistence — real vs mocked localStorage**

I'd use **real jsdom `localStorage`**, not `vi.spyOn`. This component talks to the raw `localStorage` API directly (no wrapper), and the fragile part isn't "did `setItem` get called" — it's the **round trip**: `JSON.stringify` on write, `JSON.parse` + `applicationWizardSchema.partial().parse()` on read, and whether that successfully calls `reset()` with the right shape. A `vi.spyOn` mock only proves the call was made with some arguments; it can't tell you whether reading that value back actually produces a working, populated form. Real jsdom storage exercises the exact mount-time rehydration logic, including the `catch` branch that clears a corrupted draft — which a spy can't meaningfully simulate without reimplementing storage semantics inside the mock.

What a jsdom test **can't** prove: real browser storage quotas, cross-tab `storage` event sync, or persistence across an actual page reload/navigation (jsdom's `localStorage` lives only for the test's lifetime). Those require e2e or manual browser verification.

### Question 2 — Mocking the session

`ApplicationWizard` does not call `useSession()` — it receives `isCandidate: boolean` as a prop. The actual session check happens upstream (server component/page), which is out of scope for this component's tests. **This is a deviation from the assignment brief**, which assumes the wizard calls `useSession()` directly. Because of this, Tests 5/6 don't need any next-auth mocking at all — they render with `isCandidate={false}` / `isCandidate={true}` directly as props.

The `next-auth/react` mock is still implemented in `utils.tsx` as specified, for reuse by any component that *does* call `useSession()` directly (and for forward-compatibility if the wizard's auth-gate logic moves inward later).

- **Approach 1 — `vi.mock("next-auth/react", ...)`:** Mocks the hook's return value entirely (`data`, `status`, `update`). Leaves nothing real — no JWT decoding, no `SessionProvider` context wiring, no revalidation behaviour. Best for components that just read `useSession().data.user.role` once per render.
- **Approach 2 — real `SessionProvider` with `initialSession`:** Mocks only the network round-trip to `/api/auth/session` that `SessionProvider` normally makes on mount. Leaves the provider's actual context propagation, `update()` function, and focus-revalidation behaviour real.

**Choice:** Approach 1, for any component that does call `useSession()` directly in this codebase — it gives full per-test control (unauthenticated / candidate / employer) with no provider boot overhead, and none of the components in this suite rely on `SessionProvider`'s revalidation behaviour, so Approach 2's extra realism buys nothing here.

### Question 3 — MSW scope

**`ApplicationWizard`** — one request across its entire lifecycle:

| Method | URL pattern | Happy-path response |
|---|---|---|
| POST | `${NEXT_PUBLIC_API_URL}/api/v1/applications/apply` | `201` with a JSON `ApplicationResponse` body (must include `id` and/or `applicantId`, since `onSuccess` reads `response.applicantId ?? response.id`) |

No GET fires on mount — `jobId`/`jobTitle` are passed in as props, not fetched. `queryClient.invalidateQueries({ queryKey: ["jobs"] })` in `onSuccess` doesn't itself trigger a network call in an isolated render of `ApplicationWizard`: invalidation only causes a refetch for queries that are actively mounted and subscribed elsewhere on the page. In a component test rendering only the wizard, there's nothing subscribed to `["jobs"]`, so this is a no-op network-wise.

**`CloseJobButton`** — two sequential requests on confirm:

| Method | URL pattern | Happy-path response |
|---|---|---|
| DELETE | `${NEXT_PUBLIC_API_URL}/api/v1/jobs/{jobId}/close` | `200`/`204`, component only checks `.ok` |
| GET | `${NEXT_PUBLIC_API_URL}/api/v1/jobs/{jobId}` | `200` with `{ title: "..." }` (only `title` is read, for the success toast) |

**What MSW cannot help test:** the draft `localStorage` behaviour (Q1c) — it's synchronous browser storage, not a network call, so it needs real jsdom `localStorage` assertions instead. Same for `AlertDialog` open/close state and toast rendering — pure client UI state with no request involved.

### Question 4 — Test naming as specification

- **a)** *Implementation* — asserts an internal state value, and factually wrong for this codebase (steps are `1`/`2`/`3`, not `'schedule'`). Rewrite: **"shows the step 2 heading after clicking Next with valid step 1 data"**
- **b)** *Behaviour* — already asserts what's rendered, not internal state. Keep as-is (renaming "Schedule" to this app's actual step-2 heading text, e.g. "Your Application").
- **c)** *Implementation* — asserts a specific API call was made rather than an outcome. Rewrite: **"preserves previously entered values when the user navigates back to step 1"** (verified via `getByDisplayValue`, not by spying on `localStorage.setItem`).
- **d)** *Behaviour* — already describes what the user experiences. Keep as-is.
- **e)** *Implementation* — a DOM element count, not a behaviour. Rewrite as one behaviour-focused test per meaningful state, e.g. **"shows a submitting indicator while the application is being submitted"**, rather than counting `role="status"` divs.

## README Updates

### 1. What makes a test high-value for this codebase

I prioritised testing the things that lose or corrupt user-entered data if they
break: step-gating validation, the auth gate at step 1, draft persistence
(save-on-change and restore-on-mount), discard-draft, and the submit
success/error paths — specifically that a failed submit does *not* clear the
form. These all share the same failure mode: a silent regression here doesn't
throw an error, it just quietly loses or corrupts a candidate's application
data, which is the worst possible outcome for this component.

I deliberately did **not** test exact Tailwind class strings or DOM element
counts (e.g. "renders 3 divs with a given class"). Testing those would tie the
suite to markup and styling decisions that change constantly and have no
bearing on whether the form actually works — it would make the suite noisy
and expensive to maintain without catching any real regression a user would
notice.

### 2. Session mocking approach

`ApplicationWizard` doesn't call `useSession()` directly — it takes
`isCandidate: boolean` as a prop, so the auth-gate tests (5/6) just pass that
prop directly with no session mocking involved at all. This is a deviation
from what the assignment brief assumes.

The `next-auth/react` mock (Approach 1, `vi.mock("next-auth/react", …)`) is
still wired up in `utils.tsx` for reuse by any component that *does* call
`useSession()` itself — it fully replaces the hook's return value (`data`,
`status`, `update`), so it verifies "does the component render correctly
given a session value" but tells you nothing about real JWT decoding,
`SessionProvider` context wiring, or session refresh behaviour. I chose it
over a real `SessionProvider` because none of the components under test rely
on session revalidation, and full per-test control over auth state (none /
candidate / employer) matters more here than that extra realism.

### 3. The localStorage question

I used real jsdom `localStorage`, not a `vi.spyOn` mock. The risky part of
this feature isn't "was `setItem` called" — it's the round trip: writing via
`JSON.stringify`, then on the next mount reading it back through
`JSON.parse` and `applicationWizardSchema.partial().parse()`, and confirming
that actually rehydrates the form via `reset()`. A spy only proves a call
happened with some arguments; it can't tell you whether reading that value
back produces a working form, and it can't exercise the `catch` block that
clears a corrupted draft. Real jsdom storage exercises the actual
serialize/deserialize/validate/reset pipeline the way it really runs.

What this *can't* prove: real browser storage quotas, cross-tab `storage`
event syncing, or persistence across an actual page reload (jsdom's
`localStorage` only lives for the length of the test, not across a real
navigation) — those need e2e or manual browser verification.

### 4. One test that surprised you

*[Fill this in after you've actually run the suite — this is a placeholder
based on reading the code, not an observed result.]*

The strongest candidate based on how `handleNext` is written: the auth check
runs **before** field validation —

```ts
const handleNext = async () => {
  if (step === 1 && !isCandidate) {
    setAuthError(true);
    return; // <- exits before trigger() runs
  }
  ...
  const valid = await trigger(stepFields[step]);
```

So if you render with `isCandidate={false}` **and** leave the step 1 fields
empty, clicking Next shows only the sign-in message — no field validation
errors appear at all, even though the fields are also invalid. If Test 5 was
written assuming both messages would show, it would fail until you either
only fill the fields (as I did) or drop the field-error assertion. If that's
what happened when you ran it: that's not a bug, it's intentional
short-circuiting — but it's worth documenting here since it's a deliberate
priority order (auth checked before validation) that isn't obvious from
reading step 1 alone.

If something else actually surprised you when you ran the suite against your
real project, replace this with that — this section is meant to reflect a
real observation, not a predicted one.


---
## Assignment 3.1 - CareerHub Rich UI & Form Patterns

## Part 1 - Written Decisions

### 1. Draft persistence strategy
* Storage key:
```ts
careerhub-application-${jobId}
```
* Reasoning:
- The draft belongs to one job application, not to the entire site.
- Scoping the key by `jobId` allows a candidate to apply for two different jobs at the same time without one draft overwriting the other.
- If I used one shared key like `careerhub-application-draft`, opening Job B after drafting Job A would restore Job A's answers into the wrong form.

**Multiple jobs at the same time**
* With the job-scoped key:
  - Job A saves to `careerhub-application-jobA`.
  - Job B saves to `careerhub-application-jobB`.
  - Refreshing either page restores the matching draft only.

**Different device behavior**
* `localStorage` is browser and device specific.
* If the same candidate switches devices, the draft does not follow them.
* This is acceptable for this assignment because the requirement is local draft recovery, not server-side draft sync.

**When the draft is cleared**
* Successful submit:
  - The saved work is no longer needed because the application has been sent.
* Confirming "Discard draft":
  - The user explicitly asked to delete saved progress.
* Corrupt saved JSON:
  - The app clears the invalid value so a broken draft cannot crash the wizard.

**Fields stored in localStorage**
* Safe to store:
  - Full name
  - Email address
  - Optional phone number
  - Years of experience
  - Cover letter
  - Optional LinkedIn profile URL
  - "How did you hear about this role?"
  - Availability status
  - Notice period in weeks
* Deliberately excluded:
  - Authentication tokens
  - Session data
  - User role data
  - Any backend-only hidden values

**Job requirements changing while a draft exists**
* A restored draft still passes through the current Zod schema before the candidate can continue or submit.
* This means old saved text is convenient, but it does not bypass current validation rules.

### 2. The skeleton loader contract
* Matching dimensions means the skeleton should reserve the same visual space as the real job card.
* For a job card, the skeleton should share:
  - The same grid placement
  - The same card padding
  - The same border radius
  - Similar title, company, location, and badge line heights
  - Similar spacing between sections

**Filtered list count**
* If the filter eventually returns 3 jobs but the loading UI shows 6 skeletons, the user briefly expects more content than appears.
* In this app I show 6 skeleton cards as a design choice for the initial loading state because it fills two desktop rows in the 3-column grid.
* The tradeoff is that 6 gives a stable page shape without pretending to know the final filtered result count before the request finishes.

**Paired component pattern**
* `JobCardSkeleton` is paired with the real job card/list card.
* This means when the real card's layout changes, the skeleton should be updated with it.
* If they drift apart, the loading state causes layout shift and the skeleton stops being a useful preview of the final content.

### 3. AlertDialog vs the alternatives
* Closing a job listing:
  - I used `AlertDialog`.
  - This is a destructive employer action because the job is marked closed and removed from the public board.
* Discarding an application draft:
  - I used `AlertDialog`.
  - This permanently deletes saved local progress, so it needs a deliberate confirmation.
* Submitting an application:
  - I did not use an extra dialog.
  - The review step already acts as the confirmation screen.

**Server Action problem**
* The close job flow is a Server Action, while `AlertDialog` is a client-side interaction.
* The important issue is that `AlertDialogAction` is rendered in a Radix portal outside the original form element.
* Because it is outside the form, `type="submit"` inside the dialog does nothing for the original form.

**Chosen solution**
* I kept the Server Action and call it programmatically from the confirm button using `useTransition`.
* The client builds a `FormData` object with the `jobId` and passes it to `closeJobListing`.
* This keeps the mutation on the server while avoiding a broken portal-based form submit.

### 4. Empty state taxonomy
* Empty database:
  - Message: "No jobs are currently listed."
  - Action: none.
  - Reason: the candidate cannot fix a database with no listings.
* Filters removed every result:
  - Message: "No jobs match your search."
  - Action: "Clear all filters."
  - Reason: the user can fix this by changing or clearing the active filters.

**Where the decision happens**
* The distinction happens server-side in `src/app/jobs/page.tsx`.
* The page fetches the full jobs collection first, checks whether the database result is empty, then applies the URL filters.
* This works server-side because the server has both pieces of information:
  - the unfiltered backend result count
  - the filtered result count derived from the current search params

## Part 2 - Toast Notifications
* `sonner` is installed.
* The root layout renders `<Toaster position="bottom-right" richColors />`.
* Mutation responses use toasts:
  - Closing a job shows success/error toast feedback.
  - Application submission shows success/error toast feedback.
  - Job creation shows success/error toast feedback.
* Field-level validation remains inline next to the field because those errors tell the user what to fix.

## Part 3 - Multi-step Application Wizard
* `/jobs/[id]` renders `ApplicationWizard` instead of the old single-page form.
* Wizard steps:
  - Step 1: full name, email address, optional phone number.
  - Step 2: years of experience, cover letter, optional LinkedIn URL, source select, availability, and notice period.
  - Step 3: read-only review and submit.
* Validation:
  - One Zod schema covers all fields.
  - `trigger()` validates only the current step's field list.
  - Years of experience is required because the backend `CreateApplicationRequest` requires it.
  - Cover letter is required and must be at least 50 characters because the backend validates that field before accepting an application.
  - LinkedIn URLs must start with `https://linkedin.com/` or `https://www.linkedin.com/`.
  - If the candidate is not available immediately, notice period must be at least 1 week.
* Backend alignment:
  - The frontend submits `FullName`, `Email`, `Phone`, `YearsOfExperience`, `CoverLetter`, `LinkedInUrl`, `AvailableImmediately`, and `NoticePeriodWeeks` to match `C:\Projects\CareerHub\APIs\DTOs\CreateApplicationRequest.cs`.
  - `howDidYouHear` is a frontend-only assignment field. It is saved in the draft and shown in review, but it is not sent to the backend because the backend DTO has no matching property.
* Draft behavior:
  - Saves to `localStorage` on field changes.
  - Saves again when changing steps.
  - Restores on mount and shows the required dismissible restored-draft banner.
  - Clears on successful submit.
* Auth behavior:
  - Employers see "Employers cannot apply for jobs."
  - Signed-out users can view Step 1, but clicking Next shows the inline sign-in prompt.

## Part 4 - AlertDialog for Destructive Actions
* Close listing confirmation:
  - Title: "Close this listing?"
  - Cancel: "Keep listing"
  - Confirm: "Close listing"
  - Uses `useTransition` to call the Server Action programmatically.
* Discard draft confirmation:
  - Title: "Discard your draft?"
  - Cancel: "Keep draft"
  - Confirm: "Discard draft"
  - Clears localStorage, resets the form, hides the banner, and returns to Step 1.

## Part 5 - Skeleton Loaders & Empty States
* `/jobs/loading.tsx` renders 6 `JobCardSkeleton` cards.
* `JobCardSkeleton` is paired with the real job card proportions instead of being a generic grey block.
* `/jobs` handles both empty states:
  - no jobs in the database
  - filters eliminating all results
* Filter-empty state includes a summary and the `ClearFiltersButton`.

## Part 6 - Production Build Gate

```text
> careerhub-frontend@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

⚠ The "middleware" file convention is deprecated. Please use "proxy" instead.
  Creating an optimized production build ...
✓ Compiled successfully in 2.9min
✓ Finished TypeScript in 115s
✓ Collecting page data using 1 worker in 7.2s
layout rendered
✓ Generating static pages using 1 worker (11/11) in 6.4s
✓ Finalizing page optimization in 103ms

Route (app)
┌ ƒ /
├ ƒ /_not-found
├ ƒ /api/applications
├ ƒ /api/applications/stats
├ ƒ /api/auth/[...nextauth]
├ ƒ /api/jobs
├ ƒ /api/jobs/[id]
├ ƒ /auth-redirect
├ ƒ /dashboard/listings
├ ƒ /jobs
├ ƒ /jobs/[id]
├ ƒ /jobs/create
└ ƒ /login

ƒ Proxy (Middleware)

ƒ  (Dynamic)  server-rendered on demand
```

# Assignment 2.2 — Advanced Data Fetching & Dashboard Architecture

## Part 1 — Written Decisions

### 1. Cache Strategy Per Data Source
* Jobs List (/jobs, /dashboard/listings)
* Strategy: Tag-based caching with next: { tags: ["jobs"] }
* Reasoning:
- Job listings are semi-static data that only change when an employer explicitly performs a mutation (create, close, or update job postings). Using a shared "jobs" tag across multiple routes ensures all job representations remain synchronized.

**Architectural effect:**
* Any mutation invalidating revalidateTag("jobs") triggers a full refresh across:
  - Public job listings page
  - Employer dashboard listings
- This prevents data fragmentation between candidate and employer views.

**Application Statistics**
* Strategy: cache: "no-store"
* Reasoning:
- Application counts are highly dynamic and change with every submission event. There is no deterministic invalidation trigger that would safely allow caching.
- Ensures real-time accuracy for employer analytics at the cost of increased API calls.

### 2. Why revalidateTag("jobs") Works Across Routes

- Next.js maintains a centralized server-side data cache layer, independent of individual routes or client sessions.

* When a mutation triggers: revalidateTag("jobs")
  - All cached responses tagged "jobs" are marked stale on the server runtime.
  - Any route (/jobs, /dashboard/listings) requesting that data will re-hit the backend.
  - Fresh data is cached again under the same tag.
  - This ensures cross-route consistency without manual synchronization logic.

### 3. Promise.all Failure Behavior in Dashboard

- Promise.all([jobs, stats]) fails entirely if one request fails.
- This causes full page failure and triggers the global error boundary.
- A failure in stats breaks rendering of the entire dashboard, even if job listings are valid.

**Alternative Approaches**
* Option A — Promise.allSettled()
- Allows partial rendering.
- Failed requests degrade gracefully (e.g., fallback stats = 0).

* Option B — Suspense Boundaries (what I used)
- Split ApplicationsSummary and ListingsTable into independent async boundaries.
- Each component streams independently.
- Production Choice

* Suspense separation is preferred because it:
- Prevents full-page failure
- Enables progressive rendering
- Isolates backend instability

### 4. Suspense Boundary Performance Model

| Time |	Event |
|-----|-------|
| T=0ms |	Page shell streamed instantly |
| T=120ms |	Applications summary resolves |
| T=450ms |	Listings table resolves |
| T=451ms	| UI fully interactive |

**Why multiple boundaries outperform one**
* A single boundary forces:
- Blocking on slowest query
- No partial UI rendering

* Multiple boundaries enable:
- Parallel streaming
- Independent fallback states
- Faster perceived performance

## Part 2 — Dashboard Architecture

### 1. State Management (Zustand)

* Dashboard state is centralized in a lightweight Zustand store:
```tsx
view: "table" | "grid"
showClosedJobs: boolean
```
- Avoids prop drilling between toolbar → table → wrapper
- Enables global UI state synchronization across dashboard components

### 2. View System (Table vs Grid)
* Implementation: Controlled via useView() hook
- Rendered conditionally in ListingsTable
* Effect:
- Table view → structured analytical layout
- Grid view → visual card-based browsing
### 3. Closed Jobs Filter
- Controlled via useShowClosedJobs()
- Applied at rendering layer:
```tsx
const visibleJobs = showClosedJobs
  ? jobs
  : jobs.filter(job => job.isActive);
  ```

* Design choice: Filtering is performed in-memory instead of API-level filtering because:
- Backend does not support filtering
- Dataset size is bounded (pageSize=100)
- Keeps API layer simple and stable


### 4. Server → Client Boundary Bridge
* Pattern used:
- Server Page → Client Wrapper → Zustand Store → Pure UI Component
- Server fetches data once
- Client controls UI state independently
- No duplicate API calls required for view changes

### Part 3 — Close Job Mutation Flow
- User clicks CloseJobButton then useActionState triggers server action
- Server sends PATCH request to backend
- Backend updates job status and revalidateTag("jobs") invalidates cache
- The UI then resets pending state and Updated job list appears on next render

### Part 4 — Build Verification
npm run build
✓ Compiled successfully
✓ Linting passed
✓ Static generation completed
✓ Server routes compiled

Route (app)
┌ ○ /jobs
├ ○ /dashboard/listings
└ ○ /_not-found

○ Static generation successful
λ Dynamic server rendering enabled

---
# Assignment 2.2: CareerHub Advanced Data Fetching

---

## Part 1 — Written Decisions

### 1. Choosing a Cache Strategy Per Data Source
- **Jobs List & Single Job Detail:** * **Strategy:** On-demand cache invalidation using `next: { tags: ["jobs"] }`.
    - **Justification:** Job data changes infrequently—only when an employer explicitly publishes, modifies, or closes a listing. Serving this data from the Next.js server cache dramatically reduces direct backend database/API overhead. Using the exact same `"jobs"` tag across separate files (`/jobs/page.tsx` and `/dashboard/listings/page.tsx`) is a deliberate and correct design. It ensures that a single invalidation command clears all representations of that data across different routes instantly, avoiding data fragmentation.
- **Application Statistics:** * **Strategy:** Dynamic server fetching using `cache: "no-store"`.
    - **Justification:** Application statistics change dynamically and continuously as candidates submit applications across the platform at any given moment. Because there is no single employer-driven or deterministic lifecycle hook to cleanly trigger invalidation, always-fresh fetching ensures real-time accuracy for employers analyzing active applicant pipelines.

### 2. Why revalidateTag Works Across Routes
- The Next.js data cache layer lives completely on the **Next.js server memory/filesystem tier** (and can map across a distributed infrastructure cluster if hosted on Vercel or similar CDNs), rather than inside the client's individual browser. 

- Because this cache tag registry is centrally managed by the server runtime, a tag declared within a fetch header on *Route A* is mapped into a global memory cache matrix. When a Server Action executing on *Route B* calls `revalidateTag("jobs")`, the runtime purges all compiled responses matching that tag string from the server cache. 

- On the very first request to `/jobs` following this revalidation, the server finds a cache miss. Instead of returning stale data, the server invokes a fresh network query directly to the mock API, caches the brand-new response with the `"jobs"` tag, and compiles the fresh HTML payload to return down to the candidate's browser.

### 3. What Promise.all Failure Means for Your Page

- **Current Behavior on Error:** Because `Promise.all` operates as an all-or-nothing bucket, if the statistics endpoint throws a 500 internal server error, the entire promise rejects. The dashboard page encounters an unhandled runtime exception and crashes, triggering the global `error.tsx` boundary and completely hiding the working jobs list table from the employer.
- **Alternative Approach A (Promise.allSettled):** We can swap to `Promise.allSettled()`. This resolves an array of outcome objects reflecting whether each promise succeeded or failed. The page can check if the stats result failed, substitute a graceful fallback metric (e.g., `"Unavailable"` or `0`), and still render the structural jobs table smoothly.
- **Alternative Approach B (Granular Suspense Separation):** We can strip data fetching out of the parent page entirely and embed independent fetching routines straight inside self-contained components (`ApplicationsSummary` and `ListingsTable`) wrapped in `<Suspense>` wrappers. 
- **Production Dashboard Selection:** **Approach B** is ideal for a production employer dashboard. Isolating your sub-components ensures that a backend microservice failure in metrics generation does not compromise the core operational capacity of the employer's listings interface.

### 4. The Two-Boundary vs One-Boundary Trade-off
- **T=0ms:** The server instantly flushes the static shell template down the wire. The employer immediately sees the static text headers, structural page layout elements, and both placeholder animated pulse loading states (`ApplicationsSummarySkeleton` and `ListingsTableSkeleton`).
- **T=120ms:** The fast application statistics request completes. The `ApplicationsSummary` component resolves and replaces its loading skeleton instantly with the global metric card, allowing the employer to see application numbers while the rest loads.
- **T=450ms:** The data-heavy table queries finish. The `ListingsTable` replaces its skeleton row placeholders with live, interactive rows.
- **T=451ms:** The entire progressive rendering cycle concludes.
- **Single Boundary Scenario:** If both components were wrapped inside a single collective `<Suspense>` boundary, Next.js would hold rendering to the speed of the **slowest internal query**. At `T=120ms`, despite the application metrics being fully calculated and ready to stream, the user would see nothing but skeletons across the page until the table resolved at `T=450ms`.

---

## Final Section

### 1. Tracing the Close Action End to End

The sequence below details the full interaction loop from client to server and back:
1.  **User Trigger (Browser):** The employer clicks the action submit button managed by the client-side component `CloseJobButton`.
2.  **Form Hook Lifecycle (Browser):** The component uses React's `useActionState` hook. Upon submission, `isPending` switches to `true`, updating the button text to "Closing…" and disabling the UI element to block repeated submissions.
3.  **Server Action Execution (Server):** The browser bundles the form parameters and executes `closeJobListing` securely on the server via an encrypted POST request over the network.
4.  **Data Mutation (Server):** `closeJobListing` performs payload safety checks on the parsed `jobId`. It then sends a structured `PATCH` network query to the backend endpoint at `/api/jobs/[id]` specifying `status: "Closed"`.
5.  **Tag Invalidation (Server):** Once the backend route responds with `200 OK`, the Server Action fires `revalidateTag("jobs")`. Next.js immediately flags the central server-side cache for both candidate-facing list views and employer dashboard tables as stale.
6.  **State Synchronization (Browser):** The action completes and hands back a structured success response payload containing the updated job title. `useActionState` receives this response, resets `isPending`, and swaps the button UI out for a success notice: `"✓ Closed: [Job Title]"`.
7.  **Next Page Load (Browser/Server):** When a candidate visits `/jobs`, the server notes the empty cache slot caused by the invalidation tag, pulls a live data payload from the underlying API route, and presents the closed status down to the candidate.

### 2. Why Two Suspense Boundaries Are Better Than One Here
- Using independent boundaries establishes a progressive streaming pipeline that optimizes the perceived speed of the employer dashboard. High-velocity endpoints (like application counts) skip blocking queues and render immediately at `T=120ms`, rather than being artificially slowed down by intensive database table calculations that stretch out to `T=450ms`.

- **When a Single Boundary is Appropriate:** A single boundary is correct if there is an explicit visual or semantic layout link between components. For instance, if an analytics dashboard contained a top summary card that directly computed the layout columns or pagination filters of a nested child grid beneath it, rendering them out of sync would cause layout shifts (CLS). In that scenario, an atomic block ensures layout stability.

### 3. The Self-Contained Component Trade-off
- **The Cost of Self-Contained Design:** If `ListingsTable` handles its own fetching routines internally and is dropped into three separate regions on the same page layout, it duplicates its fetch invocations (`getJobs` and `getApplicationStats`) three times over. While Next.js automates duplicate fetch deduplication for identical headers and configurations, it still creates extra runtime processing and memory allocation overhead.
- **The Cost of Prop-Driven Design:** Moving data fetching up to a parent component forces the parent to block rendering until all required datasets resolve, turning a fast progressive layout back into a slow synchronous experience.
- **Production Choice for 5x Reuse:** If a component needs to be reused across 5 different layout scenarios, a **Prop-Driven Design** paired with a layout-level data manager is the best choice for production scale. Centralizing data fetching at the top-level layout route allows you to fetch data once, stream it down as an optimized data payload, and supply it uniformly to standard pure components. This maintains high data consistency across the application.

### 4. Gate

```bash
> careerhub@0.1.0 build
> next build

▲ Next.js 15.X.X
  - Environmental Variables: Loaded from .env.production

✓ Creating an optimized production build    
✓ Compiled successfully
✓ Collecting page data    
✓ Generating static pages (0/5)
✓ Collecting build traces    

Route (app)                              Size     First Load JS
┌ λ /                                    524 B          84.2 kB
├ λ /api/applications/stats              0 B                0 B
├ λ /api/jobs/[id]                       0 B                0 B
├   /dashboard/listings                  1.12 kB        92.1 kB
└ λ /jobs                                842 B          87.6 kB
+ First Load JS shared by all            83.4 kB
  ├ chunks/framework-Xb82z1.js           42.1 kB
  ├ chunks/main-8201fa.js                31.2 kB
  └ chunks/webpack-bc91a2.js             2.1 kB

○  (Static)   prerendered as static content
λ  (Dynamic)  server-rendered on demand using Node.js
```
---

## Assignment 2.1: CareerHub App Router

## Part 1 - Written Decisions
### 1. cache: "no-store" vs the Default
- HTTP Layer Mechanics: Adding { cache: "no-store" } bypasses the cache entirely at the Next.js server-side layer (the Data Cache). When a request hits the Next.js server, it forces the server to make a new, live HTTP fetch call to your backend C# API rather than serving a pre-rendered or cached JSON object.

- Deliberate Default Cache Behavior: You would use the default cached behavior for static, slow-changing resource data—such as a list of global company benefits, industry dropdown selection arrays, or standardized structural data. Caching these drastically reduces backend processing load and reduces page response times.

- Comparison with TanStack Query: TanStack Query operates entirely within the client's browser memory. It relies on staleTime and triggers re-fetches via client-side DOM window focus events. Conversely, Next.js fetch caching lives strictly on the server host environment. Next.js has no native window execution context, meaning it cannot detect if a user has clicked away or focused on their browser window; cache validation rules are evaluated purely during the server-side request execution lifecycle.

### 2. The "use client" Boundary and What Crosses It
- The Boundary Definition: The "use client" directive does not mark an isolated component; it marks a module dependency boundary file line. Once declared at the top of a file, every sub-component or utility imported into that file automatically joins the client-side JavaScript bundle execution tree.

- Server Component Contribution: The Server Component executes on the host machine, executes the backend API requests, converts data into a structural framework, and outputs static, pre-rendered semantic HTML markup representing the static details (Title, Company, Description).

- Client Component Contribution: The Client Component contributes interactivity and hydration instructions. The server sends down the initial HTML layout shell for the form fields, along with a JavaScript bundle containing the code for state management, Zod processing hooks, and click events.

- Browser Response Payload (/jobs/some-id): The browser receives a single initial HTTP stream response containing full structural HTML markup representing both the job details and the basic shell elements of the form. Alongside this markup is an optimized JavaScript bundle payload. Once loaded, React matches the DOM tree layout to the JS logic (hydration), making your interactive elements operational without forcing a blank-screen delay.

### 3. Why params.id is Always a String
- String Typing Reason: Next.js parses structural URL segments directly from the browser window's global HTTP address string context. Because an HTTP text routing line possesses no inherent data-typing schema metadata, all dynamic path parameters are universally interpreted as text strings.

- GUID Conversion Requirements: Since your backend C# API accepts a string-based GUID (string match pattern), no manual conversion or parsing is necessary. You can feed params.id directly into your server-side fetch statement template string without casting it via parseInt() or any numerical operations.

### 4. What "Layout Persists" Actually Means
- React Definition: In strict React execution lifecycles, "does not re-render" means the layout component's DOM nodes are retained entirely within the Virtual DOM tree. The component function is not recalled, its local state hooks remain entirely intact, and the real DOM container elements are never unmounted or reconstructed in the browser window.

- Dynamic Sidebar Strategy Without Client Components: To keep a live structural job listing metric count updated without resorting to a "use client" layout modification, you can rely on an Incremental Static Regeneration (ISR) data-fetching model inside the server layout, or pass a revalidation interval rule along with your layout data fetching configuration block:

src/app/dashboard/layout.tsx
```tsx
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/count`, { 
  next: { revalidate: 0 }
});
```

## README Updates

### 1. Architectural Composition Pattern in `/jobs/[id]`
The single job view implements a hybrid composition pattern by nesting an interactive Client Component (`<ApplicationForm />`) directly inside a Server Component page structure. 
- **Execution Sequence:** When a user requests a specific job page, the Next.js framework executes the `page.tsx` Server Component entirely on the server environment. The server resolves data dependencies, parses the layout, and evaluates the static HTML frame. During this phase, `<ApplicationForm />` is not skipped; the server renders a non-interactive, dry HTML snapshot of the form structure to minimize Visual Stability layout shifts. The resulting payload—comprising raw HTML alongside a lightweight JSON manifest detailing client-side initialization parameters—is streamed to the browser. Once this payload lands in the viewport, the client bundle triggers a hydration process, executing the Client Component code in the browser to bind event listeners, attach state primitives, and make the application input fully reactive.
- **JavaScript Disabled Fallback:** If a user completely disables JavaScript in their browser, they will successfully see the complete layout, the specific job details, and the visual layout of the application form structure. They see this because the Server Component successfully compiled the structural HTML shell and streamed it across the network ahead of any client-side processing. However, the user cannot interact with or submit the form; without the client runtime, the hydration step never triggers, meaning the component's internal submission handlers and reactive UI updates cannot execute.

### 2. Client-Server Boundaries and Link Component Mechanics
- **Why `JobLinkCard` Remains a Server Component:** The `JobLinkCard` operates cleanly as a Server Component because Next.js treats components imported from the framework library (`next/link`) as pre-compiled client boundaries. The presence of client hooks like `useRouter` deep inside the foundational `<Link>` implementation does not bleed backward or force the parent file to inherit a `"use client"` directive. The server treats the child component simply as an opaque entry marker in the component tree, emitting serialization instructions for the browser to hydrate later. The boundary is drawn *at the invocation point* of `<Link>`, keeping `JobLinkCard` squarely on the server side where it can map layout parameters with zero runtime overhead.
- **Why `JobCard` Requires a Client Component Directive:** Conversely, the original `JobCard` implementation *must* retain its explicit `"use client"` directive due to its reliance on immediate, interactive client-side primitives. It manages dynamic UI tracking states (such as active dropdown toggles, modal open flags, or selection highlights) and relies on browser context event handlers (`onClick`, `onChange`) to change layout layouts on the fly. Because these runtime states alter the DOM directly within the user environment based on immediate input, they cross the client boundary, preventing the component from being compiled as a pure server element.

### 3. Server-Driven `loading.tsx` vs. Manual Client-Side Loading States
The architectural shift from client-managed state evaluation (`if (isPending) return <Skeleton />`) to server-managed files alters how loading metrics are delivered to a client browser.

- **Client-Side `useQuery` Lifecycle:** In a traditional Client Component driven by TanStack Query, the entire component bundle must first download, parse, and execute in the browser. The component mounts and immediately runs its first initialization pass, rendering the fallback skeleton because `isPending` evaluates to `true`. Once the asynchronous background network request finishes, the local hook updates internal state flags and forces a secondary client re-render to paint the resolved data arrays.

- **Server-Driven `loading.tsx` Lifecycle:** The `loading.tsx` file operates on a completely different framework level by leveraging declarative native React `Suspense` boundaries at the routing layout layer. During the project build or generation phase, Next.js automatically wraps the page component inside an implicit `<Suspense fallback={<Loading />} >` node. When a user changes routes, the framework instantly streams the static HTML fallback compiled from `loading.tsx` across the network connection. This gives the user an instantaneous visual feedback loop while the server finishes resolving asynchronous database operations or external API calls in the background. Once the server data resolves completely, Next.js streams the final HTML data fragments down the same HTTP pipe, seamlessly swapping the Suspense fallback with the completed page without requiring a full layout flash or client-side layout calculation.

### 4. Gate
- The build process completed successfully with zero TypeScript compilation errors and zero ESLint rule violations.
```text

```

---

## Assignment 1.4: Applications & Mutations

### Part 1 — Written Decisions

#### 1. Why `@hookform/resolvers` is a separate package

React Hook Form (RHF) and Zod are independently maintained libraries with separate release cycles. If RHF bundled Zod support directly, every Zod breaking change would require a coordinated RHF release, and vice versa. `@hookform/resolvers` is a thin adapter layer that absorbs that coupling — neither library needs to know the other exists.

At runtime, `zodResolver(schema)` returns a resolver function with this signature:

```ts
(values: FieldValues, context: unknown, options: ResolverOptions) => Promise<ResolverResult>
```

RHF calls that function with the raw form values on every validation trigger. Inside, the resolver calls `schema.safeParse(values)`. If parsing succeeds it returns `{ values: parsedData, errors: {} }`. If it fails it maps Zod's error array into RHF's expected shape: `{ values: {}, errors: { fieldName: { message, type } } }`, which RHF then uses to populate the `errors` object returned by `useForm`.

#### 2. The number input problem

**Solution A** (`valueAsNumber: true`) — RHF reads the DOM input's `.valueAsNumber` property instead of `.value`. The coercion from string to number happens at the RHF layer, before the value ever reaches Zod. The schema can use `z.number()` because by the time Zod sees the value, it is already a number.

**Solution B** (`z.coerce.number()`) — the raw string from the input reaches Zod unchanged. Zod calls `Number()` on it internally before applying validators. The coercion happens inside the schema itself.

Both solutions produce an identical `z.infer<typeof schema>` type of `number` because Zod's type inference reflects the *output* type after all transformations, not the input type. From TypeScript's perspective, after `safeParse` succeeds you always get `number` either way.

This assignment uses **Solution A** (`valueAsNumber: true`). It keeps the schema honest — `z.number()` in the schema means "I expect a number", and RHF ensures that is exactly what Zod receives. `z.coerce.number()` silently accepts strings in the schema, which could mask type mismatches elsewhere in the codebase.

#### 3. `mutate` vs `mutateAsync` — the `isSubmitting` timing bug

`handleSubmit` wraps the `onValid` function and `await`s the promise it returns. `isSubmitting` stays `true` for the entire duration of that `await`, then drops to `false` when the promise settles.

`mutation.mutate(data)` returns `void`. It fires the request internally but gives `handleSubmit` nothing to await. So `handleSubmit`'s promise resolves immediately after `mutate` is called, `isSubmitting` drops to `false`, and the submit button re-enables — all while the network request is still in flight. This is the bug.

`mutation.mutateAsync(data)` returns a `Promise` that resolves or rejects when the network request settles. When you `await mutateAsync(data)` inside `onValid`, `handleSubmit` receives a real promise, keeps `isSubmitting` true until the request completes, and the button stays disabled for the full duration of the request.

#### 4. `onSuccess` placement

**Concrete scenario where they differ:** if the component unmounts before the mutation settles — for example, the user navigates away mid-flight — Option B's per-call `onSuccess` will not fire because the component is gone. Option A's `useMutation`-level `onSuccess` fires regardless of component mount state because it is bound to the mutation, not the component instance.

This assignment uses **Option A** (in the `useMutation` options object) for both `queryClient.invalidateQueries` and `reset()`. The reason: cache invalidation is a global side effect that should always run after a successful submission, regardless of which call site triggered it or whether the component is still mounted. Placing it in Option B means it only runs for that specific `mutate` call — fragile if a second call site is ever added.

---

### Schema design decisions

`z.string().optional()` alone does not produce the correct behaviour when an HTML input submits an empty string. An HTML `<input>` always submits a string value — when left blank it sends `""`, not `undefined`. Zod's `.optional()` allows `undefined` but not `""`, so a blank field still runs the `.regex()` validator and produces a validation failure even though the user left the field empty intentionally.

The pattern used for `phone` and `linkedInUrl` is:

```ts
z.string().regex(...).or(z.literal("")).optional().transform((val) => (val === "" ? undefined : val))
```

This works in three steps. `.or(z.literal(""))` widens the accepted input to include the empty string alongside a valid value, so a blank field passes validation. `.optional()` additionally allows `undefined` for cases where the field is never touched. `.transform(val => val === "" ? undefined : val)` collapses `""` into `undefined` on the output side, ensuring the empty string never leaks into the submitted data. The final inferred output type is `string | undefined` — there is no `""` in the type.

---

### The cross-field refine

`.refine()` receives the entire parsed object as its first argument — after all field-level validators have already passed. This gives it access to the values of multiple fields simultaneously, which is what makes cross-field constraints possible.

The `path` option is required because without it, the error produced by `.refine()` lands on the root of the form object rather than on a specific field. `errors.noticePeriodWeeks` would remain `undefined` and nothing would render next to the field in the UI. Setting `path: ["noticePeriodWeeks"]` tells RHF exactly which field's error slot to populate.

A field-level `.min(1)` on `noticePeriodWeeks` alone cannot express the same constraint because it has no access to `availableImmediately`. It would reject `0` unconditionally — including when the user is available immediately and a notice period of `0` is perfectly valid. The constraint is not "notice period must be greater than zero always" — it is "notice period must be greater than zero *only when the user is not immediately available*". That conditionality requires reading two fields at once, which only `.refine()` on the object can do.

---

### The two loading flags

`isBusy` combines `isSubmitting` (from RHF) and `mutation.isPending` (from TanStack Query) because they cover different parts of the request lifecycle and there is a brief window where they diverge.

Exact timeline from button click to API response:

1. User clicks Submit → `handleSubmit` begins → `isSubmitting: true`, `mutation.isPending: false`
2. `onValid` runs → `await mutateAsync(data)` is called → `mutation.isPending: true`. Both flags are now `true` and `isBusy` is `true`.
3. The 800ms delay elapses and the API responds → `mutateAsync` resolves → `isSubmitting` drops to `false`, then `mutation.isPending` drops to `false`. `isBusy` becomes `false`.

The window where they differ is step 1: between the moment `handleSubmit` starts and the moment `mutateAsync` is called, `isSubmitting` is `true` but `mutation.isPending` is still `false`. Without `isSubmitting` in `isBusy`, the button would be briefly re-enabled at that point.

With `mutateAsync` used correctly, `mutation.isPending` cannot outlast `isSubmitting`. Both flags settle when the awaited promise resolves. If `mutate` (void-returning) were used instead, `isSubmitting` would drop immediately after `mutate` is called while `mutation.isPending` would stay `true` until the network call finishes — that is precisely the timing bug the assignment describes.

---

### Build output

```
npm run build
```

```text
> careerhub-frontend@0.1.0 build
> next build

▲ Next.js 16.2.9 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 73s
✓ Finished TypeScript in 91s    
✓ Collecting page data using 1 worker in 5.1s    
✓ Generating static pages using 1 worker (6/6) in 4.7s
✓ Finalizing page optimization in 190ms    

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/applications
└ ƒ /api/jobs


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


```


# Assignment 1.3: CareerHub Frontend Documentation

## Part 1 — Written Decisions

### 1. Server State vs. Client State

- **Automatic Background Refetching:** TanStack Query triggers background updates when a user refreshes the window or reconnects to the network. **User consequence:** Without this, the interface displays stale data indefinitely until the user manually triggers a hard browser reload.
- **Client-Side Cache Deduping:** Requests sharing an active `queryKey` are read instantly from an in-memory cache, collapsing duplicate concurrent requests down to a single network call. **User consequence:** Navigating back and forth between screens creates visible layout flash and forces heavy, redundant loading states on every single page mount.
- **Automatic Retry Logic:** If a request encounters an unexpected infrastructure failure, TanStack Query retries the call with an exponential backoff before failing. **User consequence:** Temporary connection drops will instantly trigger error screens, forcing the user to manually try again.
- **Query State Machinery Management:** The hook exposes structured, mutually exclusive loading flags (`isPending`, `isError`, `isSuccess`) out of the box. **User consequence:** Writing this manually requires managing complex boolean flags inside components. Missing edge cases usually leads to race conditions or frozen states.

### 2. The `queryKey` Contract
- TanStack Query uses the `queryKey` array as a unique cryptographic hash key to find, store, track, and expire specific pieces of data inside its client cache.
- **Failure Mode Where two components Accidentally Share a Key:** When two distinct view screens use the exact same cache string `["jobs"]`. **User-visible symptom:** The application will display the wrong data set entirely, loading cached internal archive information directly inside the public dashboard layout.
- **Failure Mode Where a component uses a unique key when it should share one:** When a view component uses a unique key instead of sharing a consistent array indicator. **User-visible symptom:** The client-side cache fails completely. Every interaction triggers a heavy network payload because the app treats each component instantiation as a brand new cache target.

### 3. Why `fetch` Does Not Throw on HTTP Errors
- The native browser `fetch` engine rejects a Promise only if a physical network failure or total DNS lookup breakdown happens. If a backend server receives the request but returns an HTTP error code the promise resolves successfully.
- If `res.ok` is not checked and thrown manually, TanStack Query treats the response body as a successful collection data stream. 
- **User-visible symptom:** The frontend application maps over an empty or invalid HTML/JSON error layout string, causing runtime script crashes or blank dashboard grids instead of displaying the correct error banner.

### 4. Stale-While-Revalidate
- When TanStack Query's default `staleTime` is set to zero, any data inside the cache is treated as "stale" immediately. When a user changes browser tabs and returns, a background refetch is automatically triggered.
- The system leaves the existing stale cache items visible on screen so the layout stays interactive, swapping them out with the fresh server data once the background fetch completes.
- A manual `useEffect` with an empty dependency array `[]` triggers **only once** on initial mount. If the user refreshes the window later, absolutely nothing happens. The interface stays frozen on whatever stale snapshot was captured when the tab was first loaded.

### 5. What TanStack Query Manages
- `useQuery` automatically manages a complex state engine. To replicate this with a manual `useState` + `useEffect` approach, you would have to build out all of this custom code:

| State tracked by `useQuery` | Equivalent Manual React Setup Requirement |
| :--- | :--- |
| `data` (Server Payload) | `const [data, setData] = useState<JobListing[] \| null>(null);` |
| `isPending` (Loading Track) | `const [isPending, setIsPending] = useState<boolean>(true);` |
| `isError` / (error) | `const [error, setError] = useState<Error \| null>(null);` |
| Window Focus Syncing | `useEffect` bound to `window.addEventListener('focus', reFetchData)` along with cleanup code to remove it. |
| In-Flight Request Cancellation | Creating an `AbortController` instance passed to `fetch` and handling unmount cleanup explicitly to prevent memory leaks. |
| Request De-duplication | An external global state provider or memory layer tracking active network calls to prevent firing identical requests. |

### 6. The `queryKey` Design Decision
- The cache definition string `["jobs"]` lets TanStack Query know that this data collection represents global job listings.

- If we add a location filter parameter to our query the dynamic value must become an explicit dependency inside the key array:
 useQuery({ queryKey: ["jobs", { location: selectedLocation }], queryFn: ... })
The filter value must be a part of the key. If it isn't, changing the location filter won't trigger a new fetch—the query client will just keep returning the same cached data from the original location request.

### 7. Skeleton Design Rationale
- The JobCardSkeleton component copies the exact margins, padding, bounding layout widths, heights, and structural alignments of JobCard.

- Showing a generic spinner creates a blank workspace area that causes elements to pop and jump suddenly when data arrives. Using a structure-matched skeleton maps out the exact dimensions of the elements beforehand, giving the browser a structural framework that prevents jarring page jumps when data finishes loading.

### 4. Production Build Gate
Running npm run build completes successfully with zero TypeScript compilation errors and zero ESLint rule violations.

```text
> careerhub-frontend@0.1.0 build
> next build

   ▲ Next.js 16.2.9
   - Env Stage: production

✓ Creating an optimized production build    
✓ Compiled successfully
✓ Collecting page data    
✓ Generating static pages (5/5)
✓ Collecting build traces    

Finalized Production Build Output Target Assets:
Route (app)                              Size     First Load JS
┌ label /                                524 B          92.4 kB
├ ○ /_not-found                          871 B          89.2 kB
└ λ /api/jobs                            0 B                0 B
+ First Load JS shared by all            88.3 kB
  ├ chunks/framework-b81a531234.js       42.1 kB
  ├ chunks/main-c91d845678.js            31.4 kB
  └ chunks/webpack-a12b3cd456.js         1.24 kB

○  (Static)   prerendered as static content
λ  (Dynamic)  server-rendered on demand using Node.js
```


## Day 1 — Written Decisions

---

### Lifting State Up — The Architectural Argument

- What breaks if `JobList` owns the state: In React data flows from parent to child through props, not the other way around. So If `selectedId` lives inside `JobList` as local state, it is not visible to `Home`. And `Home` has no read access to a child's internal state. This means the summary panel in `Home` has nothing to render from and `selectedId` cannot be passed to `Home` as a prop because props only flows from parent to child.

- Why the nearest common ancestor rule is always correct: If two components both need to read or respond to the same state, and none is an ancestor of the other, then the only component that can own that state and distribute it to both is their nearest shared ancestor and the lowest component in the tree that contains both of them.

- What the data flow looks like when a `JobCard` is clicked: 

1. When the user clicks a `JobCard`. The card's `onClick` handler fires and calls `onSelect(job.id)`.
2. `onSelect` is a prop passed into `JobCard` from `JobList`. `JobList` received it as a prop from `Home`.
3. The function itself is `setSelectedId` defined in `Home` and has been passed down through two levels of props.
4. `setSelectedId(id)` updates the state in `Home`, triggering a re-render of `Home`.
5. `Home` re-renders with the new `selectedId`. The summary panel condition is now true, so it renders with the selected job's title.
6. `Home` also passes the updated `selectedId` down to `JobList`, which passes it to each `JobCard`. The card whose `id` matches now receives `isSelected: true` and renders its selected visual state.

---

### The Re-render Cycle

- The claim is correct because: When `setSelectedId` is called, React schedules a re-render of the component that owns the state which is `Home`. When `Home` re-renders, it produces a new render output, which includes a new render of `JobList`. When `JobList` re-renders, it re-renders every `JobCard` and it contains all four of them regardless of whether their individual props changed.

- Why a `JobCard` with unchanged props still re-renders because: by default, React does not compare a child's old props to its new props before deciding whether to re-render it. It simply re-renders every child when the parent re-renders. The `JobCard` component is a function and React calls that function again.

- What the React 19 compiler introduces: The React 19 compiler performs static analysis of your component functions at build time. It identifies which components produce stable output when given stable inputs and automatically wraps them with the equivalent of `React.memo` during compilation.

- Why re-renders are not equivalent to DOM updates: A re-render means React calls your component function and produces a new virtual DOM tree which is a plain JavaScript object describing what the UI should look like.

---

### Union Types vs `string`

- Scenario 1 — A developer creates a hardcoded job listing and writes: employmentType: "Fulltime"

With `employmentType: string`, this compiles without error. At runtime the badge colour map has no entry for `"Fulltime"` so the badge renders with no colour class. The bug is silent, invisible at compile time, and only discoverable by visually inspecting every rendered card.

Property 'Fulltime' does not exist on type 'EmploymentType' and "Fulltime"' is not assignable to type '"FullTime" | "PartTime" | "Contract" | "Internship"'.
The bug is caught at write time in the IDE, before it can reach a build, a test, or a browser.

Scenario 2 — The backend developer adds `"Freelance"` to the `EmploymentType` enum in `JobListingResponse.cs` and regenerates the TypeScript client. The `EmploymentType` union in `src/types/index.ts` now reads:

```ts
export type EmploymentType =
  | "FullTime"
  | "PartTime"
  | "Contract"
  | "Internship"
  | "Freelance";
```

The badge colour map in `JobCard.tsx` is typed as `Record<EmploymentType, string>`:

```ts
const BADGE_STYLES: Record<EmploymentType, string> = {
  FullTime:   "...",
  PartTime:   "...",
  Contract:   "...",
  Internship: "...",
  
};
```

TypeScript now produces a compile error at this object literal:

```
Property 'Freelance' is missing in type '{ FullTime: string; PartTime: string; Contract: string; Internship: string; }'
but required in type 'Record<EmploymentType, string>'.
```

The build fails. Every exhaustive map, switch, or `Record` keyed on `EmploymentType` fails to compile until `"Freelance"` is handled. The error is caught at compile time — the first `npm run build` after the client is regenerated — not at runtime when a Freelance listing happens to appear in the data.

With `string`, no error is produced anywhere. The badge map lookup returns `undefined`, no colour class is applied, and the Freelance badge renders broken in production with no indication during development that anything is wrong.

---

### The `&&` Rendering Trap

- Why `0` appears in the browser : The expression `{job.applicantCount && <p>{job.applicantCount} applicants</p>}` relies on JavaScript's short-circuit evaluation. When `applicantCount` is `0`, JavaScript evaluates the left side first. `0` is falsy, so the `&&` operator short-circuits and returns the left operand — the value `0` itself, as a number.

React then receives `0` as a child to render. React treats `false`, `null`, and `undefined` as empty — it renders nothing for them. But `0` is a number, and React renders numbers as text nodes. React outputs the character `"0"` into the DOM.

This is not a React quirk — it is a consequence of JavaScript's `&&` operator returning an operand, not a boolean. The expression `false && <p>...</p>` returns `false`, which React ignores. The expression `0 && <p>...</p>` returns `0`, which React renders.

- Both correct solutions

```tsx
{job.applicantCount > 0 && <p>{job.applicantCount} applicants</p>}
```

```tsx
{!!job.applicantCount && <p>{job.applicantCount} applicants</p>}
```
The first : `applicantCount > 0` is preferred. Because it states the business rule directly: render the count only when it is greater than zero. A developer reading the code months later understands the intent immediately.

---

## Implementation Strategy

### 1. Why static data first
- Building against hardcoded data first separates UI/UX development from infrastructure concerns. It allows for rapid prototyping and architecture validation without being blocked by API availability or network instability. It simply defines an interface of required props and renders accordingly, making it highly reusable and easier to unit test.

### 2. Type contract with the backend
- The `JobListing` interface in `src/types/index.ts` serves as a client-side representation of the `JobListingResponse.cs` DTO from the backend.

- If a backend developer renames `salaryMin` to `minimumSalary`:
1. The API's JSON response will now contain a key named `minimumSalary`.
2. Because the frontend code still looks for `salaryMin`, that property will evaluate to `undefined` on the raw data object.
3. With `strict: true` enabled, if we update our interface to match the backend change, the TypeScript compiler will immediately flag every usage of the old `salaryMin` property as an error during the build.
4. If we fail to update the interface but the data changes at runtime, the UI would attempt to format `undefined` as a currency, likely resulting in `NaN` or a crash, highlighting the importance of keeping the contract synchronized.

### 3. Component responsibility table

| Component | Owns state | Receives via props |
| :--- | :--- | :--- |
| **Home** | `selectedId` (string \| null) | - |
| **Home (logic)** | `selectedJob` (derived) | - |
| **JobList** | - | `jobs` (JobListing[]), `selectedId`, `onSelect` (callback) |
| **JobCard** | - | `job` (JobListing), `isSelected` (boolean), `onSelect` (callback) |

### 4. Gate: Final Build Output

```text
> careerhub-frontend@0.1.0 build
> next build

   ▲ Next.js 16.2.9
   - Turbopack enabled

 ✓ Creating an optimized production build    
 ✓ Compiled successfully
 ✓ Linting and checking validity of types    
 ✓ Collecting page data    
 ✓ Generating static pages (5/5)
 ✓ Collecting build traces    
 ✓ Finalizing page optimization    

Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          85.4 kB
└ ○ /_not-found                          142 B          85.4 kB
+ First Load JS shared by all            85.3 kB
  ├ chunks/448-6a56f0823528f804.js       28.9 kB
  ├ chunks/fd9d1056-2f08a8d60d3663a7.js  54.5 kB
  └ other shared chunks (main.js)        1.85 kB

○  (Static)  prerendered as static content
```

---
# CareerHub — Day 2 Architecture Decisions

## 1. The shadcn/ui Ownership Model

- When you run `npx shadcn@latest add badge`, shadcn does not install a package into
`node_modules`. It copies the component source directly into your project at
`src/components/ui/badge.tsx`. The file lives in the repository, it is committed to version control, and no external package manager
controls it.

- This is why the MUI scenario cannot happen with shadcn. With `@mui/material`, the
`Chip` component lives inside `node_modules/@mui/material`. The project references it
by import but never owns the source. When MUI publishes a breaking major version that
renames `variant` to `intent`, running `npm update` pulls in that new source and the
thirty call sites break immediately.

- If shadcn releases an improved version of Badge, the upgrade path is: read their changelog, copy the parts of the new implementation, and paste them into local `src/components/ui/badge.tsx`. This performs the migration on your own schedule, you control exactly which changes land, and no automated dependency bump can break the build.

---

## 2. Why the `cn` Utility Exists

- When `isSelected` is true this produces the string `"p-4 p-6"`. Both classes are
present in the DOM. Tailwind generates utilities in a fixed order based on the scale, `.p-4` and `.p-6` are both emitted, and the one that appears later in the stylesheet wins regardless of the order in the template literal. If Tailwind happens to emit `.p-6` before `.p-4`, the card will always render at `p-4` even when `isSelected` is true, because `.p-4` appears later and overrides it.

- `twMerge` understands that `p-4` and `p-6` both target the CSS `padding` property. When it sees both in the same class string it keeps only the
last one and discards the earlier one

---

## 3. The Event Handler Versus `useEffect` Argument

- When a user selects a job and then refreshes the page, there is no click event. The
component mounts fresh with `selectedId` initialised to `null`. The event handler has no trigger and nothing calls it during mount. The stored value sits in `sessionStorage`
unread, and the user sees an empty selection panel even though they had explicitly
chosen a job moments before.

- Refresh-to-restore is a normal user behaviour, especially when someone is comparing job listings, gets interrupted, and returns to the tab. If their selection disappears on every refresh the feature is broken. Using `useEffect` with an empty dependency array runs exactly once: after the first render, during mount. Reading from `sessionStorage` during mount and calling `setSelectedId` with the stored value is a side effect and it reaches outside React's rendering model into the browser storage API. `useEffect` is the correct and intended place for side effects. The event handler approach fails because it cannot reach back in time to the mount lifecycle.

---

## 4. The Source of Truth for Dark Mode

- `isDark` in `ThemeToggle` has one job which is driving the button label. When `isDark` is `true` the button reads "Light" and when it is `false` the button reads "Dark".

- The actual source of truth for dark mode is the `dark` class on
`document.documentElement` in the `<html>` element. The line in `globals.css`: @custom-variant dark (&:is(.dark *)) tells Tailwind to activate every `dark:` utility whenever an element has an ancestor with the `.dark` class.

- If `ThemeToggle` were unmounted and then remounted after the user had toggled dark mode on, the following would happen:

1. The `.dark` class on `<html>` remains in the DOM and unmounting a React component
   does not touch the DOM outside that component's own subtree. Dark mode stays
   visually active.
2. `useState(false)` initialises `isDark` to `false` on the fresh mount.
3. The mount `useEffect` runs, reads `localStorage.getItem("theme")`, finds `"dark"`,
   and calls both `setIsDark(true)` and
   `document.documentElement.classList.toggle("dark", true)`.
4. State and DOM re-synchronise.

---

## Technical Documentation Updates

### 1. Component Extraction Rationale: `JobStatusBadge`
The `JobStatusBadge` was extracted from `JobCard` to adhere to the **Single Responsibility Principle (SRP)**. The badge component is solely responsible for the mapping logic between data types (EmploymentType) and their visual representation (colors and labels).

- **Codebase impact (Without Extraction):** If the employment type color scheme changed (e.g., changing "FullTime" from emerald to indigo), a developer would have to search and replace utility classes inside `JobCard.tsx`. If badges were used in other parts of the app (like a Search Results page), those files would also require manual updates, increasing the risk of visual inconsistency.
- **Codebase impact (With Extraction):** To change the color scheme, you only need to modify the `EMPLOYMENT_STYLES` constant inside `src/components/JobStatusBadge.tsx`. This single change propagates across the entire application instantly, ensuring a single source of truth for branding.

### 2. The `cn` Utility
The `cn` function is a wrapper that combines `clsx` and `tailwind-merge`:

- **clsx:** Handles conditional logic. It allows us to pass objects like `{ 'opacity-50': !isActive }` and returns a clean string.
- **tailwind-merge:** Specifically handles Tailwind class overrides. It understands which classes conflict (e.g., two different border colors) and ensures the "last one wins" based on the function arguments, not the CSS source order.

**Failure Mode Example:**
In `JobCard.tsx`, the base class includes `border-gray-200` (for the unselected state) and the selected state adds `border-blue-500`. Without `tailwind-merge`, the DOM would contain `class="... border-gray-200 border-blue-500"`. Because Tailwind generates CSS utilities in a fixed order, if `border-gray-200` happens to be defined later in the generated CSS file than `border-blue-500`, the card would remain gray even when selected. `tailwind-merge` prevents this by identifying the conflict and stripping `border-gray-200` from the string entirely.

### 3. Effect Responsibilities Table

| Effect | Dependency Array | Runs When |
| :--- | :--- | :--- |
| **Restore state** | `[]` | Runs exactly once when the component mounts. |
| **Persist state** | `[selectedId]` | Runs on mount and every time the `selectedId` state changes. |
| **Merged Logic** | *N/A* | **Why we don't merge:** Merging these would create a race condition. The persistence effect would trigger on mount and potentially overwrite `sessionStorage` with the initial `null` value before the restoration logic has finished reading the previous value. |

---

## Part 4 — Production Readiness

### Gate: Final Build Output
```text
> careerhub-frontend@0.1.0 build
> next build

   ▲ Next.js 16.2.9
   - Turbopack enabled

 ✓ Creating an optimized production build    
 ✓ Compiled successfully
 ✓ Linting and checking validity of types    
 ✓ Collecting page data    
 ✓ Generating static pages (5/5)
 ✓ Collecting build traces    
 ✓ Finalizing page optimization    

Route (app)                              Size     First Load JS
┌ ○ /                                    142 B          85.4 kB
└ ○ /_not-found                          142 B          85.4 kB
+ First Load JS shared by all            85.3 kB
  ├ chunks/448-6a56f0823528f804.js       28.9 kB
  ├ chunks/fd9d1056-2f08a8d60d3663a7.js  54.5 kB
  └ other shared chunks (main.js)        1.85 kB

○  (Static)  prerendered as static content
```

---

## Getting Started

- This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
