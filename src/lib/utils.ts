

export function generatePassword(user: { firstName: string; lastName: string }) {
  return `${user.firstName.trim()}-${user.lastName.trim()}`.toLowerCase();
}