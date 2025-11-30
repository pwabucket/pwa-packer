import type { PlanFileContent } from "../types";
import { SendForm } from "./SendForm";
import { PlanInfo } from "./PlanInfo";
import { usePlanSender } from "../hooks/usePlanSender";

const PlanSender = ({ plan }: { plan: PlanFileContent }) => {
  const { selector, sendMutation, sendForm, handleFormSubmit } =
    usePlanSender(plan);

  return (
    <div className="flex flex-col gap-4">
      {/* Plan Info */}
      <PlanInfo plan={plan} />

      <SendForm
        handleFormSubmit={handleFormSubmit}
        selector={selector}
        mutation={sendMutation}
        form={sendForm}
        showAmount={false}
        showDifference={false}
        showSkipValidated={false}
      />
    </div>
  );
};

export { PlanSender };
