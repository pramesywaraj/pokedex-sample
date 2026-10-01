# Pokédex

A frontend-only Pokédex built with Angular, Ionic, and Capacitor, running from the open
[PokeAPI](https://pokeapi.co/). Browse the dex, search it, filter by Type, open a Pokémon's detail
with stats and evolutions, and save favourites that survive a restart. One codebase ships to the
web and wraps as a native app.

## Where the thinking lives

| Doc | What it covers |
|---|---|
| [docs/PRD.md](docs/PRD.md) | Use cases, acceptance criteria, the state matrix |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, layers, domain models, caching |
| [docs/DESIGN.md](docs/DESIGN.md) | Visual and interaction design |
| [docs/adr/](docs/adr/) | The point decisions, with rationale |
| [CONTEXT.md](CONTEXT.md) | Glossary — the words this project uses |

## Prerequisites

- **Node 22** — `.nvmrc` pins 22.23.3. Run `nvm use` before anything else.
- `npm ci` to install.

## Run on the web

```bash
nvm use
npm ci
npm start
```

The dev server comes up on <http://localhost:4200> and reloads on save.

On macOS the dev server can die with `EMFILE`, because the default `kern.maxfilesperproc` of 10240
is below what the file watcher wants. If you hit it, poll instead of watching:

```bash
npm start -- --poll 3000
```

## Run on Android

Capacitor wraps the same web build, so there is no second codebase — `android/` is committed and
the web bundle is copied into it on each sync.

You need, on top of the web prerequisites:

- **JDK 21** — set `JAVA_HOME` to it. Not the newest JDK: the project's Gradle 8.14.3 predates
  JDK 25 support, and its AGP 8.13.0 needs 17 or above.
- **Android SDK** with `platform-tools`, `platforms;android-36`, and `build-tools;36.0.0`, its
  licences accepted, and `ANDROID_HOME` pointing at the SDK root.
- A **real device** with developer options and USB debugging on, or an emulator. Check it is
  visible with `adb devices` — a device listed as `unauthorized` means the prompt on the phone
  has not been accepted yet.

Then build the web bundle, copy it into the Android project, and launch:

```bash
npm run run:android
```

That runs the production build, `npx cap sync android`, and `npx cap run android` in order. Use
`npm run sync:android` on its own to refresh the native project without launching — handy before
opening `android/` in Android Studio.

The app's minimum is Android 7.0 (minSdk 24), and it compiles and targets SDK 36.

> **Rebuild before you test.** `npx cap run android` does not run the Angular build, so a stale
> `dist/` ships the wrong bundle to the device. The `run:android` script exists so you cannot
> forget that step.

## The app icon

The launcher icon is rendered from three SVG masters in `assets/` — `icon-only.svg` (the flat
1024 master), plus `icon-foreground.svg` and `icon-background.svg` for Android's adaptive icon:

```bash
npm run icons
```

Edit a master, re-run that, and the per-density resources under `android/app/src/main/res/` are
rewritten. Don't run `@capacitor/assets` over these — it insets the adaptive layers in a way that
breaks a full-bleed background; see
[ARCHITECTURE → Build & run](docs/ARCHITECTURE.md#10-build--run).

## Run on iOS

Not wired up yet — no iOS platform has been added. The app code is platform-agnostic, so this is a
toolchain step rather than a code one.

## Tests, linting, formatting

| Command | What it does |
|---|---|
| `npm test` | unit tests once, with Vitest |
| `npm run test:watch` | the same, in watch mode |
| `npm run lint` | ESLint, including the layering check |
| `npm run format` | Prettier write (`npm run format:check` to verify) |

The lint step enforces the architecture's layering rule — presentation may reach down into
application and data, never the other way — so a stray import fails the build rather than quietly
rotting.

## Build for production

```bash
npm run build
```

Output lands in `dist/pokedex/browser`.
