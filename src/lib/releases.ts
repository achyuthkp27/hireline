// Where Hireline's releases are published, for the update check and its
// notice (update-check.ts, the sidebar). Safe to use in the browser.

export const RELEASES_REPOSITORY = "achyuthkp27/hireline";
/** The repository's page, for credits and support (the sidebar). */
export const REPOSITORY_URL = `https://github.com/${RELEASES_REPOSITORY}`;
/** How to update, in the docs. */
export const UPGRADE_GUIDE_URL = `${REPOSITORY_URL}/blob/main/docs/upgrading.md`;

/** A published release: its version, without the "v", and its page on GitHub. */
export type Release = { version: string; url: string };
