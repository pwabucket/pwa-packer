import { Route, Routes } from "react-router";
import { Welcome } from "./pages/Welcome";
import { Dashboard } from "./pages/Dashboard";
import { AccountCreationPage } from "./pages/AccountCreationPage";
import { ProtectedRoutes } from "./routes/ProtectedRoutes";

function App() {
  return (
    <>
      <Routes>
        <Route index element={<Welcome />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts/new" element={<AccountCreationPage />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
