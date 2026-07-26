# ACME Workspace — Frontend

The user-facing half of the **ERP Authorization Lab**: an HR and delivery workspace where what you
see is decided entirely by the backend's permission model
(`User → Role → Module/Submodule/Screen → API use-case → Action → Record scope → Field group`).

The product never shows that model to the people using it. A manager sees *"Đang hiển thị 6 nhân
viên thuộc nhóm Backend Team và các bộ phận bạn phụ trách"*, not `TEAM ∪ RESPONSIBILITY`. Every
code, screen id and permission flag lives behind an opt-in **Developer mode**.

- Backend, database and docker compose: [erp-authorization-lab](https://github.com/quangpnhe1711/erp-authorization-lab)
- Design system, and the reasoning behind every UI decision: [docs/DESIGN.md](docs/DESIGN.md)

---

## Run

```bash
npm install
npm run dev            # http://localhost:5173, proxies /api → http://localhost:8080
```

Start the backend first (from the backend repo):

```bash
POSTGRES_PORT=55432 docker compose up -d postgres backend
```

Point the dev proxy elsewhere with `BACKEND_ORIGIN=http://host:port npm run dev`.

### Demo accounts

Password `Password@123`. The sign-in screen lists them as job descriptions and fills the form on
click.

| Sign in as | Job | Sees |
|---|---|---|
| `employee@example.com` | Nhân viên | Own profile, 3 colleagues in their team |
| `manager@example.com` | Quản lý nhóm | Their team plus the project they run |
| `hr@example.com` | Nhân sự | Everyone in the Development department |
| `admin@example.com` | Quản trị hệ thống | All 8 people, payroll, and the configuration areas |
| `multi-role@example.com` | Kiêm nhiệm | Own team **plus** the team they look after — 6 people |

---

## How authorization reaches the interface

Three calls carry the whole model into the browser; nothing is inferred from role names.

| Call | Purpose |
|---|---|
| `GET /api/me/navigation` | Which areas this person may open. The sidebar renders a **business taxonomy** filtered by this answer — an item the server did not return is never drawn. |
| `GET /api/me/screen-permission` | Effective permission on one area: actions, record scope, readable / writable field groups. |
| every business call | Sends `X-Module-Key`, `X-Submodule-Key`, `X-Screen-Code`, so the backend answers for *that* area. |

Four rules the code holds to:

1. **`ScreenGuard` gates a route** ([src/shared/permissions/ScreenGuard.tsx](src/shared/permissions/ScreenGuard.tsx))
   and, when access is refused, explains it in a sentence — no code, no stack, a next step.
2. **Columns come from the response, not the code**
   ([src/shared/ui/FieldTable.tsx](src/shared/ui/FieldTable.tsx)). A field the caller may not read
   never arrives, so it can never be drawn. Coded values (`ACTIVE`, `FULLTIME`) are rendered as
   words.
3. **Forms render only writable fields**
   ([src/features/employees/EmployeeFieldForm.tsx](src/features/employees/EmployeeFieldForm.tsx))
   and submit only what changed.
4. **`ActionGate` hides an action nobody in this role can perform** — a permanently disabled button
   is a dead end, not an explanation.

### Developer mode

Toggle it in the account menu or with `Ctrl/Cmd + Alt + D`. It adds a diagnostics drawer (request
headers, merged permission, contributing roles, recent calls), raw scope codes on the scope
sentence, error codes on failures, and a permission-decision tab on the activity page. It changes
nothing the server enforces.

---

## Areas

| Section | Screens |
|---|---|
| Công việc | Tổng quan (dashboard), Hồ sơ của tôi |
| Con người | Nhân viên (list · detail · edit · create), Lương |
| Dự án | Dự án, chi tiết, thành viên, thêm thành viên |
| Quản trị | Người dùng, Phân vai trò, Quyền theo vai trò (3 tabs), Phân công phụ trách, Danh mục hệ thống (4 tabs) |
| Nhật ký | Hoạt động (+ Kiểm tra quyền in developer mode) |

**The demo worth showing:** `GET /api/employees` is called from three areas.

| Area (as `manager@example.com`) | Rows | Contact details |
|---|---|---|
| Nhân viên | 3 (their team) | yes |
| Thành viên dự án | 3 (the project they run) | no |
| Thêm thành viên | 6 (their department) | no |

Same endpoint, same session — three answers, decided by the area you are working in.

The three permission editors write through `PUT /api/admin/role-permissions/{roleId}` and take
effect on the next request. The e2e suite proves it: it opens Bảng lương for HR Officer, signs in as
that person to confirm, then puts it back.

---

## Structure

```
src/
├── app/          providers (React Query, router, auth, developer mode) + route table
├── layouts/      shell — collapsible sidebar, topbar, search, notifications, account menu
├── shared/
│   ├── api/      axios client (screen-context headers, single-flight refresh, typed errors)
│   ├── auth/     session bootstrap, sign in / out
│   ├── devmode/  developer-mode switch + diagnostics drawer
│   ├── navigation/ the business taxonomy and its labels
│   ├── permissions/ screen registry, ScreenGuard, ActionGate, the plain-language scope sentence
│   └── ui/       design-system primitives, feedback layer, permission-aware FieldTable
└── features/     auth · dashboard · employees · salary · projects · administration · activity
```

Notable choices:

- **Same-origin API.** `VITE_API_BASE_URL` defaults to empty, so the app calls `/api/*`; Vite proxies
  it in development, nginx in the container. No CORS, no build-time host.
- **Single-flight token refresh.** A burst of 401s triggers one `/api/auth/refresh`; refresh tokens
  rotate on use, so parallel refreshes would invalidate each other.
- **403 is an answer, not a hiccup.** React Query does not retry 4xx — retrying a refusal only fills
  the decision log.

---

## Tests

```bash
npm run typecheck
npm test               # Vitest — 43 unit tests
npm run e2e            # Playwright — 25 tests against a running backend
```

Unit tests cover the rules that must not regress: a withheld field never becomes a column, a
non-updatable field never becomes an input, the scope sentence never prints a scope code, an
unmapped audit action never leaks its constant, and the sidebar never offers an area the server
did not grant.

The e2e suite drives the real stack and asserts the product, not the plumbing: row counts per role,
the union for someone with two jobs, coded values rendered as words, a refusal explained in plain
language, a contact update round-tripping, `FIELD_PERMISSION_DENIED` returned for a field the UI
refuses to render, the activity feed reading as sentences, a live permission change applied and
reverted, and diagnostics staying hidden until developer mode is switched on.

```bash
npx playwright install chromium   # first run only
```

Playwright starts the dev server itself; set `E2E_NO_SERVER=1` to reuse a running one.

---

## Docker

```bash
docker build -t eal-frontend .
docker run -p 8081:80 eal-frontend      # expects a backend reachable as http://backend:8080
```

Or, from the backend repo with this repository cloned into `./frontend`:

```bash
POSTGRES_PORT=55432 docker compose up --build
```
