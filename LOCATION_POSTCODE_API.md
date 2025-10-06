# Enhanced Location & Postcode API Implementation

## Overview

This implementation provides enhanced location search functionality with automatic postcode retrieval through the Geoapify API. The system al### 5. Enhanced Service Availability Check (Public)
```
POST /api/check-availability
Content-Type: application/json
```

**Request Body:**
```json
{
  "postcode": "M1 1AA",
  "serviceId": 1,
  "includeNearby": true
}
```

**Response (Exact Match):**
```json
{
  "message": "Services available for this postcode",
  "available": true,
  "postcode": "M11AA",
  "matchType": "exact",
  "data": [...]
}
```

**Response (Nearby Match):**
```json
{
  "message": "Services available in nearby areas (M1** postcodes)",
  "available": true,
  "postcode": "M11ZZ",
  "matchType": "nearby",
  "searchRadius": "M1",
  "data": [...]
}
```

## Admin Panel Workflow

### Creating Services with Location & Postcodes (Updated)

1. **Service Details**: Admin fills in service information (name, description, etc.)

2. **Location Search**: Admin types in location search bar
   - Frontend calls `/api/locations/autocomplete?q={searchTerm}&country=gb`
   - Returns suggestions from Geoapify

3. **Select Location**: Admin clicks on a location suggestion
   - Frontend gets coordinates (lat, lng) from selected location
   - Frontend calls `/api/locations/postcodes?lat={lat}&lng={lng}&radius=5000`
   - Returns all postcodes in the area

4. **Select Postcodes**: Admin reviews and selects which postcodes to include
   - Admin can select all or specific postcodes

5. **Create Service**: Admin submits the form with service data, location, and postcodes
   - Frontend calls `/api/services` (POST) with all data
   - Backend creates service, location (if new), and availability records in one operation

### Alternative: Add Location to Existing Service

If you need to add location/postcodes to an existing service:
- Use `/api/services/add-availability-with-postcodes` endpointows admin users to:

1. Search for locations using autocomplete
2. Get postcodes for selected locations automatically
3. Store services with multiple postcodes
4. Allow customers to search services by postcode (including nearby areas)

## New API Endpoints

### 1. Location Autocomplete (Admin Only)
```
GET /api/locations/autocomplete?q=manchester&country=gb&limit=10
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Suggestions retrieved",
  "data": [
    {
      "id": "geoapify-place-id-123",
      "name": "Manchester",
      "address": "Manchester, Greater Manchester, England, United Kingdom",
      "city": "Manchester",
      "state": "Greater Manchester",
      "zipCode": "M1 1AA",
      "country": "United Kingdom",
      "lat": 53.4808,
      "lng": -2.2426,
      "placeType": "city",
      "category": "administrative"
    }
  ],
  "meta": {
    "q": "manchester",
    "limit": 10,
    "count": 1,
    "source": "geoapify"
  }
}
```

### 2. Get Postcodes for Location (Admin Only)
```
GET /api/locations/postcodes?lat=53.4808&lng=-2.2426&radius=5000&limit=50&countryCode=gb
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Postcodes retrieved successfully",
  "data": [
    {
      "postcode": "M1 1AA",
      "displayName": "M1 1AA"
    },
    {
      "postcode": "M1 1AB",
      "displayName": "M1 1AB"
    },
    {
      "postcode": "M1 2AA",
      "displayName": "M1 2AA"
    }
  ],
  "meta": {
    "lat": 53.4808,
    "lng": -2.2426,
    "radius": 5000,
    "count": 3,
    "source": "geoapify"
  }
}
```

### 3. Create Service with Location & Postcodes (Admin Only)
```
POST /api/services
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Home Care Service",
  "slug": "home-care-service",
  "description": "Professional home care services",
  "fullDescription": "Comprehensive home care services...",
  "category": "healthcare",
  "price": "£25/hour",
  "duration": "1-2 hours",
  "services": ["Personal Care", "Medication Management", "Companionship"],
  "benefits": "Professional trained caregivers",
  "gettingStarted": "Contact us for assessment",
  "gettingStartedPoints": ["Initial consultation", "Care plan development", "Service starts"],
  "image": "/images/home-care.jpg",
  "icon": "home-care-icon",
  "stats": [{"label": "Experience", "value": "10+ years"}],
  "locationData": {
    "name": "Manchester",
    "lat": 53.4808,
    "lng": -2.2426,
    "type": "city",
    "region": "england",
    "county": "Greater Manchester",
    "zipCode": "M1 1AA"
  },
  "postcodes": ["M1 1AA", "M1 1AB", "M1 2AA", "M2 1AA"]
}
```

**Response:**
```json
{
  "message": "Service created successfully with 4 postcode(s) in Manchester",
  "data": {
    "service": {
      "id": 1,
      "name": "Home Care Service",
      "slug": "home-care-service",
      "description": "Professional home care services",
      // ... other service fields
    },
    "location": {
      "id": 15,
      "name": "Manchester",
      "county": "Greater Manchester",
      "region": "england",
      "postcodeCount": 4,
      "postcodes": ["M1 1AA", "M1 1AB", "M1 2AA", "M2 1AA"]
    },
    "availabilities": [...]
  }
}
```

