// Throwaway: /proto/reader. Ways to read a contract, behind the picker. Nothing in production imports this folder.
import { Suspense } from "react";
import { Harness } from "./harness";

export const metadata = { title: "Contract reader concepts" };

export default function ProtoReader() {
  return (
    <Suspense>
      <Harness />
    </Suspense>
  );
}
