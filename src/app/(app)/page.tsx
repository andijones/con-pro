import { currentUser } from "@/lib/data";
import { HomeTabs } from "@/components/contravo/home-tabs";

export const metadata = { title: "Home" };

export default function Home() {
  return (
    <div className="mx-auto max-w-[880px]">
      <h1 className="heading text-[2.25rem]">Good morning, {currentUser.name.split(" ")[0]}</h1>
      <p className="mt-2 text-base text-muted-foreground">Here’s what needs a decision across your contracts.</p>
      <HomeTabs />
    </div>
  );
}