**Note:** If you create a service without location data and postcodes, it will work as before:
```json
{
  "name": "Basic Service",
  "description": "A basic service without location"
}
```
Response:
```json
{
  "message": "Service created successfully",
  "data": {
    "service": {...},
    "location": null,
    "availabilities": []
  }
}
```

### 4. Add Service with Postcodes (Admin Only)
```
POST /api/services/add-availability-with-postcodes
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "serviceId": 1,
  "locationData": {
    "name": "Manchester",
    "lat": 53.4808,
    "lng": -2.2426,
    "type": "city",
    "region": "england",
    "county": "Greater Manchester",
    "zipCode": "M1 1AA"
  },
  "postcodes": ["M1 1AA", "M1 1AB", "M1 2AA", "M2 1AA"]
}
```

**Response:**
```json
{
  "message": "Service availability with postcodes added successfully",
  "data": {
    "serviceId": 1,
    "location": {
      "id": 15,
      "name": "Manchester",
      "county": "Greater Manchester",
      "region": "england"
    },
    "addedCount": 4,
    "postcodes": ["M1 1AA", "M1 1AB", "M1 2AA", "M2 1AA"],
    "availabilities": [...]
  }
}
```

### 5. Enhanced Service Availability Check (Public)
```
POST /api/check-availability
Content-Type: application/json
```

**Request Body:**
```json
{
  "postcode": "M1 1AA",
  "serviceId": 1,
  "includeNearby": true
}
```

**Response (Exact Match):**
```json
{
  "message": "Services available for this postcode",
  "available": true,
  "postcode": "M11AA",
  "matchType": "exact",
  "data": [...]
}
```

**Response (Nearby Match):**
```json
{
  "message": "Services available in nearby areas (M1** postcodes)",
  "available": true,
  "postcode": "M11ZZ",
  "matchType": "nearby",
  "searchRadius": "M1",
  "data": [...]
}
```

## Admin Panel Workflow

### Adding Services with Location & Postcodes

1. **Location Search**: Admin types in location search bar
   - Frontend calls `/api/locations/autocomplete?q={searchTerm}&country=gb`
   - Returns suggestions from Geoapify

2. **Select Location**: Admin clicks on a location suggestion
   - Frontend gets coordinates (lat, lng) from selected location
   - Frontend calls `/api/locations/postcodes?lat={lat}&lng={lng}&radius=5000`
   - Returns all postcodes in the area

3. **Select Postcodes**: Admin reviews and selects which postcodes to include
   - Admin can select all or specific postcodes

4. **Save Service**: Admin saves the service with selected location and postcodes
   - Frontend calls `/api/services/add-availability-with-postcodes`
   - Backend creates location if it doesn't exist
   - Backend creates service availability records for each postcode

## Customer Workflow

### Searching Services by Postcode

1. **Enter Postcode**: Customer enters their postcode/zipcode
2. **Search Services**: Frontend calls `/api/check-availability`
   - First tries exact postcode match
   - If no results and `includeNearby=true`, tries partial matches
   - Returns available services in the area

## Technical Implementation Details

### Enhanced Geoapify Service

The `GeoapifyService` now includes:
- `getPostcodesForLocation()`: Fetches postcodes within a radius of coordinates
- `reverseGeocode()`: Gets location details from coordinates
- Fallback mechanisms for API failures

### Database Structure

The existing structure remains the same:
- `locations` table stores location details
- `service_availabilities` table links services to postcodes and locations
- Each postcode gets its own availability record

### Error Handling

- Validates coordinates and required parameters
- Handles Geoapify API failures with fallbacks
- Provides meaningful error messages
- Supports partial postcode matching for better user experience

## Environment Variables

Make sure your `.env` file includes:
```bash
GEOAPIFY_API_KEY=your_api_key_here
GEOAPIFY_BASE_URL=https://api.geoapify.com/v1
```

## Testing the Implementation

### Test Autocomplete
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3333/api/locations/autocomplete?q=manchester&country=gb&limit=5"
```

### Test Postcode Retrieval
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3333/api/locations/postcodes?lat=53.4808&lng=-2.2426&radius=5000"
```

### Test Service Addition
```bash
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"serviceId":1,"locationData":{"name":"Manchester","lat":53.4808,"lng":-2.2426,"type":"city","region":"england","county":"Greater Manchester"},"postcodes":["M1 1AA","M1 1AB"]}' \
  "http://localhost:3333/api/services/add-availability-with-postcodes"
```

### Test Service Search
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"postcode":"M1 1AA","includeNearby":true}' \
  "http://localhost:3333/api/check-availability"
```

## Frontend Integration Tips

1. **Debounce** autocomplete requests to avoid too many API calls
2. **Cache** postcode results for recently selected locations
3. **Validate** postcodes on the frontend before submission
4. **Show loading states** while fetching postcodes from Geoapify
5. **Handle errors** gracefully when Geoapify is unavailable

## Benefits of This Implementation

- **Real-time location data** from Geoapify's global database
- **Automatic postcode discovery** reduces manual entry
- **Flexible search** with exact and nearby matches
- **Scalable** - no need to maintain postcode databases
- **User-friendly** - customers can find services in nearby areas
- **Consistent** - standardized location and postcode formats