import { getBotMessagesToUser } from "@/lib/slack";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApprovalCard } from "@/components/approval-card";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function HumanApprovalPage() {
  const { messages, channelId } = await getBotMessagesToUser({ limit: 1 });

  return (
    <Suspense fallback={<div>Loading...</div>}>
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

        <ScrollArea className="h-[600px] rounded-md border p-4 shadow-sm bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-20 text-muted-foreground">
                No messages found.
              </div>
            )}

            {messages.map((msg: any) => {
              return (
                <ApprovalCard
                  key={msg.ts}
                  message={msg}
                  channelId={channelId}
                />
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </Suspense>
  );
}
