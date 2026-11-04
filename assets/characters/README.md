# Character Vault — Model Storage

Each character gets a dedicated folder:

```
assets/characters/
  the-one/
    portrait.webp
    references/
    models/
    animation/
  prince-of-peace/
    portrait.webp
    references/
    models/
    animation/
```

Folders are examples of future uploads; the actual images/models are **not included yet**.

## Supported suggestions

- Portraits: `.webp`, `.png`, `.jpg`
- Model interchange: `.glb`, `.gltf` (with referenced textures), `.fbx`, `.obj`
- Creation projects: `.blend` or other native formats when appropriate
- Motion: `.mp4`, `.webm`, animation metadata and prompt `.md` files

File names should identify version: `the-one-v01.glb`, `the-one-v02.glb`.

Link each model entry in `characters/registry.json`. Keep the model entry blank until a real file exists.

**Storage limits:** GitHub repositories work well for documentation and modest images. GitHub warns on files over 50 MB and blocks standard Git uploads over 100 MB; use Git LFS or dedicated file storage for large model assets. GitHub is version control, not unlimited private media storage.

**Privacy:** This repository is public, so all committed creative materials will be visible and downloadable by others.
