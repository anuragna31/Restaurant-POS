import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

export interface PillTab<T extends string> {
  value: T;
  label: string;
}

export function PillTabs<T extends string>({
  value,
  tabs,
  onChange
}: {
  value: T;
  tabs: PillTab<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <Button
            key={t.value}
            onClick={() => onChange(t.value)}
            size="small"
            variant="text"
            sx={{
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              px: 1.5,
              py: 0.75,
              minHeight: 30,
              color: active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.55)",
              bgcolor: active ? "rgba(255,255,255,0.08)" : "transparent",
              border: active ? "1px solid rgba(255,255,255,0.12)" : "1px solid transparent",
              "&:hover": {
                bgcolor: active ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.04)"
              }
            }}
          >
            {t.label}
          </Button>
        );
      })}
    </Box>
  );
}

