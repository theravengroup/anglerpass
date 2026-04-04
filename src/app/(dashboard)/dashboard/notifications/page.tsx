"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  Loader2,
  Users,
  MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

function getIcon(type: string) {
  switch (type) {
    case "booking_requested":
    case "booking_confirmed":
    case "booking_declined":
    case "booking_cancelled":
      return <CalendarDays className="size-4" />;
    case "member_invited":
    case "member_approved":
      return <Users className="size-4" />;
    case "property_access_granted":
      return <MapPin className="size-4" />;
    default:
      return <Bell className="size-4" />;
  }
}

function getIconColor(type: string) {
  switch (type) {
    case "booking_confirmed":
    case "member_approved":
    case "property_access_granted":
      return "text-forest bg-forest/10";
    case "booking_declined":
      return "text-red-600 bg-red-50";
    case "booking_cancelled":
      return "text-stone bg-stone/10";
    case "booking_requested":
      return "text-bronze bg-bronze/10";
    case "member_invited":
      return "text-river bg-river/10";
    default:
      return "text-text-secondary bg-stone-light/20";
  }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications?limit=50");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unread_count ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mark_all_read: true }),
    });
    setMarkingAll(false);
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-3xl items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-forest" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-semibold text-text-primary">
            Notifications
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "You're all caught up"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllRead}
            disabled={markingAll}
          >
            <CheckCheck className="mr-1.5 size-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="border-stone-light/20">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-forest/10">
              <Bell className="size-6 text-forest" />
            </div>
            <p className="text-sm text-text-secondary">
              No notifications yet. They&apos;ll appear here when you get booking
              requests, confirmations, and other updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-stone-light/20 overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="sr-only">Notification list</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-stone-light/15">
              {notifications.map((n) => {
                const content = (
                  <div
                    className={cn(
                      "flex items-start gap-3 px-5 py-4 transition-colors",
                      !n.read && "bg-forest/[0.03]",
                      n.link && "hover:bg-stone-light/10 cursor-pointer"
                    )}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                    }}
                  >
                    <div
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                        getIconColor(n.type)
                      )}
                    >
                      {getIcon(n.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "text-sm",
                            !n.read
                              ? "font-medium text-text-primary"
                              : "text-text-secondary"
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-text-light">
                          {timeAgo(n.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-text-light line-clamp-2">
                        {n.body}
                      </p>
                    </div>
                    {!n.read && (
                      <div className="mt-2 size-2 shrink-0 rounded-full bg-forest" />
                    )}
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} className="block">
                    {content}
                  </Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
