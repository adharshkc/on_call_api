#!/usr/bin/env node

// Test script to verify JSON parsing fix
console.log('🧪 Testing JSON String Parsing Fix\n');

// Simulate the data structure we saw in the debug output
const testRequestData = {
  locationData: '{"name":"City of London","lat":51.5156177,"lng":-0.0919983,"type":"area","region":"england","county":"England"}',
  postcodes: '["EC2V 5AE"]'
};

console.log('📥 Input Data (as received from frontend):');
console.log('locationData type:', typeof testRequestData.locationData);
console.log('postcodes type:', typeof testRequestData.postcodes);
console.log('locationData value:', testRequestData.locationData);
console.log('postcodes value:', testRequestData.postcodes);

// Apply the same parsing logic we added to the controller
let { locationData, postcodes } = testRequestData;

// Parse JSON strings if they are strings (from frontend)
if (typeof locationData === 'string') {
  try {
    locationData = JSON.parse(locationData);
    console.log('\n✅ Successfully parsed locationData from JSON string');
  } catch (error) {
    console.log('\n❌ Failed to parse locationData JSON:', error);
    locationData = null;
  }
}

if (typeof postcodes === 'string') {
  try {
    postcodes = JSON.parse(postcodes);
    console.log('✅ Successfully parsed postcodes from JSON string');
  } catch (error) {
    console.log('❌ Failed to parse postcodes JSON:', error);
    postcodes = null;
  }
}

console.log('\n📤 Parsed Data (after JSON.parse):');
console.log('locationData type:', typeof locationData);
console.log('postcodes type:', typeof postcodes);
console.log('postcodes is array:', Array.isArray(postcodes));

if (locationData) {
  console.log('\n📍 Location Data Properties:');
  console.log('- Name:', locationData.name);
  console.log('- Coordinates:', locationData.lat, locationData.lng);
  console.log('- County:', locationData.county);
  console.log('- Region:', locationData.region);
  console.log('- Type:', locationData.type);
}

if (postcodes) {
  console.log('\n📮 Postcodes:');
  console.log('- Count:', postcodes.length);
  console.log('- Values:', postcodes);
}

// Test the validation logic
console.log('\n🔍 Validation Check:');
const hasValidLocationData = locationData && locationData.name && locationData.lat && locationData.lng;
const hasValidPostcodes = postcodes && Array.isArray(postcodes) && postcodes.length > 0;

console.log('✅ Has valid location data:', hasValidLocationData);
console.log('✅ Has valid postcodes:', hasValidPostcodes);
console.log('✅ Should process location:', hasValidLocationData && hasValidPostcodes);

console.log('\n🎯 Expected Result:');
if (hasValidLocationData && hasValidPostcodes) {
  console.log('🎉 Location processing should now work!');
  console.log(`- Will create/find location: "${locationData.name}"`);
  console.log(`- Will add ${postcodes.length} postcode(s): ${postcodes.join(', ')}`);
} else {
  console.log('❌ Location processing will still be skipped');
}

console.log('\n✨ Fix Complete! Test with your API now.');