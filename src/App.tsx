import { Route, Routes } from "react-router";
import { Welcome } from "./pages/Welcome";
import { Dashboard } from "./pages/Dashboard";
import { AccountCreationPage } from "./pages/AccountCreationPage";
import { ProtectedRoutes } from "./routes/ProtectedRoutes";
import { AccountEditPage } from "./pages/AccountEditPage";
import { Withdraw } from "./pages/Withdraw";
import { Send } from "./pages/Send";
import { Split } from "./pages/Split";
import { useInactivity } from "./hooks/useInactivity";
import { Toaster } from "react-hot-toast";
import { Restore } from "./pages/Restore";
import { Password } from "./pages/Password";
import { Validate } from "./pages/Validate";
import { useAppStore } from "./store/useAppStore";
import { useWakeLock } from "./hooks/useWakeLock";
import { useIsMutating } from "@tanstack/react-query";
import { usePendingActivity } from "./hooks/usePendingActivity";
import { UpdateURLs } from "./pages/UpdateURLs";
import { Pack } from "./pages/Pack";
import { useAnalytics } from "./hooks/useAnalytics";

const INACTIVITY_DURATION = 1 * 60 * 1000;

function App() {
  const isProcessing = useAppStore((state) => state.isProcessing);
  const isMutating = useIsMutating();

  /* Wake Lock Hook */
  useWakeLock(isProcessing);

  /* Inactivity Hook */
  useInactivity(INACTIVITY_DURATION);

  /* Set Pending Activity Based on Mutations */
  usePendingActivity(isMutating > 0);

  /* Register analytics */
  useAnalytics();

  return (
    <>
      <Routes>
        <Route index element={<Welcome />} />
        <Route path="restore" element={<Restore />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts/new" element={<AccountCreationPage />} />
          <Route
            path="accounts/edit/:accountId"
            element={<AccountEditPage />}
          />
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="send" element={<Send />} />
          <Route path="split" element={<Split />} />
          <Route path="password" element={<Password />} />
          <Route path="update-urls" element={<UpdateURLs />} />
          <Route path="validate" element={<Validate />} />
          <Route path="pack" element={<Pack />} />
        </Route>
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          className: "font-mono text-sm",
        }}
      />
    </>
  );
}

export default App;
