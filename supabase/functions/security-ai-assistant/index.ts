import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, description, canvasObjects, viewingRange } = await req.json();

    let suggestions = "";

    if (type === "placement") {
      suggestions = `Based on your property description: "${description}"\n\nRecommended Camera Placements:\n\n1. Main Entrance - Install a dome camera at eye level for facial recognition\n2. Driveway/Parking - Wide-angle bullet camera for vehicle monitoring\n3. Back Door - Motion-activated camera with night vision\n4. Perimeter Corners - PTZ cameras for comprehensive coverage\n5. High-value Areas - Additional cameras for critical zones\n\nConsider overlapping coverage zones for complete security.`;
    } else if (type === "coverage") {
      const cameraCount = canvasObjects?.filter((obj: any) => obj.type === "camera").length || 0;
      suggestions = `Coverage Analysis:\n\nCurrent Setup:\n- ${cameraCount} cameras placed\n- Viewing range: ${viewingRange}m\n\nRecommendations:\n- Ensure no blind spots in entry/exit points\n- Check for overlapping coverage zones\n- Consider adding ${Math.max(0, 4 - cameraCount)} more cameras for optimal coverage\n- Verify night vision capabilities for all outdoor cameras`;
    } else if (type === "camera-types") {
      suggestions = `Camera Type Recommendations for: "${description}"\n\n1. Dome Cameras - Discreet indoor monitoring, vandal-resistant\n2. Bullet Cameras - Long-range outdoor coverage, weather-resistant\n3. PTZ Cameras - Pan-tilt-zoom for large area monitoring\n4. Fisheye Cameras - 360° coverage for open spaces\n\nBased on your needs, prioritize:\n- Entry points: Dome cameras\n- Perimeter: Bullet cameras\n- Large areas: PTZ or Fisheye cameras`;
    }

    return new Response(
      JSON.stringify({ 
        suggestions, 
        analysis: suggestions, 
        recommendations: suggestions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
