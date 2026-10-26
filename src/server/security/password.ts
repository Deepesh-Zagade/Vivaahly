import "server-only";

import * as argon2 from "argon2";

const ARGON2ID_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
} as const;

export const INVALID_LOGIN_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,p=1,t=2$pgyfzUjWHZ/gfJefBm20FQ$V6cbbZj0vuIb99wryglPMZ1THgMySWws2RLpER4wulg";

export function hashPassword(password: string) {
  return argon2.hash(password, ARGON2ID_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string) {
  return argon2.verify(passwordHash, password);
}
