import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'
import db from '@adonisjs/lucid/services/db'
import { addZipcodesValidator } from '#validators/zipcode'

export default class ServicesController {
  /**
   * Check service availability by zipcode (for customers)
   * Search through ServiceAvailability table that contains the zipcode
   */
  async checkAvailability({ request, response }: HttpContext) {
    const { postcode, serviceId } = request.only(['postcode', 'serviceId'])
    const zipcode = postcode
    if (!zipcode) {
      return response.status(400).json({
        message: 'Zipcode is required',
      })
    }

    console.log('🔍 Checking availability for zipcode:', zipcode, 'and serviceId:', serviceId)

    try {
      // Normalize input: remove spaces/special chars and uppercase
      const normalizedZipcode = this.normalizeZipcode(zipcode)
      if (!normalizedZipcode) {
        return response.status(400).json({
          message: 'Zipcode is required or contains no valid characters',
        })
      }
      // Derive UK postcode matching tiers
      const tokens = this.getUkPostcodeTokens(normalizedZipcode)

      // Helper to run a search with a pattern on postcode_search
      const runSearch = async (pattern: string, exact: boolean) => {
        const qb = db
          .from('service_availabilities')
          .leftJoin('services as s', 'service_availabilities.service_id', 's.id')
          .distinct('service_availabilities.service_id')
          .select(
            'service_availabilities.service_id as service_id',
            's.name',
            's.description',
            's.slug'
          )

        if (exact) {
          qb.where('service_availabilities.postcode_search', pattern)
        } else {
          qb.where('service_availabilities.postcode_search', 'like', `${pattern}%`)
        }

        if (serviceId) {
          qb.where('service_availabilities.service_id', serviceId)
        }

        return qb
      }

      // 1) Full Code (specific override)
      if (tokens.full) {
        const rowsFull = await runSearch(tokens.full, true)
        if (rowsFull.length > 0) {
          return response.json({
            message: 'Services available for this zipcode',
            available: true,
            zipcode: normalizedZipcode,
            matchLevel: 'full',
            data: rowsFull,
          })
        }
      }

      // 2) Sector (e.g., SW1A1)
      if (tokens.sector) {
        const rowsSector = await runSearch(tokens.sector, false)
        if (rowsSector.length > 0) {
          return response.json({
            message: 'Services available for this zipcode',
            available: true,
            zipcode: normalizedZipcode,
            matchLevel: 'sector',
            data: rowsSector,
          })
        }
      }

      // 3) Outward Code (e.g., SW1A)
      if (tokens.outward) {
        const rowsOutward = await runSearch(tokens.outward, false)
        if (rowsOutward.length > 0) {
          return response.json({
            message: 'Services available for this zipcode',
            available: true,
            zipcode: normalizedZipcode,
            matchLevel: 'outward',
            data: rowsOutward,
          })
        }
      }

      // 4) Area (e.g., SW)
      if (tokens.area) {
        const rowsArea = await runSearch(tokens.area, false)
        if (rowsArea.length > 0) {
          return response.json({
            message: 'Services available for this zipcode',
            available: true,
            zipcode: normalizedZipcode,
            matchLevel: 'area',
            data: rowsArea,
          })
        }
      }

      return response.json({
        message: 'No services available for this zipcode',
        available: false,
        zipcode: normalizedZipcode,
        data: [],
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error checking availability',
        error: error.message,
      })
    }
  }

  /**
   * Helper method to format service response consistently
   */
  

