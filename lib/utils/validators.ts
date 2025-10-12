export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 6) {
    return { valid: false, error: 'Şifre en az 6 karakter olmalıdır' }
  }
  return { valid: true }
}

export function validateDisplayName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim()
  if (!trimmed) {
    return { valid: false, error: 'Lütfen adınızı girin' }
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Ad en az 2 karakter olmalıdır' }
  }
  return { valid: true }
}

export function validatePostContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim()
  if (!trimmed) {
    return { valid: false, error: 'Gönderi içeriği boş olamaz' }
  }
  if (trimmed.length > 280) {
    return { valid: false, error: 'Gönderi en fazla 280 karakter olabilir' }
  }
  return { valid: true }
}

