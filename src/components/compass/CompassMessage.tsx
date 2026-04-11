"use client";

import type { UIMessage } from "ai";
import { User, Compass } from "lucide-react";
import CompassPropertyCard from "./CompassPropertyCard";
import CompassWeatherCard from "./CompassWeatherCard";
import CompassStreamCard from "./CompassStreamCard";
import CompassProductCard from "./CompassProductCard";
import type { ProductRecommendation } from "./CompassProductCard";
import AffiliateDisclosure from "@/components/shared/AffiliateDisclosure";

interface CompassMessageProps {
  message: UIMessage;
}

/** Minimal markdown-to-JSX for assistant responses (bold, italic, links, lists). */
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-4 space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // List item
    if (
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      /^\d+\.\s/.test(trimmed)
    ) {
      const content = trimmed.replace(/^[-*]\s|^\d+\.\s/, "");
      listItems.push(content);
      continue;
    }

    flushList();

    // Empty line
    if (trimmed === "") {
      continue;
    }

    // Heading
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4
          key={i}
          className="font-heading text-sm font-semibold text-forest-deep mt-2"
        >
          {renderInline(trimmed.slice(4))}
        </h4>
      );
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3
          key={i}
          className="font-heading text-base font-semibold text-forest-deep mt-2"
        >
          {renderInline(trimmed.slice(3))}
        </h3>
      );
    } else {
      elements.push(<p key={i}>{renderInline(trimmed)}</p>);
    }
  }

  flushList();

  return <div className="space-y-2 text-sm leading-relaxed">{elements}</div>;
}

/** Parse inline markdown: **bold**, *italic*, [link](url), `code` */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      parts.push(
        <strong key={key++} className="font-semibold">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      parts.push(
        <em key={key++} className="italic">
          {match[3]}
        </em>
      );
    } else if (match[4]) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-sand/50 px-1 py-0.5 text-xs font-mono text-forest-deep"
        >
          {match[4]}
        </code>
      );
    } else if (match[5] && match[6]) {
      parts.push(
        <a
          key={key++}
          href={match[6]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-river underline underline-offset-2 hover:text-river-light"
        >
          {match[5]}
        </a>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

/** Extract text content from UIMessage parts. */
function getTextContent(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");
}

/** Render tool invocation results as inline cards. */
function renderToolResults(message: UIMessage) {
  const cards: React.ReactNode[] = [];

  for (const part of message.parts) {
    // Handle dynamic-tool parts (used when tools aren't statically typed on the client)
    if (part.type === "dynamic-tool" && part.state === "output-available") {
      const { toolName, output } = part;
      const result = output as Record<string, unknown>;

      if (
        toolName === "searchProperties" &&
        Array.isArray(result?.results) &&
        result.results.length > 0
      ) {
        for (const property of result.results) {
          cards.push(
            <CompassPropertyCard key={property.id} property={property} />
          );
        }
      }

      if (toolName === "getPropertyDetails" && result?.property) {
        const prop = result.property as unknown as Parameters<typeof CompassPropertyCard>[0]["property"];
        cards.push(
          <CompassPropertyCard
            key={prop.id}
            property={prop}
          />
        );
      }

      if (
        toolName === "getWeather" &&
        result?.days &&
        Array.isArray(result.days)
      ) {
        cards.push(
          <CompassWeatherCard
            key="weather"
            weather={
              result as unknown as Parameters<typeof CompassWeatherCard>[0]["weather"]
            }
          />
        );
      }

      if (
        toolName === "getStreamFlow" &&
        result?.gauges &&
        Array.isArray(result.gauges)
      ) {
        cards.push(
          <CompassStreamCard
            key="stream"
            stream={
              result as unknown as Parameters<typeof CompassStreamCard>[0]["stream"]
            }
          />
        );
      }

      if (
        toolName === "getProductRecommendations" &&
        Array.isArray(result?.products) &&
        result.products.length > 0
      ) {
        for (const product of result.products) {
          cards.push(
            <CompassProductCard
              key={product.id}
              product={product as ProductRecommendation}
              source="compass"
            />
          );
        }
        // FTC-compliant affiliate disclosure
        cards.push(
          <AffiliateDisclosure key="affiliate-disclosure" variant="inline" />
        );
      }
    }
  }

  return cards.length > 0 ? (
    <div className="space-y-2 mt-2">{cards}</div>
  ) : null;
}

export default function CompassMessage({ message }: CompassMessageProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-forest/10 text-forest" : "bg-bronze/10 text-bronze"
        }`}
      >
        {isUser ? (
          <User className="size-4" />
        ) : (
          <Compass className="size-4" />
        )}
      </div>

      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-xl px-4 py-3 ${
          isUser
            ? "bg-forest text-white"
            : "border border-parchment bg-white text-text-primary"
        }`}
      >
        {textContent &&
          (isUser ? (
            <p className="text-sm leading-relaxed">{textContent}</p>
          ) : (
            renderMarkdown(textContent)
          ))}
        {!isUser && renderToolResults(message)}
      </div>
    </div>
  );
}
