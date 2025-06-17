import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async () => {
  // Query Supabase for unanswered messages
  // Send reminders via LINE
  return new Response("Checked for unanswered messages");
});
