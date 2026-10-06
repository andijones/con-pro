"use client";
// Throwaway: /proto/reader harness. "Original" is the reader before Risk map; "Risk map" was promoted to the app.
import { OriginalReader } from "./original";
import { BackLink, PageHeader } from "@/components/contravo/primitives";
import { Picker } from "../home/picker";
import { all, contract } from "./doc";
import { Annotated, Brief, RiskMap } from "./variants";

const Current = () => <OriginalReader clauses={all} title={contract.title} pages={contract.pages} />;
const variants = [Current, RiskMap, Brief, Annotated];

export function Harness() {
  return (
    <div>
      <PageHeader title={contract.title} leading={<BackLink href="/contracts" label="contracts" />}>
        {contract.supplier}
      </PageHeader>
      <h2 className="mt-8 mb-4 text-base font-medium">
        What the contract says <span className="font-normal text-muted-foreground">· in plain English</span>
      </h2>
      <Picker
        names={["Original", "Risk map", "Brief", "Annotated"]}
        render={(i) => {
          const V = variants[i];
          return <V />;
        }}
      />
    </div>
  );
}
