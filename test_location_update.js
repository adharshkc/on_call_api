#!/usr/bin/env node

// Simple test script to check if location update is working
console.log('Testing Service Location Update...\n');

// Test data
const testServiceData = {
  name: "Test Home Care Service",
  description: "Updated description with location",
  category: "healthcare",
  locationData: {
    name: "Manchester",
    lat: 53.4808,
    lng: -2.2426,
    type: "city",
    region: "england",
    county: "Greater Manchester"
  },
  postcodes: ["M1 1AA", "M2 2BB", "M3 3CC"]
};

console.log('Test Service Data:');
console.log(JSON.stringify(testServiceData, null, 2));

console.log('\n🔍 Checking if location data is present...');
console.log('✅ Has locationData:', !!testServiceData.locationData);
console.log('✅ Has postcodes:', !!testServiceData.postcodes);
console.log('✅ Postcodes count:', testServiceData.postcodes?.length || 0);

console.log('\n📝 Location Details:');
if (testServiceData.locationData) {
  console.log('- Name:', testServiceData.locationData.name);
  console.log('- Coordinates:', testServiceData.locationData.lat, testServiceData.locationData.lng);
  console.log('- County:', testServiceData.locationData.county);
}

console.log('\n📍 Postcodes:');
testServiceData.postcodes?.forEach((code, index) => {
  console.log(`${index + 1}. ${code}`);
});

console.log('\n💡 To test this with curl:');
console.log(`curl -X PUT "http://localhost:3333/api/services/YOUR_SERVICE_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(testServiceData)}'`);

console.log('\n🎯 Expected behavior:');
console.log('1. Service should be updated with new name/description');
console.log('2. Location "Manchester" should be created/found');
console.log('3. Three service availability records should be created');
console.log('4. Response should include location info at top level');