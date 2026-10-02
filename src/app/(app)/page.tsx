import { currentUser } from "@/lib/data";
import { HomeTabs } from "@/components/contravo/home-tabs";
import { PageHeader } from "@/components/contravo/primitives";

export const metadata = { title: "Home" };

export default function Home() {
  return (
    <div>
      <PageHeader title={`Good morning, ${currentUser.name.split(" ")[0]}`}>Here’s what needs a decision across your contracts.</PageHeader>
      <HomeTabs />
    </div>
  );
}
