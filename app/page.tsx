"use client";

import { useChat } from "@ai-sdk/react";
import { WorkflowChatTransport } from "@workflow/ai";
import { useEffect, useMemo, useRef } from "react";
import type { MyUIMessage } from "@/schemas/chat";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import ChatInput from "@/components/chat-input";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = ["I want to return a package", "Where is my package"];

export default function ChatPage() {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeWorkflowRunId = useMemo(() => {
    if (typeof window === "undefined") return;
    return localStorage.getItem("active-workflow-run-id") ?? undefined;
  }, []);

  const { stop, messages, sendMessage, status, setMessages } =
    useChat<MyUIMessage>({
      resume: !!activeWorkflowRunId,
      onError(error) {
        console.error("onError", error);
      },
      onFinish(data) {
        console.log("onFinish", data);

        console.log("Saving chat history to localStorage", data.messages);
        localStorage.setItem("chat-history", JSON.stringify(data.messages));

        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      },

      transport: new WorkflowChatTransport({
        onChatSendMessage: (response, options) => {
          console.log("onChatSendMessage", response, options);

          localStorage.setItem(
            "chat-history",
            JSON.stringify(options.messages)
          );

          const workflowRunId = response.headers.get("x-workflow-run-id");
          if (!workflowRunId) {
            throw new Error(
              'Workflow run ID not found in "x-workflow-run-id" response header'
            );
          }
          localStorage.setItem("active-workflow-run-id", workflowRunId);
        },
        onChatEnd: ({ chatId, chunkIndex }) => {
          console.log("onChatEnd", chatId, chunkIndex);

          localStorage.removeItem("active-workflow-run-id");
        },
        prepareReconnectToStreamRequest: ({ id, api, ...rest }) => {
          console.log("prepareReconnectToStreamRequest", id);
          const workflowRunId = localStorage.getItem("active-workflow-run-id");
          if (!workflowRunId) {
            throw new Error("No active workflow run ID found");
          }
          return {
            ...rest,
            api: `/api/chat/${encodeURIComponent(workflowRunId)}/stream`,
          };
        },
        maxConsecutiveErrors: 5,
      }),
    });

  useEffect(() => {
    const chatHistory = localStorage.getItem("chat-history");
    if (!chatHistory) return;
    setMessages(JSON.parse(chatHistory) as MyUIMessage[]);
  }, [setMessages]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col">
      <div className="w-full flex justify-end p-5">
        <Button
          onClick={() =>
            window.open("/human-approval", "_blank", "noopener,noreferrer")
          }
          className="cursor-pointer"
        >
          Human Approval Test
        </Button>
      </div>

      <div className="flex flex-col w-full max-w-2xl pt-12 pb-24 mx-auto stretch">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Super Agent</h1>
          <p className="text-muted-foreground">Ask for any assistance</p>
        </div>

        {messages.length === 0 && (
          <div className="mb-8 space-y-4">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">
                How can I help you today?
              </h2>
              <p className="text-muted-foreground text-sm">
                Try one of these suggestions or ask anything about products and
                orders.
              </p>
            </div>
            <Suggestions>
              {SUGGESTIONS.map((suggestion) => (
                <Suggestion
                  key={suggestion}
                  suggestion={suggestion}
                  onClick={(suggestion) =>
                    sendMessage({
                      text: suggestion,
                      metadata: { createdAt: Date.now() },
                    })
                  }
                />
              ))}
            </Suggestions>
          </div>
        )}
        <Conversation className="mb-10">
          <ConversationContent>
            {messages.map((message, index) => {
              const hasText = message.parts.some(
                (part) => part.type === "text"
              );

              return (
                <div key={message.id}>
                  {message.role === "assistant" &&
                    index === messages.length - 1 &&
                    (status === "submitted" || status === "streaming") &&
                    !hasText && (
                      <Shimmer className="text-sm">Thinking...</Shimmer>
                    )}
                  <Message from={message.role}>
                    <MessageContent>
                      {message.parts.map((part, partIndex) => {
                        // Render text parts
                        if (part.type === "text") {
                          return (
                            <Response key={`${message.id}-text-${partIndex}`}>
                              {part.text}
                            </Response>
                          );
                        }
                        return null;
                      })}
                    </MessageContent>
                  </Message>
                </div>
              );
            })}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        <ChatInput
          status={status}
          textareaRef={textareaRef}
          setMessages={setMessages}
          sendMessage={(message) => {
            sendMessage({
              text: message.text || "",
              metadata: message.metadata,
            });
          }}
          stop={stop}
        />
      </div>
    </div>
  );
}
