/**
 * Enforces Conventional Commits (https://www.conventionalcommits.org/).
 * Format:  <type>(<optional scope>): <description>
 * Examples:
 *   feat(user): add UserModule.forRoot repository wiring
 *   fix(role): correct RoleRepository injection token
 *   chore: bump typescript-eslint to 8.68.0
 *
 * Enforced by the "commit-msg" Git hook (.husky/commit-msg) — a commit with
 * a message that doesn't match this format is rejected.
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
};
