import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
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
  Globe,
  Building2,
  Search,
  Users,
  ChevronDown,
  ChevronRight,
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
  Codigo: string | null;
  id_persona: string | null;
  Nombre: string | null;
  NIF: string | null;
  Fdenominacion: string | null;
  Coeficiente: number | null;
  Direccion: string | null;
  Cpostal: string | null;
  TelefonoFijo: string | null;
  Email: string | null;
  Movil: string | null;
  Web: string | null;
  Fax: string | null;
  Cuenta: string | null;
  pagadores: string | null;
  NEMP: string | null;
  fecha_baja: string | null;
  coddistri: string | null;
  Nomdistri: string | null;
  bloque: string | null;
  BajoNombre: string | null;
  BajoNIF: string | null;
  BajoFdenominacion: string | null;
  Notas: string | null;
  NumComunidad: number | null;
  created_at: string;
}

const phoneRegex = /^\+[1-9]\d{6,14}$/;

const clienteSchema = z.object({
  Nombre: z.string().trim().min(1, "El nombre es obligatorio").max(400),
  NIF: z.string().trim().max(20).optional().or(z.literal("")),
  Fdenominacion: z.string().trim().max(400).optional().or(z.literal("")),
  Coeficiente: z.string().trim().optional().or(z.literal("")),
  Movil: z
    .string()
    .trim()
    .regex(phoneRegex, "El móvil debe estar en formato E.164, ej. +34611123456")
    .optional()
    .or(z.literal("")),
  TelefonoFijo: z
    .string()
    .trim()
    .regex(phoneRegex, "El fijo debe estar en formato E.164, ej. +34911123456")
    .optional()
    .or(z.literal("")),
  Email: z
    .string()
    .trim()
    .email("Introduce un email válido")
    .optional()
    .or(z.literal("")),
  Web: z.string().trim().max(300).optional().or(z.literal("")),
  Fax: z.string().trim().max(50).optional().or(z.literal("")),
  Direccion: z.string().trim().max(400).optional().or(z.literal("")),
  Cpostal: z.string().trim().max(10).optional().or(z.literal("")),
  Cuenta: z.string().trim().max(100).optional().or(z.literal("")),
  pagadores: z.string().trim().max(200).optional().or(z.literal("")),
  NEMP: z.string().trim().max(50).optional().or(z.literal("")),
  fecha_baja: z.string().trim().optional().or(z.literal("")),
  coddistri: z.string().trim().max(50).optional().or(z.literal("")),
  Nomdistri: z.string().trim().max(200).optional().or(z.literal("")),
  bloque: z.string().trim().max(100).optional().or(z.literal("")),
  BajoNombre: z.string().trim().max(400).optional().or(z.literal("")),
  BajoNIF: z.string().trim().max(20).optional().or(z.literal("")),
  BajoFdenominacion: z.string().trim().max(400).optional().or(z.literal("")),
  Notas: z.string().trim().max(4000).optional().or(z.literal("")),
  Codigo: z.string().trim().max(50).optional().or(z.literal("")),
  id_persona: z.string().trim().max(50).optional().or(z.literal("")),
  NumComunidad: z.string().trim().optional().or(z.literal("")),
});

const EMPTY_FORM = {
  Nombre: "", NIF: "", Fdenominacion: "", Coeficiente: "",
  Movil: "", TelefonoFijo: "", Email: "", Web: "", Fax: "",
  Direccion: "", Cpostal: "", Cuenta: "", pagadores: "",
  NEMP: "", fecha_baja: "", coddistri: "", Nomdistri: "",
  bloque: "", BajoNombre: "", BajoNIF: "", BajoFdenominacion: "",
  Notas: "", Codigo: "", id_persona: "", NumComunidad: "",
};

