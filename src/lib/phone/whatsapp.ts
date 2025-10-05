import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

export interface WhatsAppPhoneFormattingOptions {
  defaultCountry?: CountryCode
}

export interface WhatsAppPhone {
  digits: string
  jid: string
  e164: string
  country?: CountryCode
}

const sanitize = (input: string) => input.replace(/[^0-9+]/g, '').trim()

const buildCandidateNumbers = (raw: string) => {
  const sanitized = sanitize(raw)
  const candidates = new Set<string>()

  if (sanitized.startsWith('+')) {
    candidates.add(sanitized)
  } else {
    candidates.add(`+${sanitized}`)
  }

  // Agregar candidato sin símbolo + para permitir parseos nacionales
  candidates.add(sanitized)

  return Array.from(candidates).filter((value) => value.length > 0)
}

export const formatPhoneNumberForWhatsApp = (
  raw: string,
  options: WhatsAppPhoneFormattingOptions = {}
): WhatsAppPhone => {
  const trimmed = raw.trim()

  if (!trimmed) {
    throw new Error('PHONE_NUMBER_REQUIRED')
  }

  const candidates = buildCandidateNumbers(trimmed)

  let parsed = candidates
    .map((candidate) =>
      parsePhoneNumberFromString(candidate, options.defaultCountry)
    )
    .find((candidate) => candidate && candidate.isValid())

  if (!parsed && options.defaultCountry) {
    parsed = parsePhoneNumberFromString(trimmed, options.defaultCountry)
  }

  if (!parsed || !parsed.isValid()) {
    throw new Error('PHONE_NUMBER_INVALID')
  }

  let digits = `${parsed.countryCallingCode}${parsed.nationalNumber}`

  if (parsed.country === 'MX') {
    const national = parsed.nationalNumber.toString()
    if (!national.startsWith('1')) {
      digits = `${parsed.countryCallingCode}1${national}`
    }
  }

  const jid = `${digits}@s.whatsapp.net`
  const e164 = `+${digits}`

  return {
    digits,
    jid,
    e164,
    country: parsed.country
  }
}

export const ensureWhatsAppJid = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('JID_REQUIRED')
  }

  return trimmed.endsWith('@s.whatsapp.net')
    ? trimmed
    : `${sanitize(trimmed)}@s.whatsapp.net`
}
