import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Plus,
  Send,
  Trash2,
  Phone,
  X,
  Loader2,
  UsersRound,
  AlertCircle,
  Mail,
  MapPin,
  StickyNote,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/Skeleton";
import { sendWhatsAppMessage } from "@/lib/whatsapp.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts - WhatsBoard" },
      { name: "description", content: "Manage WhatsApp contacts and send messages." },
    ],
  }),
  component: ContactsPage,
});

interface Cliente {
  id: string;
  nombre: string;
  apellidos: string;
  telefono_movil: string | null;
  telefono_fijo: string | null;
  email: string | null;
  direccion: string | null;
  numero: string | null;
  piso: string | null;
  puerta: string | null;
  codigo_postal: string | null;
  municipio: string | null;
  provincia: string | null;
  anotaciones: string | null;
  created_at: string;
}

const phoneRegex = /^\+[1-9]\d{6,14}$/;

const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  apellidos: z.string().trim().min(1, "Los apellidos son obligatorios").max(200),
  telefono_movil: z
    .string()
    .trim()
    .regex(phoneRegex, "El móvil debe estar en formato E.164, ej. +34911123456"),
  telefono_fijo: z
    .string()
    .trim()
    .regex(phoneRegex, "El fijo debe estar en formato E.164, ej. +34911123456")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Introduce un email válido")
    .optional()
    .or(z.literal("")),
  direccion: z.string().trim().max(300).optional().or(z.literal("")),
  numero: z.string().trim().max(20).optional().or(z.literal("")),
  piso: z.string().trim().max(20).optional().or(z.literal("")),
  puerta: z.string().trim().max(20).optional().or(z.literal("")),
  codigo_postal: z.string().trim().max(10).optional().or(z.literal("")),
  municipio: z.string().trim().max(200).optional().or(z.literal("")),
  provincia: z.string().trim().max(200).optional().or(z.literal("")),
  anotaciones: z.string().trim().max(2000).optional().or(z.literal("")),
});

const EMPTY_FORM = {
  nombre: "", apellidos: "", telefono_movil: "", telefono_fijo: "",
  email: "", direccion: "", numero: "", piso: "", puerta: "",
  codigo_postal: "", municipio: "", provincia: "", anotaciones: "",
};

