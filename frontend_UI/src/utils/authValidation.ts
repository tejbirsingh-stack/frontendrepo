const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,16}$/;

export function validatePassword(password: string): string | null {
  const trimmed = password.trim();
  if (!trimmed) {
    return 'Password is required.';
  }
  if (trimmed.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (trimmed.length > 16) {
    return 'Password must be 16 characters or fewer.';
  }
  if (!PASSWORD_PATTERN.test(trimmed)) {
    return 'Password must include uppercase, lowercase, and a number.';
  }
  return null;
}

export function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