async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, Codigo, id_persona, Nombre, NIF, Fdenominacion, Coeficiente, Movil, TelefonoFijo, Email, Web, Fax, Direccion, Cpostal, Cuenta, pagadores, NEMP, fecha_baja, coddistri, Nomdistri, bloque, BajoNombre, BajoNIF, BajoFdenominacion, Notas, NumComunidad, created_at")
    .order("NumComunidad", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

// ─── NumComunidad combobox ───────────────────────────────────────────────────
function NumComunidadCombobox({
  options,
  value,
  onChange,
  placeholder = "Buscar o escribir nº comunidad…",
}: {
  options: number[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // keep query in sync when value prop changes (e.g. form reset)
  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!query) return options;
    return options.filter((n) => String(n).includes(query));
  }, [options, query]);

  return (
    <div ref={ref} className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={query}
        placeholder={placeholder}
        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg text-sm">
          {filtered.map((n) => (
            <li
              key={n}
              className="px-3 py-2 cursor-pointer hover:bg-accent"
              onMouseDown={() => {
                onChange(String(n));
                setQuery(String(n));
                setOpen(false);
              }}
            >
              Comunidad {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
function ContactsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["contacts"],
    queryFn: fetchClientes,
  });

  const [composeFor, setComposeFor] = useState<Cliente | null>(null);
  const [composeBulk, setComposeBulk] = useState<{ num: number; clientes: Cliente[] } | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  // search / filter state
  const [nameSearch, setNameSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFormError(null);
    };
  }

  // Derived data
  const communityNumbers = useMemo(() => {
    if (!data) return [];
    const nums = [...new Set(data.map((c) => c.NumComunidad).filter((n): n is number => n != null))];
    return nums.sort((a, b) => a - b);
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    let list = data;
    if (nameSearch.trim()) {
      const q = nameSearch.trim().toLowerCase();
      list = list.filter((c) => c.Nombre?.toLowerCase().includes(q));
    }
    if (communityFilter.trim()) {
      const num = parseFloat(communityFilter.trim());
      if (!isNaN(num)) {
        list = list.filter((c) => c.NumComunidad === num);
      }
    }
    return list;
  }, [data, nameSearch, communityFilter]);

  // Group by NumComunidad
  const grouped = useMemo(() => {
    const map = new Map<string, Cliente[]>();
    for (const c of filteredData) {
      const key = c.NumComunidad != null ? String(c.NumComunidad) : "__sin_comunidad__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    // Sort: numbered groups first (ascending), then the no-community group
    const entries = [...map.entries()].sort(([a], [b]) => {
      if (a === "__sin_comunidad__") return 1;
      if (b === "__sin_comunidad__") return -1;
      return parseFloat(a) - parseFloat(b);
    });
    return entries;
  }, [filteredData]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const addCliente = useMutation({
    mutationFn: async (input: typeof EMPTY_FORM) => {
      const { error } = await supabase.from("clientes").insert({
        Nombre: input.Nombre || null,
        NIF: input.NIF || null,
        Fdenominacion: input.Fdenominacion || null,
        Coeficiente: input.Coeficiente ? parseFloat(input.Coeficiente) : null,
        Movil: input.Movil || null,
        TelefonoFijo: input.TelefonoFijo || null,
        Email: input.Email || null,
        Web: input.Web || null,
        Fax: input.Fax || null,
        Direccion: input.Direccion || null,
        Cpostal: input.Cpostal || null,
        Cuenta: input.Cuenta || null,
        pagadores: input.pagadores || null,
        NEMP: input.NEMP || null,
        fecha_baja: input.fecha_baja || null,
        coddistri: input.coddistri || null,
        Nomdistri: input.Nomdistri || null,
        bloque: input.bloque || null,
        BajoNombre: input.BajoNombre || null,
        BajoNIF: input.BajoNIF || null,
        BajoFdenominacion: input.BajoFdenominacion || null,
        Notas: input.Notas || null,
        Codigo: input.Codigo || null,
        id_persona: input.id_persona || null,
        NumComunidad: input.NumComunidad ? parseFloat(input.NumComunidad) : null,
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

      {/* ── Add contact form ── */}
      <form
        onSubmit={submitNew}
        className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5"
      >
        <h2 className="font-medium">Añadir contacto</h2>

        {/* Identification */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Identificación</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Código</label>
              <input value={form.Codigo} onChange={setField("Codigo")} placeholder="COD001" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">ID Persona</label>
              <input value={form.id_persona} onChange={setField("id_persona")} placeholder="ID externo" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">NIF</label>
              <input value={form.NIF} onChange={setField("NIF")} placeholder="12345678A" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Personal */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Datos personales</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre completo <span className="text-destructive">*</span></label>
              <input value={form.Nombre} onChange={setField("Nombre")} placeholder="Jane Smith" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Fdenominación</label>
              <input value={form.Fdenominacion} onChange={setField("Fdenominacion")} placeholder="Denominación fiscal" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Coeficiente</label>
              <input value={form.Coeficiente} onChange={setField("Coeficiente")} type="number" step="0.0001" placeholder="0.0000" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cuenta</label>
              <input value={form.Cuenta} onChange={setField("Cuenta")} placeholder="ES00 0000 0000 0000" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">NEMP</label>
              <input value={form.NEMP} onChange={setField("NEMP")} placeholder="Nº empleado" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fecha de baja</label>
              <input value={form.fecha_baja} onChange={setField("fecha_baja")} type="date" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Núm. comunidad</label>
              <NumComunidadCombobox
                options={communityNumbers}
                value={form.NumComunidad}
                onChange={(v) => { setForm((p) => ({ ...p, NumComunidad: v })); setFormError(null); }}
                placeholder="Nº comunidad…"
              />
            </div>
          </div>
        </fieldset>

        {/* Contact */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Contacto</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Móvil (WhatsApp)</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Movil} onChange={setField("Movil")} placeholder="+34611123456" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Teléfono fijo</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.TelefonoFijo} onChange={setField("TelefonoFijo")} placeholder="+34911123456" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Fax</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Fax} onChange={setField("Fax")} placeholder="+34911123456" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring font-mono" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Email} onChange={setField("Email")} type="email" placeholder="jane@example.com" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Web</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Web} onChange={setField("Web")} placeholder="https://www.example.com" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
        </fieldset>

        {/* Address */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Dirección</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Dirección</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Direccion} onChange={setField("Direccion")} placeholder="Calle Mayor, 12, 3B" className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Código postal</label>
              <input value={form.Cpostal} onChange={setField("Cpostal")} placeholder="28001" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Bloque</label>
              <input value={form.bloque} onChange={setField("bloque")} placeholder="Bloque A" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Cód. distribución</label>
              <input value={form.coddistri} onChange={setField("coddistri")} placeholder="D01" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nom. distribución</label>
              <input value={form.Nomdistri} onChange={setField("Nomdistri")} placeholder="Zona Norte" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Bajo */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Datos del bajo</legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nombre bajo</label>
              <input value={form.BajoNombre} onChange={setField("BajoNombre")} placeholder="Nombre del bajo" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">NIF bajo</label>
              <input value={form.BajoNIF} onChange={setField("BajoNIF")} placeholder="NIF del bajo" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="space-y-1 md:col-span-3">
              <label className="text-xs font-medium text-muted-foreground">Fdenominación bajo</label>
              <input value={form.BajoFdenominacion} onChange={setField("BajoFdenominacion")} placeholder="Denominación fiscal del bajo" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
        </fieldset>

        {/* Pagadores */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Pagadores</legend>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Pagadores</label>
            <input value={form.pagadores} onChange={setField("pagadores")} placeholder="Pagadores asociados" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
        </fieldset>

        {/* Notes */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Notas</legend>
          <div className="relative">
            <StickyNote className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <textarea value={form.Notas} onChange={setField("Notas")} placeholder="Notas relevantes sobre este contacto…" rows={3} maxLength={4000} className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
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

      {/* ── Contact list ── */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Header + search/filter toolbar */}
        <div className="px-5 py-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Todos los contactos</h2>
            <span className="text-xs text-muted-foreground">{filteredData.length} / {data?.length ?? 0}</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Name search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {/* Community filter combobox */}
            <div className="sm:w-64">
              <NumComunidadCombobox
                options={communityNumbers}
                value={communityFilter}
                onChange={setCommunityFilter}
                placeholder="Filtrar por comunidad…"
              />
            </div>
            {(nameSearch || communityFilter) && (
              <button
                onClick={() => { setNameSearch(""); setCommunityFilter(""); }}
                className="h-9 px-3 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent flex items-center gap-1 shrink-0"
              >
                <X className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
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
        ) : grouped.length > 0 ? (
          <div className="divide-y divide-border">
            {grouped.map(([groupKey, members]) => {
              const isNoCommunity = groupKey === "__sin_comunidad__";
              const collapsed = collapsedGroups.has(groupKey);
              const withPhone = members.filter((c) => c.Movil);
              return (
                <div key={groupKey}>
                  {/* Group header */}
                  <div className="px-5 py-2.5 bg-muted/40 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleGroup(groupKey)}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                    >
                      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isNoCommunity ? (
                        <span className="text-muted-foreground italic">Sin comunidad asignada</span>
                      ) : (
                        <>
                          <Users className="h-4 w-4 text-muted-foreground" />
                          Comunidad {groupKey}
                        </>
                      )}
                      <span className="text-xs text-muted-foreground font-normal ml-1">
                        ({members.length} contacto{members.length !== 1 ? "s" : ""})
                      </span>
                    </button>
                    {!isNoCommunity && withPhone.length > 0 && (
                      <button
                        onClick={() => setComposeBulk({ num: parseFloat(groupKey), clientes: withPhone })}
                        className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 shrink-0"
                      >
                        <Send className="h-3 w-3" />
                        Enviar a comunidad ({withPhone.length})
                      </button>
                    )}
                  </div>

                  {/* Members */}
                  {!collapsed && (
                    <ul className="divide-y divide-border">
                      {members.map((c) => (
                        <li key={c.id} className="px-5 py-3 flex items-center justify-between gap-3 pl-10">
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {c.Nombre ?? "(sin nombre)"}
                              {c.NIF && <span className="ml-2 text-xs text-muted-foreground font-mono">{c.NIF}</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                              {c.Movil && (
                                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                  <Phone className="h-3 w-3" />{c.Movil}
                                </span>
                              )}
                              {c.Email && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3" />{c.Email}
                                </span>
                              )}
                              {c.Nomdistri && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />{c.Nomdistri}
                                </span>
                              )}
                            </div>
                            {c.Notas && (
                              <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-sm">{c.Notas}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {c.Movil && (
                              <button
                                onClick={() => setComposeFor(c)}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                              >
                                <Send className="h-3.5 w-3.5" /> Enviar
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm(`¿Eliminar a ${c.Nombre ?? "este contacto"}?`)) deleteCliente.mutate(c.id); }}
                              className="grid place-items-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">
              {nameSearch || communityFilter ? "Sin resultados para esta búsqueda" : "Sin contactos todavía"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {nameSearch || communityFilter ? "Prueba con otros términos de búsqueda." : "Añade tu primer contacto arriba para empezar."}
            </p>
          </div>
        )}
      </div>

      {/* Individual compose sheet */}
      {composeFor && <ComposeSheet cliente={composeFor} onClose={() => setComposeFor(null)} />}

      {/* Bulk compose sheet */}
      {composeBulk && (
        <BulkComposeSheet
          numComunidad={composeBulk.num}
          clientes={composeBulk.clientes}
          onClose={() => setComposeBulk(null)}
        />
      )}
    </div>
  );
}

// ─── Individual compose sheet ────────────────────────────────────────────────
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
          nombre_cliente: cliente.Nombre ?? "",
          recipient_phone: cliente.Movil!,
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
            <div className="font-medium mt-0.5">{cliente.Nombre ?? "(sin nombre)"}</div>
            <div className="text-xs font-mono text-muted-foreground mt-0.5">{cliente.Movil}</div>
            {cliente.NumComunidad != null && (
              <div className="text-xs text-muted-foreground mt-0.5">Comunidad {cliente.NumComunidad}</div>
            )}
            {cliente.Nomdistri && <div className="text-xs text-muted-foreground mt-0.5">{cliente.Nomdistri}</div>}
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

// ─── Bulk compose sheet ───────────────────────────────────────────────────────
type BulkResult = { nombre: string; phone: string; ok: boolean; error?: string };

function BulkComposeSheet({
  numComunidad,
  clientes,
  onClose,
}: {
  numComunidad: number;
  clientes: Cliente[];
  onClose: () => void;
}) {
  const send = useServerFn(sendWhatsAppMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) { setError("El mensaje no puede estar vacío"); return; }
    setSending(true);
    setResults(null);
    setError(null);

    const out: BulkResult[] = [];
    for (const c of clientes) {
      if (!c.Movil) continue;
      try {
        const res = await send({
          data: {
            cliente_id: c.id,
            nombre_cliente: c.Nombre ?? "",
            recipient_phone: c.Movil,
            message_body: trimmed,
          },
        });
        out.push({ nombre: c.Nombre ?? c.Movil, phone: c.Movil, ok: res.ok, error: res.ok ? undefined : res.error });
      } catch (e) {
        out.push({ nombre: c.Nombre ?? c.Movil, phone: c.Movil, ok: false, error: e instanceof Error ? e.message : "Error" });
      }
    }

    setSending(false);
    setResults(out);
    const sent = out.filter((r) => r.ok).length;
    const failed = out.filter((r) => !r.ok).length;
    if (sent > 0) toast.success(`${sent} mensaje${sent !== 1 ? "s" : ""} enviado${sent !== 1 ? "s" : ""}`);
    if (failed > 0) toast.error(`${failed} mensaje${failed !== 1 ? "s" : ""} fallido${failed !== 1 ? "s" : ""}`);
    qc.invalidateQueries({ queryKey: ["messages-log"] });
    qc.invalidateQueries({ queryKey: ["recent"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  }

  const done = results !== null && !sending;

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={!sending ? onClose : undefined} />
      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div>
            <h3 className="font-semibold">Envío masivo — Comunidad {numComunidad}</h3>
            <p className="text-xs text-muted-foreground">{clientes.length} destinatario{clientes.length !== 1 ? "s" : ""} con móvil</p>
          </div>
          {!sending && (
            <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-5 flex-1 overflow-y-auto">
          {/* Recipients preview */}
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 max-h-36 overflow-y-auto">
            <div className="text-xs text-muted-foreground font-medium mb-1">Destinatarios</div>
            {clientes.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[55%]">{c.Nombre ?? "(sin nombre)"}</span>
                <span className="font-mono text-muted-foreground">{c.Movil}</span>
              </div>
            ))}
          </div>

          {/* Message */}
          {!done && (
            <div>
              <label className="text-sm font-medium">Mensaje</label>
              <textarea
                value={body}
                onChange={(e) => { setBody(e.target.value); setError(null); }}
                rows={8}
                maxLength={4096}
                placeholder="Escribe tu mensaje para toda la comunidad…"
                disabled={sending}
                className="mt-2 w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60"
              />
              <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{error && <span className="text-destructive">{error}</span>}</span>
                <span>{body.length}/4096</span>
              </div>
            </div>
          )}

          {/* Progress / results */}
          {sending && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Enviando mensajes…
            </div>
          )}

          {results && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Resultado del envío</div>
              <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden text-xs">
                {results.map((r, i) => (
                  <li key={i} className={`px-3 py-2 flex items-center justify-between gap-2 ${r.ok ? "bg-background" : "bg-destructive/5"}`}>
                    <span className="truncate max-w-[55%]">{r.nombre}</span>
                    {r.ok ? (
                      <span className="text-green-600 font-medium shrink-0">✓ Enviado</span>
                    ) : (
                      <span className="text-destructive truncate max-w-[40%]" title={r.error}>✗ {r.error ?? "Error"}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex gap-2">
          <button onClick={onClose} disabled={sending} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent disabled:opacity-60">
            {done ? "Cerrar" : "Cancelar"}
          </button>
          {!done && (
            <button
              onClick={handleSend}
              disabled={sending || !body.trim()}
              className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {sending
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</>
                : <><Send className="h-4 w-4" /> Enviar a {clientes.length} contacto{clientes.length !== 1 ? "s" : ""}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
