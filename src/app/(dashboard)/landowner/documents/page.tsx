"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface Property {
  id: string;
  name: string;
}

interface Template {
  id: string;
  property_id: string;
  title: string;
  body: string;
  required: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export default function DocumentsPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(false);

  // Load properties
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/properties");
        if (res.ok) {
          const data = await res.json();
          const props = (data.properties ?? []).map(
            (p: { id: string; name: string }) => ({
              id: p.id,
              name: p.name,
            })
          );
          setProperties(props);
          if (props.length > 0) {
            setSelectedPropertyId(props[0].id);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Load templates when property changes
  useEffect(() => {
    if (!selectedPropertyId) return;

    async function loadTemplates() {
      setTemplatesLoading(true);
      try {
        const res = await fetch(
          `/api/documents?property_id=${selectedPropertyId}`
        );
        if (res.ok) {
          const data = await res.json();
          setTemplates(data.templates ?? []);
        }
      } catch {
        // silent
      } finally {
        setTemplatesLoading(false);
      }
    }
    loadTemplates();
  }, [selectedPropertyId]);

  const toggleActive = async (id: string, currentActive: boolean) => {
    const res = await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !currentActive }),
    });
    if (res.ok) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, active: !currentActive } : t
        )
      );
    }
  };

  const deleteTemplate = async (id: string) => {
    if (!confirm("Delete this document template?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      if (data.deactivated) {
        // Template was deactivated instead of deleted
        setTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, active: false } : t))
        );
      } else {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-4xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Documents & Waivers
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Create liability waivers and access agreements that anglers must sign
            before their trip.
          </p>
        </div>
      </div>

      {/* Property selector */}
      {properties.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-secondary">
            Property:
          </span>
          <Select
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {properties.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link
            href={`/landowner/documents/new?property_id=${selectedPropertyId}`}
          >
            <Button size="sm" className="bg-forest text-white hover:bg-forest/90">
              <Plus className="mr-1.5 size-3.5" />
              Add Document
            </Button>
          </Link>
        </div>
      )}

      {properties.length === 0 && (
        <Card className="border-stone-light/20">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-text-secondary">
              Create a property first to start adding documents.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Templates list */}
      {templatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-5 animate-spin text-forest" />
        </div>
      ) : templates.length === 0 && selectedPropertyId ? (
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-forest" />
              No Documents Yet
            </CardTitle>
            <CardDescription>
              Add a liability waiver or access agreement that anglers must sign
              before their booking. You can start with our default template or
              create your own.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/landowner/documents/new?property_id=${selectedPropertyId}&template=waiver`}
            >
              <Button
                variant="outline"
                size="sm"
                className="border-forest text-forest"
              >
                <FileText className="mr-1.5 size-3.5" />
                Start with Default Waiver
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <Card
              key={t.id}
              className={`border-stone-light/20 ${!t.active ? "opacity-60" : ""}`}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4 shrink-0 text-forest" />
                    <h3 className="text-sm font-medium text-text-primary truncate">
                      {t.title}
                    </h3>
                    {t.required && (
                      <Badge
                        variant="outline"
                        className="border-forest/20 bg-forest/10 text-forest text-[10px]"
                      >
                        Required
                      </Badge>
                    )}
                    {!t.active && (
                      <Badge variant="outline" className="text-[10px]">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-text-light truncate max-w-lg">
                    {t.body.slice(0, 120).replace(/[#*_]/g, "")}...
                  </p>
                </div>

                <div className="flex items-center gap-1.5 ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => toggleActive(t.id, t.active)}
                    title={t.active ? "Deactivate" : "Activate"}
                  >
                    {t.active ? (
                      <ToggleRight className="size-4 text-forest" />
                    ) : (
                      <ToggleLeft className="size-4 text-text-light" />
                    )}
                  </Button>
                  <Link href={`/landowner/documents/${t.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-red-500 hover:text-red-600"
                    onClick={() => deleteTemplate(t.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
