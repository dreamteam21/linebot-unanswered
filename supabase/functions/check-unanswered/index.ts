import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Load secrets
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const LINE_CHANNEL_ACCESS_TOKEN = Deno.env.get("LINE_CHANNEL_ACCESS_TOKEN")!;
const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

serve(async () => {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: messages, error } = await supabase
    .from("pending_messages")
    .select("*")
    .eq("status", "waiting")
    .lte("timestamp", fifteenMinutesAgo);

  if (error) {
    console.error("Database query error:", error);
    return new Response("Error querying database", { status: 500 });
  }

  for (const msg of messages ?? []) {
    const followupMessage = `@สมชาย รบกวนดูข้อความนี้หน่อยครับ:\n"${msg.text}"`;

    await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        to: msg.group_id,
        messages: [{
          type: "text",
          text: followupMessage
        }]
      })
    });

    await supabase
      .from("pending_messages")
      .update({ status: "notified" })
      .eq("id", msg.id);
  }

  return new Response("Checked unanswered messages");
});
