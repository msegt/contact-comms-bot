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

// ─── Shared input / textarea class helpers ───────────────────────────────────
const inputCls = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const inputIconCls = "w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "text-xs font-medium text-muted-foreground";
const fieldsetLegendCls = "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2 after:content-[''] after:flex-1 after:h-px after:bg-border";

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
        className={inputCls}
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

// ─── Template picker panel ───────────────────────────────────────────────────
function TemplatePicker({
  onSelect,
  onClose,
}: {
  onSelect: (cuerpo: string) => void;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data: plantillas = [], isLoading } = useQuery({
    queryKey: ["plantillas"],
    queryFn: fetchPlantillas,
  });

  const [editing, setEditing] = useState<Plantilla | null>(null);
  const [creating, setCreating] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editCuerpo, setEditCuerpo] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  function startEdit(p: Plantilla) {
    setEditing(p); setEditNombre(p.nombre); setEditCuerpo(p.cuerpo);
    setEditDescripcion(p.descripcion ?? ""); setEditError(null); setCreating(false);
  }
  function startCreate() {
    setCreating(true); setEditing(null); setEditNombre(""); setEditCuerpo("");
    setEditDescripcion(""); setEditError(null);
  }
  function cancelEdit() { setEditing(null); setCreating(false); setEditError(null); }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nombre = editNombre.trim();
      const cuerpo = editCuerpo.trim();
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
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plantillas").delete().eq("id", id);
      if (error) throw error;
    },
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

// ─── Attachment picker ───────────────────────────────────────────────────────
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
          <Paperclip className="h-3.5 w-3.5" />
          {file ? "Cambiar archivo" : "Adjuntar archivo"}
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

