import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req) => {
  const body = await req.json();
  // Process the incoming LINE message and store it in Supabase
  return new Response("Message received");
});
