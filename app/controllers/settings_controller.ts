import type { HttpContext } from '@adonisjs/core/http'
import Setting from '#models/setting'

export default class SettingsController {
  /**
   * Get all settings
   */
  async index({ response }: HttpContext) {
    try {
      const settings = await Setting.all()
      return response.ok({
        success: true,
        data: settings,
      })
    } catch (error) {
        console.log(error)
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch settings',
        error: error.message,
      })
    }
  }

  /**
   * Get a specific setting by key
   */
  async show({ params, response }: HttpContext) {
    try {
      const setting = await Setting.findBy('key', params.key)

      if (!setting) {
        return response.notFound({
          success: false,
          message: 'Setting not found',
        })
      }

      return response.ok({
        success: true,
        data: setting,
      })
    } catch (error) {
        console.log(error)
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch setting',
        error: error.message,
      })
    }
  }

  /**
   * Get setting value by key (returns just the value)
   */
  async getValue({ params, response }: HttpContext) {
    try {
      const value = await Setting.get(params.key)

      if (value === null) {
        return response.notFound({
          success: false,
          message: 'Setting not found',
        })
      }

      return response.ok({
        success: true,
        data: value,
      })
    } catch (error) {
        console.log(error)
      return response.internalServerError({
        success: false,
        message: 'Failed to fetch setting value',
        error: error.message,
      })
    }
  }

  /**
   * Create or update a setting
   */
  async store({ request, response }: HttpContext) {
    try {
      const { key, value, description } = request.only(['key', 'value', 'description'])

      if (!key || value === undefined) {
        return response.badRequest({
          success: false,
          message: 'Key and value are required',
        })
      }

      const setting = await Setting.set(key, value, description)

      return response.ok({
        success: true,
        message: 'Setting saved successfully',
        data: setting,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to save setting',
        error: error.message,
      })
    }
  }

  /**
   * Update a setting
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const setting = await Setting.findBy('key', params.key)

      if (!setting) {
        return response.notFound({
          success: false,
          message: 'Setting not found',
        })
      }

      const { value, description } = request.only(['value', 'description'])

      if (value !== undefined) {
        setting.value = value
      }

      if (description !== undefined) {
        setting.description = description
      }

      await setting.save()

      return response.ok({
        success: true,
        message: 'Setting updated successfully',
        data: setting,
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to update setting',
        error: error.message,
      })
    }
  }

  /**
   * Delete a setting
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const setting = await Setting.findBy('key', params.key)

      if (!setting) {
        return response.notFound({
          success: false,
          message: 'Setting not found',
        })
      }

      await setting.delete()

      return response.ok({
        success: true,
        message: 'Setting deleted successfully',
      })
    } catch (error) {
      return response.internalServerError({
        success: false,
        message: 'Failed to delete setting',
        error: error.message,
      })
    }
  }
}
