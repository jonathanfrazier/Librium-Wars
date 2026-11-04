# Librium Saga

A living science-fiction universe and website, deployed from this repository to Netlify.

**Live website:** https://strong-pasca-714035.netlify.app/

## Archive map

- `index.html` — public Saga homepage
- `characters/index.html` — public searchable Character Vault
- `characters/registry.json` — character index powering the Vault
- `characters/CHARACTER-TEMPLATE.md` — structured character profile template
- `assets/characters/README.md` — conventions for storing portraits, reference sheets and model files
- `docs/UNIVERSE-BIBLE.md` — working story canon and historical timeline

## Publishing

Netlify is linked to the `main` branch. Changes committed to this repository should trigger an automatic deployment.

## Character asset organization

Store each character under `assets/characters/<slug>/`. Keep a master portrait, references, animation prompts, and versioned model files together. Add paths to `characters/registry.json` to expose them in the website.

For large binary models, Git LFS or external object storage is preferable to committing very large files to standard Git history. A public repository makes all committed files publicly accessible. Do **not** put unpublished/private images, secrets or confidential drafts here.

## Current scope

This is a preliminary structured archive. The One and the Prince of Peace are starter entries based on the developing story; no physical models or final designs are claimed to exist yet.
