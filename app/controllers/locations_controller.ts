import type { HttpContext } from '@adonisjs/core/http'
import Location from '#models/location'
import Database from '@adonisjs/lucid/services/db'
import GeoapifyService from '#services/geoapify_service'

export default class LocationsController {
  /**
   * Search locations by name with region filtering
   * Used for admin dropdown when typing area name
   */
  async search({ request, response }: HttpContext) {
    const query = request.qs().q as string
    const region = request.qs().region || 'england'
    const limit = Number.parseInt(request.qs().limit || '10')

    if (!query || query.length < 2) {
      return response.json({
        message: 'Query must be at least 2 characters long',
        data: [],
      })
    }

    try {
      const locations = await Location.query()
        .where('region', region)
        .where('is_active', true)
        .where((builder) => {
          builder
            .whereILike('name', `%${query}%`)
            .orWhereILike('county', `%${query}%`)
            .orWhereILike('postcode', `%${query}%`)
        })
        .orderBy('name', 'asc')
        .limit(limit)

      return response.json({
        message: 'Locations found',
        data: locations.map((location) => ({
          id: location.id,
          name: location.name,
          type: location.type,
          county: location.county,
          region: location.region,
          postcode: location.postcode,
          displayName: `${location.name}, ${location.county}`,
        })),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error searching locations',
        error: error.message,
      })
    }
  }

  /**
   * Autocomplete locations using Geoapify (external API)
   * GET /api/locations/autocomplete?q=manch&limit=5&country=gb
   */
  async autocomplete({ request, response }: HttpContext) {
    const q = (request.qs().q as string) || ''
    const limit = Number.parseInt(request.qs().limit || '10')
    const country = (request.qs().country as string) || undefined
    const filter = (request.qs().filter as string) || undefined
    const bias = (request.qs().bias as string) || undefined
    const lang = (request.qs().lang as string) || 'en'

    if (!q || q.trim().length < 2) {
      return response.status(400).json({
        message: 'Query must be at least 2 characters',
        data: [],
      })
    }

    try {
      const results = await GeoapifyService.autocomplete(q, {
        limit,
        countryCode: country,
        filter,
        bias,
        lang,
      })
      return response.json({
        message: 'Suggestions retrieved',
        data: results,
        meta: { q, limit, count: results.length, source: 'geoapify' },
      })
    } catch (error: any) {
      return response.status(502).json({
        message: 'Geoapify request failed',
        error: error?.message || 'Unknown error',
      })
    }
  }

  /**
   * Get postcodes for a location using Geoapify API
   * Used when admin selects a location from autocomplete to get all postcodes in that area
   * GET /api/locations/postcodes?lat=53.4808&lng=-2.2426&radius=5000&limit=50
   */
  async getPostcodesFromGeoapify({ request, response }: HttpContext) {
    const lat = Number.parseFloat(request.qs().lat as string)
    const lng = Number.parseFloat(request.qs().lng as string)
    const radius = Number.parseInt(request.qs().radius as string) || 5000 // default 5km
    const limit = Number.parseInt(request.qs().limit as string) || 50
    const countryCode = (request.qs().countryCode as string) || 'gb'

    if (!lat || !lng || Number.isNaN(lat) || Number.isNaN(lng)) {
      return response.status(400).json({
        message: 'Valid latitude and longitude are required',
        data: [],
      })
    }

    try {
      const postcodes = await GeoapifyService.getPostcodesForLocation(lat, lng, {
        radius,
        limit,
        countryCode,
      })

      return response.json({
        message: 'Postcodes retrieved successfully',
        data: postcodes.map((postcode) => ({
          postcode: postcode,
          displayName: postcode,
        })),
        meta: {
          lat,
          lng,
          radius,
          count: postcodes.length,
          source: 'geoapify',
        },
      })
    } catch (error: any) {
      return response.status(502).json({
        message: 'Failed to fetch postcodes from Geoapify',
        error: error?.message || 'Unknown error',
      })
    }
  }

  /**
   * Get all postcodes for a specific location
   * Used when admin selects a location to get all zipcodes in that area
   */
  async getPostcodes({ params, response }: HttpContext) {
    const locationId = params.id

    try {
      const location = await Location.find(locationId)

      if (!location) {
        return response.status(404).json({
          message: 'Location not found',
        })
      }

      // Get all postcodes related to this location
      // This could be from a separate postcodes table or API
      // For now, we'll return the main postcode and simulate nearby ones
      const postcodes = await Database.rawQuery(
        `
        SELECT DISTINCT postcode
        FROM locations 
        WHERE (name = ? OR county = ?) 
        AND region = ? 
        AND is_active = true 
        ORDER BY postcode
        `,
        [location.name, location.county, location.region]
      )

      return response.json({
        message: 'Postcodes found',
        location: {
          id: location.id,
          name: location.name,
          county: location.county,
          region: location.region,
        },
        data: postcodes.map((row: any) => ({
          postcode: row.postcode,
          displayName: row.postcode,
        })),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error fetching postcodes',
        error: error.message,
      })
    }
  }

  /**
   * Add a new location (admin only)
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'name',
        'type',
        'region',
        'county',
        'postcode',
        'latitude',
        'longitude',
      ])

      const location = await Location.create({
        ...data,
        isActive: true,
      })

      return response.status(201).json({
        message: 'Location created successfully',
        data: location,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error creating location',
        error: error.message,
      })
    }
  }

  /**
   * Get all locations with pagination
   */
  async index({ request, response }: HttpContext) {
    const page = Number.parseInt(request.qs().page || '1')
    const limit = Number.parseInt(request.qs().limit || '20')
    const region = request.qs().region
    const search = request.qs().search

    try {
      const query = Location.query().where('is_active', true)

      if (region) {
        query.where('region', region)
      }

      if (search) {
        query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('county', `%${search}%`)
            .orWhereILike('postcode', `%${search}%`)
        })
      }

      const locations = await query
        .orderBy('region', 'asc')
        .orderBy('name', 'asc')
        .paginate(page, limit)

      return response.json({
        message: 'Locations retrieved successfully',
        ...locations.serialize(),
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error retrieving locations',
        error: error.message,
      })
    }
  }

  /**
   * Get a single location
   */
  async show({ params, response }: HttpContext) {
    try {
      const location = await Location.find(params.id)

      if (!location) {
        return response.status(404).json({
          message: 'Location not found',
        })
      }

      return response.json({
        message: 'Location retrieved successfully',
        data: location,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error retrieving location',
        error: error.message,
      })
    }
  }

  /**
   * Update a location
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const location = await Location.find(params.id)

      if (!location) {
        return response.status(404).json({
          message: 'Location not found',
        })
      }

      const data = request.only([
        'name',
        'type',
        'region',
        'county',
        'postcode',
        'latitude',
        'longitude',
        'isActive',
      ])

      location.merge(data)
      await location.save()

      return response.json({
        message: 'Location updated successfully',
        data: location,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error updating location',
        error: error.message,
      })
    }
  }

  /**
   * Delete a location
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const location = await Location.find(params.id)

      if (!location) {
        return response.status(404).json({
          message: 'Location not found',
        })
      }

      // Soft delete by setting is_active to false
      location.isActive = false
      await location.save()

      return response.json({
        message: 'Location deleted successfully',
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error deleting location',
        error: error.message,
      })
    }
  }
}
