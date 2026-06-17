# CareerHub Frontend

## Part 1 — Written Decisions

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
