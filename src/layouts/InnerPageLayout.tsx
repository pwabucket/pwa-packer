import { AppFooter } from "../components/AppFooter";
import { AppHeader } from "../components/AppHeader";
import { MainContainer } from "../components/MainContainer";
import { useNavigateBack } from "../hooks/useNavigateBack";
import { HiOutlineArrowLeft } from "react-icons/hi2";

interface InnerPageLayoutProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  wrapperClassName?: string;
  className?: string;
  showFooter?: boolean;
}

const InnerPageLayout = ({
  title,
  children,
  wrapperClassName,
  className,
  showFooter = true,
}: InnerPageLayoutProps) => {
  const navigateBack = useNavigateBack();
  return (
    <div className="flex flex-col min-h-dvh">
      {/* Header */}
      <AppHeader
        leftContent={
          <AppHeader.Button onClick={() => navigateBack()}>
            <HiOutlineArrowLeft className="size-6 text-neutral-400" />
          </AppHeader.Button>
        }
        middleContent={<h1 className="text-center font-bold">{title}</h1>}
      />

      {/* Main content area */}
      <MainContainer wrapperClassName={wrapperClassName} className={className}>
        {children}
      </MainContainer>

      {/* Footer */}
      {showFooter && <AppFooter />}
    </div>
  );
};

export { InnerPageLayout };
