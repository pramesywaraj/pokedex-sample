# 0002 — Angular + Ionic + Capacitor for web and native from one codebase

The product must ship as both a responsive mobile-first **web** app and **installable
iOS/Android** apps. To keep a single Angular codebase, we build the UI with **Ionic**
components and package the native apps with **Capacitor** (the Angular web app runs in a
native shell). Device storage goes through **Ionic Storage**, which uses IndexedDB/
localStorage on web and SQLite on native behind one API — the same store the future
persistent cache (see [0003](./0003-async-cache-seam.md)) will reuse.

## Considered options

- **Responsive web + PWA only** — installable to the home screen with near-native feel at
  a fraction of the effort. Rejected because the brief calls for real installable native
  app packages, not a home-screen PWA.
- **Truly native (Swift/Kotlin or React Native/Flutter)** — best native feel, but a second
  codebase and skillset. Rejected as effectively building the app twice.

## Consequences

- Adds native build/test/store tooling (Xcode, Android Studio) to non-feature work; the
  rest of the scope is kept tight to protect the finish line.
- Ionic gives us `ion-infinite-scroll`, `ion-searchbar`, `ion-card`, and a bottom tab bar
  that map directly onto the designed UI.
