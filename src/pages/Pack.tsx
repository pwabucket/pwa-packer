import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { useAccountsChooser } from "../hooks/useAccountsChooser";
import { PackForm } from "../components/PackForm";

/** Pack Page Component */
const Pack = () => {
  const selector = useAccountsChooser();

  return (
    <InnerPageLayout title="Pack" className="gap-2">
      <PackForm selector={selector} />
    </InnerPageLayout>
  );
};

export { Pack };
