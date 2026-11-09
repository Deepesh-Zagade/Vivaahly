# Vivaahly Operations Runbook

Use this checklist for small, low-risk changes that have already been tested locally. Use a reviewed pull request for large features, database migrations, security changes, or infrastructure changes.

## Environments

| Environment | Branch | URL | Database |
| --- | --- | --- | --- |
| Local | `dev` | `http://localhost:3000` | `vivaahly_dev` |
| QA | `dev` | `https://qa.vivaahly.bond` | `vivaahly_dev` |
| Production | `main` | `https://vivaahly.bond` | `vivaahly_prod` |

Pushing `dev` deploys QA automatically. Updating `main` deploys Production automatically.

## 1. Local to QA

Run from Git Bash:

```bash
git switch dev
git pull --ff-only origin dev

corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
git diff --check

git status --short
git diff
git add -- "path/to/changed-file" "path/to/another-file"
git diff --cached
git commit -m "fix: short description"
git push origin dev
```

Stage only intended files. Never commit `.env*`, credentials, or generated changes such as `next-env.d.ts` unless deliberately required.

Wait for Vercel to finish, then validate `https://qa.vivaahly.bond` in a fresh browser session.

## 2. QA to Production

After QA approval:

```bash
git switch dev
git pull --ff-only origin dev
git fetch origin --prune

git log --oneline origin/main..dev
git merge-base --is-ancestor origin/main dev
echo $?
```

Continue only when `echo $?` prints `0`. Then promote the exact QA commit:

```bash
git push origin dev:main
```

Wait for the Vercel Production deployment, then smoke-test:

- Homepage, sign in, and sign out
- The changed flow
- Important authorization boundaries
- Email links or external integrations affected by the change

## Stop and Review

Do not deploy when tests fail, the ancestry check is non-zero, unexpected files are staged, or the change requires new environment variables, database indexes/migrations, or provider configuration.

If Production has a defect, create a normal revert commit on `dev`, validate it on QA, and promote that corrected commit. Do not rewrite shared branch history.
