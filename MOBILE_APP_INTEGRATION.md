# Mobile App GPS Integration Guide

## Overview
This guide explains how to integrate GPS tracking from your mobile staff app to the BMS Pro Admin Dashboard.

## API Endpoint

**Endpoint:** `https://vyuohgwqausybsqeejhm.supabase.co/functions/v1/update-staff-location`

**Method:** `POST`

**Authentication:** Required (Bearer token)

## Request Headers

```
Authorization: Bearer <user-jwt-token>
Content-Type: application/json
```

## Request Body

```json
{
  "employee_id": "uuid-of-employee",
  "latitude": -33.8688,
  "longitude": 151.2093,
  "accuracy": 15.5,
  "battery_level": 85,
  "current_job_id": "uuid-of-current-job" // optional
}
```

### Field Descriptions

- **employee_id** (required): UUID of the employee from the employees table
- **latitude** (required): GPS latitude coordinate (decimal degrees)
- **longitude** (required): GPS longitude coordinate (decimal degrees)
- **accuracy** (optional): GPS accuracy in meters
- **battery_level** (optional): Device battery level (0-100)
- **current_job_id** (optional): UUID of the current job the staff is working on

## Response

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "id": "location-uuid",
    "employee_id": "employee-uuid",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "accuracy": 15.5,
    "battery_level": 85,
    "accuracy_level": "high",
    "timestamp": "2025-11-15T09:23:45.123Z"
  },
  "message": "Location updated successfully"
}
```

### Error Responses

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```

**400 Bad Request**
```json
{
  "error": "Missing required fields: employee_id, latitude, longitude"
}
```

**500 Server Error**
```json
{
  "error": "Error message details"
}
```

## Accuracy Levels

The system automatically categorizes GPS accuracy:

- **high**: accuracy < 20 meters (🟢 Green marker)
- **medium**: 20m ≤ accuracy ≤ 100m (🔵 Blue marker)
- **low**: accuracy > 100 meters (🟡 Yellow marker)

## Update Frequency Recommendations

- **When staff is on a job**: Every 10-30 seconds
- **When staff is idle**: Every 1-2 minutes
- **When app is in background**: Every 5 minutes (if permitted by OS)

## Example Integration (React Native)

```javascript
import * as Location from 'expo-location';
import { supabase } from './supabaseClient';

// Request permissions
async function requestLocationPermission() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access location was denied');
    return false;
  }
  return true;
}

// Send location update
async function updateLocation(employeeId, currentJobId = null) {
  try {
    // Get current position
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Get battery level (requires expo-battery)
    const batteryLevel = await Battery.getBatteryLevelAsync() * 100;

    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Not authenticated');
    }

    // Send to API
    const response = await fetch(
      'https://vyuohgwqausybsqeejhm.supabase.co/functions/v1/update-staff-location',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: employeeId,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          battery_level: Math.round(batteryLevel),
          current_job_id: currentJobId,
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update location');
    }

    console.log('Location updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// Start background location tracking
async function startLocationTracking(employeeId) {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) return;

  // Update location every 30 seconds
  const intervalId = setInterval(async () => {
    try {
      await updateLocation(employeeId);
    } catch (error) {
      console.error('Location update failed:', error);
    }
  }, 30000); // 30 seconds

  return intervalId;
}

// Stop location tracking
function stopLocationTracking(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
  }
}

export { startLocationTracking, stopLocationTracking, updateLocation };
```

## Example Integration (Flutter)

```dart
import 'package:geolocator/geolocator.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class LocationService {
  final SupabaseClient supabase = Supabase.instance.client;
  final Battery battery = Battery();

  Future<bool> requestPermission() async {
    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    return permission == LocationPermission.whileInUse || 
           permission == LocationPermission.always;
  }

  Future<void> updateLocation(String employeeId, {String? currentJobId}) async {
    try {
      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      // Get battery level
      int batteryLevel = await battery.batteryLevel;

      // Get auth session
      final session = supabase.auth.currentSession;
      if (session == null) {
        throw Exception('Not authenticated');
      }

      // Send to API
      final response = await supabase.functions.invoke(
        'update-staff-location',
        body: {
          'employee_id': employeeId,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'battery_level': batteryLevel,
          'current_job_id': currentJobId,
        },
      );

      if (response.status != 200) {
        throw Exception('Failed to update location');
      }

      print('Location updated: ${response.data}');
    } catch (e) {
      print('Error updating location: $e');
      rethrow;
    }
  }

  Stream<void> startTracking(String employeeId) async* {
    final hasPermission = await requestPermission();
    if (!hasPermission) {
      throw Exception('Location permission not granted');
    }

    // Update every 30 seconds
    yield* Stream.periodic(Duration(seconds: 30)).asyncMap((_) async {
      await updateLocation(employeeId);
    });
  }
}
```

## Testing

You can test the endpoint using curl:

```bash
curl -X POST https://vyuohgwqausybsqeejhm.supabase.co/functions/v1/update-staff-location \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "employee-uuid",
    "latitude": -33.8688,
    "longitude": 151.2093,
    "accuracy": 15.5,
    "battery_level": 85
  }'
```

## Security Notes

1. **Authentication Required**: All requests must include a valid JWT token
2. **RLS Policies**: Staff can only update their own location records
3. **Rate Limiting**: Consider implementing rate limiting on the mobile app to avoid excessive API calls
4. **Data Privacy**: Location data is sensitive - ensure compliance with privacy regulations

## Admin Dashboard Features

Once locations are being sent from mobile apps, admins can:

- ✅ View real-time staff locations on Google Maps
- ✅ See staff status (online/offline based on last update)
- ✅ Filter by staff name, role, status, and last update time
- ✅ Click markers to view detailed staff information
- ✅ See battery levels and GPS accuracy
- ✅ View current job assignments
- ✅ Auto-fit map to show all staff
- ✅ Toggle 30-minute movement trails (future feature)

## Support

For issues or questions, contact the development team.
