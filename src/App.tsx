import { Route, Routes } from "react-router";
import { Welcome } from "./pages/Welcome";
import { Dashboard } from "./pages/Dashboard";
import { AccountCreationPage } from "./pages/AccountCreationPage";
import { ProtectedRoutes } from "./routes/ProtectedRoutes";
import { AccountEditPage } from "./pages/AccountEditPage";
import { Withdraw } from "./pages/Withdraw";
import { Send } from "./pages/Send";
import { Gas } from "./pages/Gas";

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
          <Route path="withdraw" element={<Withdraw />} />
          <Route path="send" element={<Send />} />
          <Route path="gas" element={<Gas />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