// ─── Contact form fields (shared by add & edit sheet) ───────────────────────
function ClienteFormFields({
  form,
  setForm,
  communityNumbers,
  setFormError,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  communityNumbers: number[];
  setFormError: (e: string | null) => void;
}) {
  function setField(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setFormError(null);
    };
  }

  return (
    <div className="space-y-6 px-5 py-5">
      {/* Identificación */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Identificación</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Código</label>
            <input value={form.Codigo} onChange={setField("Codigo")} placeholder="COD001" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>ID Persona</label>
            <input value={form.id_persona} onChange={setField("id_persona")} placeholder="ID externo" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>NIF</label>
            <input value={form.NIF} onChange={setField("NIF")} placeholder="12345678A" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Núm. comunidad</label>
            <NumComunidadCombobox
              options={communityNumbers}
              value={form.NumComunidad}
              onChange={(v) => { setForm((p) => ({ ...p, NumComunidad: v })); setFormError(null); }}
              placeholder="Nº comunidad…"
            />
          </div>
        </div>
      </fieldset>

      {/* Datos personales */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Datos personales</legend>
        <div className="space-y-1">
          <label className={labelCls}>Nombre completo <span className="text-destructive">*</span></label>
          <input value={form.Nombre} onChange={setField("Nombre")} placeholder="Jane Smith" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Fdenominación</label>
          <input value={form.Fdenominacion} onChange={setField("Fdenominacion")} placeholder="Denominación fiscal" className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Coeficiente</label>
            <input value={form.Coeficiente} onChange={setField("Coeficiente")} type="number" step="0.0001" placeholder="0.0000" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Cuenta</label>
            <input value={form.Cuenta} onChange={setField("Cuenta")} placeholder="ES00 0000 0000" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>NEMP</label>
            <input value={form.NEMP} onChange={setField("NEMP")} placeholder="Nº empleado" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Fecha de baja</label>
            <input value={form.fecha_baja} onChange={setField("fecha_baja")} type="date" className={inputCls} />
          </div>
        </div>
      </fieldset>

      {/* Contacto */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Contacto</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Móvil (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input value={form.Movil} onChange={setField("Movil")} placeholder="+34611123456" className={`${inputIconCls} font-mono`} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Teléfono fijo</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input value={form.TelefonoFijo} onChange={setField("TelefonoFijo")} placeholder="+34911123456" className={`${inputIconCls} font-mono`} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Fax</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input value={form.Fax} onChange={setField("Fax")} placeholder="+34911000000" className={`${inputIconCls} font-mono`} />
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input value={form.Email} onChange={setField("Email")} type="email" placeholder="jane@example.com" className={inputIconCls} />
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Web</label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input value={form.Web} onChange={setField("Web")} placeholder="https://www.example.com" className={inputIconCls} />
          </div>
        </div>
      </fieldset>

      {/* Dirección */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Dirección</legend>
        <div className="space-y-1">
          <label className={labelCls}>Dirección</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input value={form.Direccion} onChange={setField("Direccion")} placeholder="Calle Mayor, 12, 3B" className={inputIconCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className={labelCls}>Código postal</label>
            <input value={form.Cpostal} onChange={setField("Cpostal")} placeholder="28001" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Bloque</label>
            <input value={form.bloque} onChange={setField("bloque")} placeholder="Bloque A" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Cód. distribución</label>
            <input value={form.coddistri} onChange={setField("coddistri")} placeholder="D01" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>Nom. distribución</label>
            <input value={form.Nomdistri} onChange={setField("Nomdistri")} placeholder="Zona Norte" className={inputCls} />
          </div>
        </div>
      </fieldset>

      {/* Datos del bajo */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Datos del bajo</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className={labelCls}>Nombre bajo</label>
            <input value={form.BajoNombre} onChange={setField("BajoNombre")} placeholder="Nombre del bajo" className={inputCls} />
          </div>
          <div className="space-y-1">
            <label className={labelCls}>NIF bajo</label>
            <input value={form.BajoNIF} onChange={setField("BajoNIF")} placeholder="NIF del bajo" className={inputCls} />
          </div>
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Fdenominación bajo</label>
          <input value={form.BajoFdenominacion} onChange={setField("BajoFdenominacion")} placeholder="Denominación fiscal del bajo" className={inputCls} />
        </div>
      </fieldset>

      {/* Pagadores + Notas */}
      <fieldset className="space-y-3">
        <legend className={fieldsetLegendCls}>Pagadores y notas</legend>
        <div className="space-y-1">
          <label className={labelCls}>Pagadores</label>
          <input value={form.pagadores} onChange={setField("pagadores")} placeholder="Pagadores asociados" className={inputCls} />
        </div>
        <div className="space-y-1">
          <label className={labelCls}>Notas</label>
          <div className="relative">
            <StickyNote className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <textarea value={form.Notas} onChange={setField("Notas")} placeholder="Notas relevantes…" rows={3} maxLength={4000} className="w-full pl-9 pr-3 py-2.5 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none" />
          </div>
        </div>
      </fieldset>
    </div>
  );
}

// ─── Add / Edit sheet ────────────────────────────────────────────────────────
function ClienteSheet({
  mode,
  cliente,
  communityNumbers,
  onClose,
}: {
  mode: "add" | "edit";
  cliente?: Cliente;
  communityNumbers: number[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<typeof EMPTY_FORM>(
    mode === "edit" && cliente ? clienteToForm(cliente) : EMPTY_FORM
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isEdit = mode === "edit" && !!cliente;

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
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = clienteSchema.safeParse(form);
    if (!parsed.success) { setFormError(parsed.error.issues[0].message); return; }
    mutation.mutate(form);
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="grid place-items-center h-8 w-8 rounded-full bg-primary/10 text-primary">
              {isEdit ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-sm">{isEdit ? "Editar contacto" : "Nuevo contacto"}</h3>
              {isEdit && <p className="text-xs text-muted-foreground">{cliente!.Nombre ?? "(sin nombre)"}</p>}
            </div>
          </div>
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto">
            <ClienteFormFields
              form={form}
              setForm={setForm}
              communityNumbers={communityNumbers}
              setFormError={setFormError}
            />
          </div>

          {/* Sticky footer */}
          <div className="shrink-0 border-t border-border px-5 py-4 bg-background space-y-2">
            {formError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
              </p>
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2"
              >
                {mutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</>
                  : <><Check className="h-4 w-4" /> {isEdit ? "Guardar cambios" : "Añadir contacto"}</>}
              </button>
            </div>
          </div>
        </form>
      </div>
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
      list = list.filter((c) => c.Nombre?.toLowerCase().includes(q));
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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data ? `${data.length} contacto${data.length !== 1 ? "s" : ""} en total` : "Gestiona tus contactos de WhatsApp Business"}
          </p>
        </div>
        <button
          onClick={() => setClienteSheet({ mode: "add" })}
          className="h-10 inline-flex items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
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
                type="text"
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="sm:w-56">
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
                      <span className="text-xs text-muted-foreground font-normal">
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

                  {/* Contact rows */}
                  {!collapsed && (
                    <ul className="divide-y divide-border">
                      {members.map((c) => (
                        <li key={c.id} className="px-5 py-3 pl-10 flex items-center justify-between gap-3 group hover:bg-muted/20 transition-colors">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {c.Nombre ?? "(sin nombre)"}
                              </span>
                              {c.NIF && <span className="text-xs text-muted-foreground font-mono hidden sm:inline">{c.NIF}</span>}
                              {c.fecha_baja && (
                                <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium shrink-0">Baja</span>
                              )}
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
                              <p className="text-xs text-muted-foreground mt-0.5 italic truncate max-w-sm">{c.Notas}</p>
                            )}
                          </div>

                          {/* Actions — always visible on mobile, hover-reveal on desktop */}
                          <div className="flex items-center gap-1.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {c.Movil && (
                              <button
                                onClick={() => setComposeFor(c)}
                                title="Enviar mensaje"
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span className="hidden sm:inline">Enviar</span>
                              </button>
                            )}
                            <button
                              onClick={() => setClienteSheet({ mode: "edit", cliente: c })}
                              title="Editar contacto"
                              className="grid place-items-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { if (confirm(`¿Eliminar a ${c.Nombre ?? "este contacto"}?`)) deleteCliente.mutate(c.id); }}
                              title="Eliminar contacto"
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
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              {nameSearch || communityFilter ? "Prueba con otros términos de búsqueda." : "Añade tu primer contacto para empezar."}
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
        )}
      </div>

      {/* Sheets & modals */}
      {clienteSheet && (
        <ClienteSheet
          mode={clienteSheet.mode}
          cliente={clienteSheet.cliente}
          communityNumbers={communityNumbers}
          onClose={() => setClienteSheet(null)}
        />
      )}
      {composeFor && <ComposeSheet cliente={composeFor} onClose={() => setComposeFor(null)} />}
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

// ─── Helper: upload attachment ────────────────────────────────────────────────
async function uploadAttachment(file: File): Promise<{ path: string; url: string }> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("adjuntos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Error al subir el archivo: ${error.message}`);
  const { data } = supabase.storage.from("adjuntos").getPublicUrl(path);
  return { path, url: data.publicUrl };
}

// ─── Individual compose sheet ─────────────────────────────────────────────────
function ComposeSheet({ cliente, onClose }: { cliente: Cliente; onClose: () => void }) {
  const send = useServerFn(sendWhatsAppMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error("El mensaje no puede estar vacío");
      let adjunto_url: string | undefined;
      let adjunto_nombre: string | undefined;
      let adjunto_mime: string | undefined;
      if (file) {
        const uploaded = await uploadAttachment(file);
        adjunto_url = uploaded.url;
        adjunto_nombre = file.name;
        adjunto_mime = file.type;
      }
      const res = await send({
        data: {
          cliente_id: cliente.id,
          nombre_cliente: cliente.Nombre ?? "",
          recipient_phone: cliente.Movil!,
          message_body: trimmed,
          adjunto_url,
          adjunto_nombre,
          adjunto_mime,
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
          <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 min-h-0">
          {showTemplates && (
            <div className="w-72 border-r border-border flex flex-col overflow-hidden shrink-0">
              <TemplatePicker onSelect={(cuerpo) => { setBody(cuerpo); setShowTemplates(false); }} onClose={() => setShowTemplates(false)} />
            </div>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground">Para</div>
                <div className="font-medium mt-0.5">{cliente.Nombre ?? "(sin nombre)"}</div>
                <div className="text-xs font-mono text-muted-foreground mt-0.5">{cliente.Movil}</div>
                {cliente.NumComunidad != null && <div className="text-xs text-muted-foreground mt-0.5">Comunidad {cliente.NumComunidad}</div>}
                {cliente.Nomdistri && <div className="text-xs text-muted-foreground mt-0.5">{cliente.Nomdistri}</div>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium">Mensaje</label>
                  <button
                    type="button"
                    onClick={() => setShowTemplates((v) => !v)}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors ${showTemplates ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}
                  >
                    <BookTemplate className="h-3.5 w-3.5" /> Plantillas
                  </button>
                </div>
                <textarea
                  value={body}
                  onChange={(e) => { setBody(e.target.value); setError(null); }}
                  rows={7}
                  maxLength={4096}
                  placeholder="Escribe tu mensaje o carga una plantilla…"
                  className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>{error && <span className="text-destructive">{error}</span>}</span>
                  <span>{body.length}/4096</span>
                </div>
              </div>
              <AttachmentPicker file={file} onChange={setFile} />
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
      </div>
    </div>
  );
}

// ─── Bulk compose sheet ───────────────────────────────────────────────────────
type BulkResult = { nombre: string; phone: string; ok: boolean; error?: string };

function BulkComposeSheet({ numComunidad, clientes, onClose }: { numComunidad: number; clientes: Cliente[]; onClose: () => void }) {
  const send = useServerFn(sendWhatsAppMessage);
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<BulkResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) { setError("El mensaje no puede estar vacío"); return; }
    setSending(true); setResults(null); setError(null);
    let adjunto_url: string | undefined, adjunto_nombre: string | undefined, adjunto_mime: string | undefined;
    if (file) {
      try {
        const uploaded = await uploadAttachment(file);
        adjunto_url = uploaded.url; adjunto_nombre = file.name; adjunto_mime = file.type;
      } catch (e) {
        setSending(false); setError(e instanceof Error ? e.message : "Error al subir el archivo"); return;
      }
    }
    const out: BulkResult[] = [];
    for (const c of clientes) {
      if (!c.Movil) continue;
      try {
        const res = await send({ data: { cliente_id: c.id, nombre_cliente: c.Nombre ?? "", recipient_phone: c.Movil, message_body: trimmed, adjunto_url, adjunto_nombre, adjunto_mime } });
        out.push({ nombre: c.Nombre ?? c.Movil, phone: c.Movil, ok: res.ok, error: res.ok ? undefined : res.error });
      } catch (e) {
        out.push({ nombre: c.Nombre ?? c.Movil, phone: c.Movil, ok: false, error: e instanceof Error ? e.message : "Error" });
      }
    }
    setSending(false); setResults(out);
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
      <div className="relative ml-auto h-full w-full max-w-lg bg-background border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between px-5 h-16 border-b border-border">
          <div>
            <h3 className="font-semibold">Envío masivo — Comunidad {numComunidad}</h3>
            <p className="text-xs text-muted-foreground">{clientes.length} destinatario{clientes.length !== 1 ? "s" : ""} con móvil</p>
          </div>
          {!sending && <button onClick={onClose} className="grid place-items-center h-9 w-9 rounded-md hover:bg-accent"><X className="h-4 w-4" /></button>}
        </div>
        <div className="flex flex-1 min-h-0">
          {showTemplates && (
            <div className="w-72 border-r border-border flex flex-col overflow-hidden shrink-0">
              <TemplatePicker onSelect={(cuerpo) => { setBody(cuerpo); setShowTemplates(false); }} onClose={() => setShowTemplates(false)} />
            </div>
          )}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-5 space-y-4 flex-1 overflow-y-auto">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 max-h-36 overflow-y-auto">
                <div className="text-xs text-muted-foreground font-medium mb-1">Destinatarios</div>
                {clientes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-[55%]">{c.Nombre ?? "(sin nombre)"}</span>
                    <span className="font-mono text-muted-foreground">{c.Movil}</span>
                  </div>
                ))}
              </div>
              {!done && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Mensaje</label>
                    <button type="button" onClick={() => setShowTemplates((v) => !v)} disabled={sending} className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors disabled:opacity-50 ${showTemplates ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground"}`}>
                      <BookTemplate className="h-3.5 w-3.5" /> Plantillas
                    </button>
                  </div>
                  <textarea value={body} onChange={(e) => { setBody(e.target.value); setError(null); }} rows={7} maxLength={4096} placeholder="Escribe tu mensaje para toda la comunidad…" disabled={sending} className="w-full rounded-md border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-60" />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{error && <span className="text-destructive">{error}</span>}</span>
                    <span>{body.length}/4096</span>
                  </div>
                </div>
              )}
              {!done && <AttachmentPicker file={file} onChange={setFile} />}
              {sending && <div className="flex items-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" /> Enviando mensajes…</div>}
              {results && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Resultado del envío</div>
                  <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden text-xs">
                    {results.map((r, i) => (
                      <li key={i} className={`px-3 py-2 flex items-center justify-between gap-2 ${r.ok ? "bg-background" : "bg-destructive/5"}`}>
                        <span className="truncate max-w-[55%]">{r.nombre}</span>
                        {r.ok ? <span className="text-green-600 font-medium shrink-0">✓ Enviado</span> : <span className="text-destructive truncate max-w-[40%]" title={r.error}>✗ {r.error ?? "Error"}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <button onClick={onClose} disabled={sending} className="flex-1 h-10 rounded-md border border-border text-sm font-medium hover:bg-accent disabled:opacity-60">{done ? "Cerrar" : "Cancelar"}</button>
              {!done && (
                <button onClick={handleSend} disabled={sending || !body.trim()} className="flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 inline-flex items-center justify-center gap-2">
                  {sending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Send className="h-4 w-4" /> Enviar a {clientes.length} contacto{clientes.length !== 1 ? "s" : ""}</>}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
