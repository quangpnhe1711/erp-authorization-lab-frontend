# Design system — ACME Workspace

The product is an HR and delivery workspace for a mid-size software company. Its users are
employees, team managers, HR officers and one system administrator. None of them are engineers.

Everything below follows from one rule: **the interface is designed from the user's goal, never
from the database.** Permissions still decide what appears — but the person reading the screen is
never asked to understand how.

---

## 1. What changed, and why it is better UX

| # | Before | Now | Why it helps |
|---|---|---|---|
| 1 | `READ · UPDATE · DELETE`, `EMPLOYEE_LIST`, `SCREEN_ACCESS_DENIED`, `TEAM ∪ RESPONSIBILITY` printed on business screens | All of it moved behind **Developer mode**; business screens say "Xem / Thêm / Sửa / Xoá", "Nhân viên", "Bạn chưa được cấp quyền vào mục này" | A term nobody outside the team can define is not information, it is noise. Removing it shortens the time to the one thing on screen that matters. |
| 2 | Dashboard listed roles, permissions and screen codes | Dashboard opens with **who you are, how big your world is, what is waiting for you** | People arrive with a question ("what do I do today?"). The old dashboard answered a question nobody asked. |
| 3 | "Identity" card with username, employee id, role, action | **Welcome card**: avatar, name, job title, team, date, primary action | Identity is context, not content. Recognising yourself takes a face and a name, not an id. |
| 4 | Navigation card listing `Employee Detail`, `Employee Picker` | Business areas: Tổng quan · Nhân viên · Lương · Dự án · Quản trị · Hoạt động | People navigate by task. `Employee Picker` is a step inside a task, not a destination. |
| 5 | Cards explaining "Multi Role", "Same API", "Field Level" | **Cần bạn xử lý**, **Đồng nghiệp của bạn**, **Dự án**, **Hoạt động gần đây** | Documentation belongs in documentation. A dashboard should be actionable. |
| 6 | Sidebar mirrored the source tree (Employee → Employee List → Employee Detail) | Sidebar grouped by domain, detail screens reached from their list | The menu is a map of the business, not of the routing table. |
| 7 | Every card the same weight | **Hero → KPI row → 8/4 split** (work on the left, awareness on the right) | Without hierarchy the eye has nowhere to land. Now the page has a first, second and third read. |
| 8 | Paragraphs on every card | One title, one metric, one line of context, one link | Reading is the most expensive interaction on a dashboard. |
| 9 | Few clear actions | Every screen has one primary action, in the same place, phrased as a verb | "Thêm nhân viên" tells you what will happen; "Submit" does not. |
| 10 | Almost no icons | One family (Lucide), 1.9 stroke, 15–18px, always paired with a label | Icons speed up scanning; icons alone slow down comprehension. |
| 11 | Dense, form-like | 14px card radius, hairline `#EEF0F3` borders, near-invisible shadow, generous padding | Breathing room signals "read me", density signals "fill me in". |
| 12 | Screen-shaped | KPI cards, task list, directory preview, activity feed, notifications | This is the vocabulary users already know from other SaaS tools they use daily. |
| 13 | Resized | Desktop 12-col → tablet 2-col → mobile single column with a drawer nav and a collapsible rail | Layouts change job at each size; they do not just shrink. |
| 14 | Permission words on screen | Backend still decides; the UI **hides** what you cannot do and **explains** what you cannot reach | Same enforcement, none of the vocabulary. |
| 15 | — | Every string tested against "would a non-programmer understand this?" | If the answer is no, it was rewritten. |

### The one deliberate risk

Rather than deleting the permission story, the app **translates** it. Every list carries a single
quiet sentence:

> Đang hiển thị 6 nhân viên thuộc nhóm Backend Team và các bộ phận bạn phụ trách.

Same information as the old `TEAM ∪ RESPONSIBILITY` badges, in a form a manager can act on. It
answers the question people actually have — "why six and not eight?" — without teaching them a
vocabulary they did not ask for.

---

## 2. Colour

Brand identity is unchanged: red, white, grey. What changed is *where the red is allowed to go*.

| Token | Value | Used for |
|---|---|---|
| `brand-500` | `#CE181E` | Primary button fill, active-nav rail, unread dot, critical badge — **nothing else** |
| `brand-600 / 700` | `#B31418` / `#8F1114` | Hover / active states of the above |
| `brand-50 / 100` | `#FEF2F2` / `#FDE4E5` | Active nav background, soft warning surfaces |
| `ink` | `#14161A` | Headings and primary text |
| `ink-secondary` | `#3D444F` | Body text, table cells |
| `ink-muted` | `#5B6472` | Descriptions, secondary lines |
| `ink-subtle` | `#8A93A1` | Placeholders, metadata, empty values |
| `line` / `line-strong` | `#EEF0F3` / `#DDE1E7` | Dividers / control borders |
| `canvas` | `#F6F7F9` | Application background |
| `surface` | `#FFFFFF` | Cards, tables, menus |
| `positive` / `caution` / `info` | `#0E9F6E` / `#D97706` / `#2563EB` | Status only, always small |

