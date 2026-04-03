"use client";

import { MessagesView } from "@/components/shared/MessagesView";

export default function MessagesPage() {
  return (
    <MessagesView
      accentColor="forest"
      subtitle="Communicate with landowners, club managers, and guides."
      emptyDescription="Your conversations will appear here."
    />
  );
}