async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, apellidos, telefono_movil, telefono_fijo, email, direccion, numero, piso, puerta, codigo_postal, municipio, provincia, anotaciones, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function ContactsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchClientes,
  });
  const [composeFor, setComposeFor] = useState<Cliente | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFormError(null);
    };
  }

  const addCliente = useMutation({
    mutationFn: async (input: typeof EMPTY_FORM) => {
      const { error } = await supabase.from("clientes").insert({
        nombre: input.nombre,
        apellidos: input.apellidos,
        telefono_movil: input.telefono_movil || null,
        telefono_fijo: input.telefono_fijo || null,
        email: input.email || null,
        direccion: input.direccion || null,
        numero: input.numero || null,
        piso: input.piso || null,
        puerta: input.puerta || null,
        codigo_postal: input.codigo_postal || null,
        municipio: input.municipio || null,
        provincia: input.provincia || null,
        anotaciones: input.anotaciones || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Contacto añadido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Contacto eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const parsed = clienteSchema.safeParse(form);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    addCliente.mutate(form);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona a quién puedes enviar mensajes por WhatsApp Business.
        </p>
      </div>

      <form
        onSubmit={submitNew}
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5"
      >
        <h2 className="font-medium">Añadir contacto</h2>

        {/* Personal */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Datos personales</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nombre <span className="text-destructive">*</span></label>
              <input value={form.nombre} onChange={setField("nombre")} placeholder="Jane" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Apellidos <span className="text-destructive">*</span></label>
              <input value={form.apellidos} onChange={setField("apellidos")} placeholder="Smith" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Móvil (WhatsApp) <span className="text-destructive">*</span></label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.telefono_movil} onChange={setField("telefono_movil")} placeholder="+34611123456" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Teléfono fijo</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.telefono_fijo} onChange={setField("telefono_fijo")} placeholder="+34911123456" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.email} onChange={setField("email")} type="email" placeholder="jane@example.com" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Address */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Dirección</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Calle</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.direccion} onChange={setField("direccion")} placeholder="Calle Mayor" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número</label>
              <input value={form.numero} onChange={setField("numero")} placeholder="12" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Piso</label>
              <input value={form.piso} onChange={setField("piso")} placeholder="3" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Puerta</label>
              <input value={form.puerta} onChange={setField("puerta")} placeholder="B" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Código postal</label>
              <input value={form.codigo_postal} onChange={setField("codigo_postal")} placeholder="28001" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Municipio</label>
              <input value={form.municipio} onChange={setField("municipio")} placeholder="Madrid" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Provincia</label>
              <input value={form.provincia} onChange={setField("provincia")} placeholder="Madrid" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Anotaciones</legend>
          <div className="relative">
            <StickyNote className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <textarea value={form.anotaciones} onChange={setField("anotaciones")} placeholder="Notas relevantes sobre este contacto…" rows={3} maxLength={2000} className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </fieldset>

        {formError && <p className="text-xs text-destructive">{formError}</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addCliente.isPending}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {addCliente.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Añadir contacto
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">Todos los contactos</h2>
          <span className="text-xs text-muted-foreground">{data?.length ?? 0} total</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-destructive/10 text-destructive mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-destructive">Error al cargar los contactos</p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              {error instanceof Error ? error.message : "Ha ocurrido un error."}
            </p>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["contacts"] })}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Reintentar
            </button>
          </div>
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.nombre} {c.apellidos}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    {c.telefono_movil && (
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3" />{c.telefono_movil}
                      </span>
                    )}
                    {c.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />{c.email}
                      </span>
                    )}
                    {c.municipio && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{c.municipio}{c.provincia ? `, ${c.provincia}` : ""}
                      </span>
                    )}
                  </div>
                  {c.anotaciones && (
                    <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-sm">{c.anotaciones}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.telefono_movil && (
                    <button
                      onClick={() => setComposeFor(c)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                    >
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  )}
                  <button
                    onClick={() => { if (confirm(`¿Eliminar a ${c.nombre} ${c.apellidos}?`)) deleteCliente.mutate(c.id); }}
                    className="grid place-items-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">Sin contactos todavía</p>
            <p className="text-xs text-muted-foreground mt-1">Añade tu primer contacto arriba para empezar.</p>
          </div>
        )}
      </div>

      {composeFor && <ComposeSheet cliente={composeFor} onClose={() => setComposeFor(null)} />}
    </div>
  );
}

function ComposeSheet({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const send = useServerFn(sendWhatsAppMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error("El mensaje no puede estar vacío");
      const res = await send({
        data: {
          cliente_id: cliente.id,
          nombre_cliente: `${cliente.nombre} ${cliente.apellidos}`,
          recipient_phone: cliente.telefono_movil!,
          message_body: trimmed,
        },
      });
      if (!res.ok) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success("Mensaje enviado");
      qc.invalidateQueries({ queryKey: ["messages-log"] });
      qc.invalidateQueries({ queryKey: ["recent"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div>
            <h3 className="font-semibold">Nuevo mensaje</h3>
            <p className="text-xs text-muted-foreground">vía WhatsApp Business</p>
          </div>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Para</div>
            <div className="font-medium mt-0.5">{cliente.nombre} {cliente.apellidos}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{cliente.telefono_movil}</div>
            {cliente.municipio && <div className="text-xs text-muted-foreground mt-0.5">{cliente.municipio}</div>}
          </div>
          <div>
            <label className="text-sm font-medium">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => { setBody(e.target.value); setError(null); }}
              rows={8}
              maxLength={4096}
              placeholder="Escribe tu mensaje…"
              className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-destructive">{error}</span>}</span>
              <span>{body.length}/4096</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border p-4 flex gap-2">
          <button onClick={onClose} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent">Cancelar</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !body.trim()}
            className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {mutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar mensaje</>}
          </button>
        </div>
      </div>
    </div>
  );
}
