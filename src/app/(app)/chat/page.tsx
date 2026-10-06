import { currentUser } from "@/lib/data";
import { ChatView } from "@/components/contravo/chat-view";

export const metadata = { title: "Chat" };

export default async function ChatPage(props: PageProps<"/chat">) {
  const sp = await props.searchParams;
  return <ChatView initialTab={sp.tab === "foi" ? "foi" : "ask"} firstName={currentUser.name.split(" ")[0]} />;
}
