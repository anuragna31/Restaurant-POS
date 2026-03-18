import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { login } from "../../api/auth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("manager");
  const [password, setPassword] = useState("manager123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <Box sx={{ display: "grid", placeItems: "center", minHeight: "calc(100vh - 24px)" }}>
      <Paper
        sx={{
          width: "min(420px, 94vw)",
          p: 3,
          borderRadius: 2,
          bgcolor: "#020617",
          border: "1px solid",
          borderColor: "divider"
        }}
      >
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.2 }}>
          Restaurant POS
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25 }}>
          Sign in to continue
        </Typography>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
          Login
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Enter your credentials to access your dashboard
        </Typography>

        <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
          {error ? (
            <Alert severity="error" variant="outlined">
              {error}
            </Alert>
          ) : null}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            size="small"
          />
          <TextField
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            size="small"
          />

          <Button
            variant="contained"
            disabled={loading}
            onClick={async () => {
              setError(null);
              setLoading(true);
              try {
                const res = await login(username, password);
                localStorage.setItem("token", res.token);
                localStorage.setItem("user", JSON.stringify(res.user));
                navigate(`/${(res.user.role || "MANAGER").toLowerCase()}`);
              } catch (e: any) {
                setError(e?.response?.data?.message || "Login failed");
              } finally {
                setLoading(false);
              }
            }}
            sx={{ mt: 0.5 }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          <Paper
            variant="outlined"
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "rgba(255,255,255,0.03)",
              borderColor: "divider"
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              Demo Credentials:
            </Typography>
            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Waiter: <span style={{ color: "white" }}>waiter1</span> /{" "}
                <span style={{ color: "white" }}>waiter123</span>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Chef: <span style={{ color: "white" }}>chef</span> / <span style={{ color: "white" }}>chef123</span>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manager: <span style={{ color: "white" }}>manager</span> /{" "}
                <span style={{ color: "white" }}>manager123</span>
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
};

