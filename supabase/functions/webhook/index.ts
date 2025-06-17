import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Get secrets from Supabase environment
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const LINE_REPLY_API = "https://api.line.me/v2/bot/message/reply";

serve(async (req) => {
  const body = await req.json();
  const events = body.events || [];

  for (const event of events) {
    if (event.type === "message" && event.message.type === "text") {
      await supabase.from("pending_messages").insert({
        text: event.message.text,
        user_id: event.source.userId,
        group_id: event.source.groupId,
        message_id: event.message.id,
        timestamp: new Date().toISOString(),
        status: "waiting"
      });

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
