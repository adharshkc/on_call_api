import vine from '@vinejs/vine'

/**
 * Validator for creating/updating settings
 */
export const createSettingValidator = vine.compile(
  vine.object({
    key: vine.string().trim().minLength(1).maxLength(255),
    value: vine.any(),
    description: vine.string().trim().optional(),
  })
)

/**
 * Validator for updating settings
 */
export const updateSettingValidator = vine.compile(
  vine.object({
    value: vine.any().optional(),
    description: vine.string().trim().optional(),
  })
)
