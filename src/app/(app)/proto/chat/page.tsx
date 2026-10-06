// Throwaway: /proto/chat. Chat page concepts: making the composer and suggestion glow read on a white page.
// Nothing in production imports this folder.
import { Suspense } from "react";
import ChatPage from "../../chat/page";
import { Harness } from "./harness";

export const metadata = { title: "Chat concepts" };

export default async function ProtoChat() {
  const current = await ChatPage({ searchParams: Promise.resolve({}) } as never);
  return (
    <Suspense>
      <Harness current={current} />
    </Suspense>
  );
}
