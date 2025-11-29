"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { ScrollShadow } from "@heroui/scroll-shadow";
import { Spinner } from "@heroui/spinner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

interface ChatStepProps {
  formData: {
    title: string;
    description: string;
    type: string;
  };
  chatHistory: ChatMessage[];
  onChatUpdate: (history: ChatMessage[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

export function ChatStep({
  formData,
  chatHistory,
  onChatUpdate,
  onComplete,
  onBack,
}: ChatStepProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  // Initialize with a welcome message if chat is empty
  useEffect(() => {
    if (chatHistory.length === 0) {
      const welcomeMessage: ChatMessage = {
        role: "assistant",
        content: `Hello! I'm here to help you with your project "${formData.title}". ${formData.description ? `I see you want to: ${formData.description}` : "How can I assist you today?"}`,
        timestamp: new Date(),
      };
      onChatUpdate([welcomeMessage]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedHistory = [...chatHistory, userMessage];
    onChatUpdate(updatedHistory);
    setInput("");
    setIsLoading(true);

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: `I understand you're asking about "${userMessage.content}". Let me help you with that. This is a simulated response - in a real application, this would connect to an AI service like OpenAI or similar.`,
        timestamp: new Date(),
      };
      onChatUpdate([...updatedHistory, assistantMessage]);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[600px]">
      {/* Chat Messages */}
      <ScrollShadow
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 bg-default-50 dark:bg-default-100 rounded-lg"
      >
        <div className="flex flex-col gap-4">
          {chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <Card
                className={`max-w-[80%] ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-default-200 dark:bg-default-300"
                }`}
              >
                <CardBody className="p-3">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  {message.timestamp && (
                    <p className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </CardBody>
              </Card>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-default-200 dark:bg-default-300">
                <CardBody className="p-3">
                  <div className="flex items-center gap-2">
                    <Spinner size="sm" />
                    <span className="text-sm text-default-600">Thinking...</span>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          variant="bordered"
          disabled={isLoading}
          classNames={{
            input: "pr-2",
          }}
          endContent={
            <Button
              size="sm"
              color="primary"
              onPress={handleSend}
              isDisabled={!input.trim() || isLoading}
              className="min-w-0 px-3"
            >
              Send
            </Button>
          }
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 justify-end pt-2 border-t border-default-200">
        <Button variant="light" onPress={onBack}>
          Back
        </Button>
        <Button
          color="primary"
          onPress={onComplete}
          isDisabled={chatHistory.length < 2}
        >
          Next: Video Editor
        </Button>
      </div>
    </div>
  );
}

