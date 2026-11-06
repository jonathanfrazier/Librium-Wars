# Cloudflare Pages deployment — Librium Saga

**Prepared source repository:** [jonathanfrazier/Librium-Wars](https://github.com/jonathanfrazier/Librium-Wars)

## Connect the existing site (one-time)

1. Open [Cloudflare dashboard — Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages).
2. Choose **Create application → Pages → Connect to Git** (or **Import an existing Git repository**).
3. Authorize Cloudflare to access GitHub, and select **jonathanfrazier/Librium-Wars**.
4. Set the deployment values:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | **None** |
| Build command | `sh cloudflare-build.sh` |
| Build output directory | `dist` |
| Root directory | Repository root (leave blank) |

5. Select **Save and Deploy**. Cloudflare provides a live `*.pages.dev` URL after successful deployment.

This build copies the homepage, the Eight Nations, the Nine Ages, religions, Social Orders, Character Vault, image inventory, and committed artwork. It excludes the obsolete Netlify server functions.

## Image uploads are a separate feature

The previous website uploader submits photos to **Netlify Forms**. **Cloudflare Pages does not run Netlify Forms.** The form is therefore not a publishing mechanism on the Cloudflare site. The static uploader includes a notice instead of pretending submissions are published.

For automatic image publishing on Cloudflare, a separate **authenticated** storage/publishing backend is required (for example Cloudflare R2 plus a Worker, or a GitHub App). Do not place GitHub tokens in browser code or make public unauthenticated repository-write endpoints.

Until that is configured, upload approved artwork in the ChatGPT project conversation, where the connected GitHub tools can publish it. Uploaded photos sitting in Netlify Forms are **not included** in this migration; the files need to be downloaded from the Netlify dashboard if they are not already present in GitHub.

## Cutover

- Keep the Netlify site live until the Pages deployment is checked.
- Test these paths: `/`, `/nations/`, `/ages/`, `/religions/`, `/social-orders/`, `/characters/`.
- Confirm image assets such as `/assets/images/beings/automata-librium-saga.avif` return correctly.
- GitHub `main` becomes the source for future automatic Cloudflare deployments.
- The `strong-pasca-714035.netlify.app` URL **belongs to Netlify** and cannot be transferred to Cloudflare. Use the new `pages.dev` URL or a custom domain you control.

## Existing features

This is a static HTML/CSS/JavaScript website with a JSON-backed character registry. No JavaScript framework installation is required. Existing image slot paths remain unchanged.

Official reference: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
