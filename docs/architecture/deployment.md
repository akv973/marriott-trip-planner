# GitHub repository and Pages runbook

## Current state

The project is a local Git repository, intended for `akv973/marriott-trip-planner`. The connected GitHub tools expose repository reads and content changes but do not expose repository creation or Pages-settings changes. No connected repository with this name was found. No remote push, PR, Actions run, or Pages deployment has occurred.

## Repository setup

1. Create `akv973/marriott-trip-planner` on GitHub. Choose visibility explicitly; standard public GitHub Pages requires public access unless the account's plan supports the desired private-repository configuration. Do not initialize a separate README, license, or .gitignore when importing this history.
2. Grant the GitHub integration access to the repository.
3. Push the completed local history using an authenticated Git client. Do not place credentials in source files or command arguments.

```bash
git remote add origin https://github.com/akv973/marriott-trip-planner.git
git push -u origin main
```

4. In repository Settings → Pages, select **GitHub Actions** as the build source. Confirm Actions has permission to use official actions and that the `github-pages` environment permits main deployments.
5. Require pull requests and the **Required checks** status on `main` through a branch rule or ruleset. Do not bypass a failed check to publish.
6. Inspect the first CI run. If Pages was enabled after the first run, rerun through the workflow's `workflow_dispatch` on `main`.

## What the workflow does

Install → typecheck → lint → schema validation → unit tests → integration tests → empty-catalog health → production build. It builds with `VITE_BASE_PATH=/marriott-trip-planner/`, uploads `dist/` only for main, then a separate dependent job configures and deploys Pages.

PRs and merge-queue checks do not deploy. No personal access token or deploy key is required by the workflow. `GITHUB_TOKEN` and short-lived OIDC permissions are scoped to their job.

## Verify before claiming deployment

- Record the full main commit SHA and exact Actions run URL.
- Verify **Required checks** and **Deploy GitHub Pages** succeeded for that SHA.
- Record the literal Pages URL returned by the deployment, not an assumed future URL.
- Open the live shell at its repository base path. Confirm its CSS/JS load, empty state and planned labels are visible, anchor links work, and mobile/desktop layouts behave correctly.
- Confirm there are no failed external requests or invented hotel/rate values.

The expected URL shape is `https://akv973.github.io/marriott-trip-planner/`. This is an intended location, **not a verified deployed URL**.

## Local production check

```bash
VITE_BASE_PATH=/marriott-trip-planner/ npm run build
npm run preview
```

Open `http://localhost:4173/marriott-trip-planner/`. Also build with the default `/` for local development. Assets must resolve under the selected base path. Future route/deep-link checks belong to Stage 2.

## If the repository name changes

Update the workflow base path, runbook URLs, and any explicit base-path verification. Do not leave `/marriott-trip-planner/` in a build for a differently named project repository.

## Primary reference

[Vite: Deploying a Static Site — GitHub Pages](https://vite.dev/guide/static-deploy.html), consulted during Stage 0, explains project base paths, Pages enablement, and the official Actions workflow pattern.
