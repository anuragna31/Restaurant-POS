import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { Routes, Route, Navigate } from "react-router-dom";
import { WaiterDashboard } from "./pages/waiter/WaiterDashboard";
import { ChefDashboard } from "./pages/chef/ChefDashboard";
import { ManagerDashboard } from "./pages/manager/ManagerDashboard";
import { LoginPage } from "./pages/auth/LoginPage";
import { AppShell } from "./components/layout/AppShell";
import { getStoredUser, isAuthed, Role } from "./auth/authStore";
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

const RequireRole = ({ children, role }: { children: JSX.Element; role: Role }) => {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  const user = getStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return children;
};

function App() {
  const queryClient = useQueryClient();
  const authed = isAuthed();

  useEffect(() => {
    if (!authed) return;
    const socket = getSocket();
    socket.auth = { token: localStorage.getItem("token") || "" };
    if (!socket.connected) socket.connect();
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "active"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };
    socket.on("order:created", invalidate);
    socket.on("order:statusUpdated", invalidate);
    socket.on("kitchen:alert", invalidate);
    socket.on("notification:created", invalidate);
    return () => {
      socket.off("order:created", invalidate);
      socket.off("order:statusUpdated", invalidate);
      socket.off("kitchen:alert", invalidate);
      socket.off("notification:created", invalidate);
    };
  }, [queryClient, authed]);

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
              <RequireRole role="WAITER">
                <WaiterDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/chef"
            element={
              <RequireRole role="CHEF">
                <ChefDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/manager"
            element={
              <RequireRole role="MANAGER">
                <ManagerDashboard />
              </RequireRole>
            }
          />
        </Routes>
      </AppShell>
    </ThemeProvider>
  );
}

export default App;
