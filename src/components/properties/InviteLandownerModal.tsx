"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

const inviteSchema = z.object({
  landowner_email: z.string().email("Please enter a valid email address"),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteLandownerModalProps {
  propertyId: string;
  propertyName: string;
  trigger: React.ReactNode;
  onInviteSent?: () => void;
}

export default function InviteLandownerModal({
  propertyId,
  propertyName,
  trigger,
  onInviteSent,
}: InviteLandownerModalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  });

  const onSubmit = async (data: InviteFormData) => {
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch(
        `/api/properties/${propertyId}/invite-landowner`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setErrorMessage(err.error ?? "Failed to send invitation");
        setStatus("error");
        return;
      }

      setStatus("success");
      onInviteSent?.();
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        reset();
      }, 3000);
    } catch {
      setErrorMessage("An unexpected error occurred");
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
          setErrorMessage("");
          reset();
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        {status === "success" ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-forest/10">
              <CheckCircle2 className="size-7 text-forest" />
            </div>
            <h3 className="mt-4 font-heading text-xl font-semibold text-forest">
              Invitation Sent
            </h3>
            <p className="mt-2 max-w-[340px] text-sm text-text-secondary">
              The landowner will receive an email with a link to claim
              ownership of <strong>{propertyName}</strong>.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading text-xl tracking-[-0.3px] text-forest">
                Invite Landowner
              </DialogTitle>
              <DialogDescription>
                Send an invitation to the landowner to claim ownership of{" "}
                <strong>{propertyName}</strong>. They&rsquo;ll need to create an
                account and set up Stripe Connect for payouts.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="mt-4 space-y-4"
            >
              <div>
                <Label htmlFor="landowner-email">
                  <Mail className="mr-1 inline size-3.5" />
                  Landowner Email
                </Label>
                <Input
                  id="landowner-email"
                  type="email"
                  placeholder="landowner@example.com"
                  {...register("landowner_email")}
                />
                {errors.landowner_email && (
                  <p
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                    aria-live="polite"
                  >
                    {errors.landowner_email.message}
                  </p>
                )}
              </div>

              {status === "error" && (
                <p
                  className="text-xs text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {errorMessage}
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
                    Sending...
                  </>
                ) : (
                  "Send Invitation"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
