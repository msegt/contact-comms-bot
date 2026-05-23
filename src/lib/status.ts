export type MessageStatus = "pending" | "sent" | "delivered" | "read" | "failed";

export const STATUSES: MessageStatus[] = ["pending", "sent", "delivered", "read", "failed"];

export function statusClasses(status: string): string {
  switch (status) {
    case "sent":
      return "bg-status-sent/15 text-status-sent border border-status-sent/30";
    case "delivered":
      return "bg-status-delivered/15 text-status-delivered border border-status-delivered/30";
    case "read":
      return "bg-status-read/15 text-status-read border border-status-read/30";
    case "failed":
      return "bg-status-failed/15 text-status-failed border border-status-failed/30";
    case "pending":
    default:
      return "bg-status-pending/15 text-status-pending border border-status-pending/30";
  }
}
