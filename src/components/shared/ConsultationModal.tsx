"use client";

import { useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  consultationSchema,
  type ConsultationFormData,
} from "@/lib/validations/consultation";

export default function ConsultationModal({
  trigger,
}: {
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
  });

  const onSubmit = async (data: ConsultationFormData) => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("success");
      reset();
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
      }, 3000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setStatus("idle");
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        {status === "success" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <CheckCircle2 className="size-7 text-forest" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-forest">
              Request Received
            </h3>
            <p className="mt-2 max-w-[340px] text-sm text-text-secondary">
              We&rsquo;ll follow up within 1&ndash;2 business days to schedule
              your consultation.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-[-0.3px] text-forest">
                Book a Consultation
              </DialogTitle>
              <DialogDescription>
                Tell us about your club and we&rsquo;ll schedule a Zoom call to
                discuss your migration to AnglerPass.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
            >
              <div>
                <Label htmlFor="consult-name">Name</Label>
                <Input
                  id="consult-name"
                  placeholder="Your full name"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="consult-email">Email</Label>
                <Input
                  id="consult-email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="consult-org">Club / Organization</Label>
                <Input
                  id="consult-org"
                  placeholder="Your club or organization name"
                  {...register("organization")}
                />
                {errors.organization && (
                  <p className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {errors.organization.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="consult-count">
                  Number of Properties{" "}
                  <span className="text-text-light">(optional)</span>
                </Label>
                <Input
                  id="consult-count"
                  type="number"
                  min={1}
                  placeholder="e.g. 12"
                  {...register("property_count", { valueAsNumber: true })}
                />
                {errors.property_count && (
                  <p className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {errors.property_count.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="consult-dates">
                  Preferred Dates / Times{" "}
                  <span className="text-text-light">(optional)</span>
                </Label>
                <Textarea
                  id="consult-dates"
                  placeholder="e.g. Weekday mornings, anytime after April 15"
                  rows={2}
                  {...register("preferred_dates")}
                />
              </div>

              <div>
                <Label htmlFor="consult-notes">
                  Notes{" "}
                  <span className="text-text-light">(optional)</span>
                </Label>
                <Textarea
                  id="consult-notes"
                  placeholder="Anything else we should know about your club or migration?"
                  rows={3}
                  {...register("notes")}
                />
              </div>

              {status === "error" && (
                <p className="text-xs text-red-600" role="alert" aria-live="polite">
                  Something went wrong. Please try again or email us at
                  onboarding@anglerpass.com.
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Request Consultation"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
