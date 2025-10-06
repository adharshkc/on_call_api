# Zipcode Processing Test Cases

The new logic handles these problematic cases:

## Current Problematic Input (from your request):
```
zipcodes: "[\"NULL,[\\\"WC2N 5DU\\\"]\",\"[\\\"WC2N 5DU\\\"]\"]"
```

**What this means:** The frontend is sending nested JSON arrays and NULL values.

## New Processing Logic:

### Step 1: Parse JSON
```javascript
// Input: "[\"NULL,[\\\"WC2N 5DU\\\"]\",\"[\\\"WC2N 5DU\\\"]\"]"
// Parsed: ["NULL,[\"WC2N 5DU\"]", "[\"WC2N 5DU\"]"]
```

### Step 2: Flatten nested JSON strings
```javascript
// Process each item:
// "NULL,[\"WC2N 5DU\"]" → Invalid JSON, keep as is
// "[\"WC2N 5DU\"]" → Parse to ["WC2N 5DU"]
```

### Step 3: Filter and normalize
```javascript
// Remove NULL values and normalize
// Final result: ["WC2N5DU"]
```

## Expected Database Result:
```json
"zipcodes": "[\"WC2N5DU\"]"
```

## Debug Output
When you test again, you should see console logs like:
```
🔍 DEBUG - Raw zipcodes: [nested data] Type: string
✅ DEBUG - Parsed JSON: [parsed array]
🎯 DEBUG - Final zipcodes: ["WC2N5DU"]
```

## Recommendation
Check your frontend code that sends zipcodes. It should send:
```javascript
// Simple array (best)
zipcodes: ["WC2N 5DU", "SW1A 1AA"]

// Or comma-separated string
zipcodes: "WC2N 5DU, SW1A 1AA"

// NOT nested JSON strings
```