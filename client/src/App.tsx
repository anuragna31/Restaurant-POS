import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { WaiterDashboard } from "./pages/waiter/WaiterDashboard";
import { ChefDashboard } from "./pages/chef/ChefDashboard";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { LoginPage } from "./pages/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { getStoredUser, isAuthed } from "./auth/authStore";
import { useEffect } from "react";
import { getSocket } from "./rt/socket";
import { useQueryClient } from "@tanstack/react-query";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#060607",
      paper: "rgba(255,255,255,0.04)"
    },
    primary: {
      main: "#3b34d6"
    },
    secondary: {
      main: "#22c55e"
    }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none"
        }
      }
    }
  }
});

const RequireAuth = ({ children }: { children: JSX.Element }) => {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "mine"] });
    };
    socket.on("order:created", invalidate);
    socket.on("order:statusUpdated", invalidate);
    return () => {
      socket.off("order:created", invalidate);
      socket.off("order:statusUpdated", invalidate);
    };
  }, [queryClient]);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppShell>
        <Routes>
          <Route
            path="/"
            element={
              isAuthed() ? (
                <Navigate to={`/${(getStoredUser()?.role || "manager").toLowerCase()}`} replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/waiter"
            element={
              <RequireAuth>
                <WaiterDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/chef"
            element={
              <RequireAuth>
                <ChefDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/manager"
            element={
              <RequireAuth>
                <ManagerDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </AppShell>
    </ThemeProvider>
  );
}

export default App;
