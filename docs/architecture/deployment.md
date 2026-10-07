# GitHub repository and Pages runbook

## Current state

Repository: [akv973/marriott-trip-planner](https://github.com/akv973/marriott-trip-planner), public. Pages source is **GitHub Actions**. The live explorer is [https://akv973.github.io/marriott-trip-planner/](https://akv973.github.io/marriott-trip-planner/).

The exact original foundation commit `7a66c1228dc7aff73ca758b0761b8cbae14a3657` was imported without rewriting it. Its [first CI and Pages run](https://github.com/akv973/marriott-trip-planner/actions/runs/37563282727) succeeded. The temporary import workflow is retained only on the separate `stage-0-import` bootstrap branch; it is not on main. Subsequent Stage 0 changes use focused PRs and passing CI. See the stage record for final verification evidence.

Branch protection remains unconfigured. Automatic approval review rejected changing branch protection and administrator bypass settings as outside the explicit authorization. The workflow still gates deployment on successful required checks; this does not enforce PR requirements at the repository level.

## Repository setup

1. Create `akv973/marriott-trip-planner` on GitHub. Choose visibility explicitly; standard public GitHub Pages requires public access unless the account's plan supports the desired private-repository configuration. Do not initialize a separate README, license, or .gitignore when importing this history.
2. Grant the GitHub integration access to the repository.
3. Push the completed local history using an authenticated Git client. Do not place credentials in source files or command arguments.

```bash
git remote add origin https://github.com/akv973/marriott-trip-planner.git
git push -u origin main
```

4. In repository Settings → Pages, select **GitHub Actions** as the build source. Confirm Actions has permission to use official actions and that the `github-pages` environment permits main deployments.
5. Repository-level protection is recommended separately: require pull requests and the **Required checks** status on `main` through a branch rule or ruleset. Configure security settings only with authorization. Do not merge a failed check or publish a failed build.
6. Inspect the first CI run. If Pages was enabled after the first run, rerun through the workflow's `workflow_dispatch` on `main`.

## What the workflow does

Install → typecheck → lint → schema validation → unit tests → integration tests → catalog evidence health → production build → desktop/narrow browser checks. It builds with `VITE_BASE_PATH=/marriott-trip-planner/`, uploads `dist/` only for a successful main validation, then a separate dependent job configures and deploys Pages. A third job depends on deployment and checks the live site at desktop and narrow widths, uploading browser evidence.

PRs and merge-queue checks do not deploy. No personal access token or deploy key is required by the workflow. `GITHUB_TOKEN` and short-lived OIDC permissions are scoped to their job.

## Verify before claiming deployment

- Record the full main commit SHA and exact Actions run URL.
- Verify **Required checks**, **Deploy GitHub Pages**, and **Live browser QA** succeeded for that SHA.
- Record the literal Pages URL returned by the deployment, not an assumed future URL.
- Open the live explorer at its repository base path. Confirm CSS/JS load, all 25 properties render, combined filters and sorting work, detail URLs reload, sources and unknowns remain visible, and mobile/desktop layouts behave correctly.
- Confirm there are no failed external requests or invented hotel/rate values.

Compare the live HTML and bundled asset bytes with the artifact built for the recorded commit. The dependent deployment job supplies the workflow-to-commit connection; matching bytes corroborate the live output. The app does not display an embedded commit identifier.

## Local production check

```bash
VITE_BASE_PATH=/marriott-trip-planner/ npm run build
npm run preview -- --base /marriott-trip-planner/
```

Open `http://localhost:4173/marriott-trip-planner/`. Also build with the default `/` for local development. Assets must resolve under the selected base path. Stage 2 uses `#/explore` and `#/properties/<slug>` hash routes. Reloading either fetches the repository root document; filters/search/sort remain inside the fragment. The original informational anchors are still restored after React mounts. Planner routes belong to later authorized stages.

## If the repository name changes

Update the workflow base path, runbook URLs, and any explicit base-path verification. Do not leave `/marriott-trip-planner/` in a build for a differently named project repository.

## Primary reference

[Vite: Deploying a Static Site — GitHub Pages](https://vite.dev/guide/static-deploy.html), consulted during Stage 0, explains project base paths, Pages enablement, and the official Actions workflow pattern.
