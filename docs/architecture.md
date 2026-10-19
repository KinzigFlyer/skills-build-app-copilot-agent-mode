# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep the React app as a thin UI layer that has no business logic of its own. Each view should use the shared API client to fetch data, render loading, empty, success, and error states, and provide accessible output with semantic headings, status text, and alert messaging.
- Logic tier decision: Treat the Express service layer as the canonical place for API validation and aggregation. Routes should translate HTTP requests into service calls while services own the validation rules, ID checks, sorting, and user/team matching logic so the API returns meaningful 4xx errors instead of raw cast exceptions.
- Data tier decision: Treat the Mongoose schema as the contract of the data layer. Required fields, defaults, and relationships should be defined in the models, with seed scripts using upserts to preserve stable demo records and move a previously assigned demo user to the correct team without deleting unrelated data.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and `minutes`, validate that the referenced `User` and `Team` documents exist, reject malformed IDs or missing references with a deliberate 4xx, and persist the record with computed `points` and `occurredAt` values derived from the input and activity type.
- Team management approach: Require a non-empty `name`, allow `mascot` and `members`, normalize team membership to ObjectId arrays, and keep the membership relationship consistent by linking each member back to the team record without creating duplicate collection entries.
- Leaderboard approach: Compute totals from the `Activity` collection grouped by `team`, aggregate the sum of each team's points, sort descending, and assign a 1-based rank. The leaderboard should represent authoritative data derived from activity rather than storing redundant totals on the team document.
- Workout suggestions approach: Resolve the target user by email from the seeded `User` collection, compare the user’s goal or recent activity pattern with the available workout catalog, and return the most relevant recommendation first with a human-readable `reason` explaining the match. If no user exists for the given email, return a deliberate 4xx such as 404.
- Delivery order: Complete the data contracts first, then the backend service behaviors, then the UI rendering. This keeps the implementation test-driven and reduces rework by ensuring each layer depends only on the contracts established beneath it.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
