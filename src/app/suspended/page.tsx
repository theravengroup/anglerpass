import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ban, Mail } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export const metadata = {
  title: "Account Suspended",
};

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-offwhite p-4">
      <Card className="w-full max-w-md border-red-200">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
            <Ban className="size-8 text-red-500" />
          </div>
          <h1 className="mt-6 font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Account Suspended
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">
            Your account has been suspended. If you believe this is an error,
            please contact our support team.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <a href={`mailto:${siteConfig.contactEmail}`}>
              <Button className="bg-charcoal text-white hover:bg-charcoal/90">
                <Mail className="mr-1.5 size-4" />
                Contact Support
              </Button>
            </a>
            <Link href="/login">
              <Button variant="outline" className="w-full text-sm">
                Back to Login
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