**Rules.** Red is never a heading colour. Red is never body text. One red element per view is the
target; two is the maximum. Status colours only ever appear inside a badge or an icon, never as a
background for a whole region.

## 3. Typography

| Role | Face | Usage |
|---|---|---|
| Display | **Montserrat** 600/700 | Page titles, the wordmark. Carries the brand voice. |
| Interface | **Inter** 400/500/600 | Everything else: body, tables, controls, labels. |
| Diagnostics | **JetBrains Mono** | Developer mode only. |

The face change *is* the signal: crossing into developer mode changes the typeface and the surface
colour, so you can tell at a glance that you are looking at machinery rather than at the product.

Scale: `11 / 12 / 13 / 14 / 15 / 17 / 20 / 24 / 30 / 32`. Body is 14px, tables 14px, metrics 32px.
Numerals are tabular everywhere they line up in a column. Sentence case throughout — the only
uppercase left is the 11px section label in the sidebar, and it is grey.

## 4. Spacing, grid, shape

- 4px base. Card padding 20px, page gutters 16px → 32px, section gap 24px.
- Content max-width 1400px, centred; sidebar 264px, collapsible to a 72px icon rail; topbar 60px.
- Dashboard: full-width hero → 3-column KPI row → `8/4` split.
- Radius: 10px controls, 14px cards, 18px dialogs.
- Shadow: `0 1px 2px rgba(20,22,26,.04)` at rest; `0 8px 24px -12px` on lift; `0 24px 60px -20px`
  for overlays. Never more than one elevation step between neighbours.

## 5. Components

`Button` (primary / secondary / ghost / danger × sm / md / lg, optional leading icon) ·
`IconButton` · `Card` + `CardHeader` · `PageHeader` (breadcrumb, title, description, actions) ·
`Badge` (5 tones) · `Avatar` (deterministic tint per name) · `Input` · `SearchInput` · `Select` ·
`Checkbox` · `Switch` · `Label` · `Table` / `Th` / `Td` · `Tabs` · `Spinner` · `SkeletonRows` /
`SkeletonCard` · `KeyValue` · `Alert` · `EmptyState` · `ErrorState` / `ErrorNotice` · `Modal` ·
`Toast` · `StatCard` · `SectionCard` · `FieldTable` · `ScopeNotice` · `DiagnosticsPanel`.

### States

- **Loading** — skeletons shaped like the content that is coming, never a spinner over a blank page.
- **Empty** — icon, what is missing, and the action that fills it ("Thêm nhân viên đầu tiên").
- **Error** — one sentence for what happened, one for what to do. Every backend code has a
  translation; the code itself appears only in developer mode.
- **Success** — a toast using the same verb as the button that caused it: *Lưu* → *Đã lưu thay đổi*.

## 6. Interaction and motion

Motion is short and functional: 140–220ms, `cubic-bezier(.22,1,.36,1)`.

- Page content fades in (160ms); cards and menus rise 6px as they appear.
- The diagnostics drawer slides from the right (220ms).
- Hover lifts a card's shadow one step; rows tint rather than move.
- Focus is always visible: a 2px brand ring with a white offset.
- `prefers-reduced-motion` disables all of it.

Micro-interactions: the sidebar rail animates its width, the developer-mode switch has a 200ms
thumb travel, the password field has a reveal toggle, and the toast dismisses itself after 4s.

## 7. Responsive

- **≥1280px** — sidebar, 3-up KPIs, 8/4 dashboard split, all table columns.
- **1024–1280px** — sidebar, 2-up KPIs, dashboard stacks to one column.
- **640–1024px** — sidebar collapses to a drawer, topbar keeps search, tables scroll sideways with
  one row per record (they never reflow into paragraphs).
- **<640px** — single column, hamburger drawer, search moves out of the topbar, actions stack.

## 8. Developer mode

Off by default, per browser, toggled from the account menu or `Ctrl/Cmd + Alt + D`. When on:

- a **Developer mode** chip appears in the topbar;
- every guarded screen gets a **Diagnostics** button that opens the request context, the merged
  permission the server computed, the contributing roles and the recent calls;
- the scope sentence appends its raw scopes;
- error panels append the code, HTTP status and request id;
- the activity page gains a **Kiểm tra quyền** tab with the permission-decision log.

Nothing about it is available to end users, and nothing about it changes what the server enforces.
