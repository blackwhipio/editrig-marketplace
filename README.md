# Editrig Marketplace

The community index of free [Editrig](https://editrig.io) packs: characters, backgrounds, props, 3D
models, styles, plugins and templates that anyone can install from Editrig's **Marketplace** screen.

Everything here is free. There are no accounts, payments or servers: a pack is a public repository
of its author's, and this repository is only the list (`index.json`) that Editrig reads.

## Installing packs

Open **Marketplace** in Editrig's sidebar, pick a pack, and press **Install**. Every file is checked
against the sha256 the pack lists before anything is added to your library. Installed items keep
their licence and credit their author.

## Publishing a pack

1. Connect your GitHub, GitLab or Gitea account in Editrig (**Settings › Sync**).
2. In **Marketplace**, press **Publish**, choose library items, a name, a description and a licence.
   Editrig makes a public repository `editrig-pack-<name>` in your account with the files and an
   `editrig-pack.json` manifest.
3. Press **Send to the Index**. This opens an issue here with the pack's entry filled in. A
   maintainer checks it and adds it to `index.json`.

You can also open a pull request that adds your entry to `index.json` yourself.

## Rules

- **Licence required**: CC0-1.0, CC-BY-4.0, CC-BY-SA-4.0, MIT or Apache-2.0.
- **Only what you may share**: your own work, or work whose licence lets you share it. Say which AI
  models made generated items. Editrig records this note itself.
- **Suitable for everyone**. No sexual content, hate, violence aimed at real people, or malware.
- **No trademarks or real people's likenesses** without permission.
- **Pin a commit**: `base` must point at a fixed commit (Editrig's Publish does this), so a pack
  cannot change after it is reviewed. A new version is a new entry with a new commit.

Maintainers may remove a pack at any time. Report problems by opening an issue.

## Format

`index.json`:

```json
{ "editrigIndex": 1,
  "packs": [{
    "id": "author.pack-name", "name": "Village Kids", "kind": "characters",
    "description": "Six rigged village kids", "author": "author", "license": "CC-BY-4.0",
    "version": "1.0.0",
    "base": "https://raw.githubusercontent.com/author/editrig-pack-village-kids/<commit>/",
    "page": "https://github.com/author/editrig-pack-village-kids",
    "preview": "items/ravi-1a2b3c/thumb.png", "tags": ["kids", "village"], "size": 812345 }] }
```

`kind` is one of `characters`, `backgrounds`, `props`, `models`, `styles`, `voices`, `plugins`,
`templates` or `mixed`.

A pack's root holds `editrig-pack.json`, the same fields plus `previews`, `items` and `files`. Each
item is `{ "kind": "library" | "plugin", "path": "items/<folder>", "name": "…" }`, and each file is
`{ "path", "sha256", "size" }`. Paths are relative, with `/`, and never contain `..`.

`scripts/validate.mjs` checks the index and every pack it lists. The workflow in
`.github/workflows/validate.yml` runs it on every pull request.
