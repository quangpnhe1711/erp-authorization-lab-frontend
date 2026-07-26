# ERP Authorization Lab — Frontend

React UI for the **TKCB permission model** reference app:
`User → Role → Module/Submodule/Screen → API use-case → Action → Record scope → Field group`.

The interface never decides what you may see. Every list, column, button and menu entry is a
rendering of what the backend returned — so the same screen looks different for every demo account,
and the UI can explain *why*.

- Backend + database + docker compose: [erp-authorization-lab](https://github.com/quangpnhe1711/erp-authorization-lab)
- Design language: modelled on [luvina.net](https://luvina.net) — Montserrat display type, all-caps
  eyebrows, hairline borders, square corners, one strong red (`#CE181E`).

---

## Run

```bash
npm install
npm run dev            # http://localhost:5173, proxies /api → http://localhost:8080
```

Start the backend first (from the backend repo):

```bash
docker compose up -d postgres backend
```

Point the dev proxy somewhere else with `BACKEND_ORIGIN=http://host:port npm run dev`.

### Demo accounts

Password `Password@123` for all of them; the login screen lists them and fills the form on click.

| Username | Roles | EMPLOYEE_LIST shows |
|---|---|---|
| `employee@example.com` | EMPLOYEE | TEAM — 3 rows, public + organization fields |
| `manager@example.com` | TEAM_MANAGER + EMPLOYEE | TEAM + contact fields, may edit organization on detail |
| `hr@example.com` | HR_OFFICER | RESPONSIBILITY — the Development department |
| `admin@example.com` | HR_ADMIN + SYSTEM_ADMIN | ALL — 8 rows including salary, plus the config screens |
| `multi-role@example.com` | TEAM_MANAGER + HR_OFFICER | **TEAM ∪ RESPONSIBILITY** — 6 rows |

---

## How authorization reaches the UI

Three server calls carry the whole model into the browser:

| Call | Purpose |
|---|---|
| `GET /api/me/navigation` | The module → submodule → screen tree this user may open. The sidebar is this response; it is never derived from role names. |
| `GET /api/me/screen-permission` | Effective permission on one screen: access, actions, record scopes, readable/creatable/updatable field groups and fields. |
| every business call | Sends `X-Module-Key`, `X-Submodule-Key`, `X-Screen-Code` so the backend re-resolves the claim and answers for *that* screen. |

Three rules follow, and the code sticks to them:

1. **`ScreenGuard` gates a route** ([src/shared/permissions/ScreenGuard.tsx](src/shared/permissions/ScreenGuard.tsx)).
   It fetches the screen permission before rendering and blocks with `SCREEN_ACCESS_DENIED` when
   the answer says no — including when the URL is typed by hand. The check is advisory: the API
   rejects the call anyway.
2. **Columns come from the response, not from the code**
   ([src/shared/ui/FieldTable.tsx](src/shared/ui/FieldTable.tsx)). A field the caller may not read is
   absent from `fields`, so it is absent from the table. Nothing is greyed out, because nothing was
   sent.
3. **Forms render only writable fields**
   ([src/features/employees/EmployeeFieldForm.tsx](src/features/employees/EmployeeFieldForm.tsx)),
   taken from `updatableFields` / `creatableFields`, and submit only what changed.

### Permission debug drawer

Every guarded screen carries one (bottom-right). It shows the headers actually sent, the merged
permission the server computed, which roles contributed it, and the last API calls made from this
screen with their `readableFields`, row counts and error codes. When a call fails, the toggle turns
red and names the error code.

---

## Screens

| Module | Screen | Route |
|---|---|---|
| Dashboard | `DASHBOARD` | `/dashboard` |
| HRM · Employee | `MY_PROFILE`, `EMPLOYEE_LIST`, `EMPLOYEE_DETAIL`, `EMPLOYEE_CREATE`, `EMPLOYEE_EDIT` | `/hrm/…` |
| HRM · Salary | `SALARY_LIST` | `/hrm/salaries` |
| Project | `PROJECT_LIST`, `PROJECT_DETAIL` | `/projects`, `/projects/:id` |
| Project · Member | `MEMBER_LIST`, `EMPLOYEE_PICKER` | `/projects/:id/members`, `…/add` |
| Administration | user / role / module / submodule / screen / field-group catalogues, screen-permission, record-scope and field-group-permission editors, user-role and responsibility assignment | `/admin/…` |
| Audit | `AUDIT_LOG_LIST`, `PERMISSION_DECISION_TRACE` | `/audit/…` |

**The demo worth showing:** `GET /api/employees` is called from three screens.

| Screen (as `manager@example.com`) | Scope | Rows | Contact fields |
|---|---|---|---|
| `EMPLOYEE_LIST` | TEAM | 3 | yes |
| `MEMBER_LIST` | RESPONSIBILITY | 3 members of Project Alpha | no |
| `EMPLOYEE_PICKER` | DEPARTMENT | 6 | no |

Same endpoint, same user, same session — three answers, decided entirely by the screen context.

The three configuration editors write back through `PUT /api/admin/role-permissions/{roleId}`, so a
change made in the Administration UI takes effect on the very next request. The e2e suite proves it:
it grants `HR_OFFICER` access to `SALARY_LIST`, logs in as the HR officer to confirm the screen
opens, then reverts.

---

## Structure

```
src/
├── app/          providers (React Query, router, auth) + route table
├── layouts/      application shell — server-driven sidebar, topbar
├── shared/
│   ├── api/      axios client (screen-context headers, token refresh, typed errors) + endpoints
│   ├── auth/     session bootstrap, login/logout
│   ├── permissions/  screen registry, ScreenGuard, ActionGate, debug drawer
│   └── ui/       design-system primitives + the permission-aware FieldTable
└── features/     auth · dashboard · employees · salary · projects · administration · audit
```

Notable choices:

- **Same-origin API.** `VITE_API_BASE_URL` defaults to empty, so the app calls `/api/*`; Vite proxies
  it in development and nginx proxies it in the container. No CORS preflight, no build-time host.
- **Single-flight token refresh.** A burst of 401s triggers one `/api/auth/refresh`, not N — refresh
  tokens rotate on use, so parallel refreshes would invalidate each other.
- **403 is an answer, not a hiccup.** React Query does not retry 4xx; retrying a permission denial
  only spams the decision log.

---

## Tests

```bash
npm run typecheck
npm test               # Vitest — 26 unit tests
npm run e2e            # Playwright — 21 tests against a running backend
```

Unit tests cover the rules that must not regress: a withheld field never becomes a column, a
non-updatable field never becomes an input, `ScreenGuard` blocks and `ActionGate` hides.

The e2e suite drives the real stack — no mocks — and mirrors the demo scenarios: record scope row
counts per role, the multi-role union, field-group column sets, `SCREEN_ACCESS_DENIED` on a typed
URL, a successful contact-field update, `FIELD_PERMISSION_DENIED` on a field the UI refuses to even
render, the audit trail, the decision trace, and the live config change described above.

```bash
npx playwright install chromium   # first run only
```

Playwright starts the dev server itself; set `E2E_NO_SERVER=1` to reuse one you already have.

---

## Docker

```bash
docker build -t eal-frontend .
docker run -p 8081:80 eal-frontend      # expects a backend reachable as http://backend:8080
```

Or, from the backend repo with this repository cloned into `./frontend`:

```bash
docker compose up --build
```
