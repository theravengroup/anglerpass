"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  Copy,
  Code,
  LinkIcon,
  Eye,
  FileText,
  ChevronDown,
} from "lucide-react";
import { SITE_URL } from "@/lib/constants";

interface CopyTemplate {
  id: string;
  label: string;
  headline: string;
  body: string;
  cta: string;
}

function getTemplates(clubName: string): CopyTemplate[] {
  return [
    {
      id: "access",
      label: "Private Water Access",
      headline: `${clubName} Is Now on AnglerPass`,
      body: `We've partnered with AnglerPass to bring our members streamlined access to private water. Book trips, manage your membership, and unlock water across the AnglerPass network\u00a0\u2014\u00a0all in one\u00a0place.`,
      cta: `Join ${clubName} on AnglerPass`,
    },
    {
      id: "network",
      label: "Cross-Club Network",
      headline: `Your ${clubName} Membership Just Got Bigger`,
      body: `Through the AnglerPass Cross-Club Network, your membership now opens the gate to private water managed by partner clubs across the country. One membership, more\u00a0water.`,
      cta: `Join ${clubName} on AnglerPass`,
    },
    {
      id: "modern",
      label: "Modern Club Management",
      headline: `${clubName} + AnglerPass`,
      body: `We\u2019re using AnglerPass to run our club\u00a0\u2014\u00a0online bookings, verified independent guides, and a network of private water that goes well beyond our own properties. Join us and see what modern club membership\u00a0looks\u00a0like.`,
      cta: `Join ${clubName} on AnglerPass`,
    },
  ];
}

function buildButtonHtml(joinUrl: string, ctaText: string): string {
  return `<a href="${joinUrl}" style="display:inline-block;padding:14px 28px;background:#1a3a2a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px;letter-spacing:.3px">${ctaText}</a>`;
}

function buildAnnouncementHtml(
  joinUrl: string,
  template: CopyTemplate
): string {
  return `<div style="max-width:560px;margin:0 auto;padding:32px;border:1px solid #e8e5de;border-radius:12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#faf9f6">
  <h2 style="margin:0 0 12px;font-size:22px;font-weight:600;color:#1a3a2a;line-height:1.3">${template.headline}</h2>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#5a5a52">${template.body}</p>
  <a href="${joinUrl}" style="display:inline-block;padding:14px 28px;background:#1a3a2a;color:#fff;font-size:14px;font-weight:500;text-decoration:none;border-radius:6px;letter-spacing:.3px">${template.cta}</a>
  <p style="margin:16px 0 0;font-size:12px;color:#9a9a8e">Powered by <a href="https://anglerpass.com" style="color:#9a9a8e">AnglerPass</a></p>
</div>`;
}

export default function ClubEmbedWidget({ club }: { club: { id: string; name: string } }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(0);
  const [copied, setCopied] = useState<"button" | "block" | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);

  const joinUrl = `${SITE_URL}/join/${club.id}`;
  const templates = getTemplates(club.name);
  const template = templates[activeTemplate];

  const buttonHtml = buildButtonHtml(joinUrl, template.cta);
  const announcementHtml = buildAnnouncementHtml(joinUrl, template);

  function copyToClipboard(text: string, type: "button" | "block") {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <Card className="border-stone-light/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex size-8 items-center justify-center rounded-lg bg-river/10">
            <LinkIcon className="size-4 text-river" />
          </div>
          Website Embed &amp; Join Link
        </CardTitle>
        <CardDescription>
          Share your join link directly, or embed a branded button or
          announcement block on your club&rsquo;s&nbsp;website.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ── Direct Link ── */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-text-primary">
            Direct Join Link
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={joinUrl}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(joinUrl);
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2000);
              }}
            >
              {linkCopied ? (
                <>
                  <Check className="size-4 text-forest" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>

        <hr className="border-stone-light/20" />

        {/* ── Template Picker ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-text-light" />
              <p className="text-sm font-medium text-text-primary">
                Marketing Copy Template
              </p>
            </div>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                className="gap-1"
              >
                {template.label}
                <ChevronDown className="size-3" />
              </Button>
              {showTemplateMenu && (
                <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-stone-light/20 bg-white py-1 shadow-lg">
                  {templates.map((t, i) => (
                    <button
                      key={t.id}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-offwhite ${
                        i === activeTemplate
                          ? "font-medium text-forest"
                          : "text-text-secondary"
                      }`}
                      onClick={() => {
                        setActiveTemplate(i);
                        setShowTemplateMenu(false);
                      }}
                    >
                      {i === activeTemplate && (
                        <Check className="size-3 text-forest" />
                      )}
                      <span className={i === activeTemplate ? "" : "ml-5"}>
                        {t.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-text-secondary">
            Choose a pre-written template, then copy the button or full
            announcement block to paste into your&nbsp;site.
          </p>
        </div>

        {/* ── Live Preview ── */}
        <div className="space-y-3">
          <button
            className="flex items-center gap-2 text-sm font-medium text-river transition-colors hover:text-river/80"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="size-4" />
            {showPreview ? "Hide Preview" : "Show Preview"}
          </button>

          {showPreview && (
            <div className="overflow-hidden rounded-xl border border-stone-light/20 bg-offwhite p-6">
              <div className="mx-auto max-w-[560px] rounded-xl border border-parchment bg-parchment-light p-8">
                <h2 className="mb-3 font-heading text-[22px] font-semibold leading-[1.3] text-forest">
                  {template.headline}
                </h2>
                <p className="mb-6 text-[15px] leading-[1.7] text-text-secondary">
                  {template.body}
                </p>
                <span className="inline-block rounded-md bg-forest px-7 py-3.5 text-sm font-medium tracking-wide text-white">
                  {template.cta}
                </span>
                <p className="mt-4 text-xs text-text-light">
                  Powered by{" "}
                  <span className="text-text-light">AnglerPass</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Code Snippets ── */}
        <div className="space-y-4">
          {/* Button only */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-text-light" />
                <p className="text-sm font-medium text-text-primary">
                  Button Only
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(buttonHtml, "button")}
              >
                {copied === "button" ? (
                  <>
                    <Check className="size-4 text-forest" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="overflow-x-auto rounded-lg bg-forest-deep p-4">
              <pre className="font-mono text-xs leading-relaxed text-parchment/80">
                {buttonHtml}
              </pre>
            </div>
          </div>

          {/* Full announcement block */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="size-4 text-text-light" />
                <p className="text-sm font-medium text-text-primary">
                  Full Announcement Block
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(announcementHtml, "block")
                }
              >
                {copied === "block" ? (
                  <>
                    <Check className="size-4 text-forest" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="max-h-[200px] overflow-auto rounded-lg bg-forest-deep p-4">
              <pre className="font-mono text-xs leading-relaxed text-parchment/80">
                {announcementHtml}
              </pre>
            </div>
          </div>
        </div>

        <p className="text-xs text-text-light">
          Works with any platform &mdash; WordPress, Squarespace, Wix,
          or custom&nbsp;sites.
        </p>
      </CardContent>
    </Card>
  );
}
