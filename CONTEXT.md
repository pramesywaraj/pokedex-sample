# Pokédex

A frontend-only Pokédex — a browsable encyclopedia of every Pokémon — built as a
take-home assessment. This file is the shared glossary. It defines *what words mean*,
not how anything is built (implementation lives in the PRD, ADRs, and code).

## Language

**Pokédex**:
The application itself — the encyclopedia a Trainer browses.
_Avoid_: app, catalogue (as the product name)

**Pokémon**:
A single creature catalogued in the Pokédex, identified by a Dex number and a name.
_Avoid_: monster, creature, entry

**Trainer**:
The person using the Pokédex. Single and anonymous — there are no accounts, and a
Trainer's data lives only on their own device.
_Avoid_: user, player, account

**Dex number**:
A Pokémon's National Pokédex number — its stable numeric identifier (e.g. Pikachu is 25).
In PokeAPI this is the **species id**. For a base Pokémon it also equals its *entry id*
(`/pokemon/{id}`); but a Form has its own entry id (10001+) while sharing its base's Dex
number / species id — which is what fetches its description, category, and Evolution line.
_Avoid_: id, index

**Type**:
An elemental category a Pokémon belongs to (Water, Fire, Grass, Ghost, Flying, …).
A Pokémon has one or two.
_Avoid_: category, element, class

**Species**:
The richer classification behind a Pokémon that carries its description (the classic
Pokédex blurb), its category label, and its Evolution line. Distinct from the Pokémon
entry, which carries stats, physical attributes, and images.
_Avoid_: kind, breed

**Form**:
An alternate version of a Pokémon (Mega, regional, or other variant) that PokeAPI lists
as its own **entry** at id 10001+, sharing its base Pokémon's Dex number (species id). There
are 326 such entries beyond the 1025 base Pokémon (1351 entries in total). A Form **displays
its own entry id** as its number, but its description, category, and Evolution come from the
shared base species.
_Avoid_: variant, variation, alternate

**Evolution line**:
The ordered sequence a Pokémon evolves through (e.g. Bulbasaur → Ivysaur → Venusaur).
_Avoid_: evolution tree, evolution path

**Favourite**:
A Pokémon a Trainer has marked to keep. Stored on the device with its Dex number,
name, and Type(s). Marked and unmarked only from that Pokémon's detail view.
_Avoid_: bookmark, saved, liked, starred

**Sprite**:
The small pixel image of a Pokémon, used on the detail view's front/back flip.
Has a front and a back.
_Avoid_: icon, thumbnail

**Artwork**:
The large official illustration of a Pokémon. Shown on browse/favourite cards and on
its detail view. Front only.
_Avoid_: image, picture, render
