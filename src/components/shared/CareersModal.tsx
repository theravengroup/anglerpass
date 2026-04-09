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
  careersInquirySchema,
  type CareersInquiryData,
} from "@/lib/validations/careers";
import TurnstileWidget from "@/components/shared/TurnstileWidget";

export default function CareersModal({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CareersInquiryData>({
    resolver: zodResolver(careersInquirySchema),
  });

  const onSubmit = async (data: CareersInquiryData) => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, turnstileToken }),
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
          setTurnstileToken(null);
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
              Message Sent
            </h3>
            <p className="mt-2 max-w-[340px] text-sm text-text-secondary">
              Thanks for your interest in AnglerPass. We&rsquo;ll review your
              message and get back to&nbsp;you.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-[-0.3px] text-forest">
                Get in Touch
              </DialogTitle>
              <DialogDescription>
                Tell us who you are and what interests you about working
                with&nbsp;AnglerPass.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
            >
              <div>
                <Label htmlFor="careers-name">Name</Label>
                <Input
                  id="careers-name"
                  placeholder="Your full name"
                  {...register("name")}
                />
                {errors.name && (
                  <p
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="careers-email">Email</Label>
                <Input
                  id="careers-email"
                  type="email"
                  placeholder="you@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="careers-interest">
                  What interests you about AnglerPass?
                </Label>
                <Textarea
                  id="careers-interest"
                  placeholder="Tell us about yourself — your background, what role you'd be a fit for, and why AnglerPass caught your eye."
                  rows={5}
                  {...register("interest")}
                />
                {errors.interest && (
                  <p
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.interest.message}
                  </p>
                )}
              </div>

              {status === "error" && (
                <p
                  className="text-xs text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  Something went wrong. Please try again or email us
                  at&nbsp;hello@anglerpass.com.
                </p>
              )}

              <TurnstileWidget onVerify={setTurnstileToken} />

              <Button
                type="submit"
                className="w-full"
                disabled={status === "submitting" || !turnstileToken}
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
