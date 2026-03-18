import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { useQuery } from "@tanstack/react-query";
import { createTable, deleteTable, fetchTables, updateTable } from "../../api/tables";
import { fetchOrders } from "../../api/orders";
import { PillTabs } from "../../components/ui/PillTabs";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  updateMenuItem
} from "../../api/menu";
import { fetchUsers } from "../../api/users";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";

export const ManagerDashboard = () => {
  const [tab, setTab] = useState<"overview" | "tables" | "menu" | "staff">("overview");

  const tablesQ = useQuery({ queryKey: ["tables"], queryFn: fetchTables });
  const ordersQ = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  const menuQ = useQuery({ queryKey: ["menuItems"], queryFn: fetchMenuItems });
  const usersQ = useQuery({ queryKey: ["users"], queryFn: () => fetchUsers() });

  const loading = tablesQ.isLoading || ordersQ.isLoading || menuQ.isLoading || usersQ.isLoading;
  const error = tablesQ.isError || ordersQ.isError || menuQ.isError || usersQ.isError;

  const tables = tablesQ.data ?? [];
  const orders = ordersQ.data ?? [];
  const menuItems = menuQ.data ?? [];
  const users = usersQ.data ?? [];
  const waiters = users.filter((u) => u.role === "WAITER");

  const totalTables = tables.length;
  const activeTables = tables.filter((t) => t.status !== "FREE").length;
  const availableTables = tables.filter((t) => t.status === "FREE").length;

  const activeOrders = orders.filter((o) => ["PENDING", "IN_PROGRESS", "READY"].includes(o.status)).length;

  const revenueToday = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter((o) => new Date(o.created_at) >= startOfDay && o.status !== "CANCELLED");
    return todayOrders.reduce((sum, o) => {
      const orderTotal = (o.items ?? []).reduce((s, it) => s + Number(it.price_at_order) * it.quantity, 0);
      return sum + orderTotal;
    }, 0);
  }, [orders]);

  const waiterPerformance = useMemo(() => {
    const byWaiter = new Map<string, { name: string; orders: number; revenue: number }>();
    for (const o of orders) {
      const key = o.waiter_id;
      const name = o.waiter_name || o.waiter_username || "Waiter";
      const revenue = (o.items ?? []).reduce((s, it) => s + Number(it.price_at_order) * it.quantity, 0);
      const prev = byWaiter.get(key) || { name, orders: 0, revenue: 0 };
      prev.name = name;
      prev.orders += 1;
      prev.revenue += revenue;
      byWaiter.set(key, prev);
    }
    return Array.from(byWaiter.values()).sort((a, b) => b.revenue - a.revenue);
  }, [orders]);

  const [addTableOpen, setAddTableOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState<number>(totalTables + 1 || 1);
  const [newTableCapacity, setNewTableCapacity] = useState<number>(2);

  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [menuCategory, setMenuCategory] = useState("");
  const [menuPrice, setMenuPrice] = useState<number>(0);
  const [menuDescription, setMenuDescription] = useState("");
  const [menuImageUrl, setMenuImageUrl] = useState("");
  const [menuAvailable, setMenuAvailable] = useState(true);

  const groupedMenu = useMemo(() => {
    const by = new Map<string, typeof menuItems>();
    for (const m of menuItems) {
      const key = m.category || "Menu";
      by.set(key, [...(by.get(key) || []), m]);
    }
    return Array.from(by.entries());
  }, [menuItems]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <PillTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "overview", label: "Overview" },
          { value: "tables", label: "Tables" },
          { value: "menu", label: "Menu" },
          { value: "staff", label: "Staff" }
        ]}
      />

      {loading ? (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2" color="text.secondary">
            Loading dashboard…
          </Typography>
        </Box>
      ) : null}
      {error ? (
        <Alert severity="error" variant="outlined">
          Failed to load dashboard metrics. Make sure you are logged in and the API is running.
        </Alert>
      ) : null}

      {tab === "overview" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Today's Revenue
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                  ${revenueToday.toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {orders.filter((o) => o.status === "SERVED").length} orders completed
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Active Orders
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                  {activeOrders}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={3}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)"
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={800}>
                  Tables Status
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ mt: 0.5 }}>
                  {activeTables}/{totalTables || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {availableTables} available
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper
            sx={{
              p: 2.5,
              borderRadius: 2,
              bgcolor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <Typography fontWeight={900}>Waiter Performance</Typography>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", my: 1.5 }} />
            {waiterPerformance.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No orders yet.
              </Typography>
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                {waiterPerformance.slice(0, 6).map((w) => (
                  <Box key={w.name} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <Box>
                      <Typography fontWeight={900}>{w.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {w.orders} orders
                      </Typography>
                    </Box>
                    <Typography fontWeight={900}>${w.revenue.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      ) : null}

      {tab === "tables" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography fontWeight={900}>Table Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setNewTableNumber(totalTables + 1 || 1);
                setNewTableCapacity(2);
                setAddTableOpen(true);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: 1.5,
                bgcolor: "#6d28d9",
                "&:hover": { bgcolor: "#5b21b6" }
              }}
            >
              Add Table
            </Button>
          </Box>

          <Grid container spacing={2}>
            {tables.map((t) => {
              const statusChip =
                t.status === "FREE"
                  ? { label: "free", bg: "rgba(34,197,94,0.16)", color: "#22c55e" }
                  : { label: "occupied", bg: "rgba(239,68,68,0.16)", color: "#ef4444" };
              return (
                <Grid key={t.id} item xs={12} md={4}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)"
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                      <Box>
                        <Typography fontWeight={900}>Table {t.number}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Capacity: {t.seating_capacity}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={async () => {
                          await deleteTable(t.id);
                          await tablesQ.refetch();
                        }}
                        sx={{
                          borderRadius: 1,
                          border: "1px solid rgba(239,68,68,0.25)",
                          color: "rgba(239,68,68,0.9)"
                        }}
                      >
                        <DeleteIcon fontSize="inherit" />
                      </IconButton>
                    </Box>

                    <Box sx={{ mt: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Status
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            size="small"
                            label={statusChip.label}
                            sx={{
                              bgcolor: statusChip.bg,
                              color: statusChip.color,
                              fontWeight: 800,
                              border: "1px solid rgba(255,255,255,0.08)"
                            }}
                          />
                        </Box>
                      </Box>

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Assigned Waiter
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 0.75 }}>
                          <Select
                            value={t.assigned_waiter_id || ""}
                            displayEmpty
                            onChange={async (e) => {
                              const v = String(e.target.value || "");
                              await updateTable(t.id, { assigned_waiter_id: v ? v : null });
                              await tablesQ.refetch();
                            }}
                            sx={{
                              bgcolor: "rgba(255,255,255,0.03)",
                              borderRadius: 1.5
                            }}
                          >
                            <MenuItem value="">
                              <em>Select waiter</em>
                            </MenuItem>
                            {waiters.map((w) => (
                              <MenuItem key={w.id} value={w.id}>
                                {w.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              );
            })}
          </Grid>

          <Dialog
            open={addTableOpen}
            onClose={() => setAddTableOpen(false)}
            maxWidth="xs"
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2 }}>
                <Typography fontWeight={900}>Add Table</Typography>
                <IconButton size="small" onClick={() => setAddTableOpen(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField
                  label="Table Number"
                  size="small"
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(Number(e.target.value))}
                />
                <TextField
                  label="Capacity"
                  size="small"
                  type="number"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                />
                <Button
                  variant="contained"
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 1.5,
                    bgcolor: "#6d28d9",
                    "&:hover": { bgcolor: "#5b21b6" }
                  }}
                  onClick={async () => {
                    await createTable({ number: newTableNumber, seating_capacity: newTableCapacity });
                    setAddTableOpen(false);
                    await tablesQ.refetch();
                  }}
                >
                  Create Table
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      ) : null}

      {tab === "menu" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography fontWeight={900}>Menu Management</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingMenuId(null);
                setMenuName("");
                setMenuCategory("");
                setMenuPrice(0);
                setMenuDescription("");
                setMenuImageUrl("");
                setMenuAvailable(true);
                setMenuModalOpen(true);
              }}
              sx={{
                textTransform: "none",
                fontWeight: 900,
                borderRadius: 1.5,
                bgcolor: "#6d28d9",
                "&:hover": { bgcolor: "#5b21b6" }
              }}
            >
              Add Menu Item
            </Button>
          </Box>

          {groupedMenu.map(([cat, items]) => (
            <Box key={cat} sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="subtitle2" color="text.secondary" fontWeight={900}>
                {cat}
              </Typography>
              <Grid container spacing={2}>
                {items.map((m) => {
                  const available = Boolean(m.is_available);
                  return (
                    <Grid key={m.id} item xs={12} md={4}>
                      <Paper
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)"
                        }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap>
                              {m.name}
                            </Typography>
                            <Typography variant="h6" fontWeight={900} sx={{ mt: 0.25 }}>
                              ${Number(m.price).toFixed(2)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingMenuId(m.id);
                                setMenuName(m.name);
                                setMenuCategory(m.category || "");
                                setMenuPrice(Number(m.price));
                                setMenuDescription(m.description || "");
                                setMenuImageUrl(m.image_url || "");
                                setMenuAvailable(Boolean(m.is_available));
                                setMenuModalOpen(true);
                              }}
                              sx={{
                                borderRadius: 1,
                                border: "1px solid rgba(255,255,255,0.10)",
                                color: "rgba(255,255,255,0.75)"
                              }}
                            >
                              <EditIcon fontSize="inherit" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={async () => {
                                await deleteMenuItem(m.id);
                                await menuQ.refetch();
                              }}
                              sx={{
                                borderRadius: 1,
                                border: "1px solid rgba(239,68,68,0.25)",
                                color: "rgba(239,68,68,0.9)"
                              }}
                            >
                              <DeleteIcon fontSize="inherit" />
                            </IconButton>
                          </Box>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: "block" }}>
                          {m.description || ""}
                        </Typography>
                        <Box sx={{ mt: 1.25 }}>
                          <Chip
                            size="small"
                            label={available ? "Available" : "Unavailable"}
                            sx={{
                              bgcolor: available ? "rgba(34,197,94,0.16)" : "rgba(239,68,68,0.16)",
                              color: available ? "#22c55e" : "#ef4444",
                              fontWeight: 900,
                              border: "1px solid rgba(255,255,255,0.08)"
                            }}
                          />
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          ))}

          <Dialog
            open={menuModalOpen}
            onClose={() => setMenuModalOpen(false)}
            maxWidth="xs"
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 3, py: 2 }}>
                <Typography fontWeight={900}>{editingMenuId ? "Edit Menu Item" : "Add Menu Item"}</Typography>
                <IconButton size="small" onClick={() => setMenuModalOpen(false)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)" }} />
              <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
                <TextField label="Name" size="small" value={menuName} onChange={(e) => setMenuName(e.target.value)} />
                <TextField
                  label="Category"
                  size="small"
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value)}
                />
                <TextField
                  label="Price"
                  size="small"
                  type="number"
                  value={menuPrice}
                  onChange={(e) => setMenuPrice(Number(e.target.value))}
                />
                <TextField
                  label="Description"
                  size="small"
                  value={menuDescription}
                  onChange={(e) => setMenuDescription(e.target.value)}
                />
                <TextField
                  label="Image URL"
                  size="small"
                  value={menuImageUrl}
                  onChange={(e) => setMenuImageUrl(e.target.value)}
                />
                <FormControlLabel
                  control={<Checkbox checked={menuAvailable} onChange={(e) => setMenuAvailable(e.target.checked)} />}
                  label={<Typography variant="caption">Available</Typography>}
                />
                <Button
                  variant="contained"
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    fontWeight: 900,
                    borderRadius: 1.5,
                    bgcolor: "#6d28d9",
                    "&:hover": { bgcolor: "#5b21b6" }
                  }}
                  onClick={async () => {
                    const payload = {
                      name: menuName,
                      category: menuCategory,
                      price: menuPrice,
                      description: menuDescription,
                      image_url: menuImageUrl,
                      is_available: menuAvailable
                    };
                    if (editingMenuId) await updateMenuItem(editingMenuId, payload);
                    else await createMenuItem(payload);
                    setMenuModalOpen(false);
                    await menuQ.refetch();
                  }}
                >
                  {editingMenuId ? "Save Changes" : "Create Item"}
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      ) : null}

      {tab === "staff" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography fontWeight={900}>Staff Directory</Typography>
          <Grid container spacing={2}>
            {users.map((u) => {
              const initial = u.name?.[0]?.toUpperCase() || "U";
              return (
                <Grid key={u.id} item xs={12} md={6}>
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      display: "flex",
                      alignItems: "center",
                      gap: 2
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        bgcolor: "rgba(109,40,217,0.35)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 900
                      }}
                    >
                      {initial}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>
                        {u.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {u.email}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {u.role.toLowerCase()}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={u.role.toLowerCase()}
                      sx={{
                        bgcolor: "rgba(109,40,217,0.18)",
                        color: "rgba(203,213,255,0.95)",
                        border: "1px solid rgba(109,40,217,0.35)",
                        fontWeight: 900
                      }}
                    />
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ) : null}
    </Box>
  );
};
