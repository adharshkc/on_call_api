import vine from '@vinejs/vine'

export const contactFormValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().trim().email(),
    phone: vine.string().trim().optional(),
    serviceType: vine.string().trim().minLength(2).maxLength(100),
    message: vine.string().trim().minLength(5).maxLength(2000),
    // recaptchaToken: vine.string().trim(),
  })
)

export const contactEditValidator = vine.compile(
  vine.object({
    status: vine.enum([
      'view',
      'opened',
      'replayed',
      'need follow up',
      'follow up scheduled',
      'closed',
    ] as const),
    comment: vine.string().trim().nullable().optional(),
    followUpDate: vine.string().trim().nullable().optional(),
    followUpTime: vine.string().trim().nullable().optional(),
  })
)
