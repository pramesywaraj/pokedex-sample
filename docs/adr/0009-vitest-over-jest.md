# 0009 — Tests on Vitest, not Jest

Unit and component tests run on **Vitest** — Angular's built-in default test runner from v21 —
not Jest. This reverses the original tech-stack note (ARCHITECTURE §9 first specified Jest, when
Jest was the common community pick for Angular).

## Context

The design docs were written before scaffold. By scaffold time the Angular testing story had
moved:

- **Angular 21** made **Vitest** the stable, built-in default runner and **retired Karma**.
- Angular's **Jest** support is now officially **experimental and frozen** — no further
  investment from the team.
- **Ionic 9** (our UI layer) defaults to **zoneless** change detection, matching Angular
  21/22 — the same modern default Vitest is wired for.

So the framework's grain now runs toward Vitest; staying on Jest means swimming against it.

## Considered options

- **Jest (via `jest-preset-angular`)** — matches the original docs and is a mature community
  preset. But there is no first-party builder, support is experimental/frozen, and it needs
  extra ESM/Angular bridging config. A reviewer current with Angular would ask "why not Vitest?".
- **Karma / Jasmine** — the old Ionic starter default. Retired / maintenance-mode. Rejected.
- **Vitest** — Angular's native default from v21, driven by the CLI's `unit-test` builder,
  Vite-powered (fast, ESM-native), with a Jest-compatible API (`describe/it/expect`; `vi` for
  mocks/spies).

## Why Vitest

- **First-party:** no extra test-runner plumbing — the Angular CLI's unit-test builder runs it.
- **Current:** matches the Angular 22 + Ionic 9 defaults (standalone, zoneless) we scaffold on
  ([ADR 0002](./0002-ionic-capacitor.md)).
- **Fast:** Vite transform pipeline, ESM-native.
- **Near-zero cost vs. the plan:** the per-layer testing strategy in ARCHITECTURE §9 is
  runner-agnostic — same assertions and fixtures; `vi` simply replaces `jest` for mocks.

Recorded because it overturns a written choice: a reviewer seeing Vitest where the docs once said
Jest deserves the why — the ecosystem shifted between design and scaffold.
