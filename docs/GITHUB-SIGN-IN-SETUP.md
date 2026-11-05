# Activate GitHub Sign-In for Librium Saga Image Uploads

The upload interface and Netlify Functions are committed to this repository, but **the sign-in button will not work until the OAuth App and Netlify secrets are configured**.

## One-time GitHub OAuth App setup

1. Sign in to GitHub as **jonathanfrazier**.
2. Go to https://github.com/settings/developers → **OAuth Apps** → **New OAuth App**.
3. Set:
   - **Application name:** Librium Saga Image Studio
   - **Homepage URL:** `https://strong-pasca-714035.netlify.app`
   - **Authorization callback URL:** `https://strong-pasca-714035.netlify.app/.netlify/functions/librium-callback`
4. Register the app. Copy its **Client ID**, then generate and copy its **Client secret**. Treat the secret like a password.

## Netlify environment variables

Open the Netlify project for `strong-pasca-714035.netlify.app` → **Project configuration / Environment variables**.

Add these variables (availability must include **Functions**):

| Name | Value |
| --- | --- |
| `LIBRIUM_GITHUB_CLIENT_ID` | Client ID from your GitHub OAuth App |
| `LIBRIUM_GITHUB_CLIENT_SECRET` | Client secret from the GitHub OAuth App |
| `LIBRIUM_SESSION_SECRET` | New **random secret of at least 32 characters** (do not reuse the GitHub secret) |
| `LIBRIUM_GITHUB_LOGIN` | `jonathanfrazier` |

**Never commit credentials to GitHub, paste them into a webpage source file, or send them in ChatGPT.**

After adding the environment variables, **trigger a fresh Netlify deployment** to make the secrets available to the Functions. Verify the project deploys from the `main` branch and functions are available.

## Use

Open `https://strong-pasca-714035.netlify.app/upload-images/`, choose an image target and press **Sign in with GitHub**. Authorize once, then choose an image and press Publish. The signed-in session lasts **up to 7 days**. You may need to reauthorize after that or upon sign-out. No manual token entry is required.

The site verifies that the signed-in GitHub account is `jonathanfrazier` **and** has permission to push to `Librium-Wars`. The backend accepts only registered image slot IDs, optimizes client uploads to WebP, and writes images to `assets/images/slots/<slot-id>.webp`.

## Important permission note

GitHub **OAuth Apps cannot grant per-repository permissions**. The requested `public_repo` scope allows access to **public repositories of the approving GitHub account**, not only Librium-Wars. The Librium Saga backend itself restricts operations to `jonathanfrazier/Librium-Wars`; however, GitHub's authorization scope is broader. If strict repository-level permissions are necessary, this must be replaced by a custom **GitHub App** installation restricted to that repository.

The website stores an encrypted, HttpOnly, Secure, SameSite=Lax session cookie for up to 7 days; GitHub credentials are never embedded in the public JavaScript bundle. To revoke access, revoke the OAuth App in GitHub settings and/or rotate `LIBRIUM_SESSION_SECRET` in Netlify. Sign out via the upload page.

## Troubleshooting

- **Sign-in setup needed:** One or more of the three OAuth/session environment variables are missing; redeploy after setting them.
- **Sign-in failed:** Verify callback URL exactly matches the OAuth App and the deployed site hostname.
- **Upload failed / Not authorized:** Sign in as the repository owner with write access.
- **Image missing from page:** Wait for Netlify to deploy the image commit and refresh. The chosen slot ID determines the file path; different placements can use different images.
- **File too large:** Images are optimized in-browser and must be under 3.9 MB after compression.

See also [IMAGE-SLOTS.json](../assets/IMAGE-SLOTS.json) for current site image positions.