  /**
   * Normalize a zipcode: remove all whitespace, strip non-alphanumeric characters,
   * and convert to uppercase. Returns an empty string if input is falsy.
   */
  private normalizeZipcode(zip: any): string {
    if (zip === undefined || zip === null) return ''
    return String(zip)
      .replace(/\s+/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
  }

  /**
   * Given a normalized UK postcode (no spaces, uppercase), derive matching tokens.
   * - full: full normalized (e.g., SW1A1AA)
   * - sector: outward + sector digit (e.g., SW1A1)
   * - outward: area + district (e.g., SW1A)
   * - area: 1-2 leading letters (e.g., SW)
   */
  private getUkPostcodeTokens(normalized: string): {
    full?: string
    sector?: string
    outward?: string
    area?: string
  } {
    const result: { full?: string; sector?: string; outward?: string; area?: string } = {}
    if (!normalized || normalized.length < 2) return result

    result.full = normalized

    // Area: first 1-2 letters
    const areaMatch = normalized.match(/^[A-Z]{1,2}/)
    if (areaMatch) {
      result.area = areaMatch[0]
    }

    // Outward: everything except last 3 chars (sector digit + unit letters)
    if (normalized.length >= 4) {
      result.outward = normalized.slice(0, normalized.length - 3)
    }

    // Sector: outward + sector digit (remove last 2 unit letters)
    if (normalized.length >= 5) {
      result.sector = normalized.slice(0, normalized.length - 2)
    }

    return result
  }

  /**
   * Get all services (admin/customer)
   */
  async index({ request, response }: HttpContext) {
    const page = Number.parseInt(request.qs().page || '1')
    const limit = Number.parseInt(request.qs().limit || '20')
    const category = request.qs().category
    const search = request.qs().search
    const isActive = request.qs().isActive !== 'false' // default to true

    try {
      const query = Service.query().where('is_active', isActive)

      if (category) {
        query.where('category', category)
      }

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('description', `%${search}%`)
            .orWhereILike('category', `%${search}%`)
        })
      }

      const services = await query.orderBy('name', 'asc').paginate(page, limit)

