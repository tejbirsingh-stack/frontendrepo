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

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'aol.com',
  'zoho.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
  'gmx.com',
  'yandex.com',
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  '10minutemail.com',
  'trashmail.com',
  'getairmail.com',
]);

export function validateBusinessEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return 'Email address is required.';
  }
  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1] || !parts[1].includes('.')) {
    return 'Please enter a valid email address.';
  }
  const domain = parts[1].trim();
  if (FREE_EMAIL_DOMAINS.has(domain)) {
    return 'Please enter a corporate or work email address (personal emails like Gmail/Outlook are not allowed).';
  }
  return null;
}
