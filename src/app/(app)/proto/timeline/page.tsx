// Throwaway: /proto/timeline. Taking the timeline further. Nothing in production imports this folder.
import { Suspense } from "react";
import TimelinePage from "../../timeline/page";
import { Harness } from "./harness";

export const metadata = { title: "Timeline concepts" };

export default function ProtoTimeline() {
  return (
    <Suspense>
      <Harness current={<TimelinePage />} />
    </Suspense>
  );
}
