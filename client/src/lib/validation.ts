const SAFE_PATTERN = /^[a-zA-Z0-9 _-]+$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateIdentity(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Name is required." };
  if (trimmed.length > 100)
    return { valid: false, error: "Name must be 100 characters or fewer." };
  if (!SAFE_PATTERN.test(trimmed))
    return {
      valid: false,
      error: "Name can only contain letters, numbers, spaces, - or _.",
    };
  return { valid: true };
}

export function validateRoomName(value: string): ValidationResult {
  const trimmed = value.trim();
  if (!trimmed) return { valid: false, error: "Room name is required." };
  if (trimmed.length > 100)
    return { valid: false, error: "Room name must be 100 characters or fewer." };
  if (!SAFE_PATTERN.test(trimmed))
    return {
      valid: false,
      error: "Room name can only contain letters, numbers, spaces, - or _.",
    };
  return { valid: true };
}
