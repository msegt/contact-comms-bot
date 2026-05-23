import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Send, Trash2, Phone, X, Loader2, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/Skeleton";
import { sendWhatsAppMessage } from "@/lib/whatsapp.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/contacts")({
  head: () => ({
    meta: [
      { title: "Contacts — WhatsBoard" },
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
  created_at: string;
}

const phoneRegex = /^\+[1-9]\d{6,14}$/;
const contactSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido").max(100),
  apellidos: z.string().trim().min(1, "Apellidos requeridos").max(100),
  telefono_movil: z.string().trim().regex(phoneRegex, "Teléfono en formato E.164, ej. +34911123456"),
});

async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, apellidos, telefono_movil, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function ContactsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["contacts"], queryFn: fetchClientes });
  const [composeFor, setComposeFor] = useState<Cliente | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const addContact = useMutation({
    mutationFn: async (input: { nombre: string; apellidos: string; telefono_movil: string }) => {
    const { error } = await supabase.from("clientes").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      setNombre("");
      setApellidos("");  // ← añadir esta línea
      setPhone("");
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Contact added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Contact deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    const parsed = contactSchema.safeParse({ nombre, apellidos, telefono_movil: phone });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    addContact.mutate(parsed.data);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage who you can message via WhatsApp Business.
        </p>
      </div>

      <form
        onSubmit={submitNew}
        className="rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <h2 className="font-medium mb-4">Add contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={apellidos}
            onChange={(e) => setApellidos(e.target.value)}
            placeholder="Apellidos"
            className="h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+347911123456"
            className="h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
          <button
            type="submit"
            disabled={addContact.isPending}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {addContact.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </button>
        </div>
        {formError && (
          <p className="mt-2 text-xs text-destructive">{formError}</p>
        )}
      </form>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">All contacts</h2>
          <span className="text-xs text-muted-foreground">
            {data?.length ?? 0} total
          </span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li
                key={c.id}
                className="px-5 py-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.nombre} {c.apellidos}</div>
                  <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                    <Phone className="h-3 w-3" />
                    {c.telefono_movil ?? "-"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setComposeFor(c)}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                  >
                    <Send className="h-3.5 w-3.5" /> Send
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${c.nombre} ${c.apellidos}?`)) deleteContact.mutate(c.id);
                    }}
                    className="grid place-items-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                    aria-label="Delete"
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
            <p className="text-sm font-medium">No contacts yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your first contact above to start messaging.
            </p>
          </div>
        )}
      </div>

      {composeFor && (
        <ComposeSheet contact={composeFor} onClose={() => setComposeFor(null)} />
      )}
    </div>
  );
}

function ComposeSheet({ contact, onClose }: { contact: Cliente; onClose: () => void }) {
  const send = useServerFn(sendWhatsAppMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error("Message cannot be empty");
      const res = await send({
        data: {
          contact_id: contact.id,
          nombre_cliente: `${contact.nombre} ${contact.apellidos}`,
          telefono_destino: contact.telefono_movil!,
          mensaje: trimmed,
        },
      });
      if (!res.ok) throw new Error(res.error);
      return res;
    },
    onSuccess: () => {
      toast.success("Message sent");
      qc.invalidateQueries({ queryKey: ["messages-log"] });
      qc.invalidateQueries({ queryKey: ["recent"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      onClose();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="fixed inset-0 z-40 flex">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div>
            <h3 className="font-semibold">New message</h3>
            <p className="text-xs text-muted-foreground">via WhatsApp Business</p>
          </div>
          <button
            onClick={onClose}
            className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">To</div>
            <div className="font-medium mt-0.5">{contact.nombre} {contact.apellidos}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              {contact.telefono_movil}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Message</label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setError(null);
              }}
              rows={8}
              maxLength={4096}
              placeholder="Type your message…"
              className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-destructive">{error}</span>}</span>
              <span>{body.length}/4096</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border p-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !body.trim()}
            className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" /> Send message
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
