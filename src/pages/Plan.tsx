import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { Tabs } from "radix-ui";
import { PlanCreator } from "../components/PlanCreator";
import { TabTrigger } from "../components/TabTrigger";
import { PlanValidator } from "../components/PlanValidator";

/** Plan Page Component */
const Plan = () => {
  return (
    <InnerPageLayout title="Plan" className="gap-4" wrapperClassName="pt-0">
      <Tabs.Root defaultValue="create" className="flex flex-col gap-4">
        <Tabs.List className="grid grid-cols-2 shrink-0">
          <TabTrigger value="create" title="Create" />
          <TabTrigger value="validate" title="Validate" />
        </Tabs.List>

        <Tabs.Content value="create">
          <PlanCreator />
        </Tabs.Content>

        <Tabs.Content value="validate">
          <PlanValidator />
        </Tabs.Content>
      </Tabs.Root>
    </InnerPageLayout>
  );
};

export { Plan };
