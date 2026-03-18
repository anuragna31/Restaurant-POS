import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { fetchTables } from "../../api/tables";
import { fetchMenuItems, MenuItemDto } from "../../api/menu";
import { http } from "../../api/http";
import { OrderDto } from "../../api/orders";

export const WaiterDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const { data, isLoading, isError } = useQuery({
    queryKey: ["tables"],
    queryFn: fetchTables
  });

  const tables = data ?? [];

  const ordersQ = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: async () => {
      const res = await http.get<OrderDto[]>("/orders", { params: { mine: 1, active: 1 } });
      return res.data;
    }
  });

  const menuQ = useQuery({
    queryKey: ["menuItems"],
    queryFn: fetchMenuItems
  });

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, number>>({});

  const selectedTable = tables.find((t) => t.id === selectedTableId) || null;
  const menuItems = (menuQ.data ?? []).filter((m) => Boolean(m.is_available));

  const grouped = useMemo(() => {
    return menuItems.reduce<Record<string, MenuItemDto[]>>((acc, item) => {
      const key = (item.category || "Menu").toUpperCase();
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const total = Object.entries(orderItems).reduce((sum, [id, qty]) => {
    const mi = menuItems.find((m) => m.id === id);
    const price = mi ? Number(mi.price) : 0;
    return sum + price * qty;
  }, 0);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <RestaurantMenuIcon sx={{ color: "rgba(255,255,255,0.65)" }} fontSize="small" />
          <Typography variant="subtitle1" fontWeight={800}>
            My Active Orders
          </Typography>
        </Box>
        <Paper
          sx={{
            p: 2,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)"
          }}
        >
          {ordersQ.isLoading ? (
            <Typography variant="body2" color="text.secondary">
              Loading…
            </Typography>
          ) : (ordersQ.data ?? []).length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
              No active orders
            </Typography>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
                gap: 2
              }}
            >
              {(ordersQ.data ?? []).map((o) => {
                const orderTotal = (o.items ?? []).reduce((sum, it) => {
                  return sum + Number(it.price_at_order) * it.quantity;
                }, 0);
                const chip =
                  o.status === "READY"
                    ? { label: "ready", bg: "rgba(34,197,94,0.16)", color: "#22c55e" }
                    : o.status === "PENDING"
                      ? { label: "pending", bg: "rgba(234,179,8,0.15)", color: "#fbbf24" }
                      : { label: o.status.toLowerCase(), bg: "rgba(59,130,246,0.15)", color: "#60a5fa" };
                return (
                <Paper
                  key={o.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.03)",
                    border: o.status === "READY" ? "1px solid rgba(34,197,94,0.35)" : "1px solid rgba(255,255,255,0.06)"
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between" }}>
                    <Box>
                      <Typography fontWeight={900}>Table {o.table_number ?? "—"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        #{o.id.slice(0, 8).toUpperCase()}
                      </Typography>
                    </Box>
                    <Chip
                      label={chip.label}
                      size="small"
                      sx={{
                        bgcolor: chip.bg,
                        color: chip.color,
                        border: "1px solid rgba(255,255,255,0.08)"
                      }}
                    />
                  </Box>
                  <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {(o.items ?? []).slice(0, 4).map((it) => (
                      <Box
                        key={it.id}
                        sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}
                      >
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)" }}>
                          {it.quantity}x {it.menu_item_name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.72)" }}>
                          ${(Number(it.price_at_order) * it.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 1.25 }} />
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      Total
                    </Typography>
                    <Typography fontWeight={900}>${orderTotal.toFixed(2)}</Typography>
                  </Box>

                  {o.status === "READY" ? (
                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        mt: 1.25,
                        textTransform: "none",
                        fontWeight: 900,
                        borderRadius: 1.5,
                        bgcolor: "rgba(34,197,94,0.18)",
                        color: "#22c55e",
                        border: "1px solid rgba(34,197,94,0.35)",
                        "&:hover": { bgcolor: "rgba(34,197,94,0.24)" }
                      }}
                      onClick={async () => {
                        await http.patch(`/orders/${o.id}/status`, { status: "SERVED" });
                        await ordersQ.refetch();
                      }}
                    >
                      Mark Served
                    </Button>
                  ) : null}
                </Paper>
              );
              })}
            </Box>
          )}
        </Paper>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <Typography variant="subtitle1" fontWeight={800}>
          Tables
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading tables…
          </Typography>
        </Box>
      ) : isError ? (
        <Alert severity="error" variant="outlined">
          Failed to load tables. Make sure you are logged in and the API is running.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {tables.map((t) => {
            const chip =
              t.status === "FREE"
                ? { label: "free", bg: "rgba(34,197,94,0.16)", color: "#22c55e" }
                : { label: "occupied", bg: "rgba(239,68,68,0.16)", color: "#ef4444" };
            return (
              <Grid key={t.id} item xs={6} sm={4} md={3}>
                <Paper
                  onClick={() => {
                    setSelectedTableId(t.id);
                    setOrderItems({});
                  }}
                  sx={{
                    p: 2,
                    height: 92,
                    borderRadius: 2,
                    cursor: "pointer",
                    bgcolor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    "&:hover": { borderColor: "rgba(255,255,255,0.14)" }
                  }}
                >
                  <Typography fontWeight={900} sx={{ textAlign: "center", fontSize: 18 }}>
                    {t.number}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center", display: "block" }}>
                    Seats: {t.seating_capacity}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                    <Chip
                      size="small"
                      label={chip.label}
                      sx={{
                        bgcolor: chip.bg,
                        color: chip.color,
                        fontWeight: 700,
                        border: "1px solid rgba(255,255,255,0.08)"
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog
        open={Boolean(selectedTable)}
        onClose={() => setSelectedTableId(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: "#111214",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden"
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
            <Typography fontWeight={900}>
              New Order - Table {selectedTable?.number}
            </Typography>
            <IconButton onClick={() => setSelectedTableId(null)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 0 }}>
            <Box
              sx={{
                p: 3,
                borderRight: { xs: "none", md: "1px solid rgba(255,255,255,0.06)" },
                borderBottom: { xs: "1px solid rgba(255,255,255,0.06)", md: "none" },
                minHeight: 420,
                maxHeight: { xs: "46vh", md: "unset" },
                overflow: { xs: "auto", md: "unset" }
              }}
            >
              <Typography fontWeight={800}>Menu</Typography>
              <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 2 }}>
                {Object.entries(grouped).map(([cat, items]) => (
                  <Box key={cat}>
                    <Typography variant="caption" color="text.secondary" fontWeight={800}>
                      {cat}
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 1 }}>
                      {items.map((m) => (
                        <Paper
                          key={m.id}
                          onClick={() =>
                            setOrderItems((prev) => ({ ...prev, [m.id]: (prev[m.id] || 0) + 1 }))
                          }
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            cursor: "pointer",
                            bgcolor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            "&:hover": { borderColor: "rgba(255,255,255,0.14)" }
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800} fontSize={13} noWrap>
                                {m.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap>
                                {m.description || ""}
                              </Typography>
                            </Box>
                            <Typography fontWeight={800} fontSize={13} sx={{ whiteSpace: "nowrap" }}>
                              ${Number(m.price).toFixed(2)}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                p: 3,
                minHeight: 420,
                display: "flex",
                flexDirection: "column",
                maxHeight: { xs: "54vh", md: "unset" }
              }}
            >
              <Typography fontWeight={800}>Order Items</Typography>
              <Box sx={{ mt: 1.5, flex: 1, overflow: "auto", pr: 0.5 }}>
                {Object.keys(orderItems).length === 0 ? (
                  <Box
                    sx={{
                      height: 260,
                      display: "grid",
                      placeItems: "center",
                      color: "rgba(255,255,255,0.35)"
                    }}
                  >
                    <Box sx={{ textAlign: "center" }}>
                      <Typography sx={{ fontSize: 46, lineHeight: 1 }}>🍴</Typography>
                      <Typography variant="body2" color="text.secondary">
                        No items added yet
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {Object.entries(orderItems).map(([id, qty]) => {
                      const mi = menuItems.find((m) => m.id === id);
                      if (!mi) return null;
                      return (
                        <Paper
                          key={id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            bgcolor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)"
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800} fontSize={13} noWrap>
                                {mi.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                ${Number(mi.price).toFixed(2)} each
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography fontWeight={800} fontSize={13}>
                                ${(Number(mi.price) * qty).toFixed(2)}
                              </Typography>
                              <Box
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  border: "1px solid rgba(255,255,255,0.10)",
                                  borderRadius: 999,
                                  px: 0.5
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setOrderItems((prev) => {
                                      const next = { ...prev };
                                      if (next[id] <= 1) delete next[id];
                                      else next[id] -= 1;
                                      return next;
                                    })
                                  }
                                >
                                  <RemoveIcon fontSize="inherit" />
                                </IconButton>
                                <Typography fontWeight={900} fontSize={13} sx={{ minWidth: 18, textAlign: "center" }}>
                                  {qty}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => setOrderItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }))}
                                >
                                  <AddIcon fontSize="inherit" />
                                </IconButton>
                              </Box>
                            </Box>
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </Box>
              <Box
                sx={{
                  pt: 2,
                  mt: 2,
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  background: isMobile ? "#111214" : "transparent",
                  position: isMobile ? "sticky" : "static",
                  bottom: 0
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography fontWeight={800}>Total</Typography>
                  <Typography fontWeight={900}>${total.toFixed(2)}</Typography>
                </Box>
                <Button
                  variant="contained"
                  disabled={!selectedTable || Object.keys(orderItems).length === 0}
                  sx={{
                    mt: 2,
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontWeight: 800,
                    py: 1.1,
                    bgcolor: "#3b34d6",
                    "&:hover": { bgcolor: "#2f2ac8" }
                  }}
                  onClick={async () => {
                    if (!selectedTable) return;
                    const items = Object.entries(orderItems).map(([menu_item_id, quantity]) => ({
                      menu_item_id,
                      quantity
                    }));
                    await http.post("/orders", { table_id: selectedTable.id, items });
                    setSelectedTableId(null);
                    await Promise.all([ordersQ.refetch(), menuQ.refetch()]);
                  }}
                >
                  Place Order
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};
