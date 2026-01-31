import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LocationUpdate {
  tripId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  metadata?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // POST /driver-location - Update location
    if (req.method === "POST") {
      const body: LocationUpdate = await req.json();
      
      if (!body.tripId || body.latitude === undefined || body.longitude === undefined) {
        return new Response(JSON.stringify({ error: "Missing required fields: tripId, latitude, longitude" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get driver link for current user
      const { data: driverUser } = await supabase
        .from("driver_users")
        .select("driver_id")
        .eq("user_id", user.id)
        .single();

      // Insert location
      const { data: location, error: insertError } = await supabase
        .from("trip_locations")
        .insert({
          trip_id: body.tripId,
          user_id: user.id,
          driver_id: driverUser?.driver_id || null,
          latitude: body.latitude,
          longitude: body.longitude,
          accuracy: body.accuracy,
          speed: body.speed,
          heading: body.heading,
          altitude: body.altitude,
          metadata: body.metadata || {},
          recorded_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting location:", insertError);
        return new Response(JSON.stringify({ error: "Failed to save location" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Location saved for trip ${body.tripId}: ${body.latitude}, ${body.longitude}`);

      return new Response(JSON.stringify({ success: true, location }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET /driver-location?tripId=xxx - Get trip locations
    if (req.method === "GET") {
      const tripId = url.searchParams.get("tripId");
      
      if (!tripId) {
        return new Response(JSON.stringify({ error: "Missing tripId parameter" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: locations, error: fetchError } = await supabase
        .from("trip_locations")
        .select("*")
        .eq("trip_id", tripId)
        .order("recorded_at", { ascending: true });

      if (fetchError) {
        console.error("Error fetching locations:", fetchError);
        return new Response(JSON.stringify({ error: "Failed to fetch locations" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get latest location
      const latestLocation = locations?.length ? locations[locations.length - 1] : null;

      return new Response(JSON.stringify({ 
        locations, 
        latestLocation,
        totalPoints: locations?.length || 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Driver location error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
