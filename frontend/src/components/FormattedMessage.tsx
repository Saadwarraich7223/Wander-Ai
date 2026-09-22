"use client";

import React from "react";

interface FormattedMessageProps {
  content: string;
  className?: string;
  isUser?: boolean;
}

/**
 * Parses inline markdown tokens: **bold**, *italic*, `code`
 */
function renderInline(text: string, isUser?: boolean) {
  // Regex matches **bold**, *italic*, and `code`
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={index}
          className={isUser ? "font-bold text-white" : "font-semibold text-on-surface"}
        >
          {inner}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <em key={index} className="italic">
          {inner}
        </em>
      );
    }

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      const inner = part.slice(1, -1);
      return (
        <code
          key={index}
          className={`px-1.5 py-0.5 rounded text-xs font-mono ${
            isUser ? "bg-white/20 text-white" : "bg-surface-container text-secondary"
          }`}
        >
          {inner}
        </code>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

export default function FormattedMessage({ content, className = "", isUser = false }: FormattedMessageProps) {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      const listItems = [...currentList];
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                  isUser ? "bg-white" : "bg-secondary"
                }`}
              />
              <span className="flex-1 leading-relaxed">
                {renderInline(item, isUser)}
              </span>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, i) => {
    const line = rawLine.trim();

    // Check if bullet item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      currentList.push(line.slice(2));
      return;
    }

    // Not a bullet item -> flush existing list if any
    flushList();

    if (!line) {
      // Empty line / paragraph break
      elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
      return;
    }

    // Heading 3 / 4
    if (line.startsWith("### ")) {
      elements.push(
        <h4
          key={`h4-${i}`}
          className={`font-display font-bold text-sm mt-3 mb-1 ${
            isUser ? "text-white" : "text-on-surface"
          }`}
        >
          {renderInline(line.slice(4), isUser)}
        </h4>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {renderInline(line, isUser)}
      </p>
    );
  });

  // Flush any trailing list
  flushList();

  return <div className={`space-y-1 font-sans ${className}`}>{elements}</div>;
}
