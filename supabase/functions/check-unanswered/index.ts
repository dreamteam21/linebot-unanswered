import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";
import { config } from "https://deno.land/std@0.203.0/dotenv/mod.ts";

const env = await config();

const supabase = createClient(
  env.SUPABASE_URL!,
  env.SUPABASE_SERVICE_ROLE_KEY!
);

const LINE_CHANNEL_ACCESS_TOKEN = env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

serve(async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  // Get messages that are still waiting and older than 15 mins
  const { data: messages, error } = await supabase
    .from("pending_messages")
    .select("*")
    .eq("status", "waiting")
    .lte("timestamp", fifteenMinutesAgo);

  if (error) {
    console.error("Database error:", error);
    return new Response("Error", { status: 500 });
  }

  for (const msg of messages ?? []) {
    // You can replace this userId with someone in your group
    const mentionText = `@สมชาย รบกวนดูข้อความนี้หน่อยครับ:\n"${msg.text}"`;

    await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: msg.group_id,
        messages: [
          {
            type: "text",
            text: mentionText
            // Optional: add `mention` block for real @ mention if you have userId
          }
        ]
      })
    });

    // Mark message as notified to avoid duplicate notifications
    await supabase
      .from("pending_messages")
      .update({ status: "notified" })
      .eq("id", msg.id);
  }

  return new Response("Checked unanswered messages");
});
