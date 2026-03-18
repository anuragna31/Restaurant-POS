import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../auth/authStore";

interface Props {
  children: ReactNode;
}

function titleForPath(pathname: string) {
  if (pathname.startsWith("/manager")) return "Manager Dashboard";
  if (pathname.startsWith("/waiter")) return "Waiter Dashboard";
  if (pathname.startsWith("/chef")) return "Kitchen Display";
  return "Restaurant POS";
}

export const AppShell = ({ children }: Props) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const isLogin = location.pathname.startsWith("/login");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#060607",
        backgroundImage:
          "radial-gradient(1200px 400px at 50% -10%, rgba(255,255,255,0.08), rgba(255,255,255,0) 60%)",
        color: "text.primary"
      }}
    >
      {!isLogin ? (
        <Box
          sx={{
            px: { xs: 2, md: 4 },
            py: 2,
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                {titleForPath(location.pathname)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.name || ""}
              </Typography>
            </Box>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                logout();
                navigate("/login");
              }}
              sx={{
                borderColor: "rgba(255,255,255,0.14)",
                color: "rgba(255,255,255,0.85)",
                textTransform: "none",
                borderRadius: 1.5,
                px: 1.5,
                py: 0.5,
                "&:hover": { borderColor: "rgba(255,255,255,0.28)" }
              }}
            >
              Logout
            </Button>
          </Box>
        </Box>
      ) : null}

      <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
      </Box>
    </Box>
  );
};

