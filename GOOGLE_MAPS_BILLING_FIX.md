# Google Maps API Billing Fix

## Current Issue
The application is showing a `BillingNotEnabledMapError` because billing is not enabled for the Google Cloud project "wearecity".

## Error Details
```
You must enable Billing on the Google Cloud Project at https://console.cloud.google.com/project/_/billing/enable
Learn more at https://developers.google.com/maps/gmp-get-started
Places API error: BillingNotEnabledMapError
```

## Solution Steps

### 1. Enable Billing for Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project "wearecity" (or create it if it doesn't exist)
3. Navigate to [Billing](https://console.cloud.google.com/project/_/billing/enable)
4. Enable billing for the project
5. Add a payment method (credit card)

### 2. Enable Required APIs
After enabling billing, enable these APIs:
- Maps JavaScript API
- Places API
- Geocoding API
- Directions API

### 3. Configure API Key Restrictions
1. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
2. Find your API key or create a new one
3. Set appropriate restrictions:
   - Application restrictions: HTTP referrers
   - Add your domain: `localhost:5173`, `yourdomain.com`
   - API restrictions: Select the APIs mentioned above

### 4. Update Environment Variables
Update your `.env` file with the correct API key:
```env
VITE_GOOGLE_PLACES_API_KEY=your_actual_api_key_here
```

## Alternative: Use a Different Project
If you don't want to enable billing on "wearecity", you can:
1. Create a new Google Cloud project
2. Enable billing on the new project
3. Update the `.mcp.json` file with the new project ID
4. Update environment variables with the new API key

## Cost Information
- Google Maps APIs have a free tier with generous limits
- For most development and small production use, costs are minimal
- See [Google Maps Pricing](https://developers.google.com/maps/billing-and-pricing) for details

## Verification
After completing these steps, restart the application and check the console for successful Google Maps API initialization.
