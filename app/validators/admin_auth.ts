import vine from '@vinejs/vine'

/**
 * Validator to validate the payload for login
 */
export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string().minLength(6),
  })
)

/**
 * Validator to validate the payload for registration
 */
export const registerValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional(),
    email: vine.string().email(),
    password: vine.string().minLength(6),
    role: vine.string().optional(),
  })
)

/**
 * Validator to validate the payload for updating profile
 */
export const updateProfileValidator = vine.compile(
  vine.object({
    fullName: vine.string().optional(),
    email: vine.string().email().optional(),
  })
)

/**
 * Validator to validate the payload for changing password
 */
export const changePasswordValidator = vine.compile(
  vine.object({
    currentPassword: vine.string().minLength(6),
    newPassword: vine.string().minLength(6),
  })
)
