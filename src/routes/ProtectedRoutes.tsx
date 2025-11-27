import { Outlet } from "react-router";
import { cn } from "../lib/utils";
import { Auth } from "../components/Auth";
import { Dialog } from "radix-ui";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";

const ProtectedRoutes = () => {
  const isAuthenticated = useIsAuthenticated();

  return (
    <>
      {/* Protected Routes */}
      <Outlet />

      {/* Authentication Dialog */}
      {!isAuthenticated && (
        <Dialog.Root open={true}>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 bg-neutral-950",
              "overflow-auto z-100"
            )}
          >
            <Dialog.Content onOpenAutoFocus={(ev) => ev.preventDefault()}>
              <Dialog.Title className="sr-only">
                Authentication Required
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Please log in to access the application.
              </Dialog.Description>
              <Auth />
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Root>
      )}
    </>
  );
};

export { ProtectedRoutes };
