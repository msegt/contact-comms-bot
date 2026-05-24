import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const sendSchema = z.object({
  cliente_id: z.string().uuid(),
  nombre_cliente: z.string().min(1),
  recipient_phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  message_body: z.string().min(1).max(4096),
});

/**
 * Read a secret. On Cloudflare Workers with nodejs_compat_populate_process_env
 * the Worker bindings ARE available on process.env at runtime, but only after
 * the first request has been handled (not at module initialisation time).
 * We therefore read inside the handler, never at the top level.
 */
function getSecret(key: string): string | undefined {
  // Cloudflare Workers: bindings are also accessible as properties on
  // the global scope under the same name when nodejs_compat is enabled.
  // Try globalThis first (works in the Worker runtime), then process.env
  // (works locally and as a fallback).
  const fromGlobal = (globalThis as Record<string, unknown>)[key];
  if (typeof fromGlobal === "string" && fromGlobal.length > 0) return fromGlobal;
  return process.env[key];
}

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    const token = getSecret("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = getSecret("WHATSAPP_PHONE_NUMBER_ID");

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
        const msg =
          json.error?.error_data?.details ??
          json.error?.message ??
          "Error desconocido de WhatsApp";
        return { ok: false as const, error: msg };
      }

      wamid = json.messages?.[0]?.id ?? null;
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Error de red",
      };
    }

    const supabaseUrl = getSecret("SUPABASE_URL");
    const serviceKey = getSecret("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceKey) {
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
