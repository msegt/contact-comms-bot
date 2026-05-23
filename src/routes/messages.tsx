import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/Skeleton";
import { MessageSquareDashed } from "lucide-react";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — WhatsBoard" },
      { name: "description", content: "Live log of sent WhatsApp messages and their delivery status." },
    ],
  }),
  component: MessagesPage,
});

interface MessageRow {
  id: string;
  wamid: string | null;
  recipient_phone: string;
  message_body: string;
  status: string;
  sent_at: string;
  updated_at: string | null;
  contacts: { name: string } | null;
}

async function fetchMensajes() {
  const { data, error } = await supabase
    .from("mensajes_whatsapp")
    .select("id, whatsapp_message_id, telefono_destino, mensaje, estado, enviado_at, updated_at, nombre_cliente, clientes(nombre, apellidos)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data ?? [];
}


function MessagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["messages-log"],
    queryFn: fetchMensajes,
  });

  useEffect(() => {
    const channel = supabase
      .channel("messages-log-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => {
          qc.invalidateQueries({ queryKey: ["messages-log"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live log — status updates from Meta arrive automatically.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Recipient</th>
                  <th className="text-left px-5 py-3 font-medium">Message</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 align-top">
                      <div className="font-medium">
                        {m.contacts?.name ?? "—"}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {m.recipient_phone}
                      </div>
                    </td>
                    <td className="px-5 py-3 align-top max-w-md">
                      <p className="line-clamp-2 text-muted-foreground">
                        {m.message_body}
                      </p>
                    </td>
                    <td className="px-5 py-3 align-top">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-5 py-3 align-top text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(m.sent_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-14 text-center">
            <div className="mx-auto grid place-items-center h-12 w-12 rounded-full bg-muted text-muted-foreground mb-3">
              <MessageSquareDashed className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium">No messages sent yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Send your first message from the Contacts page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
