/**
 * Sunucu taraflı form doğrulama yardımcıları
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateRequired(value: string | null | undefined, fieldName: string): string | null {
  if (!value || value.trim() === '' || value === '<p></p>' || value === '<p><br></p>') {
    return `${fieldName} alanı zorunludur.`
  }
  return null
}

export function validatePositiveInt(value: number | string, fieldName: string): string | null {
  const num = typeof value === 'string' ? parseInt(value) : value
  if (isNaN(num) || num <= 0) {
    return `${fieldName} sıfırdan büyük bir sayı olmalıdır.`
  }
  return null
}

export function validateFutureDate(dateStr: string, fieldName: string): string | null {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return `${fieldName} geçerli bir tarih olmalıdır.`
  }
  if (date <= new Date()) {
    return `${fieldName} gelecekte bir tarih olmalıdır.`
  }
  return null
}

export function validateScoreRange(score: number, maxScore: number): string | null {
  if (score < 0) {
    return 'Puan 0\'dan küçük olamaz.'
  }
  if (score > maxScore) {
    return `Puan maksimum değer olan ${maxScore}'i aşamaz.`
  }
  return null
}
