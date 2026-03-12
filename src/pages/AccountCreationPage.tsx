import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { NewAccountForm } from "../components/NewAccountForm";
import { useNavigateBack } from "@pwabucket/pwa-router";

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
