import { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Badge from "@mui/material/Badge";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import { useLocation, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../auth/authStore";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "../../api/notifications";

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
  const [notifOpen, setNotifOpen] = useState(false);
  const isLogin = location.pathname.startsWith("/login");
  const notificationsQ = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    enabled: !isLogin
  });
  const notifications = notificationsQ.data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setNotifOpen(true)}
                sx={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "rgba(255,255,255,0.85)",
                  borderRadius: 1.5
                }}
              >
                <Badge color="error" badgeContent={unreadCount} max={99}>
                  <NotificationsNoneIcon fontSize="small" />
                </Badge>
              </IconButton>
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
        </Box>
      ) : null}

      <Box sx={{ px: { xs: 2, md: 4 }, py: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>{children}</Box>
      </Box>
      <Dialog
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: "#111214",
            border: "1px solid rgba(255,255,255,0.08)"
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography fontWeight={900}>Notifications</Typography>
            <Button
              size="small"
              onClick={async () => {
                await markAllNotificationsRead();
                await notificationsQ.refetch();
              }}
            >
              Mark all read
            </Button>
          </Box>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, maxHeight: 420, overflow: "auto" }}>
            {notifications.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No notifications yet.
              </Typography>
            ) : (
              notifications.map((n) => (
                <Box
                  key={n.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: "1px solid rgba(255,255,255,0.08)",
                    bgcolor: n.is_read ? "rgba(255,255,255,0.02)" : "rgba(109,40,217,0.12)"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                    <Typography fontWeight={800}>{n.title}</Typography>
                    {!n.is_read ? <Chip label="new" size="small" color="secondary" /> : null}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {n.body}
                  </Typography>
                  {!n.is_read ? (
                    <Button
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={async () => {
                        await markNotificationRead(n.id);
                        await notificationsQ.refetch();
                      }}
                    >
                      Mark read
                    </Button>
                  ) : null}
                </Box>
              ))
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

