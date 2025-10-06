#!/bin/bash

# Service Location Update Test Script
echo "🚀 Testing Service Location Update Functionality"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3333/api"
SERVICE_ID="1"  # Change this to an existing service ID
TOKEN="your_auth_token_here"  # Replace with actual token

echo -e "${BLUE}📋 Test Configuration:${NC}"
echo "- API Base: $API_BASE"
echo "- Service ID: $SERVICE_ID"
echo "- Token: ${TOKEN:0:20}..." # Show only first 20 chars
echo ""

# Test 1: Check current service state
echo -e "${YELLOW}🔍 Test 1: Fetching current service data...${NC}"
echo "GET $API_BASE/services/$SERVICE_ID"
echo ""

# Test 2: Update service with location data
echo -e "${YELLOW}🔄 Test 2: Updating service with location data...${NC}"

TEST_DATA='{
  "name": "Enhanced Home Care Service",
  "description": "Professional home care with location coverage",
  "category": "healthcare", 
  "locationData": {
    "name": "Birmingham",
    "lat": 52.4862,
    "lng": -1.8904,
    "type": "city",
    "region": "england",
    "county": "West Midlands"
  },
  "postcodes": ["B1 1AA", "B1 1AB", "B2 4QA", "B3 1JJ"]
}'

echo "PUT $API_BASE/services/$SERVICE_ID"
echo "Payload:"
echo "$TEST_DATA" | jq '.' 2>/dev/null || echo "$TEST_DATA"
echo ""

# Test 3: Verify the update worked
echo -e "${YELLOW}✅ Test 3: Verifying service was updated with location...${NC}"
echo "GET $API_BASE/services/$SERVICE_ID"
echo ""

# Expected results
echo -e "${GREEN}📊 Expected Results:${NC}"
echo "✅ Service should be updated with new name and description"
echo "✅ Location 'Birmingham' should be created or found"
echo "✅ Four service availability records should be created for postcodes"
echo "✅ Response should include:"
echo "   - locations: [{ id, name, county, region, coordinates }]"
echo "   - postcodes: ['B1 1AA', 'B1 1AB', 'B2 4QA', 'B3 1JJ']"
echo "   - availabilityCount: 4"
echo ""

# Manual test commands
echo -e "${BLUE}🛠️  Manual Test Commands:${NC}"
echo ""
echo "1. Get current service:"
echo "curl -X GET \"$API_BASE/services/$SERVICE_ID\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

echo "2. Update with location:"
echo "curl -X PUT \"$API_BASE/services/$SERVICE_ID\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '$TEST_DATA'"
echo ""

echo "3. Verify update:"
echo "curl -X GET \"$API_BASE/services/$SERVICE_ID\" \\"
echo "  -H \"Authorization: Bearer \$TOKEN\" \\"
echo "  -H \"Content-Type: application/json\""
echo ""

# Troubleshooting
echo -e "${YELLOW}🔧 Troubleshooting Steps:${NC}"
echo ""
echo "If location is still null in frontend:"
echo "1. Check browser console for API response structure"
echo "2. Verify frontend is reading 'locations' array (not nested serviceAvailabilities)"
echo "3. Check server logs for debug messages starting with '🔍 UPDATE DEBUG'"
echo "4. Ensure locationData includes: name, lat, lng"
echo "5. Verify postcodes array is not empty"
echo ""

echo -e "${GREEN}✨ Update Complete! Test the API endpoints above.${NC}"