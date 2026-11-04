# Adding Images to Librium Saga

## Current setup

The site contains **52 named image slots**, listed in `assets/IMAGE-SLOTS.json`. Each slot has a unique `data-slot` identifier. Character cards also have portrait placeholders driven by `characters/registry.json`.

All image slots are **intentional placeholders**, not generated art. They show the expected subject while we choose final pictures.

## Creative workflow

1. **Make the artwork.** In ChatGPT, request an image for a particular page/character. State whether it is a rough draft or approved.
2. **Review and approve.** If the result is wrong, revise it before publication.
3. **Save the image** as `webp`, `jpg` or `png` with a descriptive filename. Keep a high-resolution master copy separately.
4. **Upload the asset to GitHub.** Place age and society images in `assets/images/` and character portraits in `assets/characters/<character-id>/`. For example, `assets/images/age-07-hero.webp`.
5. **Tell ChatGPT the image path and slot ID.** Once an image exists in the repository, ChatGPT can edit the website HTML to replace that slot with an `<img>` and update the manifest.
6. **Netlify deploys** the next commit automatically from `main`. Verify the published page before calling it finished.

Do not commit private or unpublished materials to this public repository. Keep draft images separate until you want them public.

## Example

Desired slot: `age-07-hero` on `/ages/entrapment/`.

Upload: `assets/images/age-07-hero.webp`.

Replace the placeholder with:

```html
<figure class="image-slot wide image-filled" data-slot="age-07-hero">
  <img src="../../assets/images/age-07-hero.webp" alt="The Age of Entrapment under the sovereign AI" loading="lazy">
</figure>
```

Keep `assets/IMAGE-SLOTS.json` synchronized with the approved image filename and status.

## Image sizes

- Wide banners: 1600 × 900 px or wider (16:9)
- Cinematic banners: 2100 × 900 px (21:9)
- Cards/thumbnails: 900 × 675 px (4:3)
- Character portraits: 900 × 1200 px (3:4)

Use reasonably compressed WebP where possible. Include human-readable alt text describing the illustration, not merely the title of the page.

## Character images

Character portrait files are referenced through `characters/registry.json`, using a `portrait` path such as `assets/characters/the-one/portrait.webp`. The Character Vault displays that file after it's uploaded and the registry is updated.

Models, animations, and reference sheets can remain cataloged separately. Large model files should use Git LFS or dedicated storage instead of normal Git history.

## What is automated and what is not

ChatGPT can edit website code in this repository and Netlify can publish the commits. Image generation in chat alone does **not** automatically place binary images into GitHub. We must upload/transfer the image asset to GitHub before linking it from the site.
