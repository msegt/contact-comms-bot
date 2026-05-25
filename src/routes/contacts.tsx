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
  Paperclip,
  FileText,
  BookTemplate,
  Pencil,
  Check,
  UserPlus,
  ChevronsUpDown,
  Hash,
  Calendar,
  CreditCard,
  Info,
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

interface Plantilla {
  id: string;
  nombre: string;
  cuerpo: string;
  descripcion: string | null;
}

const ACCEPTED_MIME =
  "application/pdf,image/jpeg,image/png,image/gif,image/webp," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function fileIcon(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "IMG";
  if (mime.includes("word")) return "DOC";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "XLS";
  return "FILE";
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

function clienteToForm(c: Cliente): typeof EMPTY_FORM {
  return {
    Nombre: c.Nombre ?? "",
    NIF: c.NIF ?? "",
    Fdenominacion: c.Fdenominacion ?? "",
    Coeficiente: c.Coeficiente != null ? String(c.Coeficiente) : "",
    Movil: c.Movil ?? "",
    TelefonoFijo: c.TelefonoFijo ?? "",
    Email: c.Email ?? "",
    Web: c.Web ?? "",
    Fax: c.Fax ?? "",
    Direccion: c.Direccion ?? "",
    Cpostal: c.Cpostal ?? "",
    Cuenta: c.Cuenta ?? "",
    pagadores: c.pagadores ?? "",
    NEMP: c.NEMP ?? "",
    fecha_baja: c.fecha_baja ?? "",
    coddistri: c.coddistri ?? "",
    Nomdistri: c.Nomdistri ?? "",
    bloque: c.bloque ?? "",
    BajoNombre: c.BajoNombre ?? "",
    BajoNIF: c.BajoNIF ?? "",
    BajoFdenominacion: c.BajoFdenominacion ?? "",
    Notas: c.Notas ?? "",
    Codigo: c.Codigo ?? "",
    id_persona: c.id_persona ?? "",
    NumComunidad: c.NumComunidad != null ? String(c.NumComunidad) : "",
  };
}

async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from("clientes")
    .select("id, Codigo, id_persona, Nombre, NIF, Fdenominacion, Coeficiente, Movil, TelefonoFijo, Email, Web, Fax, Direccion, Cpostal, Cuenta, pagadores, NEMP, fecha_baja, coddistri, Nomdistri, bloque, BajoNombre, BajoNIF, BajoFdenominacion, Notas, NumComunidad, created_at")
    .order("NumComunidad", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as Cliente[];
}

async function fetchPlantillas(): Promise<Plantilla[]> {
  const { data, error } = await supabase
    .from("plantillas")
    .select("id, nombre, cuerpo, descripcion")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Plantilla[];
}

// ─── Shared style helpers ─────────────────────────────────────────────────────
const inputCls = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow";
const inputInvalidCls = "w-full h-10 px-3 rounded-md border border-destructive bg-background text-sm outline-none focus:ring-2 focus:ring-destructive/40 transition-shadow";
const inputIconCls = "w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring transition-shadow";
const inputIconInvalidCls = "w-full h-10 pl-9 pr-3 rounded-md border border-destructive bg-background text-sm outline-none focus:ring-2 focus:ring-destructive/40 transition-shadow";
const labelCls = "text-xs font-medium text-muted-foreground";
const sectionTitleCls = "text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-border";

// ─── Inline field error helper ────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-[11px] text-destructive mt-0.5">
      <AlertCircle className="h-3 w-3 shrink-0" />{msg}
    </p>
  );
}

