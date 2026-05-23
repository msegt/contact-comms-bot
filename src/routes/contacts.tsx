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
  Building2,
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

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  company: string | null;
  notes: string | null;
  created_at: string;
}

const phoneRegex = /^\+[1-9]\d{6,14}$/;

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone_number: z
    .string()
    .trim()
    .regex(phoneRegex, "Phone must be in E.164 format, e.g. +34911123456"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254)
    .optional()
    .or(z.literal("")),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

async function fetchContacts(): Promise<Contact[]> {
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, phone_number, email, company, notes, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

const EMPTY_FORM = { name: "", phone: "", email: "", company: "", notes: "" };

function ContactsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchContacts,
  });
  const [composeFor, setComposeFor] = useState<Contact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFormError(null);
    };
  }

  const addContact = useMutation({
    mutationFn: async (input: {
      name: string;
      phone_number: string;
      email?: string | null;
      company?: string | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from("contacts").insert(input);
      if (error) throw error;
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setFormError(null);
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Contact added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
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
    const parsed = contactSchema.safeParse({
      name: form.name,
      phone_number: form.phone,
      email: form.email || undefined,
      company: form.company || undefined,
      notes: form.notes || undefined,
    });
    if (!parsed.success) {
      setFormError(parsed.error.issues[0].message);
      return;
    }
    addContact.mutate({
      name: parsed.data.name,
      phone_number: parsed.data.phone_number,
      email: parsed.data.email || null,
      company: parsed.data.company || null,
      notes: parsed.data.notes || null,
    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Required fields */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Full name <span className="text-destructive">*</span>
            </label>
            <input
              value={form.name}
              onChange={setField("name")}
              placeholder="Jane Smith"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              WhatsApp number <span className="text-destructive">*</span>
            </label>
            <input
              value={form.phone}
              onChange={setField("phone")}
              placeholder="+34911123456"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
            />
          </div>

          {/* Optional fields */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={form.email}
                onChange={setField("email")}
                type="email"
                placeholder="jane@example.com"
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Company
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                value={form.company}
                onChange={setField("company")}
                placeholder="Acme Ltd"
                className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes — full width */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Notes
            </label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <textarea
                value={form.notes}
                onChange={setField("notes")}
                placeholder="Any relevant notes about this contact…"
                rows={2}
                maxLength={1000}
                className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
          </div>
        </div>

        {formError && (
          <p className="mt-2 text-xs text-destructive">{formError}</p>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={addContact.isPending}
            className="h-10 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {addContact.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add contact
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-medium">All contacts</h2>
          <span className="text-xs text-muted-foreground">{data?.length ?? 0} total</span>
        </div>
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-destructive/10 text-destructive mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-destructive">Failed to load contacts</p>
            <p className="text-xs text-muted-foreground mt-2 mb-4">
              {error instanceof Error
                ? error.message
                : "An error occurred while loading contacts."}
            </p>
            <button
              onClick={() => qc.invalidateQueries({ queryKey: ["contacts"] })}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              Try again
            </button>
          </div>
        ) : data && data.length > 0 ? (
          <ul className="divide-y divide-border">
            {data.map((c) => (
              <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.name}</div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {c.phone_number}
                    </span>
                    {c.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {c.email}
                      </span>
                    )}
                    {c.company && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {c.company}
                      </span>
                    )}
                  </div>
                  {c.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-sm">
                      {c.notes}
                    </p>
                  )}
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
                      if (confirm(`Delete ${c.name}?`)) deleteContact.mutate(c.id);
                    }}
                    className="grid place-items-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
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

function ComposeSheet({
  contact,
  onClose,
}: {
  contact: Contact;
  onClose: () => void;
}) {
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
          recipient_phone: contact.phone_number,
          message_body: trimmed,
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
            <div className="font-medium mt-0.5">{contact.name}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">
              {contact.phone_number}
            </div>
            {contact.company && (
              <div className="text-xs text-muted-foreground mt-0.5">{contact.company}</div>
            )}
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
              placeholder="Type your message..."
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
                <Loader2 className="h-4 w-4 animate-spin" /> Sending...
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
