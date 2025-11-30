import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Tabs } from "radix-ui";
import { PlanCreator } from "../components/PlanCreator";
import { TabTrigger } from "../components/TabTrigger";
import { PlanValidator } from "../components/PlanValidator";
import { PlanSender } from "../components/PlanSender";
import { useCallback, useState } from "react";
import type { PlanFileContent } from "../types";
import { PlanImport } from "../components/PlanImport";
import { PlanPacker } from "../components/PlanPacker";

/** Plan Page Component */
const Plan = () => {
  const [plan, setPlan] = useState<PlanFileContent | null>(null);

  const onImport = useCallback((data: PlanFileContent) => setPlan(data), []);

  return (
    <InnerPageLayout title="Plan" className="gap-4" wrapperClassName="pt-0">
      <Tabs.Root defaultValue="create" className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-4 shrink-0">
          <TabTrigger value="create" title="Create" />
          <TabTrigger value="send" title="Send" />
          <TabTrigger value="validate" title="Validate" />
          <TabTrigger value="pack" title="Pack" />
        </Tabs.List>

        {/* Create */}
        <Tabs.Content
          value="create"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          <PlanCreator />
        </Tabs.Content>

        {/* Send */}
        <Tabs.Content
          value="send"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {plan ? (
            <PlanSender plan={plan} />
          ) : (
            <PlanImport onImport={onImport} />
          )}
        </Tabs.Content>

        {/* Validate */}
        <Tabs.Content
          value="validate"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {plan ? (
            <PlanValidator plan={plan} />
          ) : (
            <PlanImport onImport={onImport} />
          )}
        </Tabs.Content>

        {/* Pack */}
        <Tabs.Content
          value="pack"
          forceMount
          className="data-[state=inactive]:hidden"
        >
          {plan ? (
            <PlanPacker plan={plan} />
          ) : (
            <PlanImport onImport={onImport} />
          )}
        </Tabs.Content>
      </Tabs.Root>
    </InnerPageLayout>
  );
};

export { Plan };
