import React from "react";
import { Route, Routes } from "react-router-dom";
import DashBoard from "./pages/DashBoard";
import Auth from "./pages/Auth";
import WorkspaceDetail from "./pages/WorkspaceDetail";
import AcceptInvite from "./pages/AcceptInvite";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <>
      <Routes>
        <Route path={"/"} element={<Auth />} />
        <Route
          path={"/dashboard"}
          element={
            <ProtectedRoute>
              <DashBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path={"/workspace/:workspaceId"}
          element={
            <ProtectedRoute>
              <WorkspaceDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={"/accept-invite/:token"}
          element={<AcceptInvite />}
        />
      </Routes>
    </>
  );
};

export default App;
