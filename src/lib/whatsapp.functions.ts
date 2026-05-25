import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const sendSchema = z.object({
  cliente_id: z.string().uuid(),
  nombre_cliente: z.string().min(1),
  recipient_phone: z.string().regex(/^\+[1-9]\d{6,14}$/),
  message_body: z.string().min(1).max(4096),
  // Optional attachment — pass the Supabase Storage public/signed URL after upload
  adjunto_url: z.string().url().optional(),
  adjunto_nombre: z.string().max(255).optional(),
  adjunto_mime: z.string().max(100).optional(),
});

/** Map a MIME type to a WhatsApp media message type */
function whatsappMediaType(mime: string): "document" | "image" | "video" | "audio" {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "document";
}

export const sendWhatsAppMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sendSchema.parse(input))
  .handler(async ({ data }) => {
    // ── Env diagnostics ──────────────────────────────────────────────────────
    const tokenFromProcess = process.env.WHATSAPP_ACCESS_TOKEN;
    const tokenFromGlobal = (globalThis as Record<string, unknown>).WHATSAPP_ACCESS_TOKEN;
    const phoneFromProcess = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const phoneFromGlobal = (globalThis as Record<string, unknown>).WHATSAPP_PHONE_NUMBER_ID;

    console.log("[env-debug] process.env token:", tokenFromProcess ? `SET (${String(tokenFromProcess).length} chars)` : "MISSING");
    console.log("[env-debug] globalThis token:", tokenFromGlobal ? `SET (${String(tokenFromGlobal).length} chars)` : "MISSING");
    console.log("[env-debug] process.env phoneId:", phoneFromProcess ? `SET` : "MISSING");
    console.log("[env-debug] globalThis phoneId:", phoneFromGlobal ? `SET` : "MISSING");
    console.log("[env-debug] process.env keys:", Object.keys(process.env).filter(k => k.includes("WHATS") || k.includes("SUPA")).join(", ") || "none matching");
    // ─────────────────────────────────────────────────────────────────────────

    const token = tokenFromProcess ?? (typeof tokenFromGlobal === "string" ? tokenFromGlobal : undefined);
    const phoneNumberId = phoneFromProcess ?? (typeof phoneFromGlobal === "string" ? phoneFromGlobal : undefined);

    if (!token || !phoneNumberId) {
      return {
        ok: false as const,
        error: `Las credenciales de WhatsApp no están configuradas en el servidor. [debug: process.env token=${tokenFromProcess ? "SET" : "MISSING"}, globalThis token=${tokenFromGlobal ? "SET" : "MISSING"}]`,
      };
    }

    const to = data.recipient_phone.startsWith("+")
      ? data.recipient_phone.slice(1)
      : data.recipient_phone;

    const hasAttachment = !!(data.adjunto_url && data.adjunto_mime);

    let wamid: string | null = null;

    try {
      // ── 1. If there is an attachment, send the media message first ──────────
      if (hasAttachment) {
        const mediaType = whatsappMediaType(data.adjunto_mime!);
        const mediaPayload: Record<string, unknown> = {
          messaging_product: "whatsapp",
          to,
          type: mediaType,
          [mediaType]: {
            link: data.adjunto_url,
            // For documents, include the filename as caption
            ...(mediaType === "document"
              ? { filename: data.adjunto_nombre ?? "adjunto" }
              : {}),
          },
        };

        const mediaRes = await fetch(
          `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(mediaPayload),
          },
        );

        const mediaJson = (await mediaRes.json()) as {
          messages?: Array<{ id: string }>;
          error?: { message?: string; error_data?: { details?: string } };
        };

        if (!mediaRes.ok) {
          const msg =
            mediaJson.error?.error_data?.details ??
            mediaJson.error?.message ??
            "Error al enviar el adjunto por WhatsApp";
          return { ok: false as const, error: msg };
        }

        wamid = mediaJson.messages?.[0]?.id ?? null;
      }

      // ── 2. Send the text body ────────────────────────────────────────────────
      const textRes = await fetch(
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

      const textJson = (await textRes.json()) as {
        messages?: Array<{ id: string }>;
        error?: { message?: string; error_data?: { details?: string } };
      };

      if (!textRes.ok) {
        const msg =
          textJson.error?.error_data?.details ??
          textJson.error?.message ??
          "Error desconocido de WhatsApp";
        return { ok: false as const, error: msg };
      }

      // Use text message wamid if no attachment, otherwise keep media wamid
      if (!wamid) wamid = textJson.messages?.[0]?.id ?? null;
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : "Error de red",
      };
    }

    // ── 3. Log to database ────────────────────────────────────────────────────
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
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
      // Attachment metadata (null when no file was attached)
      adjunto_url: data.adjunto_url ?? null,
      adjunto_nombre: data.adjunto_nombre ?? null,
      adjunto_mime: data.adjunto_mime ?? null,
    });

    if (dbError) console.error("DB insert error", dbError);

    return { ok: true as const };
  });
