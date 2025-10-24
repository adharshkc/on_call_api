/**
 * Test file to verify GeoNames service integration
 *
 * To run these tests manually:
 * 1. Make sure GEONAMES_USERNAME is set in .env
 * 2. Start your server: npm run dev
 * 3. Use curl or Postman to test the endpoints
 */

import GeoNamesService from '#services/geonames_service'

/**
 * Example 1: Get postal codes by place name
 */
export async function testGetPostalCodesByPlace() {
  console.log('Testing getPostalCodesByPlace...')

  try {
    const postalCodes = await GeoNamesService.getPostalCodesByPlace('Manchester', {
      countryCode: 'GB',
      maxRows: 50,
    })

    console.log(`✅ Found ${postalCodes.length} postal codes`)
    console.log('Sample postal codes:')
    postalCodes.slice(0, 5).forEach((pc) => {
      console.log(`  ${pc.postalCode} - ${pc.placeName}, ${pc.adminName2}`)
    })

    return postalCodes
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

/**
 * Example 2: Get postal codes by coordinates
 */
export async function testGetPostalCodesNearby() {
  console.log('\nTesting getPostalCodesNearby...')

  try {
    // Manchester coordinates
    const postalCodes = await GeoNamesService.getPostalCodesNearby(53.4808, -2.2426, {
      radius: 10,
      maxRows: 50,
      countryCode: 'GB',
    })

    console.log(`✅ Found ${postalCodes.length} postal codes within 10km`)
    console.log('Sample postal codes:')
    postalCodes.slice(0, 5).forEach((pc) => {
      console.log(`  ${pc.postalCode} - ${pc.placeName} (${pc.adminName2})`)
    })

    return postalCodes
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

/**
 * Example 3: Get info about a specific postal code
 */
export async function testGetPostalCodeInfo() {
  console.log('\nTesting getPostalCodeInfo...')

  try {
    const postalCodeInfo = await GeoNamesService.getPostalCodeInfo('M1 1AA', {
      countryCode: 'GB',
    })

    console.log(`✅ Found ${postalCodeInfo.length} results`)
    if (postalCodeInfo.length > 0) {
      const info = postalCodeInfo[0]
      console.log('Postal code details:')
      console.log(`  Postcode: ${info.postalCode}`)
      console.log(`  Place: ${info.placeName}`)
      console.log(`  County: ${info.adminName2}`)
      console.log(`  State: ${info.adminName1}`)
      console.log(`  Coordinates: ${info.lat}, ${info.lng}`)
    }

    return postalCodeInfo
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

/**
 * Example 4: Search place with grouped postal codes
 */
export async function testSearchPlaceWithPostalCodes() {
  console.log('\nTesting searchPlaceWithPostalCodes...')

  try {
    const locations = await GeoNamesService.searchPlaceWithPostalCodes('Manchester', {
      countryCode: 'GB',
      maxRows: 100,
    })

    console.log(`✅ Found ${locations.length} locations`)
    console.log('Sample locations with postal codes:')
    locations.slice(0, 3).forEach((loc) => {
      console.log(`  ${loc.placeName}, ${loc.adminName2}:`)
      console.log(`    Postal codes: ${loc.postalCodes.slice(0, 5).join(', ')}...`)
      console.log(`    Total: ${loc.postalCodes.length} postal codes`)
    })

    return locations
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('🧪 Starting GeoNames Service Tests...\n')
  console.log('='.repeat(50))

  try {
    await testGetPostalCodesByPlace()
    await testGetPostalCodesNearby()
    await testGetPostalCodeInfo()
    await testSearchPlaceWithPostalCodes()

    console.log('\n' + '='.repeat(50))
    console.log('✅ All tests completed successfully!')
  } catch (error) {
    console.log('\n' + '='.repeat(50))
    console.error('❌ Tests failed. Please check your GEONAMES_USERNAME in .env')
    console.error(
      'Make sure you have enabled web services at http://www.geonames.org/manageaccount'
    )
  }
}

// Uncomment to run tests:
// runAllTests()
