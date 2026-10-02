"use client";
// Throwaway: /proto/home harness. Variant 1 is the current Home, unchanged.
import { currentUser } from "@/lib/data";
import { HomeTabs } from "@/components/contravo/home-tabs";
import { PageHeader } from "@/components/contravo/primitives";
import { Picker } from "./picker";
import { Queue } from "./queue";
import { Ask } from "./ask";
import { Estate } from "./estate";

function Current() {
  return (
    <div>
      <PageHeader title={`Good morning, ${currentUser.name.split(" ")[0]}`}>Here’s what needs a decision across your contracts.</PageHeader>
      <HomeTabs />
    </div>
  );
}

const QueueHealth = () => <Queue withHealth />;
const variants = [Current, Queue, Ask, Estate, QueueHealth];

export function Harness() {
  return <Picker names={["Current", "Queue", "Ask", "Estate", "Queue + health"]} render={(i) => {
    const V = variants[i];
    return <V />;
  }} />;
}