      return response.json({
        message: 'Services retrieved successfully',
        ...services.serialize(),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error retrieving services',
        error: error.message,
      })
    }
  }

  /**
   * Create a new service with zipcodes (admin only)
   */
  async store({ request, response }: HttpContext) {
    try {
      const serviceData = request.only([
        'name',
        'slug',
        'description',
        'fullDescription',
        'detailedDescription',
        'whatIs',
        'typicalVisit',
        'category',
        'price',
        'duration',
        'services',
        'benefits',
        'benefitsExtended',
        'gettingStarted',
        'gettingStartedPoints',
        'image',
        'icon',
        'stats',
        'zipcodes',
      ]) as any

      // Handle zipcodes array FIRST (before null handling)
      if (
        serviceData.zipcodes !== undefined &&
        serviceData.zipcodes !== null &&
        serviceData.zipcodes !== '' &&
        serviceData.zipcodes !== 'null'
      ) {
        let processedZipcodes = []

        if (typeof serviceData.zipcodes === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(serviceData.zipcodes)
            if (Array.isArray(parsed)) {
              processedZipcodes = parsed
            } else {
              processedZipcodes = [parsed]
            }
          } catch {
            // If it's a comma-separated string
            processedZipcodes = serviceData.zipcodes
              .split(',')
              .map((zip: string) => zip.trim())
              .filter((zip: string) => zip && zip !== 'NULL' && zip !== 'null')
          }
        } else if (Array.isArray(serviceData.zipcodes)) {
          processedZipcodes = serviceData.zipcodes
        }

        // Flatten and clean the array
        const flattenedZipcodes = []
        for (const item of processedZipcodes) {
          if (typeof item === 'string') {
            if (item.startsWith('[') && item.endsWith(']')) {
              // Try to parse nested JSON strings
              try {
                const nested = JSON.parse(item)
                if (Array.isArray(nested)) {
                  flattenedZipcodes.push(...nested)
                } else {
                  flattenedZipcodes.push(nested)
                }
              } catch {
                flattenedZipcodes.push(item)
              }
            } else {
              flattenedZipcodes.push(item)
            }
          } else {
            flattenedZipcodes.push(item)
          }
        }

        // Final cleanup and normalization using helper (remove spaces/special chars)
        serviceData.zipcodes = flattenedZipcodes
          .map((zip: any) => this.normalizeZipcode(zip))
          .filter((zip: string) => zip !== '')
      }

      // Handle null values properly (but skip zipcodes since we handled it above)
      Object.keys(serviceData).forEach((key: string) => {
        if (key !== 'zipcodes' && (serviceData[key] === 'null' || serviceData[key] === '')) {
          serviceData[key] = null
        }
      })

      // Convert array fields to JSON strings for storage
      if (serviceData.services !== undefined && serviceData.services !== null) {
        if (Array.isArray(serviceData.services)) {
          serviceData.services = JSON.stringify(serviceData.services)
        } else if (typeof serviceData.services === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(serviceData.services)
            serviceData.services = JSON.stringify(parsed)
          } catch {
            // If it's a comma-separated string, convert to array then JSON
            const servicesArray = serviceData.services
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            serviceData.services = JSON.stringify(servicesArray)
          }
        }
      }

      if (
        serviceData.gettingStartedPoints !== undefined &&
        serviceData.gettingStartedPoints !== null
      ) {
        if (Array.isArray(serviceData.gettingStartedPoints)) {
          serviceData.gettingStartedPoints = JSON.stringify(serviceData.gettingStartedPoints)
        } else if (typeof serviceData.gettingStartedPoints === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(serviceData.gettingStartedPoints)
            serviceData.gettingStartedPoints = JSON.stringify(parsed)
          } catch {
            // If it's a comma-separated string, convert to array then JSON
            const pointsArray = serviceData.gettingStartedPoints
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            serviceData.gettingStartedPoints = JSON.stringify(pointsArray)
          }
        }
      }

      // Handle stats field with better error handling
      if (serviceData.stats !== undefined && serviceData.stats !== null) {
        if (Array.isArray(serviceData.stats)) {
          serviceData.stats = JSON.stringify(serviceData.stats)
        } else if (typeof serviceData.stats === 'object') {
          serviceData.stats = JSON.stringify(serviceData.stats)
        } else if (typeof serviceData.stats === 'string') {
          // Check for [object Object] strings which are invalid
          if (serviceData.stats.includes('[object Object]')) {
            console.log(
              '⚠️ STATS WARNING - Received invalid [object Object] string, setting to null'
            )
            serviceData.stats = null
          } else {
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(serviceData.stats)
              serviceData.stats = JSON.stringify(parsed)
            } catch {
              console.log(
                '⚠️ STATS WARNING - Invalid JSON string, setting to null:',
                serviceData.stats
              )
              serviceData.stats = null
            }
          }
        }
      }

      // Convert zipcodes array to JSON for database storage
      if (serviceData.zipcodes && Array.isArray(serviceData.zipcodes)) {
        serviceData.zipcodes = JSON.stringify(serviceData.zipcodes)
      }

      // Create the service
      const service = await Service.create({
        ...serviceData,
        isActive: true,
      })

      return response.status(201).json({
        message: `Service created successfully with ${
          serviceData.zipcodes ? JSON.parse(serviceData.zipcodes).length : 0
        } zipcode(s)`,
        data: service,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error creating service',
        error: error.message,
      })
    }
  }

  /**
   * Get a single service
   */
  async show({ params, response }: HttpContext) {
    try {
      const service = await Service.find(params.id)

      if (!service) {
        return response.status(404).json({
          message: 'Service not found',
        })
      }

      return response.json({
        message: 'Service retrieved successfully',
        data: service,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error retrieving service',
        error: error.message,
      })
    }
  }

  /**
   * Update a service (admin only)
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const service = await Service.find(params.id)

      if (!service) {
        return response.status(404).json({
          message: 'Service not found',
        })
      }

      const data = request.only([
        'name',
        'slug',
        'description',
        'fullDescription',
        'detailedDescription',
        'whatIs',
        'typicalVisit',
        'category',
        'price',
        'duration',
        'services',
        'benefits',
        'benefitsExtended',
        'gettingStarted',
        'gettingStartedPoints',
        'image',
        'icon',
        'zipcodes',
        'isActive',
      ]) as any

      console.log('🔍 DEBUG - Raw zipcodes:', data.zipcodes, 'Type:', typeof data.zipcodes)

      // Handle zipcodes array FIRST (before null handling)
      if (
        data.zipcodes !== undefined &&
        data.zipcodes !== null &&
        data.zipcodes !== '' &&
        data.zipcodes !== 'null'
      ) {
        let processedZipcodes = []

        if (typeof data.zipcodes === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(data.zipcodes)
            console.log('✅ DEBUG - Parsed JSON:', parsed)

            if (Array.isArray(parsed)) {
              processedZipcodes = parsed
            } else {
              processedZipcodes = [parsed]
            }
          } catch {
            console.log('❌ DEBUG - Not JSON, treating as comma-separated')
            // If it's a comma-separated string
            processedZipcodes = data.zipcodes
              .split(',')
              .map((zip: string) => zip.trim())
              .filter((zip: string) => zip && zip !== 'NULL' && zip !== 'null')
          }
        } else if (Array.isArray(data.zipcodes)) {
          console.log('✅ DEBUG - Already array:', data.zipcodes)
          processedZipcodes = data.zipcodes
        }

        // Flatten and clean the array
        const flattenedZipcodes = []
        for (const item of processedZipcodes) {
          if (typeof item === 'string') {
            if (item.startsWith('[') && item.endsWith(']')) {
              // Try to parse nested JSON strings
              try {
                const nested = JSON.parse(item)
                if (Array.isArray(nested)) {
                  flattenedZipcodes.push(...nested)
                } else {
                  flattenedZipcodes.push(nested)
                }
              } catch {
                flattenedZipcodes.push(item)
              }
            } else {
              flattenedZipcodes.push(item)
            }
          } else {
            flattenedZipcodes.push(item)
          }
        }

        // Final cleanup and normalization using helper (remove spaces/special chars)
        const finalZipcodes = flattenedZipcodes
          .map((zip: any) => this.normalizeZipcode(zip))
          .filter((zip: string) => zip !== '')

        console.log('🎯 DEBUG - Final zipcodes:', finalZipcodes)
        data.zipcodes = JSON.stringify(finalZipcodes)
      }

      // Handle null values properly (but skip zipcodes since we handled it above)
      Object.keys(data).forEach((key: string) => {
        if (key !== 'zipcodes' && (data[key] === 'null' || data[key] === '')) {
          data[key] = null
        }
      })

      // Convert array fields to JSON strings
      if (data.services !== undefined && data.services !== null) {
        if (Array.isArray(data.services)) {
          data.services = JSON.stringify(data.services)
        } else if (typeof data.services === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(data.services)
            data.services = JSON.stringify(parsed)
          } catch {
            // If it's a comma-separated string, convert to array then JSON
            const servicesArray = data.services
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            data.services = JSON.stringify(servicesArray)
          }
        }
      }

      if (data.gettingStartedPoints !== undefined && data.gettingStartedPoints !== null) {
        if (Array.isArray(data.gettingStartedPoints)) {
          data.gettingStartedPoints = JSON.stringify(data.gettingStartedPoints)
        } else if (typeof data.gettingStartedPoints === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(data.gettingStartedPoints)
            data.gettingStartedPoints = JSON.stringify(parsed)
          } catch {
            // If it's a comma-separated string, convert to array then JSON
            const pointsArray = data.gettingStartedPoints
              .split(',')
              .map((s: string) => s.trim())
              .filter((s: string) => s)
            data.gettingStartedPoints = JSON.stringify(pointsArray)
          }
        }
      }

      // Handle stats field with better error handling
      if (data.stats !== undefined && data.stats !== null) {
        if (Array.isArray(data.stats)) {
          data.stats = JSON.stringify(data.stats)
        } else if (typeof data.stats === 'object') {
          data.stats = JSON.stringify(data.stats)
        } else if (typeof data.stats === 'string') {
          // Check for [object Object] strings which are invalid
          if (data.stats.includes('[object Object]')) {
            console.log(
              '⚠️ STATS WARNING - Received invalid [object Object] string, setting to null'
            )
            data.stats = null
          } else {
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(data.stats)
              data.stats = JSON.stringify(parsed)
            } catch {
              console.log('⚠️ STATS WARNING - Invalid JSON string, setting to null:', data.stats)
              data.stats = null
            }
          }
        }
      }

      service.merge(data)
      await service.save()

      return response.json({
        message: 'Service updated successfully',
        data: service,
      })
    } catch (error: any) {
      return response.status(500).json({
        message: 'Error updating service',
        error: error.message,
      })
    }
  }

  /**
   * Delete a service (admin only)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const service = await Service.find(params.id)

      if (!service) {
        return response.status(404).json({
          message: 'Service not found',
        })
      }

      // Soft delete
      service.isActive = false
      await service.save()

      return response.json({
        message: 'Service deleted successfully',
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error deleting service',
        error: error.message,
      })
    }
  }

  /**
   * Add zipcodes to a service (admin only)
   * Accepts an array of zipcodes and validates them
   */
  async addZipcodes({ params, request, response }: HttpContext) {
    try {
      const service = await Service.find(params.id)

      if (!service) {
        return response.status(404).json({
          message: 'Service not found',
        })
      }

      // Validate request using vine validator
      const data = await request.validateUsing(addZipcodesValidator)
      const { zipcodes } = data

      // Normalize zipcodes (remove spaces/special chars and uppercase)
      const normalizedZipcodes = zipcodes
        .map((zipcode: any) => this.normalizeZipcode(zipcode))
        .filter((z: string) => z !== '')

      // Get existing zipcodes
      let existingZipcodes: string[] = []
      if (service.zipcodes) {
        try {
          if (typeof service.zipcodes === 'string') {
            existingZipcodes = JSON.parse(service.zipcodes)
          } else if (Array.isArray(service.zipcodes)) {
            existingZipcodes = service.zipcodes
          }
        } catch {
          existingZipcodes = []
        }
      }

      // Normalize existing zipcodes (remove spaces/special chars and uppercase)
      existingZipcodes = existingZipcodes
        .map((zip) => this.normalizeZipcode(zip))
        .filter((z: string) => z !== '')

      // Merge and deduplicate
      const mergedZipcodes = [...new Set([...existingZipcodes, ...normalizedZipcodes])]

      // Calculate what was actually added (new zipcodes only)
      const addedZipcodes = normalizedZipcodes.filter((zip) => !existingZipcodes.includes(zip))
      const duplicateZipcodes = normalizedZipcodes.filter((zip) => existingZipcodes.includes(zip))

      // Update service with new zipcodes
      service.zipcodes = JSON.stringify(mergedZipcodes) as any
      await service.save()

      return response.json({
        message: 'Zipcodes processed successfully',
        data: {
          totalZipcodes: mergedZipcodes.length,
          addedCount: addedZipcodes.length,
          duplicateCount: duplicateZipcodes.length,
          added: addedZipcodes,
          duplicates: duplicateZipcodes,
          allZipcodes: mergedZipcodes,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error adding zipcodes to service',
        error: error.message,
      })
    }
  }

  /**
   * Remove a specific zipcode from a service (admin only)
   */
  async removeZipcode({ params, request, response }: HttpContext) {
    try {
      const service = await Service.find(params.id)

      if (!service) {
        return response.status(404).json({
          message: 'Service not found',
        })
      }

      const { zipcode } = request.only(['zipcode'])

      // Validate that zipcode is provided
      if (!zipcode) {
        return response.status(400).json({
          message: 'Zipcode is required',
        })
      }

      // Normalize zipcode (remove spaces/special chars and uppercase)
      const normalizedZipcode = this.normalizeZipcode(zipcode)

      if (!normalizedZipcode) {
        return response.status(400).json({
          message: 'Zipcode must contain letters and/or numbers',
        })
      }

      // Get existing zipcodes
      let existingZipcodes: string[] = []
      if (service.zipcodes) {
        try {
          if (typeof service.zipcodes === 'string') {
            existingZipcodes = JSON.parse(service.zipcodes)
          } else if (Array.isArray(service.zipcodes)) {
            existingZipcodes = service.zipcodes
          }
        } catch {
          existingZipcodes = []
        }
      }

      // Normalize existing zipcodes (remove spaces/special chars and uppercase)
      existingZipcodes = existingZipcodes
        .map((zip) => this.normalizeZipcode(zip))
        .filter((z: string) => z !== '')

      // Check if zipcode exists
      if (!existingZipcodes.includes(normalizedZipcode)) {
        return response.status(404).json({
          message: 'Zipcode not found in service',
          zipcode: normalizedZipcode,
        })
      }

      // Remove the zipcode
      const updatedZipcodes = existingZipcodes.filter((zip) => zip !== normalizedZipcode)

      // Update service
      service.zipcodes = JSON.stringify(updatedZipcodes) as any
      await service.save()

      return response.json({
        message: 'Zipcode removed successfully',
        data: {
          removedZipcode: normalizedZipcode,
          remainingCount: updatedZipcodes.length,
          remainingZipcodes: updatedZipcodes,
        },
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error removing zipcode from service',
        error: error.message,
      })
    }
  }
}
