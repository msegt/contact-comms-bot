import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const sendSchema = z.object({
  recipient_phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  message_body: z.string().min(1).max(4096),
  cliente_id: z.string().uuid(),
  nombre_cliente: z.string().min(1),
});

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      return { ok: false as const, error: "Las credenciales de WhatsApp no están configuradas en el servidor." };
    }

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
        error?: { message?: string; error_data?: { details?: string } };
      };

      if (!res.ok) {
        const msg = json.error?.error_data?.details ?? json.error?.message ?? "Error desconocido de WhatsApp";
        return { ok: false as const, error: msg };
      }

      wamid = json.messages?.[0]?.id ?? null;
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Error de red" };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      // Message was sent successfully — just can't log it
      console.error("Missing Supabase credentials; message sent but not logged");
      return { ok: true as const };
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: dbError } = await admin.from("mensajes_whatsapp").insert({
      cliente_id: data.cliente_id,
      nombre_cliente: data.nombre_cliente,
      telefono_destino: data.recipient_phone,
      mensaje: data.message_body,
      estado: "enviado",
      whatsapp_message_id: wamid,
      enviado_at: new Date().toISOString(),
    });

    if (dbError) console.error("DB insert error", dbError);

    return { ok: true as const };
  });
