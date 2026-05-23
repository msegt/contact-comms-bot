import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const sendSchema = z.object({
  recipient_phone: z
    .string()
    .regex(/^\+[1-9]\d{6,14}$/, "Phone must be in E.164 format e.g. +447911123456"),
  message_body: z.string().min(1).max(4096),
  contact_id: z.string().uuid(),
});

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return { ok: false as const, error: "WhatsApp credentials are not configured on the server." };
    }

    // Send via Meta Graph API
    const to = data.recipient_phone.startsWith("+")
      ? data.recipient_phone.slice(1)
      : data.recipient_phone;

    let wamid: string | null = null;
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { body: data.message_body },
          }),
        },
      );

      const json = (await res.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message?: string };
      };

      if (!res.ok) {
        const msg = json?.error?.message ?? `Meta API returned ${res.status}`;
        return { ok: false as const, error: msg };
      }

      wamid = json.messages?.[0]?.id ?? null;
    } catch (err) {
      console.error("WhatsApp send error:", err);
      return { ok: false as const, error: "Network error contacting WhatsApp API." };
    }

    const { error: insertError } = await supabaseAdmin.from("messages").insert({
      wamid,
      contact_id: data.contact_id,
      recipient_phone: data.recipient_phone,
      message_body: data.message_body,
      status: "sent",
    });

    if (insertError) {
      console.error("Failed to log message:", insertError);
      return {
        ok: true as const,
        wamid,
        warning: "Message sent but failed to log to database.",
      };
    }

    return { ok: true as const, wamid };
  });
