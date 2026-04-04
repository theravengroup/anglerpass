import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";
import type { TopProperty } from "./financials-types";

interface TopPropertiesCardProps {
  properties: TopProperty[];
}

export function TopPropertiesCard({ properties }: TopPropertiesCardProps) {
  if (properties.length === 0) return null;

  const maxRevenue = Math.max(...properties.map((p) => p.platform_revenue), 1);

  return (
    <Card className="border-stone-light/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4 text-forest" />
          Top Revenue Properties
        </CardTitle>
        <CardDescription>
          Properties generating the most platform revenue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {properties.slice(0, 10).map((prop) => {
          const pct =
            maxRevenue > 0
              ? (prop.platform_revenue / maxRevenue) * 100
              : 0;
          return (
            <div key={prop.name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-text-primary">
                  {prop.name}
                </span>
                <span className="text-text-secondary">
                  ${prop.platform_revenue.toLocaleString()} rev · $
                  {prop.gmv.toLocaleString()} GMV · {prop.bookings}{" "}
                  booking{prop.bookings !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-offwhite">
                <div
                  className="h-full rounded-full bg-forest transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
