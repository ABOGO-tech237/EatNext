import type { User } from '@prisma/client';

export function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function sanitizeUsers(users: User[]) {
  return users.map(sanitizeUser);
}
