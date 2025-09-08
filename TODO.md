# Plantainbananas Frontend MVP — Work Plan

Spec: mvp-1.0.0 (machine-first)
Env: NEXT_PUBLIC_GEMINI_TIMEOUT=180000

## Phase 1 — Architecture & Scaffolding
- App shell: mobile-first layout, desktop twin sidebars
- Componentization: CanvasPane, Toolbars, RightSidebar panels, Common UI
- State slices: session, project, ai (shape compatible with blueprint)
- Task gate: global exclusive queue with timeout + AbortSignal
- Design tokens: set up tokens file stub and font links

### Tasks
- [ ] Integrate `AppShell` into the main page
  - [ ] Replace the ad-hoc app bar/sidebars in `src/app/page.tsx` with `src/app/components/AppShell.tsx`
  - [ ] Provide `left` and `right` slots from the page (tool buttons left, panels right)
- [ ] Use shared components to de-duplicate UI
  - [ ] Replace the inline “Generated” and “Original” panels in `page.tsx` with `CanvasPane`
  - [ ] Replace the inline adjustments UI with `RightSidebar/AdjustmentsPanel`
  - [ ] Extract shared helpers (e.g., `dataURLtoFile`) into `src/app/lib/image.ts` and reuse in `page.tsx` and `useAiActions.ts`
- [ ] Wire TaskGate state to UI affordances
  - [ ] Show busy overlay using `CanvasPane`’s `busy` prop during AI actions
  - [ ] Disable action buttons while `TaskGate.busy` is true
  - [ ] Add a small “Cancel queued” control that calls `cancelAll()`
- [ ] Establish initial state slice types and providers
  - [ ] Create `src/app/types/state.ts` with `SessionState`, `ProjectState`, `AiState` interfaces
  - [ ] Add lightweight Context-based store scaffolds in `src/app/stores/*` (no new deps)
- [ ] Design tokens and theme
  - [ ] Create `src/app/tokens.json` (colors, spacing, radii, z-index, shadows)
  - [ ] Map tokens to the MUI theme in `src/app/providers.tsx` (keep dark theme)
  - [ ] Confirm Inter via `next/font` and ensure system fallbacks + `display=swap`

### Definition of Done
- [ ] `page.tsx` renders through `AppShell` and uses `CanvasPane` and `AdjustmentsPanel`
- [ ] `TaskGate` busy state visibly affects controls and canvas
- [ ] Types for `SessionState`, `ProjectState`, `AiState` exist and are imported where needed
- [ ] `tokens.json` exists and at least primary palette + spacing are consumed by `providers.tsx`

---

## Phase 2 — AI Under-the-Hood (no prompts)
- Hook `useAiActions`: autoSmile, inpaint(auto), upscale(auto)
- Replace prompt UI with action buttons and background cues
- Skeleton/patient loading: shimmer + staged content placeholders
- Timeout UX: friendly messages and retry affordances

### Tasks
- [ ] Expand `useAiActions`
  - [ ] Generalize a private helper `callImageTask({ file, prompt?, path })`
  - [ ] Implement `autoSmile(file)` (existing) on `/api/generate` or `/api/ai/generate`
  - [ ] Implement `inpaintAuto(file)` on `/api/ai/inpaint` (placeholder endpoint)
  - [ ] Implement `upscaleAuto(file)` on `/api/ai/upscale` (placeholder endpoint)
  - [ ] Add model selection + fallback (primary, then fallback) within the hook
- [ ] Replace freeform prompt UI with action buttons
  - [ ] In `page.tsx`, swap the text area for three buttons: Auto Smile, Inpaint (Auto), Upscale (Auto)
  - [ ] Buttons call `useAiActions` functions via `TaskGate.runExclusive`
  - [ ] Add subtle background cues (e.g., `Skeleton` and dim overlay) while busy
- [ ] Loading and staged content
  - [ ] Use MUI `Skeleton` for canvas containers and sidebar panels while loading
  - [ ] Maintain last image placeholder until new content arrives (avoid hard flicker)
- [ ] Timeout and retry UX
  - [ ] Standardize timeout error copy and show a “Retry last action” button
  - [ ] Implement a simple last-action cache in component state to support retry

### Definition of Done
- [ ] `useAiActions` exposes `autoSmile`, `inpaintAuto`, `upscaleAuto` with consistent return shape
- [ ] The main UI has no prompt textbox; only action buttons
- [ ] Busy state uses skeletons instead of only spinners
- [ ] Timeout/abort errors offer a one-click retry

---

## Phase 3 — Stores & Persistence
- Session store (local) with login/logout bindings
- Project store (local + sync) with load/save bindings
- AI jobs store (in-memory) tracking queued/running/history

### Tasks
- [ ] Session store
  - [ ] `SessionState`: `{ userId?: string; displayName?: string; role: 'guest'|'editor'|'admin' }`
  - [ ] Actions: `login(mock)`, `logout()`, `setRole(role)`
  - [ ] Persistence: `localStorage['pb.session']`
