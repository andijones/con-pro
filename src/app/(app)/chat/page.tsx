import { Suspense } from "react";
import { AskThread } from "@/components/contravo/ask-thread";
import { FoiIntake } from "@/components/contravo/foi-intake";
import { PageHeader } from "@/components/contravo/primitives";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const metadata = { title: "Chat" };

export default async function ChatPage(props: PageProps<"/chat">) {
  const sp = await props.searchParams;
  const tab = sp.tab === "foi" ? "foi" : "ask";
  return (
    <div>
      <PageHeader title="Ask about your contracts">
        Answers come from the documents in your workspace, not from general knowledge. Every answer shows the passages it came from and
        says what it couldn’t check.
      </PageHeader>
      <Tabs defaultValue={tab} className="mt-6">
        <TabsList>
          <TabsTrigger value="ask">Ask a question</TabsTrigger>
          <TabsTrigger value="foi">FOI request</TabsTrigger>
        </TabsList>
        <TabsContent value="ask" tabIndex={-1} className="mt-4">
          <Suspense>
            <AskThread />
          </Suspense>
        </TabsContent>
        <TabsContent value="foi" tabIndex={-1} className="mt-4">
          <FoiIntake />
        </TabsContent>
      </Tabs>
    </div>
  );
}
