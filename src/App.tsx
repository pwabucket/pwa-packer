import { Route, Routes } from "react-router";
import { Welcome } from "./pages/Welcome";
import { Dashboard } from "./pages/Dashboard";
import { AccountCreationPage } from "./pages/AccountCreationPage";
import { ProtectedRoutes } from "./routes/ProtectedRoutes";
import { AccountEditPage } from "./pages/AccountEditPage";

function App() {
  return (
    <>
      <Routes>
        <Route index element={<Welcome />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts/new" element={<AccountCreationPage />} />
          <Route
            path="accounts/edit/:accountId"
            element={<AccountEditPage />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
