# AI-Assisted Development Log — Module 3

This documents the real process of building the Projects page: prompting
v0.dev, then using Cursor to integrate the output into the existing
Module 2 codebase (Vite + React + TypeScript + TailwindCSS + Zustand).

---

## 1. v0.dev — Prompt Used

> You are a senior React developer. I have a TypeScript React app using
> Vite, React Router, and TailwindCSS (with dark mode via a `dark` class on
> `<html>`). My existing `Project` type looks like this:
>
> ```ts
> interface Project {
>   id: number;
>   title: string;
>   description: string;
>   techStack: string[];
>   liveUrl?: string;
>   githubUrl: string;
> }
> ```
>
> Create a ProjectsPage component that:
> - Displays a responsive grid of project cards (2-3 columns on desktop, 1 column on mobile)
> - Has a filter bar above the grid that lets the user filter projects by a single tech stack tag
> - Shows a loading skeleton state while data is "loading"
> - Shows an empty state message when no projects match the selected filter
> - Uses only Tailwind utility classes, no separate CSS file
> - Is fully typed with TypeScript, no `any` types
> - Uses semantic HTML and ARIA attributes for the filter buttons and loading region

*(Full prompt + v0.dev response screenshotted separately.)*

**Result:** v0.dev generated the interface correctly (matched the `Project`
shape I gave it exactly), and produced a working, well-typed component on
the first try — no `any` types anywhere. However, it wasn't a drop-in
replacement; it needed real integration work, documented below.

---

## 2. Real Differences Found Between v0.dev Output and My Codebase

| # | What v0.dev generated | What my project actually needed | Why |
|---|---|---|---|
| 1 | Its own local `interface Project { ... }` | Import `Project` from `src/types/project.ts` | Two separate type definitions for the same shape can drift out of sync over time — classic TypeScript smell |
| 2 | `ProjectsPage` receives `projects`, `isLoading`, `skeletonCount` as **props** | `ProjectsPage` is rendered directly by React Router (`<Route path="/projects" element={<ProjectsPage />} />`) with no parent passing props — it needs to fetch its own data from `useProjectsStore` and manage its own loading state | v0.dev assumed a "dumb" presentational component pattern, but in my app `ProjectsPage` **is** the route-level page, so it has to own its data |
| 3 | Wraps everything in `<main>` | Changed to `<section>` | My `App.tsx` already wraps every route in `<main id="main-content">`. Nesting a second `<main>` creates two landmark regions, which is invalid and gets flagged by accessibility tools |
| 4 | Its own `ProjectCard` using raw Tailwind colors (`gray-900`, `blue-600`) with manual `dark:` classes on every element | Kept my existing `ProjectCard.tsx`, which uses semantic color tokens (`bg-surface`, `text-primary`, `text-muted`) that already swap automatically when the `.dark` class is applied | My app already solved dark mode once via CSS variables in `index.css` + `tailwind.config.js`. Re-doing it with manual `dark:` on every element would mean maintaining two color systems |

## 3. Good Ideas From v0.dev That I Kept

Not everything needed changing — a few things from the raw output were
genuinely better than my first draft, so I merged them in:

- **`"All"` string sentinel instead of `null`** for the "no filter selected"
  state. Simpler than null-checking everywhere.
- **"Clear filter" button in the empty state** — lets the user recover
  without hunting for the filter bar again.
- **`sr-only` descriptive text on links** (e.g. "Live Demo *for Portfolio
  Website (opens in a new tab)*") — makes screen reader announcements much
  clearer than a bare "Live Demo" link.
- **`aria-busy="true"` on the loading container**, in addition to
  `aria-live="polite"` — a detail I'd missed.
- **Highlighting the active tech tag** on each card when it matches the
  selected filter — small UX touch that makes the filter feel more
  connected to the grid.

---

## 4. Cursor Prompts Used to Integrate

1. *"This component defines its own Project interface. Replace it with an
   import from `src/types/project.ts` instead."*
2. *"This component expects `projects` and `isLoading` as props, but it's
   rendered directly by a route with no parent passing props. Rewrite it to
   read `projects` from `useProjectsStore` (at
   `src/store/useProjectsStore.ts`) and manage its own `loading` state
   with `useState` + a `setTimeout` in `useEffect` to simulate a fetch."*
3. *"Change the outer `<main>` to `<section>` since `App.tsx` already
   renders a `<main id='main-content'>` around every page."*
4. *"There's already a `ProjectCard` component in
   `src/components/ProjectCard.tsx` using color tokens like `bg-surface`
   and `text-primary`. Don't use the raw gray/blue classes from this new
   component, keep using the existing token classes for consistency, but
   add the sr-only accessible link text and active-tag highlighting from
   this new version into the existing component."*
5. *"Add the 'Clear filter' button from the empty state into my version,
   styled with the same border/text-muted tokens as the rest of the app."*

---

## Bonus 1 — Multi-turn Prompting Log

The 5 prompts above are the actual log. What made later prompts more
effective:

- **Prompt 2 was the most important one.** My first instinct was to just
  copy the props-based signature as-is, but that doesn't match how the rest
  of my app is wired (Zustand store, not prop drilling). Naming the *exact*
  file path (`src/store/useProjectsStore.ts`) instead of saying "use my
  existing state" avoided Cursor guessing or inventing a new state
  mechanism.
- **Being explicit about what to keep vs. discard** (prompt 4) got a much
  better result than just saying "merge these two components," which the
  first time produced a version that mixed both color systems together
  inconsistently.

## Bonus 2 — AI Code Review

I asked Cursor to review `src/components/ProjectCard.tsx` (written by me in
Module 2, before this module's changes) against the Module 3 checklist.

| Feedback | Accepted? | Reasoning |
|---|---|---|
| "External links should use `rel="noopener noreferrer"`, not just `noopener`" | Accepted | Free security improvement, no downside |
| "The `techStack.map` key uses the tag string itself — fine now, but could collide if two tags are ever named the same within one project" | Accepted (noted) | Left as-is since tags are unique per project today, but flagged as a thing to revisit if that assumption changes |
| "Consider `React.memo` since this component has no internal state" | Rejected | With only 2 project cards on the page right now, this is premature optimization that adds overhead without a measurable benefit |

## Bonus 3 — Accessibility Audit (axe DevTools)

Ran axe DevTools on `/projects`. It reported **1 issue** (Serious severity):

**Issue: Insufficient color contrast on the active filter button (dark mode)**

The "All" filter button, when active, showed white text on a
`background-color: #6C8CFF` fill, giving a contrast ratio of **3.07:1** —
below the WCAG AA minimum of 4.5:1 for normal text.

**Root cause:** `--color-primary` is intentionally *light* in dark mode
(`#6C8CFF`), because it's mainly used as link/accent text color sitting on
top of the dark page background, where a light blue reads clearly. But that
same light value doesn't work as a solid button *fill* with white text on
top — light-on-light fails contrast even though it's fine as light-on-dark.

**Fix:** Added a second color token, `--color-primary-strong` (`#3452E1`),
kept dark in both light and dark mode, used specifically for solid-fill UI
elements with white text on top (the active filter button, and the skip
link's focus state, which had the same underlying issue). `--color-primary`
itself was left unchanged since it still works correctly everywhere else
(links, nav underline, focus rings).

This was a good example of why a single "primary" color token isn't always
enough — the same brand color can need different values depending on
whether it's being used as text-on-background or as a solid fill behind
text.

