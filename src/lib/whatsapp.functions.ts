import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const sendSchema = z.object({
  telefono_destino: z.string().regex(/^\+[1-9]\d{6,14}$/),
  mensaje: z.string().min(1).max(4096),
  cliente_id: z.string().uuid(),
  nombre_cliente: z.string(),
  comunidad_id: z.string().uuid().optional(),
});

const { error: insertError } = await admin.from("mensajes_whatsapp").insert({
  whatsapp_message_id: wamid,
  cliente_id: data.cliente_id,
  nombre_cliente: data.nombre_cliente,
  comunidad_id: data.comunidad_id ?? null,
  telefono_destino: data.telefono_destino,
  mensaje: data.mensaje,
  estado: "enviado",
  enviado_at: new Date().toISOString(),
});

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
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

    // Persist the message row using service role so RLS isn't an issue
    const supabaseUrl = process.env.SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: insertError } = await admin.from("messages").insert({
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
