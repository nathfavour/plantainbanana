# Plantainbananas Frontend MVP — Work Plan

Spec: mvp-1.0.0 (machine-first)
Env: NEXT_PUBLIC_GEMINI_TIMEOUT=180000

## Phase 1 — Architecture & Scaffolding
- App shell: mobile-first layout, desktop twin sidebars
- Componentization: CanvasPane, Toolbars, RightSidebar panels, Common UI
- State slices: session, project, ai (shape compatible with blueprint)
- Task gate: global exclusive queue with timeout + AbortSignal
- Design tokens: set up tokens file stub and font links

## Phase 2 — AI Under-the-Hood (no prompts)
- Hook `useAiActions`: autoSmile, inpaint(auto), upscale(auto)
- Replace prompt UI with action buttons and background cues
- Skeleton/patient loading: shimmer + staged content placeholders
- Timeout UX: friendly messages and retry affordances

## Phase 3 — Stores & Persistence
- Session store (local) with login/logout bindings
- Project store (local + sync) with load/save bindings
- AI jobs store (in-memory) tracking queued/running/history

## Phase 4 — Flows & Validation
- New project flow (name, canvas, dpi) with rules
- Export settings flow with validation (png/jpeg/webp, dpi>0)
- Layer management basics (add/rename/delete) with rules

## Phase 5 — Auth Model
- Role gates: guest/editor/admin for UI actions
- Rate limit hints on AI actions (client-side messaging)

## Phase 6 — Targets & Contracts
- Stubs for OpenAPI and GraphQL contracts (paths only)
- Route placeholders for /api/auth/* and /api/ai/*

## Phase 7 — Responsive Polish
- Touch targets and gesture affordances for mobile
- Resize-aware canvas and panels
- Keyboard shortcuts (progressive enhancement)

## Deliverables map (to provided schema)
- application/framework/languages: Next + TS + CSS
- contracts: create placeholders in /api
- blueprints: create stubs for ui/flows json
- stateModel: client stores matching shapes; local persistence
- validationRules: enforce via lightweight validator
- authModel: role-based UI affordances
- assets: tokens.json, fonts, icons, animations stubs
- x-ai-models: primary + fallback selectors in ai hook

## Task Tracker
- [ ] Phase 1 — Architecture & Scaffolding
- [ ] Phase 2 — AI Under-the-Hood (no prompts)
- [ ] Phase 3 — Stores & Persistence
- [ ] Phase 4 — Flows & Validation
- [ ] Phase 5 — Auth Model
- [ ] Phase 6 — Targets & Contracts
- [ ] Phase 7 — Responsive Polish
