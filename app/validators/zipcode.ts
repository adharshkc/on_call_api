import vine from '@vinejs/vine'

/**
 * Validator for adding zipcodes to a service
 */
export const addZipcodesValidator = vine.compile(
  vine.object({
    zipcodes: vine
      .array(
        vine
          .string()
          .trim()
          .minLength(1)
          .regex(/^[a-zA-Z0-9\s-]+$/)
      )
      .minLength(1),
  })
)