- [ ] Project store (expanded)
  - [ ] Types
    - [ ] `Layer`: `{ id: string; name: string; visible: boolean }`
    - [ ] `ProjectState`: `{ id: string; version: 1; name: string; canvas: { w: number; h: number; dpi: number }; layers: Layer[]; updatedAt: number; dirty: boolean }`
    - [ ] ID generation via `crypto.randomUUID()`; clamp names to 1–60 chars
  - [ ] Actions
    - [ ] `newProject({ name, w, h, dpi })` → creates base layer `{ id:'base', name:'Background', visible:true }`, sets `dirty=true`
    - [ ] `load(id)` → loads from storage, sets `dirty=false`
    - [ ] `save()` → writes to storage, updates `updatedAt`, sets `dirty=false`, updates recents
    - [ ] `renameLayer(id, name)` → trims/clamps; enforces unique layer names per project
    - [ ] `addLayer(name?)` → appends layer with unique default name; visible by default
    - [ ] `deleteLayer(id)` → prevents deleting sole base layer
    - [ ] (Optional) `reorderLayer(id, toIndex)` → bounds-check move
  - [ ] Persistence
    - [ ] Keys: `localStorage['pb.project.<id>']`, `localStorage['pb.recentProjects']`
    - [ ] `recentProjects`: `Array<{ id: string; name: string; updatedAt: number }>`; keep last 10
    - [ ] (Note) Image pixel data is not persisted in Phase 3; UI shows placeholders when missing
  - [ ] Selectors/helpers
    - [ ] `selectProjectMeta(state)`; `selectLayerById(state, id)`; `isDirty(state)`
    - [ ] Utility: `ensureUniqueLayerName(baseName)`
  - [ ] UX bindings
    - [ ] Add top-bar actions: New, Save, Open (from recents)
    - [ ] Show dirty indicator in the title (e.g., `*`)
    - [ ] Autosave after 2s debounce of changes; manual Save always available
- [ ] AI jobs store
  - [ ] `AiJob`: `{ id: string; type: 'smile'|'inpaint'|'upscale'; status: 'queued'|'running'|'done'|'error'; startedAt?: number; endedAt?: number; error?: string }`
  - [ ] Hook `TaskGate.runExclusive` to push jobs and update status transitions
  - [ ] History capped at 20; expose `lastError` and `runningCount`

### Definition of Done
- [ ] Stores exist with typed shapes and are consumed by the page
- [ ] Session persists across reload; role is reflected in UI
- [ ] Project save/load round-trips with localStorage (metadata), recents list updates
- [ ] AI jobs list updates as actions run; capped history maintained

---

## Phase 4 — Flows & Validation
- New project flow (name, canvas, dpi) with rules
- Export settings flow with validation (png/jpeg/webp, dpi>0)
- Layer management basics (add/rename/delete) with rules

### Tasks
- [ ] New Project dialog
  - [ ] Modal with fields: Name (1–60 chars), Width/Height (>0), DPI (>0)
  - [ ] Inline validation with helper validators (no new deps)
  - [ ] On submit, initialize `ProjectState` and clear images/UI filters
  - [ ] Pre-fill last used canvas settings; default to 1024×1024 @ 96 DPI
- [ ] Open/Save flows
  - [ ] Open: list from `recentProjects` with search; open clears unsaved changes prompt if `dirty`
  - [ ] Save As: duplicates current project with new `id` and `name`
- [ ] Export settings
  - [ ] Select: `png | jpeg | webp`; `quality` for jpeg/webp
  - [ ] Validate: `dpi > 0`; type-specific options
  - [ ] Use settings in `handleDownload` (render-to-canvas path when filters active)
  - [ ] Filename: `${project.name}-${timestamp}.${ext}`
- [ ] Layer basics
  - [ ] Data model: `{ id, name, visible }`; enforce unique `name` per project
  - [ ] UI: list with add/delete, click-to-rename, visibility toggle
  - [ ] Rules: cannot delete sole base layer; clamp name length; prevent dupes
  - [ ] (Optional) Reorder via drag handle or up/down buttons

### Definition of Done
- [ ] New Project validates and creates state; errors are readable and accessible
- [ ] Export validates and produces correctly typed downloads
- [ ] Layer list supports add/rename/delete with rules enforced

---

## Phase 5 — Auth Model
- Role gates: guest/editor/admin for UI actions
- Rate limit hints on AI actions (client-side messaging)

### Tasks
- [ ] Roles and gating
  - [ ] Add role to `SessionState` and a `hasRole(required)` helper
  - [ ] Gate AI action buttons to `editor+`; guests see a friendly login hint
- [ ] Client rate-limit hints
  - [ ] Track attempts per minute (client-side counter only)
  - [ ] If threshold exceeded, disable buttons briefly and show hint (no server calls)

### Definition of Done
- [ ] Guests cannot invoke AI; editors/admins can
- [ ] Exceeding attempt threshold shows a non-blocking message and temporary disable

---

