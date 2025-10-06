import env from '#start/env'
import axios from 'axios'

export interface GeoapifySuggestion {
  id: string
  name: string
  address: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  lat: number
  lng: number
  placeType?: string
  category?: string
}

export class GeoapifyService {
  private static apiKey = env.get('GEOAPIFY_API_KEY')
  private static baseUrl = env.get('GEOAPIFY_BASE_URL', 'https://api.geoapify.com/v1')

  /**
   * Call Geoapify Autocomplete endpoint and map to a simple suggestion list
   */
  static async autocomplete(
    text: string,
    options: {
      limit?: number
      countryCode?: string
      filter?: string
      bias?: string
      lang?: string
    } = {}
  ): Promise<GeoapifySuggestion[]> {
    if (!this.apiKey) {
      throw new Error('GEOAPIFY_API_KEY is not set')
    }

    const { limit = 10, countryCode, filter, bias, lang = 'en' } = options

    const params = new URLSearchParams()
    params.set('text', text)
    params.set('apiKey', this.apiKey)
    params.set('limit', String(limit))
    params.set('format', 'geojson')
    params.set('lang', lang)

    // Country filter: Geoapify supports filter=countrycode:xx
    const filters: string[] = []
    if (countryCode) filters.push(`countrycode:${countryCode}`)
    if (filter) filters.push(filter)
    if (filters.length) params.set('filter', filters.join(','))
    if (bias) params.set('bias', bias)

    const url = `${this.baseUrl}/geocode/autocomplete`
    const { data } = await axios.get(url, { params })
    const features: any[] = data?.features ?? []
    return features.map((f) => this.mapFeatureToSuggestion(f))
  }

  /**
   * Get postcodes for a specific location using Geoapify
   * This searches for postcodes in the vicinity of the selected location
   */
  static async getPostcodesForLocation(
    lat: number,
    lng: number,
    options: {
      radius?: number // in meters, default 5000 (5km)
      limit?: number
      countryCode?: string
    } = {}
  ): Promise<string[]> {
    if (!this.apiKey) {
      throw new Error('GEOAPIFY_API_KEY is not set')
    }

    const { radius = 5000, limit = 50, countryCode = 'gb' } = options

    try {
      // Use reverse geocoding first to get the area information
      const location = await this.reverseGeocode(lat, lng)
      if (!location) {
        return []
      }

      // Create search params with a text parameter (required by Geoapify)
      const params = new URLSearchParams()
      params.set('apiKey', this.apiKey)
      params.set('format', 'geojson')
      params.set('limit', String(limit))

      // Use the city or area name as the text parameter
      const searchText = location.city || location.state || location.country || 'postcode'
      params.set('text', searchText)
      params.set('type', 'postcode')

      // Add filters for location and country
      const filters: string[] = []
      filters.push(`circle:${lng},${lat},${radius}`)
      if (countryCode) filters.push(`countrycode:${countryCode}`)
      params.set('filter', filters.join(','))

      const url = `${this.baseUrl}/geocode/search`
      const { data } = await axios.get(url, { params })
      const features: any[] = data?.features ?? []

      // Extract unique postcodes
      const postcodes = new Set<string>()
      for (const feature of features) {
        const postcode = feature?.properties?.postcode
        if (postcode) {
          postcodes.add(postcode)
        }
      }

      return Array.from(postcodes).sort()
    } catch (error) {
      console.error('Error fetching postcodes from Geoapify:', error)

      // Fallback: try reverse geocoding
      try {
        const location = await this.reverseGeocode(lat, lng)
        return location?.zipCode ? [location.zipCode] : []
      } catch (reverseError) {
        console.error('Reverse geocoding fallback failed:', reverseError)
        return []
      }
    }
  }

  /**
   * Reverse geocode coordinates to get location information
   */
  static async reverseGeocode(lat: number, lng: number): Promise<GeoapifySuggestion | null> {
    if (!this.apiKey) {
      throw new Error('GEOAPIFY_API_KEY is not set')
    }

    try {
      const params = new URLSearchParams()
      params.set('lat', String(lat))
      params.set('lon', String(lng))
      params.set('apiKey', this.apiKey)
      params.set('format', 'geojson')
      params.set('limit', '1')

      const url = `${this.baseUrl}/geocode/reverse`
      const { data } = await axios.get(url, { params })
      const features: any[] = data?.features ?? []

      if (features.length > 0) {
        return this.mapFeatureToSuggestion(features[0])
      }

      return null
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return null
    }
  }

  private static mapFeatureToSuggestion(feature: any): GeoapifySuggestion {
    const p = feature?.properties || {}
    const name = p.name || this.extractName(p.formatted)
    return {
      id: p.place_id,
      name,
      address: p.formatted,
      city: p.city,
      state: p.state,
      zipCode: p.postcode,
      country: p.country,
      lat: p.lat,
      lng: p.lon,
      placeType: p.place_type,
      category: p.category,
    }
  }

  private static extractName(formatted?: string): string {
    if (!formatted) return ''
    const parts = formatted.split(',')
    return parts[0]?.trim() || formatted
  }
}

export default GeoapifyService
