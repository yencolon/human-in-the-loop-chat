"use client";

import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApprovalCard } from "@/components/approval-card";

export default function HumanApprovalPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/slack/messages");
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data?.error || "Failed to fetch messages");
        }
        if (!mounted) return;
        setMessages(data.messages || []);
        setChannelId(data.channelId || null);
      } catch (err: any) {
        console.error("Failed to load Slack messages:", err);
        if (!mounted) return;
        setError(String(err?.message || err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMessages();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Approval Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            History of requests sent to Slack via the Bot.
          </p>
        </div>
      </div>

      <ScrollArea className="h-auto rounded-md border p-4 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
        <div className="space-y-4">
          {loading && (
            <div className="text-center py-20 text-muted-foreground">
              Loading...
            </div>
          )}
          {!loading && error && (
            <div className="text-center py-20 text-red-500">Error: {error}</div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              No messages found.
            </div>
          )}

          {!loading &&
            !error &&
            messages.map((msg: any) => (
              <ApprovalCard
                key={msg.ts}
                message={msg}
                channelId={channelId ?? ""}
              />
            ))}
        </div>
      </ScrollArea>
    </div>
  );
}
