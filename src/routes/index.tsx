import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Send, CheckCheck, Eye } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — WhatsBoard" },
      { name: "description", content: "Overview of contacts and message activity." },
    ],
  }),
  component: DashboardPage,
});

interface Stats {
  totalContacts: number;
  sentToday: number;
  delivered: number;
  read: number;
}

interface RecentMessage {
  id: string;
  telefono_destino: string;
  mensaje: string;
  estado: string;
  enviado_at: string | null;
  nombre_cliente: string | null;
}

async function fetchStats(): Promise<Stats> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const iso = startOfDay.toISOString();

  const [contacts, sentToday, delivered, read] = await Promise.all([
    supabase.from("clientes").select("*", { count: "exact", head: true }),
    supabase
      .from("mensajes_whatsapp")
      .select("*", { count: "exact", head: true })
      .gte("enviado_at", iso),
    supabase
      .from("mensajes_whatsapp")
      .select("*", { count: "exact", head: true })
      .eq("estado", "entregado"),
    supabase
      .from("mensajes_whatsapp")
      .select("*", { count: "exact", head: true })
      .eq("estado", "leido"),
  ]);

  return {
    totalContacts: contacts.count ?? 0,
    sentToday: sentToday.count ?? 0,
    delivered: delivered.count ?? 0,
    read: read.count ?? 0,
  };
}

async function fetchRecent(): Promise<RecentMessage[]> {
  const { data } = await supabase
    .from("mensajes_whatsapp")
    .select("id, telefono_destino, mensaje, estado, enviado_at, nombre_cliente")
    .order("enviado_at", { ascending: false })
    .limit(10);
  return (data ?? []) as RecentMessage[];
}

function DashboardPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: fetchStats });
  const recent = useQuery({ queryKey: ["recent"], queryFn: fetchRecent });

  useEffect(() => {
    const channel = supabase
      .channel("dashboard-messages")
      .on("postgres_changes", { event: "*", schema: "public", table: "mensajes_whatsapp" }, () => {
        stats.refetch();
        recent.refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [stats, recent]);

  const kpis = [
    { label: "Total Contacts", value: stats.data?.totalContacts, icon: Users },
    { label: "Sent Today", value: stats.data?.sentToday, icon: Send },
    { label: "Delivered", value: stats.data?.delivered, icon: CheckCheck },
    { label: "Read", value: stats.data?.read, icon: Eye },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live overview of your WhatsApp Business activity.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{k.label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">
                {stats.isLoading ? <Skeleton className="h-8 w-16" /> : (k.value ?? 0)}
              </div>
            </div>
          );
        })}
      </div>

      <section className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-medium">Recent messages</h2>
        </div>
        <div className="divide-y divide-border">
          {recent.isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-5 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))
          ) : recent.data && recent.data.length > 0 ? (
            recent.data.map((m) => (
              <div key={m.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {m.nombre_cliente ?? m.telefono_destino}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.telefono_destino}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{m.mensaje}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <StatusBadge status={m.estado} />
                  <span className="text-xs text-muted-foreground">
                    {m.enviado_at
                      ? new Date(m.enviado_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-sm text-muted-foreground">
              No messages yet. Head to Contacts to send your first message.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
