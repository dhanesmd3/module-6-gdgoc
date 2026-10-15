# Frontend Integration — Module 4

These two files replace their Module 3 counterparts in your frontend
project (the React app, not the `backend/` folder):

- `src/store/useProjectsStore.ts` — now fetches from the real backend API
  (`GET /api/projects`) instead of using hardcoded data, and adds
  `addProject`/`removeProject` that call `POST`/`DELETE` on the API.
- `src/pages/ProjectsPage.tsx` — calls `fetchProjects()` when the page
  loads, and uses real `loading`/`error` state from the store instead of
  the fake `setTimeout` from Module 3. Added an error state UI in case the
  backend isn't running.

## Steps

1. ```bash
   cd backend
   npm install
   npm run dev
   ```
2. Then run the frontend in a separate terminal:
   ```bash
   npm run dev
   ```
3. Open the Projects page — it should now show a brief loading skeleton
   while it fetches from `http://localhost:4000/api/projects`, then
   display the real data coming from the backend.

## Testing the error state

Stop the backend server (Ctrl+C in its terminal) while the frontend is
still running, then refresh the Projects page. You should see the
"Couldn't load projects" error state with a "Try again" button — this is
a real network failure, not a simulated one, which is a good thing to
screenshot for evidence.
