"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { HiddenActionValue, SlackBlock, SlackMessage } from "@/types/slack";
import { useRouter } from "next/navigation";

export function ApprovalCard({
  message,
  channelId,
}: {
  message: SlackMessage;
  channelId: string;
}) {
  const [loading, setLoading] = useState<"approve" | "deny" | null>(null);
  const router = useRouter();

  console.log("Rendering ApprovalCard for message:", message);
  const getActionData = (
    targetAction: "approve" | "deny"
  ): HiddenActionValue | null => {
    if (!message.blocks) return null;

    const blocks = message.blocks as SlackBlock[];

    const actionsBlock = blocks.find((b) => b.type === "actions");
    if (!actionsBlock || !actionsBlock.elements) return null;

    const targetId =
      targetAction === "approve" ? "approve_action" : "deny_action";

    const button = actionsBlock.elements.find((e) => e.action_id === targetId);

    if (!button || !button.value) return null;

    try {
      return JSON.parse(button.value) as HiddenActionValue;
    } catch (e) {
      console.error("Failed to parse Slack button value", e);
      return null;
    }
  };

  const handleSimulate = async (action: "approve" | "deny") => {
    const data = getActionData(action);

    if (!data || !data.token) {
      console.error("Error: Could not find a valid token in this message.");
      return;
    }

    setLoading(action);

    try {
      const res = await fetch("/api/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: data.token,
          approved: data.approved,
          ts: message.ts,
          channelId: channelId,
          userName: "Test User",
          originalMessage: message.text,
        }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      console.log(`Successfully simulated ${action.toUpperCase()}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      console.log("Simulation failed. See console.");
    } finally {
      setLoading(null);
    }
  };

  const isApproved = message.text.includes("Approved");
  const isDenied = message.text.includes("Denied");
  const isPending = !isApproved && !isDenied;
  const hasActions = Boolean(
    message.blocks &&
      (message.blocks as SlackBlock[]).find(
        (b) =>
          b.type === "actions" &&
          (b as any).elements &&
          (b as any).elements.length
      )
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isApproved && <StatusBadge status="approved" />}
          {isDenied && <StatusBadge status="denied" />}
          {isPending && <StatusBadge status="pending" />}

          <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {new Date(parseFloat(message.ts) * 1000).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">
        {message.text}
      </div>

      {isPending && hasActions ? (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t">
          <Button
            size="sm"
            onClick={() => handleSimulate("approve")}
            disabled={!!loading}
            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px] gap-2"
          >
            {loading === "approve" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve
          </Button>

          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleSimulate("deny")}
            disabled={!!loading}
            className="min-w-[100px] gap-2"
          >
            {loading === "deny" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Deny
          </Button>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground italic">
          Request closed.
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "approved" | "denied" | "pending";
}) {
  const styles = {
    approved: "bg-green-100 text-green-700 border-green-200",
    denied: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