// ─── NumComunidad combobox ────────────────────────────────────────────────────
function NumComunidadCombobox({
  options, value, onChange, placeholder = "Buscar o escribir nº comunidad…",
}: {
  options: number[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

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
      <div className="relative">
        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text" inputMode="numeric" value={query} placeholder={placeholder}
          className={inputIconCls}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        />
        <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      </div>
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-md border border-border bg-popover shadow-lg text-sm">
          {filtered.map((n) => (
            <li key={n} className="px-3 py-2 cursor-pointer hover:bg-accent flex items-center gap-2"
              onMouseDown={() => { onChange(String(n)); setQuery(String(n)); setOpen(false); }}>
              <Hash className="h-3 w-3 text-muted-foreground" /> Comunidad {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Template picker panel ────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onClose }: { onSelect: (cuerpo: string) => void; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: plantillas = [], isLoading } = useQuery({ queryKey: ["plantillas"], queryFn: fetchPlantillas });
  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [creating, setCreating] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editCuerpo, setEditCuerpo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(p: Plantilla) { setEditing(p); setEditNombre(p.nombre); setEditCuerpo(p.cuerpo); setEditDescripcion(p.descripcion ?? ""); setEditError(null); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setEditNombre(""); setEditCuerpo(""); setEditDescripcion(""); setEditError(null); }
  function cancelEdit() { setEditing(null); setCreating(false); setEditError(null); }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nombre = editNombre.trim(); const cuerpo = editCuerpo.trim();
      if (!nombre) throw new Error("El nombre es obligatorio");
      if (!cuerpo) throw new Error("El cuerpo no puede estar vacío");
      if (creating) {
        const { error } = await supabase.from("plantillas").insert({ nombre, cuerpo, descripcion: editDescripcion.trim() || null });
        if (error) throw error;
      } else if (editing) {
        const { error } = await supabase.from("plantillas").update({ nombre, cuerpo, descripcion: editDescripcion.trim() || null }).eq("id", editing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plantillas"] }); cancelEdit(); toast.success(creating ? "Plantilla creada" : "Plantilla guardada"); },
    onError: (e: Error) => setEditError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("plantillas").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["plantillas"] }); toast.success("Plantilla eliminada"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const isFormOpen = creating || editing !== null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <BookTemplate className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Plantillas</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={startCreate} className="h-7 px-2.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 inline-flex items-center gap-1">
            <Plus className="h-3 w-3" /> Nueva
          </button>
          <button onClick={onClose} className="grid place-items-center h-7 w-7 rounded-md hover:bg-accent"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isFormOpen && (
          <div className="p-4 border-b border-border bg-muted/30 space-y-3">
            <div className="space-y-1">
              <label className={labelCls}>Nombre de la plantilla</label>
              <input value={editNombre} onChange={(e) => { setEditNombre(e.target.value); setEditError(null); }} placeholder="Ej. Aviso de reunión" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Descripción (opcional)</label>
              <input value={editDescripcion} onChange={(e) => setEditDescripcion(e.target.value)} placeholder="Breve descripción…" className={inputCls} />
            </div>
            <div className="space-y-1">
              <label className={labelCls}>Cuerpo del mensaje</label>
              <textarea value={editCuerpo} onChange={(e) => { setEditCuerpo(e.target.value); setEditError(null); }} rows={5} maxLength={4096} placeholder="Texto de la plantilla…" className="w-full rounded-md border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
              <div className="text-xs text-muted-foreground text-right">{editCuerpo.length}/4096</div>
            </div>
            {editError && <p className="text-xs text-destructive">{editError}</p>}
            <div className="flex gap-2">
              <button onClick={cancelEdit} className="flex-1 h-8 rounded-md border border-border text-xs font-medium hover:bg-accent">Cancelar</button>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="flex-1 h-8 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-1">
                {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {creating ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="p-4 space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : plantillas.length === 0 ? (
          <div className="p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No hay plantillas todavía.</p>
            <p className="text-xs text-muted-foreground mt-1">Crea la primera con el botón "Nueva".</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {plantillas.map((p) => (
              <li key={p.id} className="px-4 py-3 hover:bg-accent/40 group">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <button onClick={() => onSelect(p.cuerpo)} className="font-medium text-sm text-left hover:text-primary transition-colors w-full">{p.nombre}</button>
                    {p.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{p.descripcion}</p>}
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2 italic">{p.cuerpo}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} className="grid place-items-center h-7 w-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground" aria-label="Editar plantilla"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => { if (confirm(`¿Eliminar la plantilla "${p.nombre}"?`)) deleteMutation.mutate(p.id); }} className="grid place-items-center h-7 w-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive" aria-label="Eliminar plantilla"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Attachment picker ────────────────────────────────────────────────────────
function AttachmentPicker({ file, onChange }: { file: File | null; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_FILE_SIZE) { toast.error("El archivo supera el límite de 50 MB"); e.target.value = ""; return; }
    onChange(f);
  }
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Adjunto (opcional)</label>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-dashed border-border text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
          <Paperclip className="h-3.5 w-3.5" />{file ? "Cambiar archivo" : "Adjuntar archivo"}
        </button>
        {file && (
          <div className="flex items-center gap-1.5 text-xs bg-muted rounded-md px-2.5 py-1.5 min-w-0">
            <span className="font-mono font-bold text-primary">{fileIcon(file.type)}</span>
            <span className="truncate max-w-[160px]">{file.name}</span>
            <span className="text-muted-foreground shrink-0">({(file.size / 1024).toFixed(0)} KB)</span>
            <button type="button" onClick={() => { onChange(null); if (ref.current) ref.current.value = ""; }} className="text-muted-foreground hover:text-destructive ml-1" aria-label="Quitar adjunto"><X className="h-3 w-3" /></button>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept={ACCEPTED_MIME} onChange={handleChange} className="sr-only" aria-label="Seleccionar archivo adjunto" />
      <p className="text-xs text-muted-foreground">PDF, imágenes, Word, Excel · máx. 50 MB</p>
    </div>
  );
}

// ─── Tab definitions for the cliente sheet ────────────────────────────────────
const TABS = [
  { id: "principal", label: "Principal", icon: UserPlus },
  { id: "contacto",  label: "Contacto",  icon: Phone },
  { id: "direccion", label: "Dirección", icon: MapPin },
  { id: "avanzado",  label: "Avanzado",  icon: Building2 },
] as const;
type TabId = typeof TABS[number]["id"];

// ─── Per-field inline validation ─────────────────────────────────────────────
type FieldErrors = Partial<Record<keyof typeof EMPTY_FORM, string>>;

function validateField(field: keyof typeof EMPTY_FORM, value: string): string | undefined {
  if (field === "Nombre" && !value.trim()) return "El nombre es obligatorio";
  if ((field === "Movil" || field === "TelefonoFijo" || field === "Fax") && value.trim() && !phoneRegex.test(value.trim()))
    return "Formato E.164, ej. +34611123456";
  if (field === "Email" && value.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Email no válido";
  }
  return undefined;
}

// ─── Contact form — tabbed ────────────────────────────────────────────────────
function ClienteFormFields({
  form, setForm, communityNumbers, fieldErrors, setFieldErrors,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  communityNumbers: number[];
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
}) {
  const [activeTab, setActiveTab] = useState<TabId>("principal");
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Small delay to let the sheet animate in before focusing
    const t = setTimeout(() => firstInputRef.current?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
      const err = validateField(field, val);
      setFieldErrors((prev) => ({ ...prev, [field]: err }));
    };
  }

  const inp = (field: keyof typeof EMPTY_FORM) =>
    fieldErrors[field] ? inputInvalidCls : inputCls;
  const inpIcon = (field: keyof typeof EMPTY_FORM) =>
    fieldErrors[field] ? inputIconInvalidCls : inputIconCls;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex gap-0.5 px-4 pt-3 pb-0 border-b border-border shrink-0 bg-muted/20">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
              activeTab === id
                ? "border-primary text-primary bg-background"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* ── PRINCIPAL ─────────────────────────────────────────────────────── */}
        {activeTab === "principal" && (
          <>
            <fieldset className="space-y-3">
              <legend className={sectionTitleCls}>Identificación</legend>
              {/* Required: Nombre full-width */}
              <div className="space-y-1">
                <label className={labelCls}>Nombre completo <span className="text-destructive">*</span></label>
                <input ref={firstInputRef} value={form.Nombre} onChange={setField("Nombre")} placeholder="Jane Smith" className={inp("Nombre")} />
                <FieldError msg={fieldErrors.Nombre} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>NIF / CIF</label>
                  <input value={form.NIF} onChange={setField("NIF")} placeholder="12345678A" className={inp("NIF")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Nº Comunidad</label>
                  <NumComunidadCombobox options={communityNumbers} value={form.NumComunidad} onChange={(v) => { setForm((p) => ({ ...p, NumComunidad: v })); }} placeholder="Nº comunidad…" />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Código</label>
                  <input value={form.Codigo} onChange={setField("Codigo")} placeholder="COD001" className={inp("Codigo")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>ID Persona</label>
                  <input value={form.id_persona} onChange={setField("id_persona")} placeholder="ID externo" className={inp("id_persona")} />
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Denominación fiscal (Fdenominacion)</label>
                <input value={form.Fdenominacion} onChange={setField("Fdenominacion")} placeholder="Denominación fiscal" className={inp("Fdenominacion")} />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className={sectionTitleCls}>Datos económicos</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Coeficiente</label>
                  <input value={form.Coeficiente} onChange={setField("Coeficiente")} type="number" step="0.0001" placeholder="0.0000" className={inp("Coeficiente")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Cuenta bancaria</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input value={form.Cuenta} onChange={setField("Cuenta")} placeholder="ES00 0000 0000" className={inpIcon("Cuenta")} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>NEMP</label>
                  <input value={form.NEMP} onChange={setField("NEMP")} placeholder="Nº empleado" className={inp("NEMP")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Fecha de baja</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <input value={form.fecha_baja} onChange={setField("fecha_baja")} type="date" className={inpIcon("fecha_baja")} />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Pagadores</label>
                <input value={form.pagadores} onChange={setField("pagadores")} placeholder="Pagadores asociados" className={inp("pagadores")} />
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className={sectionTitleCls}>Notas</legend>
              <div className="space-y-1">
                <div className="relative">
                  <StickyNote className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <textarea value={form.Notas} onChange={setField("Notas")} placeholder="Notas relevantes…" rows={3} maxLength={4000}
                    className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow" />
                </div>
                <div className="text-xs text-muted-foreground text-right">{form.Notas.length}/4000</div>
              </div>
            </fieldset>
          </>
        )}

        {/* ── CONTACTO ──────────────────────────────────────────────────────── */}
        {activeTab === "contacto" && (
          <fieldset className="space-y-4">
            <legend className={sectionTitleCls}>Datos de contacto</legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelCls}>Móvil <span className="text-[10px] text-primary font-medium">(WhatsApp)</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input value={form.Movil} onChange={setField("Movil")} placeholder="+34611123456" className={`${inpIcon("Movil")} font-mono`} />
                </div>
                <FieldError msg={fieldErrors.Movil} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Teléfono fijo</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input value={form.TelefonoFijo} onChange={setField("TelefonoFijo")} placeholder="+34911123456" className={`${inpIcon("TelefonoFijo")} font-mono`} />
                </div>
                <FieldError msg={fieldErrors.TelefonoFijo} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input value={form.Email} onChange={setField("Email")} type="email" placeholder="jane@example.com" className={inpIcon("Email")} />
                </div>
                <FieldError msg={fieldErrors.Email} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}>Fax</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input value={form.Fax} onChange={setField("Fax")} placeholder="+34911000000" className={`${inpIcon("Fax")} font-mono`} />
                </div>
                <FieldError msg={fieldErrors.Fax} />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelCls}>Web</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <input value={form.Web} onChange={setField("Web")} placeholder="https://www.example.com" className={inpIcon("Web")} />
              </div>
            </div>

            {/* Phone format hint */}
            <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2.5">
              <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Los teléfonos deben usar formato internacional E.164.<br />
                <span className="font-medium text-foreground">Ejemplo:</span> <code className="font-mono text-primary">+34611123456</code>
              </p>
            </div>
          </fieldset>
        )}

        {/* ── DIRECCIÓN ─────────────────────────────────────────────────────── */}
        {activeTab === "direccion" && (
          <>
            <fieldset className="space-y-3">
              <legend className={sectionTitleCls}>Dirección principal</legend>
              <div className="space-y-1">
                <label className={labelCls}>Dirección</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <input value={form.Direccion} onChange={setField("Direccion")} placeholder="Calle Mayor, 12, 3B" className={inpIcon("Direccion")} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Código postal</label>
                  <input value={form.Cpostal} onChange={setField("Cpostal")} placeholder="28001" className={inp("Cpostal")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Bloque</label>
                  <input value={form.bloque} onChange={setField("bloque")} placeholder="Bloque A" className={inp("bloque")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Cód. distribución</label>
                  <input value={form.coddistri} onChange={setField("coddistri")} placeholder="D01" className={inp("coddistri")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Nom. distribución</label>
                  <input value={form.Nomdistri} onChange={setField("Nomdistri")} placeholder="Zona Norte" className={inp("Nomdistri")} />
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className={sectionTitleCls}>Datos del bajo</legend>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <label className={labelCls}>Nombre bajo</label>
                  <input value={form.BajoNombre} onChange={setField("BajoNombre")} placeholder="Nombre del bajo" className={inp("BajoNombre")} />
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>NIF bajo</label>
                  <input value={form.BajoNIF} onChange={setField("BajoNIF")} placeholder="NIF del bajo" className={inp("BajoNIF")} />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className={labelCls}>Fdenominación bajo</label>
                  <input value={form.BajoFdenominacion} onChange={setField("BajoFdenominacion")} placeholder="Denominación fiscal del bajo" className={inp("BajoFdenominacion")} />
                </div>
              </div>
            </fieldset>
          </>
        )}

        {/* ── AVANZADO ──────────────────────────────────────────────────────── */}
        {activeTab === "avanzado" && (
          <fieldset className="space-y-3">
            <legend className={sectionTitleCls}>Campos avanzados</legend>
            <p className="text-xs text-muted-foreground">Campos técnicos o de integración con sistemas externos.</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelCls}>Código</label>
                <input value={form.Codigo} onChange={setField("Codigo")} placeholder="COD001" className={inp("Codigo")} />
              </div>
              <div className="space-y-1">
                <label className={labelCls}>ID Persona (externo)</label>
                <input value={form.id_persona} onChange={setField("id_persona")} placeholder="ID externo" className={inp("id_persona")} />
              </div>
            </div>
          </fieldset>
        )}
      </div>
    </div>
  );
}

// ─── Add / Edit sheet ─────────────────────────────────────────────────────────
function ClienteSheet({
  mode, cliente, communityNumbers, onClose,
}: {
  mode: "add" | "edit"; cliente?: Cliente; communityNumbers: number[]; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    mode === "edit" && cliente ? clienteToForm(cliente) : EMPTY_FORM
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEdit = mode === "edit" && !!cliente;

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: async (input: typeof EMPTY_FORM) => {
      const payload = {
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
      };
      if (isEdit) {
        const { error } = await supabase.from("clientes").update(payload).eq("id", cliente!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clientes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      toast.success(isEdit ? "Contacto actualizado" : "Contacto añadido");
      onClose();
    },
    onError: (e: Error) => setSubmitError(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Run full schema validation to catch any remaining issues
    const parsed = clienteSchema.safeParse(form);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      // Also set inline error for the specific field
      const fieldName = firstIssue.path[0] as keyof typeof EMPTY_FORM;
      setFieldErrors((prev) => ({ ...prev, [fieldName]: firstIssue.message }));
      setSubmitError(firstIssue.message);
      return;
    }
    setSubmitError(null);
    mutation.mutate(form);
  }

  const hasFieldErrors = Object.values(fieldErrors).some(Boolean);

  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label={isEdit ? "Editar contacto" : "Nuevo contacto"}>
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className={`grid place-items-center h-9 w-9 rounded-full ${
              isEdit ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                     : "bg-primary/10 text-primary"
            }`}>
              {isEdit ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </div>
            <div>
              <h2 className="font-semibold text-sm">{isEdit ? "Editar contacto" : "Nuevo contacto"}</h2>
              {isEdit
                ? <p className="text-xs text-muted-foreground truncate max-w-[240px]">{cliente!.Nombre ?? "(sin nombre)"}</p>
                : <p className="text-xs text-muted-foreground">Rellena al menos el nombre</p>
              }
            </div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 flex flex-col">
            <ClienteFormFields
              form={form}
              setForm={setForm}
              communityNumbers={communityNumbers}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
            />
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-border px-5 py-4 bg-background/95 backdrop-blur space-y-2.5">
            {(submitError || hasFieldErrors) && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
                <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                <p className="text-xs text-destructive">{submitError ?? "Corrige los errores marcados antes de guardar."}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={mutation.isPending}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
              >
                {mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                  : <><Check className="h-4 w-4" /> {isEdit ? "Guardar cambios" : "Añadir contacto"}</>}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground text-center">Pulsa <kbd className="font-mono bg-muted px-1 rounded">Esc</kbd> para cerrar sin guardar</p>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Contact card row ─────────────────────────────────────────────────────────
function ContactRow({
  cliente,
  onEdit,
  onDelete,
  onCompose,
}: {
  cliente: Cliente;
  onEdit: () => void;
  onDelete: () => void;
  onCompose: () => void;
}) {
  const hasMobile = !!cliente.Movil;
  const hasEmail = !!cliente.Email;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/40 transition-colors">
      {/* Avatar */}
      <div className="grid place-items-center h-9 w-9 rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0 select-none">
        {(cliente.Nombre ?? "?")[0].toUpperCase()}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{cliente.Nombre ?? <span className="text-muted-foreground italic">Sin nombre</span>}</span>
          {cliente.fecha_baja && (
            <span className="shrink-0 inline-flex items-center rounded-full bg-destructive/10 text-destructive text-[10px] font-medium px-1.5 py-0.5">Baja</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          {cliente.Movil && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{cliente.Movil}</span>}
          {cliente.Email && <span className="flex items-center gap-1 truncate"><Mail className="h-3 w-3" /><span className="truncate">{cliente.Email}</span></span>}
          {!cliente.Movil && !cliente.Email && <span className="italic">Sin datos de contacto</span>}
        </div>
      </div>

      {/* NIF pill */}
      {cliente.NIF && (
        <span className="hidden sm:inline-flex shrink-0 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">
          {cliente.NIF}
        </span>
      )}

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {hasMobile && (
          <button
            onClick={onCompose}
            title="Enviar WhatsApp"
            className="grid place-items-center h-8 w-8 rounded-md hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 text-muted-foreground transition-colors"
            aria-label={`Enviar WhatsApp a ${cliente.Nombre}`}
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={onEdit}
          title="Editar"
          className="grid place-items-center h-8 w-8 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Editar ${cliente.Nombre}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          title="Eliminar"
          className="grid place-items-center h-8 w-8 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
          aria-label={`Eliminar ${cliente.Nombre}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function ContactsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["contacts"], queryFn: fetchClientes });

  const [composeFor, setComposeFor] = useState<Cliente | null>(null);
  const [composeBulk, setComposeBulk] = useState<{ num: number; clientes: Cliente[] } | null>(null);
  const [clienteSheet, setClienteSheet] = useState<{ mode: "add" | "edit"; cliente?: Cliente } | null>(null);

  const [nameSearch, setNameSearch] = useState("");
  const [communityFilter, setCommunityFilter] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

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
      list = list.filter((c) =>
        c.Nombre?.toLowerCase().includes(q) ||
        c.NIF?.toLowerCase().includes(q) ||
        c.Movil?.includes(q) ||
        c.Email?.toLowerCase().includes(q)
      );
    }
    if (communityFilter.trim()) {
      const num = parseFloat(communityFilter.trim());
      if (!isNaN(num)) list = list.filter((c) => c.NumComunidad === num);
    }
    return list;
  }, [data, nameSearch, communityFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Cliente[]>();
    for (const c of filteredData) {
      const key = c.NumComunidad != null ? String(c.NumComunidad) : "__sin_comunidad__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === "__sin_comunidad__") return 1;
      if (b === "__sin_comunidad__") return -1;
      return parseFloat(a) - parseFloat(b);
    });
  }, [filteredData]);

  function toggleGroup(key: string) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

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

  const searchRef = useRef<HTMLInputElement>(null);

  // Global shortcut: / focuses search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data
              ? `${data.length} contacto${data.length !== 1 ? "s" : ""} · ${communityNumbers.length} comunidad${communityNumbers.length !== 1 ? "es" : ""}`
              : "Gestiona tus contactos de WhatsApp Business"}
          </p>
        </div>
        <button
          onClick={() => setClienteSheet({ mode: "add" })}
          className="h-10 inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo contacto
        </button>
      </div>

      {/* Contact list */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Search / filter bar */}
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                ref={searchRef}
                type="text" value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Buscar por nombre, NIF, teléfono, email… (/)"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {nameSearch && (
                <button onClick={() => setNameSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Limpiar búsqueda">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="sm:w-52">
              <NumComunidadCombobox options={communityNumbers} value={communityFilter} onChange={setCommunityFilter} placeholder="Filtrar comunidad…" />
            </div>
            {communityFilter && (
              <button onClick={() => setCommunityFilter("")} className="h-9 px-3 rounded-md border border-border text-xs text-muted-foreground hover:bg-accent flex items-center gap-1 shrink-0">
                <X className="h-3.5 w-3.5" /> Limpiar
              </button>
            )}
          </div>
          {(nameSearch || communityFilter) && (
            <p className="text-xs text-muted-foreground mt-2">
              {filteredData.length} resultado{filteredData.length !== 1 ? "s" : ""} de {data?.length ?? 0}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
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
              className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-border text-sm hover:bg-accent"
            >
              Reintentar
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
              <UsersRound className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">{nameSearch || communityFilter ? "Sin resultados" : "No hay contactos"}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {nameSearch || communityFilter
                ? "Prueba con otros términos de búsqueda."
                : "Añade tu primer contacto con el botón de arriba."}
            </p>
            {!nameSearch && !communityFilter && (
              <button
                onClick={() => setClienteSheet({ mode: "add" })}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4" /> Añadir contacto
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {grouped.map(([key, members]) => {
              const isCollapsed = collapsedGroups.has(key);
              const label = key === "__sin_comunidad__" ? "Sin comunidad" : `Comunidad ${key}`;
              return (
                <div key={key}>
                  {/* Group header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(key)}
                    className="w-full flex items-center justify-between px-4 py-2 bg-muted/30 hover:bg-muted/60 transition-colors text-xs font-semibold text-muted-foreground"
                  >
                    <span className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {label}
                      <span className="text-[11px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full font-normal">
                        {members.length}
                      </span>
                    </span>
                    {!isCollapsed && key !== "__sin_comunidad__" && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setComposeBulk({ num: parseFloat(key), clientes: members }); }}
                        className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-background border border-border text-[11px] font-medium hover:bg-accent transition-colors"
                        aria-label={`Enviar mensaje a toda la comunidad ${key}`}
                      >
                        <Send className="h-3 w-3" /> Enviar a todos
                      </button>
                    )}
                  </button>

                  {/* Members */}
                  {!isCollapsed && (
                    <div>
                      {members.map((c) => (
                        <ContactRow
                          key={c.id}
                          cliente={c}
                          onEdit={() => setClienteSheet({ mode: "edit", cliente: c })}
                          onDelete={() => {
                            if (confirm(`¿Eliminar a "${c.Nombre ?? "este contacto"}"? Esta acción no se puede deshacer.`))
                              deleteCliente.mutate(c.id);
                          }}
                          onCompose={() => setComposeFor(c)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Compose single ── */}
      {composeFor && (
        <ComposeModal cliente={composeFor} onClose={() => setComposeFor(null)} />
      )}

      {/* ── Compose bulk ── */}
      {composeBulk && (
        <BulkComposeModal num={composeBulk.num} clientes={composeBulk.clientes} onClose={() => setComposeBulk(null)} />
      )}

      {/* ── Add / Edit sheet ── */}
      {clienteSheet && (
        <ClienteSheet
          mode={clienteSheet.mode}
          cliente={clienteSheet.cliente}
          communityNumbers={communityNumbers}
          onClose={() => setClienteSheet(null)}
        />
      )}
    </div>
  );
}

// ─── Compose modal (single) ───────────────────────────────────────────────────
function ComposeModal({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const sendFn = useServerFn(sendWhatsAppMessage);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function handleSend() {
    if (!message.trim() && !file) { toast.error("Escribe un mensaje o adjunta un archivo"); return; }
    setIsSending(true);
    try {
      let mediaData: { base64: string; mimeType: string; fileName: string } | undefined;
      if (file) {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let bin = "";
        for (const b of bytes) bin += String.fromCharCode(b);
        mediaData = { base64: btoa(bin), mimeType: file.type, fileName: file.name };
      }
      await sendFn({ data: { to: cliente.Movil!, message: message.trim(), media: mediaData } });
      toast.success(`Mensaje enviado a ${cliente.Nombre ?? cliente.Movil}`);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el mensaje");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:fade-in duration-200">
        {showTemplates ? (
          <div className="flex-1 overflow-hidden">
            <TemplatePicker onSelect={(cuerpo) => { setMessage(cuerpo); setShowTemplates(false); setTimeout(() => textareaRef.current?.focus(), 50); }} onClose={() => setShowTemplates(false)} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid place-items-center h-7 w-7 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Send className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{cliente.Nombre ?? cliente.Movil}</p>
                  {cliente.Nombre && <p className="text-xs text-muted-foreground font-mono">{cliente.Movil}</p>}
                </div>
              </div>
              <button onClick={onClose} aria-label="Cerrar" className="grid place-items-center h-8 w-8 rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mensaje</label>
                  <button type="button" onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <BookTemplate className="h-3.5 w-3.5" /> Usar plantilla
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleSend(); } }}
                  rows={5} maxLength={4096} placeholder="Escribe tu mensaje…"
                  className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">⌘/Ctrl+Enter para enviar</p>
                  <p className="text-xs text-muted-foreground">{message.length}/4096</p>
                </div>
              </div>
              <AttachmentPicker file={file} onChange={setFile} />
            </div>
            <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button
                type="button" onClick={handleSend} disabled={isSending}
                className="flex-1 h-10 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
              >
                {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Bulk compose modal ───────────────────────────────────────────────────────
function BulkComposeModal({ num, clientes, onClose }: { num: number; clientes: Cliente[]; onClose: () => void }) {
  const sendFn = useServerFn(sendWhatsAppMessage);
  const eligible = clientes.filter((c) => !!c.Movil);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [progress, setProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape" && !isSending) onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, isSending]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  async function handleBulkSend() {
    if (!message.trim() && !file) { toast.error("Escribe un mensaje o adjunta un archivo"); return; }
    if (!confirm(`¿Enviar a ${eligible.length} contacto${eligible.length !== 1 ? "s" : ""} de la Comunidad ${num}?`)) return;
    setIsSending(true);
    setProgress({ sent: 0, failed: 0, total: eligible.length });
    let sent = 0; let failed = 0;
    let mediaData: { base64: string; mimeType: string; fileName: string } | undefined;
    if (file) {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
      mediaData = { base64: btoa(bin), mimeType: file.type, fileName: file.name };
    }
    for (const c of eligible) {
      try {
        await sendFn({ data: { to: c.Movil!, message: message.trim(), media: mediaData } });
        sent++;
      } catch { failed++; }
      setProgress({ sent, failed, total: eligible.length });
      await new Promise((r) => setTimeout(r, 300));
    }
    setIsSending(false);
    toast.success(`Envío completado: ${sent} enviado${sent !== 1 ? "s" : ""}, ${failed} fallido${failed !== 1 ? "s" : ""}`);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={!isSending ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom sm:fade-in duration-200">
        {showTemplates ? (
          <div className="flex-1 overflow-hidden">
            <TemplatePicker onSelect={(cuerpo) => { setMessage(cuerpo); setShowTemplates(false); setTimeout(() => textareaRef.current?.focus(), 50); }} onClose={() => setShowTemplates(false)} />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid place-items-center h-7 w-7 rounded-full bg-primary/10 text-primary">
                  <Users className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Comunidad {num}</p>
                  <p className="text-xs text-muted-foreground">{eligible.length} de {clientes.length} tienen móvil</p>
                </div>
              </div>
              {!isSending && <button onClick={onClose} aria-label="Cerrar" className="grid place-items-center h-8 w-8 rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>}
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              {eligible.length === 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  Ningún contacto de esta comunidad tiene número de móvil registrado.
                </div>
              )}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Mensaje</label>
                  <button type="button" onClick={() => setShowTemplates(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <BookTemplate className="h-3.5 w-3.5" /> Usar plantilla
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  rows={5} maxLength={4096} placeholder="Escribe tu mensaje…"
                  className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="text-right text-xs text-muted-foreground">{message.length}/4096</div>
              </div>
              <AttachmentPicker file={file} onChange={setFile} />
              {progress && (
                <div className="space-y-1.5">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${((progress.sent + progress.failed) / progress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {progress.sent + progress.failed} / {progress.total} · {progress.sent} ✓ · {progress.failed} ✗
                  </p>
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-border shrink-0 flex gap-2">
              <button type="button" onClick={onClose} disabled={isSending} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors">Cancelar</button>
              <button
                type="button" onClick={handleBulkSend}
                disabled={isSending || eligible.length === 0}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2 transition-colors"
              >
                {isSending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar a {eligible.length}</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
