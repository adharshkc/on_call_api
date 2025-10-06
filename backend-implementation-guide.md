# AdonisJS Backend Implementation Guide
## Location Search API Implementation with Geoapify

This guide provides a complete step-by-step implementation of the location search API endpoints using **Geoapify Geocoder Autocomplete** for location suggestions and a custom database for service providers.

## Overview

Instead of maintaining a custom location database, we'll use Geoapify's powerful geocoding API for location suggestions and store only service providers in our database. This approach provides:

- **Real-time location suggestions** from Geoapify's global database
- **Accurate geocoding** with coordinates
- **Address standardization** and validation
- **Reduced database complexity**
- **Up-to-date location data**

## Table of Contents
1. [Setup Geoapify](#setup-geoapify)
2. [Database Setup](#database-setup)
3. [Models](#models)
4. [Services](#services)
5. [Controllers](#controllers)
6. [Validation](#validation)
7. [Routes](#routes)
8. [Testing](#testing)
9. [Deployment Considerations](#deployment-considerations)

---

## 1. Setup Geoapify

### Install Required Dependencies

```bash
npm install axios
npm install @types/axios --save-dev
```

### Get Geoapify API Key

1. Visit [Geoapify.com](https://www.geoapify.com/)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Free tier includes 3,000 requests/day

### Environment Configuration

Add to your `.env` file:

```bash
# Geoapify Configuration
GEOAPIFY_API_KEY=your_geoapify_api_key_here
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1
```

Also ensure start/env.ts includes GEOAPIFY_API_KEY and GEOAPIFY_BASE_URL as optional strings.

---

## 2. Database Setup

Since we're using Geoapify for location suggestions, we only need to store service providers and optionally cache frequently searched locations.

### Create Migration for Service Providers Table

```bash
node ace make:migration create_service_providers_table
```

**Migration File:** `database/migrations/xxxx_create_service_providers_table.ts`

```typescript
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'service_providers'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('name', 255).notNullable()
      table.text('address').notNullable()
      table.string('city', 100).notNullable()
      table.string('state', 50).notNullable()
      table.string('zip_code', 20).nullable()
      table.string('phone', 20).nullable()
      table.string('email').nullable()
      table.enum('service_type', ['Home Care', 'Specialist Care', 'Emergency Care', 'Mental Health']).notNullable()
      table.enum('availability_status', ['Available', 'Busy', 'Offline']).defaultTo('Available')
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.boolean('is_active').defaultTo(true)
      table.text('description').nullable()
      table.json('services_offered').nullable()
      table.decimal('rating', 2, 1).nullable()
      
      // Foreign key to locations (optional - for saved locations)
      table.uuid('location_id').nullable()
      table.string('geoapify_place_id').nullable() // Store Geoapify place ID for reference
      
      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['city', 'state'])
      table.index(['service_type'])
      table.index(['availability_status'])
      table.index(['latitude', 'longitude'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### Optional: Create Migration for Location Cache Table

```bash
node ace make:migration create_location_cache_table
```

**Migration File:** `database/migrations/xxxx_create_location_cache_table.ts`

```typescript
import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'location_cache'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('gen_random_uuid()'))
      table.string('place_id').notNullable().unique() // Geoapify place_id
      table.string('formatted_address').notNullable()
      table.string('name').nullable()
      table.string('city').nullable()
      table.string('state').nullable()
      table.string('country').nullable()
      table.string('postcode').nullable()
      table.decimal('latitude', 10, 8).notNullable()
      table.decimal('longitude', 11, 8).notNullable()
      table.json('geoapify_data').nullable() // Store full Geoapify response
      table.integer('search_count').defaultTo(1) // Track popularity
      
      // Timestamps
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })

      // Indexes
      table.index(['place_id'])
      table.index(['city', 'state'])
      table.index(['search_count'])
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
```

### Run Migrations

```bash
node ace migration:run
```

---

## 3. Models

### Service Provider Model

```bash
node ace make:model ServiceProvider
```

**File:** `app/Models/ServiceProvider.ts`

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, computed, belongsTo, BelongsTo } from '@ioc:Adonis/Lucid/Orm'
import Location from './Location'

export default class ServiceProvider extends BaseModel {
  public static table = 'service_providers'

  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column()
  public address: string

  @column()
  public city: string

  @column()
  public state: string

  @column({ columnName: 'zip_code' })
  public zipCode: string

  @column()
  public phone: string

  @column()
  public email: string

  @column({ columnName: 'service_type' })
  public serviceType: string

  @column({ columnName: 'availability_status' })
  public availabilityStatus: string

  @column()
  public latitude: number

  @column()
  public longitude: number

  @column({ columnName: 'is_active' })
  public isActive: boolean

  @column()
  public description: string

  @column({
    columnName: 'services_offered',
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value || '[]'),
  })
  public servicesOffered: string[]

  @column()
  public rating: number

  @column({ columnName: 'location_id' })
  public locationId: string | null

  @column({ columnName: 'geoapify_place_id' })
  public geoapifyPlaceId: string | null

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  // Computed properties
  @computed()
  public get fullAddress() {
    const parts = [this.address, this.city, this.state, this.zipCode].filter(Boolean)
    return parts.join(', ')
  }

  @computed()
  public get contactNumber() {
    return this.phone
  }

  @computed()
  public get availability() {
    return this.availabilityStatus
  }

  // Static methods for location-based search
  public static async findByLocation(filters: {
    city?: string
    state?: string
    zipCode?: string
    lat?: number
    lng?: number
    serviceType?: string
    availability?: string
    radius?: number // in kilometers
    geoapifyPlaceId?: string
  }) {
    let query = this.query().where('is_active', true)

    // Filter by Geoapify place ID (most accurate)
    if (filters.geoapifyPlaceId) {
      query = query.where('geoapify_place_id', filters.geoapifyPlaceId)
    }

    // Filter by city and state
    if (filters.city) {
      query = query.whereILike('city', `%${filters.city}%`)
    }
    if (filters.state) {
      query = query.whereILike('state', `%${filters.state}%`)
    }
    if (filters.zipCode) {
      query = query.where('zip_code', filters.zipCode)
    }

    // Filter by service type
    if (filters.serviceType) {
      query = query.where('service_type', filters.serviceType)
    }

    // Filter by availability
    if (filters.availability) {
      query = query.where('availability_status', filters.availability)
    }

    // Geographic proximity search (if coordinates provided)
    if (filters.lat && filters.lng) {
      const radius = filters.radius || 50 // Default 50km radius
      query = query.whereRaw(`
        ST_DWithin(
          ST_MakePoint(longitude, latitude)::geography,
          ST_MakePoint(?, ?)::geography,
          ?
        )
      `, [filters.lng, filters.lat, radius * 1000]) // Convert km to meters
    }

    return query.orderBy('rating', 'desc').orderBy('created_at', 'desc')
  }
}

### Location Cache Model (Optional)

```bash
node ace make:model LocationCache
```

**File:** `app/Models/LocationCache.ts`

```typescript
import { DateTime } from 'luxon'
import { BaseModel, column, computed } from '@ioc:Adonis/Lucid/Orm'

export default class LocationCache extends BaseModel {
  public static table = 'location_cache'

  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'place_id' })
  public placeId: string

  @column({ columnName: 'formatted_address' })
  public formattedAddress: string

  @column()
  public name: string

  @column()
  public city: string

  @column()
  public state: string

  @column()
  public country: string

  @column()
  public postcode: string

  @column()
  public latitude: number

  @column()
  public longitude: number

  @column({
    columnName: 'geoapify_data',
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value || '{}'),
  })
  public geoapifyData: Record<string, any>

  @column({ columnName: 'search_count' })
  public searchCount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @computed()
  public get coordinates() {
    return {
      lat: this.latitude,
      lng: this.longitude
    }
  }

  // Increment search count when location is accessed
  public async incrementSearchCount() {
    this.searchCount += 1
    await this.save()
  }

  // Get popular locations
  public static async getPopular(limit: number = 10) {
    return await this.query()
      .orderBy('search_count', 'desc')
      .limit(limit)
  }
}
}
```

---

## 5. Controllers

### Locations Controller

```bash
node ace make:controller Location
```

**File:** `app/Controllers/Http/LocationsController.ts`

```typescript
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import GeoapifyService from 'App/Services/GeoapifyService'
import ServiceProvider from 'App/Models/ServiceProvider'
import SearchLocationValidator from 'App/Validators/SearchLocationValidator'

export default class LocationsController {
  /**
   * Search for locations using Geoapify Autocomplete API
   * GET /api/locations/search
   */
  public async search({ request, response }: HttpContextContract) {
    try {
      // Validate request parameters
      const payload = await request.validate(SearchLocationValidator)
      const { 
        q, 
        limit = 10, 
        country = 'us', 
        filter, 
        bias,
        lang = 'en' 
      } = payload

      // Search using Geoapify
      const locations = await GeoapifyService.searchLocations(q, {
        limit,
        countryCode: country,
        filter,
        bias,
        lang
      })

      return response.json({
        data: locations,
        meta: {
          query: q,
          limit,
          count: locations.length,
          source: 'geoapify'
        }
      })
    } catch (error) {
      if (error.messages) {
        return response.status(400).json({
          message: 'Validation failed',
          errors: error.messages
        })
      }

      console.error('Location search error:', error)
      return response.status(500).json({
        message: 'Failed to search locations'
      })
    }
  }

  /**
   * Get place details by Geoapify place ID
   * GET /api/locations/:placeId/details
   */
  public async getPlaceDetails({ params, response }: HttpContextContract) {
    try {
      const placeDetails = await GeoapifyService.getPlaceDetails(params.placeId)

      if (!placeDetails) {
        return response.status(404).json({
          message: 'Location not found'
        })
      }

      return response.json({
        data: placeDetails
      })
    } catch (error) {
      console.error('Place details error:', error)
      return response.status(500).json({
        message: 'Failed to get place details'
      })
    }
  }

  /**
   * Reverse geocode coordinates to get location
   * GET /api/locations/reverse?lat=40.7128&lng=-74.0060
   */
  public async reverseGeocode({ request, response }: HttpContextContract) {
    try {
      const lat = request.input('lat')
      const lng = request.input('lng')

      if (!lat || !lng) {
        return response.status(400).json({
          message: 'Latitude and longitude are required'
        })
      }

      const location = await GeoapifyService.reverseGeocode(
        parseFloat(lat),
        parseFloat(lng)
      )

      if (!location) {
        return response.status(404).json({
          message: 'No location found for these coordinates'
        })
      }

      return response.json({
        data: location
      })
    } catch (error) {
      console.error('Reverse geocode error:', error)
      return response.status(500).json({
        message: 'Failed to reverse geocode location'
      })
    }
  }

  /**
   * Add a location to service provider (not creating new locations in our DB)
   * POST /api/locations/assign
   */
  public async assignToProvider({ request, response }: HttpContextContract) {
    try {
      const {
        providerId,
        placeId,
        address,
        city,
        state,
        zipCode,
        lat,
        lng
      } = request.only([
        'providerId',
        'placeId', 
        'address',
        'city',
        'state',
        'zipCode',
        'lat',
        'lng'
      ])

      if (!providerId) {
        return response.status(400).json({
          message: 'Provider ID is required'
        })
      }

      // Find the service provider
      const provider = await ServiceProvider.findOrFail(providerId)

      // Update provider with location information
      provider.merge({
        geoapifyPlaceId: placeId,
        address: address || provider.address,
        city: city || provider.city,
        state: state || provider.state,
        zipCode: zipCode || provider.zipCode,
        latitude: lat || provider.latitude,
        longitude: lng || provider.longitude,
      })

      await provider.save()

      return response.json({
        message: 'Location assigned to provider successfully',
        data: {
          providerId: provider.id,
          placeId: provider.geoapifyPlaceId,
          location: {
            address: provider.address,
            city: provider.city,
            state: provider.state,
            coordinates: {
              lat: provider.latitude,
              lng: provider.longitude
            }
          }
        }
      })
    } catch (error) {
      console.error('Location assignment error:', error)
      return response.status(500).json({
        message: 'Failed to assign location to provider'
      })
    }
  }

  /**
   * Health check for Geoapify API
   * GET /api/locations/health
   */
  public async health({ response }: HttpContextContract) {
    try {
      const isConnected = await GeoapifyService.validateConnection()
      
      return response.json({
        status: isConnected ? 'connected' : 'disconnected',
        service: 'Geoapify Geocoding API',
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return response.status(500).json({
        status: 'error',
        service: 'Geoapify Geocoding API',
        message: 'Health check failed'
      })
    }
  }
}
```

### Service Providers Controller

```bash
node ace make:controller ServiceProvider
```

**File:** `app/Controllers/Http/ServiceProvidersController.ts`

```typescript
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import ServiceProvider from 'App/Models/ServiceProvider'
import SearchProviderValidator from 'App/Validators/SearchProviderValidator'

export default class ServiceProvidersController {
  /**
   * Find service providers by location
   * GET /api/providers/location
   */
  public async findByLocation({ request, response }: HttpContextContract) {
    try {
      // Validate request parameters
      const payload = await request.validate(SearchProviderValidator)
      const {
        city,
        state,
        zipCode,
        lat,
        lng,
        serviceType,
        availability,
        page = 1,
        per_page = 10,
        radius = 50
      } = payload

      // Build search query
      const query = await ServiceProvider.findByLocation({
        city,
        state,
        zipCode,
        lat: lat ? parseFloat(lat.toString()) : undefined,
        lng: lng ? parseFloat(lng.toString()) : undefined,
        serviceType,
        availability,
        radius: radius ? parseInt(radius.toString()) : 50,
        geoapifyPlaceId: placeId
      })

      // Apply pagination
      const providers = await query.paginate(page, per_page)

      return response.json({
        data: providers.all().map(provider => ({
          id: provider.id,
          name: provider.name,
          address: provider.fullAddress,
          city: provider.city,
          state: provider.state,
          zipCode: provider.zipCode,
          serviceType: provider.serviceType,
          availability: provider.availability,
          contactNumber: provider.contactNumber,
          rating: provider.rating,
          servicesOffered: provider.servicesOffered,
          geoapifyPlaceId: provider.geoapifyPlaceId,
          coordinates: {
            lat: provider.latitude,
            lng: provider.longitude
          }
        })),
        meta: {
          ...providers.getMeta(),
          searchParams: {
            city,
            state,
            zipCode,
            serviceType,
            availability,
            placeId,
            radius
          }
        }
      })
    } catch (error) {
      if (error.messages) {
        return response.status(400).json({
          message: 'Validation failed',
          errors: error.messages
        })
      }

      console.error('Provider search error:', error)
      return response.status(500).json({
        message: 'Failed to search providers'
      })
    }
  }

  /**
   * Get all service providers with pagination
   * GET /api/providers
   */
  public async index({ request, response }: HttpContextContract) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 10)
      const serviceType = request.input('service_type')
      const availability = request.input('availability')

      let query = ServiceProvider.query().where('is_active', true)

      if (serviceType) {
        query = query.where('service_type', serviceType)
      }

      if (availability) {
        query = query.where('availability_status', availability)
      }

      const providers = await query
        .orderBy('rating', 'desc')
        .orderBy('created_at', 'desc')
        .paginate(page, perPage)

      return response.json({
        data: providers.all().map(provider => ({
          id: provider.id,
          name: provider.name,
          address: provider.fullAddress,
          city: provider.city,
          state: provider.state,
          zipCode: provider.zipCode,
          serviceType: provider.serviceType,
          availability: provider.availability,
          contactNumber: provider.contactNumber,
          rating: provider.rating,
        })),
        meta: providers.getMeta()
      })
    } catch (error) {
      console.error('Providers fetch error:', error)
      return response.status(500).json({
        message: 'Failed to fetch providers'
      })
    }
  }
}
```

---

## 4. Services

### Geoapify Service

```bash
mkdir -p app/Services
```

**File:** `app/Services/GeoapifyService.ts`

```typescript
import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import LocationCache from 'App/Models/LocationCache'

interface GeoapifyFeature {
  properties: {
    place_id: string
    formatted: string
    name?: string
    city?: string
    state?: string
    country?: string
    postcode?: string
    lat: number
    lon: number
    category?: string
    place_type?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

interface GeoapifyResponse {
  features: GeoapifyFeature[]
}

export default class GeoapifyService {
  private static apiKey = Env.get('GEOAPIFY_API_KEY')
  private static baseUrl = Env.get('GEOAPIFY_BASE_URL', 'https://api.geoapify.com/v1')

  /**
   * Search for location suggestions using Geoapify Autocomplete API
   */
  public static async searchLocations(
    query: string,
    options: {
      limit?: number
      countryCode?: string
      filter?: string
      bias?: string
      lang?: string
    } = {}
  ): Promise<any[]> {
    try {
      const {
        limit = 10,
        countryCode = 'us', // Default to US, change as needed
        filter,
        bias,
        lang = 'en'
      } = options

      const response = await axios.get<GeoapifyResponse>(`${this.baseUrl}/geocode/autocomplete`, {
        params: {
          text: query,
          apiKey: this.apiKey,
          limit,
          format: 'geojson',
          lang,
          ...(countryCode && { filter: `countrycode:${countryCode}` }),
          ...(filter && { filter }),
          ...(bias && { bias }),
        },
        timeout: 5000
      })

      const suggestions = response.data.features.map(feature => ({
        id: feature.properties.place_id,
        name: feature.properties.name || this.extractLocationName(feature.properties.formatted),
        address: feature.properties.formatted,
        city: feature.properties.city || '',
        state: feature.properties.state || '',
        zipCode: feature.properties.postcode || '',
        country: feature.properties.country || '',
        lat: feature.properties.lat,
        lng: feature.properties.lon,
        placeType: feature.properties.place_type,
        category: feature.properties.category,
        geoapifyData: feature.properties
      }))

      // Optionally cache popular searches
      if (suggestions.length > 0) {
        this.cacheSearchResults(query, suggestions)
      }

      return suggestions
    } catch (error) {
      console.error('Geoapify search error:', error)
      
      // Fallback to cached results if API fails
      return await this.getFallbackResults(query, options.limit || 10)
    }
  }

  /**
   * Get detailed information for a specific place
   */
  public static async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/search`, {
        params: {
          place_id: placeId,
          apiKey: this.apiKey,
          format: 'geojson'
        },
        timeout: 5000
      })

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0]
        return {
          id: feature.properties.place_id,
          name: feature.properties.name || this.extractLocationName(feature.properties.formatted),
          address: feature.properties.formatted,
          city: feature.properties.city || '',
          state: feature.properties.state || '',
          zipCode: feature.properties.postcode || '',
          country: feature.properties.country || '',
          lat: feature.properties.lat,
          lng: feature.properties.lon,
          geoapifyData: feature.properties
        }
      }

      return null
    } catch (error) {
      console.error('Geoapify place details error:', error)
      return null
    }
  }

  /**
   * Reverse geocode coordinates to get location information
   */
  public static async reverseGeocode(lat: number, lng: number): Promise<any | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/reverse`, {
        params: {
          lat,
          lon: lng,
          apiKey: this.apiKey,
          format: 'geojson',
          limit: 1
        },
        timeout: 5000
      })

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0]
        return {
          id: feature.properties.place_id,
          name: feature.properties.name || this.extractLocationName(feature.properties.formatted),
          address: feature.properties.formatted,
          city: feature.properties.city || '',
          state: feature.properties.state || '',
          zipCode: feature.properties.postcode || '',
          country: feature.properties.country || '',
          lat: feature.properties.lat,
          lng: feature.properties.lon,
          geoapifyData: feature.properties
        }
      }

      return null
    } catch (error) {
      console.error('Geoapify reverse geocode error:', error)
      return null
    }
  }

  /**
   * Cache search results for fallback and performance
   */
  private static async cacheSearchResults(query: string, results: any[]) {
    try {
      // Cache the first result if it's a high-quality match
      const firstResult = results[0]
      if (firstResult && firstResult.lat && firstResult.lng) {
        const existingCache = await LocationCache.query()
          .where('place_id', firstResult.id)
          .first()

        if (existingCache) {
          await existingCache.incrementSearchCount()
        } else {
          await LocationCache.create({
            placeId: firstResult.id,
            formattedAddress: firstResult.address,
            name: firstResult.name,
            city: firstResult.city,
            state: firstResult.state,
            country: firstResult.country,
            postcode: firstResult.zipCode,
            latitude: firstResult.lat,
            longitude: firstResult.lng,
            geoapifyData: firstResult.geoapifyData,
            searchCount: 1
          })
        }
      }
    } catch (error) {
      console.error('Error caching search results:', error)
    }
  }

  /**
   * Get fallback results from cache when API is unavailable
   */
  private static async getFallbackResults(query: string, limit: number): Promise<any[]> {
    try {
      const cachedResults = await LocationCache.query()
        .where('formatted_address', 'ilike', `%${query}%`)
        .orWhere('name', 'ilike', `%${query}%`)
        .orWhere('city', 'ilike', `%${query}%`)
        .orderBy('search_count', 'desc')
        .limit(limit)

      return cachedResults.map(cache => ({
        id: cache.placeId,
        name: cache.name,
        address: cache.formattedAddress,
        city: cache.city,
        state: cache.state,
        zipCode: cache.postcode,
        country: cache.country,
        lat: cache.latitude,
        lng: cache.longitude,
        geoapifyData: cache.geoapifyData,
        isCached: true
      }))
    } catch (error) {
      console.error('Error getting fallback results:', error)
      return []
    }
  }

  /**
   * Extract location name from formatted address
   */
  private static extractLocationName(formattedAddress: string): string {
    // Simple extraction - you can enhance this logic
    const parts = formattedAddress.split(',')
    return parts[0].trim()
  }

  /**
   * Validate API key and connection
   */
  public static async validateConnection(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/geocode/autocomplete`, {
        params: {
          text: 'test',
          apiKey: this.apiKey,
          limit: 1,
          format: 'geojson'
        },
        timeout: 3000
      })
      return true
    } catch (error) {
      console.error('Geoapify connection validation failed:', error)
      return false
    }
  }
}
```

---

## 6. Validators

### Search Location Validator

```bash
node ace make:validator SearchLocation
```

**File:** `app/Validators/SearchLocationValidator.ts`

```typescript
import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SearchLocationValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    q: schema.string({ trim: true }, [
      rules.minLength(2),
      rules.maxLength(200)
    ]),
    limit: schema.number.optional([
      rules.range(1, 50)
    ]),
    country: schema.string.optional({ trim: true }, [
      rules.minLength(2),
      rules.maxLength(2),
      rules.alpha()
    ]),
    filter: schema.string.optional({ trim: true }),
    bias: schema.string.optional({ trim: true }),
    lang: schema.string.optional({ trim: true }, [
      rules.minLength(2),
      rules.maxLength(5)
    ])
  })

  public messages: CustomMessages = {
    'q.required': 'Search query is required',
    'q.minLength': 'Search query must be at least 2 characters long',
    'q.maxLength': 'Search query cannot exceed 200 characters',
    'limit.range': 'Limit must be between 1 and 50',
    'country.alpha': 'Country code must contain only letters',
    'country.minLength': 'Country code must be 2 characters',
    'country.maxLength': 'Country code must be 2 characters',
    'lang.minLength': 'Language code must be at least 2 characters',
    'lang.maxLength': 'Language code cannot exceed 5 characters'
  }
}
```

### Search Provider Validator

```bash
node ace make:validator SearchProvider
```

**File:** `app/Validators/SearchProviderValidator.ts`

```typescript
import { schema, CustomMessages, rules } from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class SearchProviderValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    city: schema.string.optional({ trim: true }, [
      rules.minLength(2),
      rules.maxLength(100)
    ]),
    state: schema.string.optional({ trim: true }, [
      rules.minLength(2),
      rules.maxLength(50)
    ]),
    zipCode: schema.string.optional({ trim: true }, [
      rules.maxLength(20)
    ]),
    lat: schema.number.optional([
      rules.range(-90, 90)
    ]),
    lng: schema.number.optional([
      rules.range(-180, 180)
    ]),
    placeId: schema.string.optional({ trim: true }), // Geoapify place ID
    serviceType: schema.enum.optional(['Home Care', 'Specialist Care', 'Emergency Care', 'Mental Health']),
    availability: schema.enum.optional(['Available', 'Busy', 'Offline']),
    page: schema.number.optional([
      rules.range(1, 1000)
    ]),
    per_page: schema.number.optional([
      rules.range(1, 100)
    ]),
    radius: schema.number.optional([
      rules.range(1, 500)
    ])
  })

  public messages: CustomMessages = {
    'city.minLength': 'City must be at least 2 characters long',
    'city.maxLength': 'City cannot exceed 100 characters',
    'state.minLength': 'State must be at least 2 characters long',
    'state.maxLength': 'State cannot exceed 50 characters',
    'lat.range': 'Latitude must be between -90 and 90',
    'lng.range': 'Longitude must be between -180 and 180',
    'page.range': 'Page must be between 1 and 1000',
    'per_page.range': 'Items per page must be between 1 and 100',
    'radius.range': 'Search radius must be between 1 and 500 kilometers'
  }
}
```

---

## 7. Routes

**File:** `start/routes.ts`

```typescript
import Route from '@ioc:Adonis/Core/Route'

// API Routes
Route.group(() => {
  // Location routes (using Geoapify)
  Route.group(() => {
    Route.get('/search', 'LocationsController.search')
    Route.get('/reverse', 'LocationsController.reverseGeocode')
    Route.get('/health', 'LocationsController.health')
    Route.get('/:placeId/details', 'LocationsController.getPlaceDetails')
    Route.post('/assign', 'LocationsController.assignToProvider')
  }).prefix('/locations')

  // Service Provider routes
  Route.group(() => {
    Route.get('/location', 'ServiceProvidersController.findByLocation')
    Route.get('/', 'ServiceProvidersController.index')
  }).prefix('/providers')

  // Health check
  Route.get('/health', async ({ response }) => {
    return response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'connected',
        geoapify: 'checking...' // This could be enhanced with actual checks
      }
    })
  })
}).prefix('/api')

// Optional: Add rate limiting to search endpoints
import { limiter } from '@adonisjs/limiter/build/services'

Route.group(() => {
  Route.get('/locations/search', 'LocationsController.search')
}).prefix('/api').middleware([
  limiter({
    max: 100, // 100 requests
    duration: '15 min', // per 15 minutes
    blockDuration: '15 min',
  })
])
```

---

## 8. Environment Configuration

**File:** `.env`

```bash
# Database Configuration
DB_CONNECTION=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Geoapify Configuration
GEOAPIFY_API_KEY=your_geoapify_api_key_here
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1

# CORS Configuration
CORS_ENABLED=true
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# App Configuration
APP_KEY=your-app-key
NODE_ENV=development

# Optional: Rate Limiting
RATE_LIMIT_ENABLED=true
```

---

## 8. Database Seeders

### Location Seeder

```bash
node ace make:seeder Location
```

**File:** `database/seeders/LocationSeeder.ts`

```typescript
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import Location from 'App/Models/Location'

export default class extends BaseSeeder {
  public async run() {
    const locations = [
      {
        name: 'Downtown Medical Center',
        address: '123 Healthcare Blvd',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        description: 'Premier healthcare facility in downtown Manhattan'
      },
      {
        name: 'Brooklyn Community Health',
        address: '456 Community Ave',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        latitude: 40.6892,
        longitude: -73.9442,
        description: 'Community-focused healthcare services'
      },
      {
        name: 'Los Angeles General Hospital',
        address: '789 Medical Way',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90012',
        latitude: 34.0522,
        longitude: -118.2437,
        description: 'Full-service hospital in downtown LA'
      },
      {
        name: 'Miami Beach Clinic',
        address: '321 Ocean Drive',
        city: 'Miami Beach',
        state: 'FL',
        zipCode: '33139',
        latitude: 25.7617,
        longitude: -80.1918,
        description: 'Beachside healthcare clinic'
      },
      {
        name: 'Chicago North Shore Medical',
        address: '654 Lake Shore Dr',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60611',
        latitude: 41.8781,
        longitude: -87.6298,
        description: 'Medical center serving the North Shore area'
      }
    ]

    await Location.createMany(locations)
  }
}
```

### Service Provider Seeder

```bash
node ace make:seeder ServiceProvider
```

**File:** `database/seeders/ServiceProviderSeeder.ts`

```typescript
import BaseSeeder from '@ioc:Adonis/Lucid/Seeder'
import ServiceProvider from 'App/Models/ServiceProvider'

export default class extends BaseSeeder {
  public async run() {
    const providers = [
      {
        name: 'CarePlus Home Services',
        address: '123 Care Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        phone: '+1-555-0123',
        email: 'contact@careplus.com',
        serviceType: 'Home Care',
        availabilityStatus: 'Available',
        latitude: 40.7589,
        longitude: -73.9851,
        rating: 4.5,
        servicesOffered: ['Nursing', 'Physical Therapy', 'Medication Management']
      },
      {
        name: 'Specialist Care Network',
        address: '456 Specialist Ave',
        city: 'Brooklyn',
        state: 'NY',
        zipCode: '11201',
        phone: '+1-555-0124',
        email: 'info@specialistcare.com',
        serviceType: 'Specialist Care',
        availabilityStatus: 'Available',
        latitude: 40.6892,
        longitude: -73.9442,
        rating: 4.8,
        servicesOffered: ['Cardiology', 'Neurology', 'Orthopedics']
      },
      {
        name: 'Emergency Response Team',
        address: '789 Emergency Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90012',
        phone: '+1-555-0125',
        email: 'emergency@ert.com',
        serviceType: 'Emergency Care',
        availabilityStatus: 'Available',
        latitude: 34.0522,
        longitude: -118.2437,
        rating: 4.9,
        servicesOffered: ['24/7 Emergency', 'Ambulance', 'Critical Care']
      },
      {
        name: 'Mental Wellness Center',
        address: '321 Wellness Way',
        city: 'Miami Beach',
        state: 'FL',
        zipCode: '33139',
        phone: '+1-555-0126',
        email: 'help@mentalwellness.com',
        serviceType: 'Mental Health',
        availabilityStatus: 'Busy',
        latitude: 25.7617,
        longitude: -80.1918,
        rating: 4.3,
        servicesOffered: ['Counseling', 'Therapy', 'Support Groups']
      }
    ]

    await ServiceProvider.createMany(providers)
  }
}
```

**Run Seeders:**

```bash
node ace db:seed
```

---

## 9. Testing

### Test the API Endpoints

Create test files or use a tool like Postman/Insomnia to test:

#### 1. Test Location Search with Geoapify
```bash
# New autocomplete endpoint in this project (admin-protected)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3333/api/locations/autocomplete?q=manchester&country=gb&limit=5"
```

```bash
# Basic location search
curl "http://localhost:3333/api/locations/search?q=new%20york&limit=5"

# Search with country filter
curl "http://localhost:3333/api/locations/search?q=london&country=gb&limit=5"

# Search with additional filters
curl "http://localhost:3333/api/locations/search?q=hospital&country=us&filter=place:healthcare&limit=10"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": "geoapify-place-id-123",
      "name": "New York City",
      "address": "New York, NY, United States of America",
      "city": "New York",
      "state": "NY",
      "zipCode": "",
      "country": "United States of America",
      "lat": 40.7128,
      "lng": -74.0060,
      "placeType": "city",
      "category": "administrative",
      "geoapifyData": { ... }
    }
  ],
  "meta": {
    "query": "new york",
    "limit": 5,
    "count": 1,
    "source": "geoapify"
  }
}
```

#### 2. Test Reverse Geocoding
```bash
curl "http://localhost:3333/api/locations/reverse?lat=40.7128&lng=-74.0060"
```

#### 3. Test Place Details
```bash
curl "http://localhost:3333/api/locations/geoapify-place-id-123/details"
```

#### 4. Test Provider Search by Location
```bash
# Search by coordinates
curl "http://localhost:3333/api/providers/location?lat=40.7128&lng=-74.0060&radius=10&serviceType=Home%20Care"

# Search by Geoapify place ID
curl "http://localhost:3333/api/providers/location?placeId=geoapify-place-id-123&serviceType=Specialist%20Care"

# Search by city and state
curl "http://localhost:3333/api/providers/location?city=New%20York&state=NY&availability=Available"
```

#### 5. Test Location Assignment to Provider
```bash
curl -X POST "http://localhost:3333/api/locations/assign" \
  -H "Content-Type: application/json" \
  -d '{
    "providerId": "provider-uuid-123",
    "placeId": "geoapify-place-id-123",
    "address": "123 Healthcare Blvd",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "lat": 40.7128,
    "lng": -74.0060
  }'
```

#### 6. Test Health Check
```bash
# General API health
curl "http://localhost:3333/api/health"

# Geoapify connection health
curl "http://localhost:3333/api/locations/health"
```

### Frontend Integration Testing

Test the integration with your React frontend:

1. **Start your AdonisJS server:**
```bash
node ace serve --watch
```

2. **Test location search from React:**
   - Open your React app location search component
   - Type in a location (minimum 2 characters)
   - Verify suggestions appear from Geoapify
   - Select a suggestion and verify provider search works

3. **Monitor API calls:**
   - Open browser Developer Tools → Network tab
   - Perform searches and verify API calls are made correctly
   - Check response formats match expectations

### Error Testing

Test error scenarios:

```bash
# Invalid API key (update .env with wrong key temporarily)
curl "http://localhost:3333/api/locations/search?q=test"

# Invalid query (too short)
curl "http://localhost:3333/api/locations/search?q=a"

# Invalid coordinates
curl "http://localhost:3333/api/locations/reverse?lat=200&lng=-300"

# Non-existent place ID
curl "http://localhost:3333/api/locations/invalid-place-id/details"
```

---

## 10. Deployment Considerations

### Production Environment Variables

```bash
# Production .env
NODE_ENV=production
APP_KEY=your-secure-app-key
DB_CONNECTION=pg
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=your-production-db

# External API Keys
MAPBOX_ACCESS_TOKEN=your-production-mapbox-token

# CORS for production
CORS_ORIGIN=https://yourdomain.com
```

### Database Optimization

1. **Add Database Indexes:**
```sql
-- Add these indexes for better performance
CREATE INDEX idx_locations_search ON locations USING gin(to_tsvector('english', name || ' ' || city || ' ' || address));
CREATE INDEX idx_providers_location ON service_providers(city, state, service_type);
CREATE INDEX idx_providers_coordinates ON service_providers(latitude, longitude);
```

2. **Enable PostGIS for Geographic Queries:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Security Considerations

1. **Add Rate Limiting:**
```bash
npm install @adonisjs/limiter
```

2. **Add Authentication for Write Operations:**
```typescript
// Protect location creation/modification endpoints
Route.group(() => {
  Route.post('/locations', 'LocationsController.store')
  Route.put('/locations/:id', 'LocationsController.update')
  Route.delete('/locations/:id', 'LocationsController.destroy')
}).middleware('auth')
```

3. **Input Sanitization:**
```typescript
// Already handled by validators, but ensure HTML is escaped
import { string } from '@ioc:Adonis/Core/Helpers'
const sanitizedInput = string.escapeHTML(userInput)
```

---

## 10. Deployment Considerations

### Production Environment Variables

```bash
# Production .env
NODE_ENV=production
APP_KEY=your-secure-app-key

# Database
DB_CONNECTION=pg
DB_HOST=your-production-db-host
DB_PORT=5432
DB_USER=your-production-db-user
DB_PASSWORD=your-secure-password
DB_NAME=your-production-db

# Geoapify (Production API Key)
GEOAPIFY_API_KEY=your-production-geoapify-api-key
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1

# CORS for production
CORS_ORIGIN=https://yourdomain.com

# Rate limiting
RATE_LIMIT_ENABLED=true
```

### Geoapify API Considerations

1. **API Limits:**
   - Free tier: 3,000 requests/day
   - Monitor usage in Geoapify dashboard
   - Implement caching to reduce API calls
   - Consider upgrading plan for production

2. **Caching Strategy:**
```typescript
// Example caching in controller
import Redis from '@ioc:Adonis/Addons/Redis'

public async search({ request, response }: HttpContextContract) {
  const { q } = request.qs()
  const cacheKey = `geoapify_search:${q}`

  // Check cache first
  const cached = await Redis.get(cacheKey)
  if (cached) {
    return response.json(JSON.parse(cached))
  }

  // Make API call
  const results = await GeoapifyService.searchLocations(q)
  
  // Cache for 1 hour
  await Redis.setex(cacheKey, 3600, JSON.stringify({ data: results }))
  
  return response.json({ data: results })
}
```

3. **Error Handling:**
```typescript
// Implement circuit breaker pattern
let geoapifyFailureCount = 0
const MAX_FAILURES = 5

public async searchWithFallback(query: string) {
  if (geoapifyFailureCount >= MAX_FAILURES) {
    // Use cached results only
    return await this.getFallbackResults(query)
  }

  try {
    const results = await GeoapifyService.searchLocations(query)
    geoapifyFailureCount = 0 // Reset on success
    return results
  } catch (error) {
    geoapifyFailureCount++
    return await this.getFallbackResults(query)
  }
}
```

### Security Considerations

1. **API Key Protection:**
```typescript
// Never expose API key to frontend
// Always make calls from backend
// Use environment variables
// Rotate keys regularly
```

2. **Rate Limiting:**
```typescript
// Add to routes
Route.group(() => {
  Route.get('/locations/search', 'LocationsController.search')
}).middleware([
  limiter({
    max: 100,
    duration: '15 min',
    blockDuration: '15 min',
    message: 'Too many search requests'
  })
])
```

3. **Input Validation:**
```typescript
// Always validate search queries
// Sanitize user input
// Implement maximum query length
// Block suspicious patterns
```

### Performance Optimization

1. **Database Indexes:**
```sql
-- Optimize service provider searches
CREATE INDEX idx_providers_location ON service_providers(city, state, service_type);
CREATE INDEX idx_providers_geoapify ON service_providers(geoapify_place_id);
CREATE INDEX idx_providers_coordinates ON service_providers(latitude, longitude);

-- Optimize location cache
CREATE INDEX idx_location_cache_search ON location_cache USING gin(to_tsvector('english', formatted_address || ' ' || name));
```

2. **Response Compression:**
```typescript
// Enable gzip compression in server.ts
import compression from 'compression'
app.use(compression())
```

3. **Connection Pooling:**
```typescript
// Optimize axios for Geoapify calls
const axiosInstance = axios.create({
  baseURL: 'https://api.geoapify.com/v1',
  timeout: 5000,
  maxRedirects: 2,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true })
})
```

### Monitoring and Logging

1. **API Usage Monitoring:**
```typescript
// Track Geoapify usage
Logger.info('Geoapify API call', {
  endpoint: 'autocomplete',
  query: q,
  results: results.length,
  responseTime: Date.now() - startTime
})
```

2. **Error Tracking:**
```typescript
// Monitor API failures
Logger.error('Geoapify API error', {
  endpoint: 'autocomplete',
  error: error.message,
  query: q,
  statusCode: error.response?.status
})
```

### Backup Strategy

1. **Location Cache:**
   - Regular database backups
   - Export popular locations
   - Maintain offline fallback data

2. **Service Provider Data:**
   - Backup with coordinates
   - Include Geoapify place IDs
   - Regular data validation

### Scaling Considerations

1. **Multiple API Keys:**
```typescript
// Rotate between multiple API keys for higher limits
const API_KEYS = [
  process.env.GEOAPIFY_API_KEY_1,
  process.env.GEOAPIFY_API_KEY_2,
  process.env.GEOAPIFY_API_KEY_3
]

let currentKeyIndex = 0

function getApiKey() {
  const key = API_KEYS[currentKeyIndex]
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length
  return key
}
```

2. **Load Balancing:**
   - Distribute API calls across instances
   - Implement request queuing
   - Use Redis for shared cache

---

## 11. Getting Started

### Quick Setup Steps

1. **Install Dependencies:**
```bash
npm install axios @adonisjs/redis @adonisjs/limiter
```

2. **Set Up Environment:**
```bash
# Get Geoapify API key from https://www.geoapify.com/
echo "GEOAPIFY_API_KEY=your-api-key-here" >> .env
echo "GEOAPIFY_BASE_URL=https://api.geoapify.com/v1" >> .env
```

3. **Run Migrations:**
```bash
node ace migration:run
```

4. **Test the API:**
```bash
# Start your server
npm run dev

# Test in another terminal
curl "http://localhost:3333/api/locations/search?q=New+York"
```

This comprehensive guide provides everything you need to implement location search using Geoapify in your AdonisJS backend, with proper error handling, caching, and production considerations. The integration will provide more accurate and up-to-date location data than a custom database approach.
