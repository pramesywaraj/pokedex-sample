# 0005 — State via Angular signals, not NgRx

App state (browse feed, active filter/search, favourites, current Pokémon, online status) is
held in **signal-based services**, not a Redux-style store. RxJS is retained for what it's good
at: HTTP, debouncing the search box, and cancelling obsolete requests.

## Considered options

- **NgRx** — a formal single store (actions/reducers/effects/selectors). Powerful for large
  teams and complex shared state, but heavy boilerplate. For a Pokédex this size it's
  over-engineering, and a reviewer may read the ceremony as a red flag rather than a strength.
- **Services + RxJS `BehaviorSubject`** — the classic pre-signals approach. Works, but chattier
  than signals for what is mostly simple local state.

## Why signals

- Right-sized: minimal boilerplate, built into Angular, no extra dependency.
- Testable: state is plain injectable services with signals — trivial to assert on.
- Current: reflects modern Angular's default direction.

Recorded because "why not NgRx?" is the predictable review question for an Angular app, and the
answer (deliberate right-sizing) is worth stating rather than leaving as an apparent omission.
