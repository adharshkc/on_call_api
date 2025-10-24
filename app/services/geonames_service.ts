import env from '#start/env'
import axios from 'axios'

export interface GeoNamesPostalCode {
  postalCode: string
  placeName: string
  adminName1: string // State
  adminCode1: string // State code
  adminName2: string // County
  adminCode2: string // County code
  adminName3: string // City/Town
  adminCode3: string
  lat: number
  lng: number
  countryCode: string
}

export interface GeoNamesLocation {
  placeName: string
  adminName1?: string // State
  adminName2?: string // County
  lat: number
  lng: number
  postalCodes: string[]
}

export class GeoNamesService {
  private static username = env.get('GEONAMES_USERNAME')
  private static baseUrl = env.get('GEONAMES_BASE_URL', 'http://api.geonames.org')

  /**
   * Get postal codes by place name (city, town, or area)
   * This is the main method for getting zipcodes for a location
   */
  static async getPostalCodesByPlace(
    placeName: string,
    options: {
      countryCode?: string // ISO country code (e.g., 'US', 'GB')
      maxRows?: number // Maximum number of results (default 100)
    } = {}
  ): Promise<GeoNamesPostalCode[]> {
    if (!this.username) {
      throw new Error('GEONAMES_USERNAME is not set. Please register at geonames.org')
    }

    const { countryCode = 'US', maxRows = 100 } = options

    try {
      const params = new URLSearchParams()
      params.set('placename', placeName)
      params.set('country', countryCode)
      params.set('maxRows', String(maxRows))
      params.set('username', this.username)

      const url = `${this.baseUrl}/postalCodeSearchJSON`
      const { data } = await axios.get(url, { params })

      if (!data.postalCodes || data.postalCodes.length === 0) {
        console.log(`No postal codes found for place: ${placeName}`)
        return []
      }

      return data.postalCodes.map((pc: any) => ({
        postalCode: pc.postalCode,
        placeName: pc.placeName,
        adminName1: pc.adminName1,
        adminCode1: pc.adminCode1,
        adminName2: pc.adminName2,
        adminCode2: pc.adminCode2,
        adminName3: pc.adminName3,
        adminCode3: pc.adminCode3,
        lat: Number.parseFloat(pc.lat),
        lng: Number.parseFloat(pc.lng),
        countryCode: pc.countryCode,
      }))
    } catch (error: any) {
      console.error('Error fetching postal codes from GeoNames:', error.message)

      // Provide helpful error messages for common issues
      if (error.response?.status === 401) {
        throw new Error(
          'GeoNames authentication failed. Please enable web services at http://www.geonames.org/manageaccount. ' +
            'Log in to your GeoNames account and click "Click here to enable" under Free Web Services.'
        )
      }

      if (error.response?.data?.status?.message) {
        throw new Error(`GeoNames API error: ${error.response.data.status.message}`)
      }

      throw new Error(`GeoNames API error: ${error.message}`)
    }
  }

  /**
   * Get postal codes within a radius of a location (lat/lng)
   * Useful for finding all zipcodes near a specific point
   */
  static async getPostalCodesNearby(
    lat: number,
    lng: number,
    options: {
      radius?: number // in kilometers (default 10)
      maxRows?: number
      countryCode?: string
    } = {}
  ): Promise<GeoNamesPostalCode[]> {
    if (!this.username) {
      throw new Error('GEONAMES_USERNAME is not set. Please register at geonames.org')
    }

    const { radius = 10, maxRows = 100, countryCode } = options

    try {
      const params = new URLSearchParams()
      params.set('lat', String(lat))
      params.set('lng', String(lng))
      params.set('radius', String(radius))
      params.set('maxRows', String(maxRows))
      params.set('username', this.username)

      if (countryCode) {
        params.set('country', countryCode)
      }

      const url = `${this.baseUrl}/findNearbyPostalCodesJSON`
      const { data } = await axios.get(url, { params })

      if (!data.postalCodes || data.postalCodes.length === 0) {
        console.log(`No postal codes found near coordinates: ${lat}, ${lng}`)
        return []
      }

      return data.postalCodes.map((pc: any) => ({
        postalCode: pc.postalCode,
        placeName: pc.placeName,
        adminName1: pc.adminName1,
        adminCode1: pc.adminCode1,
        adminName2: pc.adminName2,
        adminCode2: pc.adminCode2,
        adminName3: pc.adminName3,
        adminCode3: pc.adminCode3,
        lat: Number.parseFloat(pc.lat),
        lng: Number.parseFloat(pc.lng),
        countryCode: pc.countryCode,
      }))
    } catch (error: any) {
      console.error('Error fetching nearby postal codes from GeoNames:', error.message)

      if (error.response?.status === 401) {
        throw new Error(
          'GeoNames authentication failed. Please enable web services at http://www.geonames.org/manageaccount'
        )
      }

      if (error.response?.data?.status?.message) {
        throw new Error(`GeoNames API error: ${error.response.data.status.message}`)
      }

      throw new Error(`GeoNames API error: ${error.message}`)
    }
  }

