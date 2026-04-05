"use client";

import { useState, useEffect } from "react";
import { CardDisplay } from "@/components/shared/CardDisplay";
import { BankAccountDisplay } from "@/components/shared/BankAccountDisplay";
import { UpdatePaymentForm } from "@/components/shared/UpdatePaymentForm";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CreditCard } from "lucide-react";

type RoleTheme = "angler" | "landowner" | "club" | "guide";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  name: string;
}

interface SavedBankAccount {
  id: string;
  bankName: string;
  last4: string;
  accountType: string;
  name: string;
}

interface PaymentMethodsSectionProps {
  /** Role theme for card coloring */
  theme?: RoleTheme;
}

/**
 * Payment methods management section for settings pages.
 *
 * Shows saved credit cards and bank accounts with options to:
 * - Add a new payment method (via Stripe Elements)
 * - Remove an existing payment method
 * - Set a default payment method
 */
export function PaymentMethodsSection({
  theme = "angler",
}: PaymentMethodsSectionProps) {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [bankAccounts, setBankAccounts] = useState<SavedBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function fetchMethods() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/payment-methods");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards ?? []);
        setBankAccounts(data.bankAccounts ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMethods();
  }, []);

  async function handleRemove(paymentMethodId: string) {
    setRemovingId(paymentMethodId);
    try {
      const res = await fetch(
        `/api/stripe/payment-methods?id=${paymentMethodId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== paymentMethodId));
        setBankAccounts((prev) => prev.filter((b) => b.id !== paymentMethodId));
      }
    } catch {
      // silent
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Loader2 className="size-4 animate-spin text-text-light" />
        <span className="text-sm text-text-secondary">Loading payment methods...</span>
      </div>
    );
  }

  const hasNoMethods = cards.length === 0 && bankAccounts.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-text-primary">
          Payment Methods
        </h3>
        <p className="text-sm text-text-secondary">
          Manage your saved cards and bank accounts for bookings and membership payments.
        </p>
      </div>

      {hasNoMethods && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-8">
          <CreditCard className="size-8 text-text-light" />
          <p className="text-sm text-text-secondary">No payment methods saved</p>
          <p className="text-xs text-text-light">
            Add a card or bank account to speed up future checkouts.
          </p>
        </div>
      )}

      {/* Credit cards */}
      {cards.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">Cards</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <div key={card.id} className="relative">
                <CardDisplay
                  name={card.name}
                  last4={card.last4}
                  expMonth={card.expMonth}
                  expYear={card.expYear}
                  brand={card.brand as "visa" | "mastercard" | "amex" | "discover" | "unknown"}
                  theme={theme}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 size-8 rounded-full bg-black/20 p-0 text-white hover:bg-black/40"
                  onClick={() => handleRemove(card.id)}
                  disabled={removingId === card.id}
                  aria-label={`Remove card ending in ${card.last4}`}
                >
                  {removingId === card.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bank accounts */}
      {bankAccounts.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">Bank Accounts</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {bankAccounts.map((account) => (
              <div key={account.id} className="relative">
                <BankAccountDisplay
                  name={account.name}
                  bankName={account.bankName}
                  last4={account.last4}
                  accountType={account.accountType as "checking" | "savings"}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-2 size-8 rounded-full bg-black/20 p-0 text-white hover:bg-black/40"
                  onClick={() => handleRemove(account.id)}
                  disabled={removingId === account.id}
                  aria-label={`Remove bank account ending in ${account.last4}`}
                >
                  {removingId === account.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <Trash2 className="size-3" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new payment method */}
      <UpdatePaymentForm onSuccess={fetchMethods} />
    </div>
  );
}