## Phase 6 — Targets & Contracts
- Stubs for OpenAPI and GraphQL contracts (paths only)
- Route placeholders for /api/auth/* and /api/ai/* and /api/projects/*

### Tasks
- [ ] Contracts (stubs only)
  - [ ] `contracts/openapi.yaml`
    - [ ] Paths: `/api/auth/login`, `/api/auth/logout`, `/api/ai/generate`, `/api/ai/inpaint`, `/api/ai/upscale`
    - [ ] Project paths: `/api/projects` (GET list, POST create), `/api/projects/{id}` (GET, PUT replace, DELETE)
    - [ ] Schemas: `Project`, `Layer`, `ProjectMeta`, `ErrorEnvelope { ok:boolean; error?:string }`
  - [ ] `contracts/schema.graphql` with basic `type Query`/`type Mutation` placeholders
    - [ ] Query: `projects, project(id: ID!)`
    - [ ] Mutation: `createProject, updateProject, deleteProject`
- [ ] Routes (Next.js handlers)
  - [ ] `src/app/api/auth/login/route.ts` → 501 JSON stub
  - [ ] `src/app/api/auth/logout/route.ts` → 501 JSON stub
  - [ ] `src/app/api/ai/generate/route.ts` → alias or delegate to existing `src/app/api/generate/route.ts`
  - [ ] `src/app/api/ai/inpaint/route.ts` → 501 JSON stub
  - [ ] `src/app/api/ai/upscale/route.ts` → 501 JSON stub
  - [ ] `src/app/api/projects/route.ts` → GET list, POST create (both 200 with stub data)
  - [ ] `src/app/api/projects/[id]/route.ts` → GET one, PUT, DELETE (return stub with `{ ok: true }`)
- [ ] Error envelope
  - [ ] Standardize `{ ok: boolean; error?: string }` for stubs and non-200 paths

### Definition of Done
- [ ] Contracts checked into `contracts/` dir and referenced in README
- [ ] API routes exist and return sane stubbed responses
- [ ] `useAiActions` points to `/api/ai/*` paths (generate/inpaint/upscale)

---

## Phase 7 — Responsive Polish
- Touch targets and gesture affordances for mobile
- Resize-aware canvas and panels
- Keyboard shortcuts (progressive enhancement)

### Tasks
- [ ] Mobile-first
  - [ ] Ensure hit targets ≥44px; sufficient spacing in sidebars
  - [ ] Hide sidebars on `xs`; add toggles to open panels
- [ ] Resize-aware canvas
  - [ ] Observe container size; tune `NextImage` `sizes` for better responsivity
  - [ ] Verify no layout shift while loading
- [ ] Gestures and shortcuts
  - [ ] Pan (drag), pinch-to-zoom (where feasible)
  - [ ] Keyboard: `U` upload, `G` generate last action, `R` reset filters, `Esc` cancel queued tasks
- [ ] A11y
  - [ ] ARIA labels, focus outlines, high-contrast states for key controls

### Definition of Done
- [ ] Comfortable on mobile and desktop; no clipped controls
- [ ] Canvas resizes smoothly without distortion
- [ ] Basic gestures/shortcuts work and are discoverable in a help tooltip

---

## Deliverables map (to provided schema)
- application/framework/languages: Next + TS + CSS
- contracts: create placeholders in /api
- blueprints: create stubs for ui/flows json
- stateModel: client stores matching shapes; local persistence
- validationRules: enforce via lightweight validator
- authModel: role-based UI affordances
- assets: tokens.json, fonts, icons, animations stubs
- x-ai-models: primary + fallback selectors in ai hook

### Tasks
- [ ] application/framework/languages: Document versions (Next 15, React 19, MUI 6) in README
- [ ] contracts: Add `contracts/openapi.yaml` and `contracts/schema.graphql` stubs (include `/api/projects` paths)
- [ ] blueprints: Add `blueprints/` folder with `ui.json`, `flows.json` placeholders
- [ ] stateModel: Stores created under `src/app/stores/` and types under `src/app/types/`
- [ ] validationRules: `src/app/lib/validate.ts` helpers used by forms
- [ ] authModel: `hasRole`/`can` helpers and gated buttons in UI
- [ ] assets: `src/app/tokens.json`, confirm `Inter` font, add icons/animation placeholders
- [ ] x-ai-models: `useAiActions` supports primary + fallback model selection

---

## Task Tracker
- [ ] Phase 1 — Architecture & Scaffolding
- [ ] Phase 2 — AI Under-the-Hood (no prompts)
- [ ] Phase 3 — Stores & Persistence
- [ ] Phase 4 — Flows & Validation
- [ ] Phase 5 — Auth Model
- [ ] Phase 6 — Targets & Contracts
- [ ] Phase 7 — Responsive Polish

### Quick Wins (suggested first passes)
- [ ] Replace `page.tsx` panels with `CanvasPane` and wire `busy` from `TaskGate`
- [ ] Extract `dataURLtoFile` to `src/app/lib/image.ts` and reuse
- [ ] Add `src/app/tokens.json` and consume primary color/spacing in `providers.tsx`
- [ ] Add `/api/ai/generate` alias route delegating to existing `/api/generate` to stabilize paths
- [ ] Add `/api/projects` and `/api/projects/[id]` stub handlers returning example payloads