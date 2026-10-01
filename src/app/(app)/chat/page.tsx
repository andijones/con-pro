import { Suspense } from "react";
import { AskThread } from "@/components/contravo/ask-thread";
import { FoiIntake } from "@/components/contravo/foi-intake";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Chat" };

export default async function ChatPage(props: PageProps<"/chat">) {
  const sp = await props.searchParams;
  const tab = sp.tab === "foi" ? "foi" : "ask";
  return (
    <div className="mx-auto max-w-[880px]">
      <h1 className="heading text-[2rem]">Ask about your contracts</h1>
      <p className="mt-2 max-w-[62ch] text-base text-muted-foreground">
        Answers come from the documents in your workspace, not from general knowledge. Every answer shows the passages it came from and
        says what it couldn’t check.
      </p>
      <Tabs defaultValue={tab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ask">Ask a question</TabsTrigger>
          <TabsTrigger value="foi">FOI request</TabsTrigger>
        </TabsList>
        <TabsContent value="ask" className="mt-4">
          <Suspense>
            <AskThread />
          </Suspense>
        </TabsContent>
        <TabsContent value="foi" className="mt-4">
          <FoiIntake />
        </TabsContent>
      </Tabs>
    </div>
  );
}
