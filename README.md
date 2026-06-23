# CareerHub Frontend


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
