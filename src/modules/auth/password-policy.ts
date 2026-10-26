export const ORGANIZER_PASSWORD_MIN_LENGTH = 12;
export const ORGANIZER_PASSWORD_MAX_LENGTH = 128;

export function getOrganizerPasswordError(password: string) {
  if (password.length === 0) return "Password is required.";

  if (/^\s+$/u.test(password)) {
    return "Password cannot contain only spaces.";
  }

  if (password.length < ORGANIZER_PASSWORD_MIN_LENGTH) {
    return `Password must contain at least ${ORGANIZER_PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > ORGANIZER_PASSWORD_MAX_LENGTH) {
    return `Password must contain at most ${ORGANIZER_PASSWORD_MAX_LENGTH} characters.`;
  }

  if (/[^\S ]/u.test(password)) {
    return "Password may contain regular spaces only.";
  }

  if (password.startsWith(" ") || password.endsWith(" ")) {
    return "Password cannot begin or end with a space.";
  }

  if (password.includes("  ")) {
    return "Use only one space between words.";
  }

  return null;
}