  /**
   * Get information about a specific postal code
   */
  static async getPostalCodeInfo(
    postalCode: string,
    options: {
      countryCode?: string
      maxRows?: number
    } = {}
  ): Promise<GeoNamesPostalCode[]> {
    if (!this.username) {
      throw new Error('GEONAMES_USERNAME is not set. Please register at geonames.org')
    }

    const { countryCode = 'US', maxRows = 10 } = options

    try {
      const params = new URLSearchParams()
      params.set('postalcode', postalCode)
      params.set('country', countryCode)
      params.set('maxRows', String(maxRows))
      params.set('username', this.username)

      const url = `${this.baseUrl}/postalCodeSearchJSON`
      const { data } = await axios.get(url, { params })

      if (!data.postalCodes || data.postalCodes.length === 0) {
        return []
      }

      return data.postalCodes.map((pc: any) => ({
        postalCode: pc.postalCode,
        placeName: pc.placeName,
        adminName1: pc.adminName1,
        adminCode1: pc.adminCode1,
        adminName2: pc.adminName2,
        adminCode2: pc.adminCode2,
        adminName3: pc.adminName3,
        adminCode3: pc.adminCode3,
        lat: Number.parseFloat(pc.lat),
        lng: Number.parseFloat(pc.lng),
        countryCode: pc.countryCode,
      }))
    } catch (error: any) {
      console.error('Error fetching postal code info from GeoNames:', error.message)

      if (error.response?.status === 401) {
        throw new Error(
          'GeoNames authentication failed. Please enable web services at http://www.geonames.org/manageaccount'
        )
      }

      if (error.response?.data?.status?.message) {
        throw new Error(`GeoNames API error: ${error.response.data.status.message}`)
      }

      throw new Error(`GeoNames API error: ${error.message}`)
    }
  }

  /**
   * Get all postal codes in a specific administrative area (state, county, etc.)
   * This is useful for getting comprehensive coverage of a region
   */
  static async getPostalCodesByAdminArea(
    adminCode: string,
    options: {
      countryCode?: string
      adminLevel?: 1 | 2 | 3 // 1 = State, 2 = County, 3 = City
      maxRows?: number
    } = {}
  ): Promise<GeoNamesPostalCode[]> {
    if (!this.username) {
      throw new Error('GEONAMES_USERNAME is not set. Please register at geonames.org')
    }

    const { countryCode = 'US', adminLevel = 1, maxRows = 1000 } = options

    try {
      const params = new URLSearchParams()
      params.set('country', countryCode)
      params.set('maxRows', String(maxRows))
      params.set('username', this.username)

      // Set the appropriate admin code based on level
      if (adminLevel === 1) {
        params.set('adminCode1', adminCode)
      } else if (adminLevel === 2) {
        params.set('adminCode2', adminCode)
      } else if (adminLevel === 3) {
        params.set('adminCode3', adminCode)
      }

      const url = `${this.baseUrl}/postalCodeSearchJSON`
      const { data } = await axios.get(url, { params })

      if (!data.postalCodes || data.postalCodes.length === 0) {
        console.log(`No postal codes found for admin code: ${adminCode}`)
        return []
      }

      return data.postalCodes.map((pc: any) => ({
        postalCode: pc.postalCode,
        placeName: pc.placeName,
        adminName1: pc.adminName1,
        adminCode1: pc.adminCode1,
        adminName2: pc.adminName2,
        adminCode2: pc.adminCode2,
        adminName3: pc.adminName3,
        adminCode3: pc.adminCode3,
        lat: Number.parseFloat(pc.lat),
        lng: Number.parseFloat(pc.lng),
        countryCode: pc.countryCode,
      }))
    } catch (error: any) {
      console.error('Error fetching postal codes by admin area from GeoNames:', error.message)

      if (error.response?.status === 401) {
        throw new Error(
          'GeoNames authentication failed. Please enable web services at http://www.geonames.org/manageaccount'
        )
      }

      if (error.response?.data?.status?.message) {
        throw new Error(`GeoNames API error: ${error.response.data.status.message}`)
      }

      throw new Error(`GeoNames API error: ${error.message}`)
    }
  }

  /**
   * Search for places by name and get their postal codes
   * This combines place search with postal code lookup
   */
  static async searchPlaceWithPostalCodes(
    placeName: string,
    options: {
      countryCode?: string
      maxRows?: number
    } = {}
  ): Promise<GeoNamesLocation[]> {
    const postalCodes = await this.getPostalCodesByPlace(placeName, options)

    // Group postal codes by place/city
    const placeMap = new Map<string, GeoNamesLocation>()

    for (const pc of postalCodes) {
      const key = `${pc.placeName}-${pc.adminName2 || ''}`

      if (!placeMap.has(key)) {
        placeMap.set(key, {
          placeName: pc.placeName,
          adminName1: pc.adminName1,
          adminName2: pc.adminName2,
          lat: pc.lat,
          lng: pc.lng,
          postalCodes: [],
        })
      }

      const location = placeMap.get(key)!
      if (!location.postalCodes.includes(pc.postalCode)) {
        location.postalCodes.push(pc.postalCode)
      }
    }

    return Array.from(placeMap.values())
  }
}

export default GeoNamesService
