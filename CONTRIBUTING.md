# Contributing Guidelines

Thank you for contributing to the AI-Powered Tourism & Travel Intelligence Platform!

## 📌 Commit Message Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/):

- `feat(scope)`: A new feature for the user or system
- `fix(scope)`: A bug fix
- `research(scope)`: ML experiments, dataset additions, or evaluation metrics
- `docs(scope)`: Documentation changes only
- `refactor(scope)`: A code change that neither fixes a bug nor adds a feature
- `test(scope)`: Adding missing tests or correcting existing tests
- `ci(scope)`: Changes to CI/CD workflows and deployment configuration

### Examples

```bash
git commit -m "feat(auth): implement JWT access and refresh token rotation"
git commit -m "research(rec): add evaluation script for Model B content-based recommendation"
git commit -m "fix(places): handle missing PostGIS extension in fallback spatial query"
```

## 🌿 Branch Strategy

- `main`: Production-ready release code. Every tag `v0.1.0`, `v0.2.0`, ... `v1.0.0` represents a weekly milestone release.
- `develop`: Primary integration branch.
- `feature/<name>` or `fix/<name>`: Feature or fix branches.

## 🚀 Pull Request Checklist

Before submitting a PR:
1. Ensure `ruff check backend/` passes without errors.
2. Run pytest suite: `pytest backend/tests`.
3. Test locally using `docker compose up`.
4. Fill out the PR template with clear description and verification evidence.
