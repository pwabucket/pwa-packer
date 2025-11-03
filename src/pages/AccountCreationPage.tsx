import { InnerPageLayout } from "../layouts/InnerPageLayout";

import { useNavigateBack } from "../hooks/useNavigateBack";
import { NewAccountForm } from "../components/NewAccountForm";

/** Account Creation Page Component */
const AccountCreationPage = () => {
  const navigateBack = useNavigateBack();

  return (
    <InnerPageLayout title="Create Account">
      <NewAccountForm
        onCreated={() => {
          navigateBack();
        }}
      />
    </InnerPageLayout>
  );
};

export { AccountCreationPage };
