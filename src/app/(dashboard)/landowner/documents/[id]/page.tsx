"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Save } from "lucide-react";

export default function EditDocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [required, setRequired] = useState(true);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/documents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.template.title);
          setBody(data.template.body);
          setRequired(data.template.required);
          setActive(data.template.active);
        } else {
          setError("Template not found");
        }
      } catch {
        setError("Failed to load template");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, required, active }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to update");
        return;
      }

      router.push("/landowner/documents");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  if (error && !title) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
          Edit Document
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Update this document template. Changes won&apos;t affect already-signed
          copies.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-stone-light/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-forest" />
              Edit Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={3}
              />
            </div>

            <div>
              <Label htmlFor="body">Document Body</Label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-stone-light/20 bg-white px-3 py-2 text-sm font-mono leading-relaxed text-text-primary focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                rows={20}
                required
                minLength={20}
              />
            </div>

            <div className="flex gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="rounded border-stone-light/20"
                />
                <span className="text-sm text-text-primary">Required</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-stone-light/20"
                />
                <span className="text-sm text-text-primary">Active</span>
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/landowner/documents")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-forest text-white hover:bg-forest/90"
              >
                {saving ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 size-4" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
