import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

interface MetaStatus {
  id: string;
  status: string;
  timestamp?: string;
}
interface MetaMessage {
  id: string;
  from: string;
  text?: { body?: string };
  type?: string;
}
interface MetaChange {
  value?: {
    statuses?: MetaStatus[];
    messages?: MetaMessage[];
  };
}
interface MetaPayload {
  entry?: Array<{ changes?: MetaChange[] }>;
}

export const Route = createFileRoute("/api/public/whatsapp-webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

        if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
          return new Response(challenge ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        let payload: MetaPayload;
        try {
          payload = (await request.json()) as MetaPayload;
        } catch {
          return new Response("ok", { status: 200 });
        }

        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !serviceKey) {
          console.error("Missing Supabase credentials in webhook");
          return new Response("ok", { status: 200 });
        }
        const admin = createClient(supabaseUrl, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        });

        try {
          for (const entry of payload.entry ?? []) {
            for (const change of entry.changes ?? []) {
              const value = change.value;
              if (!value) continue;

              for (const status of value.statuses ?? []) {
                const { error } = await admin
                  .from("messages")
                  .update({ status: status.status, updated_at: new Date().toISOString() })
                  .eq("wamid", status.id);
                if (error) console.error("status update error", error);
              }

              for (const msg of value.messages ?? []) {
                const { error } = await admin.from("incoming_messages").insert({
                  wamid: msg.id,
                  from_phone: `+${msg.from}`,
                  message_body: msg.text?.body ?? null,
                });
                if (error) console.error("incoming insert error", error);
              }
            }
          }
        } catch (err) {
          console.error("Webhook processing error:", err);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
