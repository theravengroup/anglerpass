"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useCallback } from "react";

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

/**
 * Cloudflare Turnstile CAPTCHA widget.
 * Calls onVerify with the token once the challenge is solved.
 */
export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const ref = useRef<TurnstileInstance>(null);

  const handleExpire = useCallback(() => {
    ref.current?.reset();
    onExpire?.();
  }, [onExpire]);

  return (
    <Turnstile
      ref={ref}
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
      onSuccess={onVerify}
      onExpire={handleExpire}
      onError={onError}
      options={{
        theme: "light",
        size: "flexible",
      }}
    />
  );
}
