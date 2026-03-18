import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import { useQuery } from "@tanstack/react-query";
import { http } from "../../api/http";

export const ChefDashboard = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["orders", "active"],
    queryFn: async () => {
      const res = await http.get("/orders", { params: { active: 1 } });
      return res.data;
    }
  });

  const orders = data ?? [];
  const pending = orders.filter((o: any) => o.status === "PENDING");
  const inProgress = orders.filter((o: any) => o.status === "IN_PROGRESS");
  const ready = orders.filter((o: any) => o.status === "READY");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle1" fontWeight={900}>
          Active Orders
        </Typography>
        <Typography variant="subtitle1" fontWeight={900}>
          {orders.length}
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading orders…
          </Typography>
        </Box>
      ) : isError ? (
        <Alert severity="error" variant="outlined">
          Failed to load orders. Make sure you are logged in and the API is running.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {[
            { title: "Pending", count: pending.length, items: pending, accent: "#fbbf24" },
            { title: "In Progress", count: inProgress.length, items: inProgress, accent: "#60a5fa" },
            { title: "Ready for Pickup", count: ready.length, items: ready, accent: "#22c55e" }
          ].map((col) => (
            <Grid key={col.title} item xs={12} md={4}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  {col.title}
                </Typography>
                <Chip
                  size="small"
                  label={col.count}
                  sx={{
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: col.accent,
                    fontWeight: 800
                  }}
                />
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {col.items.map((o: any) => (
                  <Paper
                    key={o.id}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: `1px solid ${col.accent}55`
                    }}
                  >
                    <Typography fontWeight={900}>Table {o.table_number ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Waiter: {o.waiter_name || o.waiter_username || "—"}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {(o.items ?? []).map((it: any) => (
                        <Typography key={it.id} variant="body2">
                          {it.quantity}x {it.menu_item_name}
                        </Typography>
                      ))}
                    </Box>
                    {o.status === "PENDING" ? (
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, textTransform: "none", fontWeight: 800, borderRadius: 1.5 }}
                        onClick={async () => {
                          await http.patch(`/orders/${o.id}/status`, { status: "IN_PROGRESS" });
                          await refetch();
                        }}
                      >
                        Start Cooking
                      </Button>
                    ) : o.status === "IN_PROGRESS" ? (
                      <Button
                        fullWidth
                        variant="contained"
                        sx={{
                          mt: 2,
                          textTransform: "none",
                          fontWeight: 800,
                          borderRadius: 1.5,
                          bgcolor: "rgba(34,197,94,0.18)",
                          color: "#22c55e",
                          border: "1px solid rgba(34,197,94,0.35)",
                          "&:hover": { bgcolor: "rgba(34,197,94,0.24)" }
                        }}
                        onClick={async () => {
                          await http.patch(`/orders/${o.id}/status`, { status: "READY" });
                          await refetch();
                        }}
                      >
                        Mark Ready
                      </Button>
                    ) : o.status === "READY" ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        sx={{
                          mt: 2,
                          textTransform: "none",
                          fontWeight: 800,
                          borderRadius: 1.5,
                          borderColor: "rgba(255,255,255,0.14)",
                          color: "rgba(255,255,255,0.85)",
                          "&:hover": { borderColor: "rgba(255,255,255,0.28)" }
                        }}
                        onClick={async () => {
                          await http.patch(`/orders/${o.id}/status`, { status: "SERVED" });
                          await refetch();
                        }}
                      >
                        Mark Picked Up
                      </Button>
                    ) : null}
                  </Paper>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
