"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  supportTicketSchema,
  SUPPORT_CATEGORIES,
  type SupportTicketFormData,
} from "@/lib/validations/support-ticket";

interface SupportTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SupportTicketModal({
  open,
  onOpenChange,
}: SupportTicketModalProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SupportTicketFormData>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      category: undefined,
      subject: "",
      message: "",
    },
  });

  const messageLength = watch("message")?.length ?? 0;

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      // Reset state when closing
      setTimeout(() => {
        reset();
        setSubmitError(null);
        setSubmitted(false);
      }, 200);
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: SupportTicketFormData) {
    setSubmitError(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        setSubmitError(
          err?.error ?? "Failed to submit your ticket. Please try again."
        );
        return;
      }

      setSubmitted(true);

      // Auto-close after 2 seconds
      setTimeout(() => {
        handleClose(false);
      }, 2000);
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-label="Submit a support ticket"
        aria-modal="true"
        role="dialog"
      >
        {submitted ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-forest/10">
              <CheckCircle2 className="size-6 text-forest" />
            </div>
            <h3 className="mt-4 font-[family-name:var(--font-heading)] text-lg font-semibold text-text-primary">
              Ticket Submitted
            </h3>
            <p className="mt-2 max-w-xs text-sm text-text-secondary">
              Your request has been submitted. We&apos;ll be in touch shortly.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-[family-name:var(--font-heading)] text-text-primary">
                Get Help
              </DialogTitle>
              <DialogDescription>
                Tell us what&apos;s going on. We&apos;ll get back to you as soon
                as we can.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
            >
              {/* Category */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm font-medium text-text-primary">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        id="category"
                        className="w-full"
                        aria-invalid={!!errors.category}
                      >
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORT_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && (
                  <p
                    className="text-xs text-red-500"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-sm font-medium text-text-primary">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief summary of your issue"
                  maxLength={100}
                  aria-invalid={!!errors.subject}
                  {...register("subject")}
                />
                {errors.subject && (
                  <p
                    className="text-xs text-red-500"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.subject.message}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-sm font-medium text-text-primary">
                  Message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  maxLength={2000}
                  aria-invalid={!!errors.message}
                  {...register("message")}
                />
                <div className="flex items-center justify-between">
                  {errors.message ? (
                    <p
                      className="text-xs text-red-500"
                      role="alert"
                      aria-live="polite"
                    >
                      {errors.message.message}
                    </p>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-text-light">
                    {messageLength}/2,000
                  </span>
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleClose(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-forest text-white hover:bg-forest-deep"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
