import { InnerPageLayout } from "../layouts/InnerPageLayout";
import { PackForm } from "../components/PackForm";
import { useProviderAccountsChooser } from "../hooks/useProviderAccountsChooser";

/** Pack Page Component */
const Pack = () => {
  const selector = useProviderAccountsChooser();

  return (
    <InnerPageLayout title="Pack" className="gap-2">
      <PackForm selector={selector} />
    </InnerPageLayout>
  );
};

export { Pack };
