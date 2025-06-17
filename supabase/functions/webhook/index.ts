import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { config } from "https://deno.land/std@0.203.0/dotenv/mod.ts";

// Load environment variables from Supabase dashboard
const env = await config();

const supabase = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

// LINE access token for replying
const LINE_CHANNEL_ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";

serve(async (req) => {
  const body = await req.json();
  const events = body.events || [];

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      // Store message into Supabase DB
      await supabase.from("pending_messages").insert({
        text: event.message.text,
        user_id: event.source.userId,
        group_id: event.source.groupId,
        message_id: event.message.id,
        timestamp: new Date().toISOString(),
        status: "waiting"
      });

      // Send reply to LINE to confirm receipt
      await fetch(LINE_REPLY_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        },
        body: JSON.stringify({
          replyToken: event.replyToken,
          messages: [{
            type: "text",
            text: "✅ ข้อความได้รับแล้ว เดี๋ยวจะช่วย monitor ให้ครับ"
          }]
        })
      });
    }
  }

  return new Response("OK", { status: 200 });
});
