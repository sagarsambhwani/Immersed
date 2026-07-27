# Workspace Rules & Environment Stages Guidelines

## Strict 3-Stage Promotion Workflow

All code changes in this repository must follow a strict 3-stage lifecycle to prevent unverified changes from reaching production:

1. **Development (`development` branch)**:
   - All new features, UI tweaks, bug fixes, and refactoring MUST be implemented and committed on the `development` branch first.
   - Active development and local testing occur exclusively in this environment.

2. **Staging (`staging` branch)**:
   - Once features are tested locally on `development`, they are merged into `staging`.
   - The user must test and approve the application in `staging` before any promotion.

3. **Production (`main` branch)**:
   - `main` represents the battle-tested, production-ready release code.
   - Code is ONLY merged into `main` after receiving explicit user approval and full verification on `staging`.
   - NEVER push unverified or experimental changes directly to `main`.
