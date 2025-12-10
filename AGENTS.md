# Agents Guide: Principles & Practices

1. As you create a project, create three files: `DESIGN.md` (captures visual language, tokens, components, motion), `PROJECT.md` (architecture/structure overview), and `TODO.md` (work log and next steps). After each step you take, update these documents as needed. Never skip this; it's not busywork, it's important. Always keep these files in context, never forget these. This is the golden rule.

This guide is for anyone (human or AI) working on this project or starting new ones with similar goals. It captures the principles established in this session so we avoid redoing work and keep quality high.

## Core Principles

- **Modularity first**: Break features into focused hooks, services, and UI subcomponents. Avoid monoliths; keep logic, data fetching, and rendering separate.
- **Single source of truth**: Centralize config (env), design tokens (colors, typography, borders), and shared UI primitives. No style drift or duplicated logic.
- **Explicit auth checks**: Enforce whitelists/permissions before side effects (e.g., before Firebase sign-in). Keep token handling consolidated and predictable.
- **Composability without overengineering**: Build base components (e.g., widget frame, modal frame) and extend them with props; don’t create needless abstractions for one-off layouts.
- **No redundancy**: Avoid duplicate helpers (e.g., token exchange) and repeated UI patterns—factor them out once and reuse.
- **Consistency in design**: Shared provenance for text styles, colors, borders, radius. Widgets, modals, and overlays should feel coherent and derive from the same base tokens.
- **Document as you go**: Keep architecture docs current. Add a design document when visual language evolves.
- **Shared primitives over per-screen tweaks**: Use a single modal frame (with portal + optional header), checkbox, and frame component across the app; tune variants via props instead of forking styles.
- **Use portals for overlays**: Render modals/overlays via a portal to escape clipping/overflow issues; keep backdrops consistent and non-opaque where possible.
- **Typography control**: Set the base font size/weight in one place (CSS root) and be deliberate with weight utility classes; avoid accidental boldness on non-primary metadata.
- **Handle commits/pushes proactively**: When asked to “add/commit/push,” propose or execute the `git add/commit/push` sequence (with permission if needed) instead of deferring to the user.

- **UI scaffolding**:
  - Use shared frames for widgets/modals (WidgetFrame/ModalFrame) to keep chrome consistent; modals portal to body.
  - Keep layout tweaks at the edge: extend base components with inline props rather than duplicating containers.
- **Styling pipeline**:
  - Use the built Tailwind pipeline; remove CDN usage. Centralize tokens (colors, spacing, radii) and avoid per-file ad-hoc styles.
- **Correctness & safety**:
  - Default to immutable state updates; avoid in-place mutation that can cause ghost UI bugs.
  - Use transactions/atomic ops for shared data (e.g., Firestore todos) to prevent race conditions; avoid optimistic writes without server reconciliation.
  - Guard effects with stable deps and callbacks to prevent runaway fetch loops or multiple subscriptions.
  - Surface errors to the UI where actionable; log with context for debugging.
  - Prefer idempotent operations/endpoints where possible; design handlers so repeated calls don’t corrupt state.
  - Validate inputs at boundaries (API calls, forms) and fail fast; avoid trusting client-only checks.
  - Handle partial failures explicitly (e.g., multi-account sync) and keep UI state consistent with backend state.
  - Clean up subscriptions/intervals/timeouts to prevent leaks or double work.

## Applying This to New Projects

- Start with a design doc: tokens, typography, spacing, motion rules. Build base frames early.
- Define config and env once; avoid secret duplication in client code.
- Build feature modules with clear boundaries: data hooks, API clients, UI shells/subcomponents.
- Enforce auth/permissions upfront; separate identity from data access tokens.
- Keep docs live: update structure and feature docs alongside code changes.

## Anti-Patterns to Avoid

- Monolithic components that mix data fetching, state, and rendering.
- Duplicated service logic (e.g., multiple token exchange helpers).
- Ad-hoc styles or inline magic numbers for colors/radii not tied to tokens.
- UI divergence (different modals/frames) when a shared base is intended.
- Client-side secrets scattered across files.
