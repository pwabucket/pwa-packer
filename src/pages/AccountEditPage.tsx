import { InnerPageLayout } from "../layouts/InnerPageLayout";

import { useAppStore } from "../store/useAppStore";
import { useNavigateBack } from "../hooks/useNavigateBack";
import { Navigate, useParams } from "react-router";
import { ExistingAccountForm } from "../components/ExistingAccountForm";

/** Account Edit Page Component */
const AccountEditPage = () => {
  const params = useParams();
  const accountId = params.accountId;

  const accounts = useAppStore((state) => state.accounts);
  const account = accounts.find((acc) => acc.id === accountId);

  const navigateBack = useNavigateBack();

  if (!account) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <InnerPageLayout title={"Edit Account"}>
      <ExistingAccountForm
        account={account}
        onUpdated={() => {
          navigateBack();
        }}
      />
    </InnerPageLayout>
  );
};

export { AccountEditPage };
