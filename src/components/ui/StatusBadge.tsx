import Badge from "./Badge";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, StatusConfig>;
  className?: string;
}

const orderStatusMap: Record<string, StatusConfig> = {
  pending: { label: "Pending", variant: "warning" },
  confirmed: { label: "Confirmed", variant: "info" },
  processing: { label: "Processing", variant: "info" },
  shipped: { label: "Shipped", variant: "info" },
  delivered: { label: "Delivered", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

const paymentStatusMap: Record<string, StatusConfig> = {
  pending: { label: "Pending", variant: "warning" },
  submitted: { label: "Submitted", variant: "info" },
  verified: { label: "Verified", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

const cargoStatusMap: Record<string, StatusConfig> = {
  preparing: { label: "Preparing", variant: "default" },
  shipped: { label: "Shipped", variant: "info" },
  in_transit: { label: "In Transit", variant: "warning" },
  customs: { label: "Customs", variant: "warning" },
  arrived: { label: "Arrived", variant: "success" },
  delivered: { label: "Delivered", variant: "success" },
};

const productStatusMap: Record<string, StatusConfig> = {
  draft: { label: "Draft", variant: "default" },
  active: { label: "Active", variant: "success" },
  archived: { label: "Archived", variant: "danger" },
  out_of_stock: { label: "Out of Stock", variant: "warning" },
};

const requestStatusMap: Record<string, StatusConfig> = {
  pending: { label: "Pending", variant: "warning" },
  reviewing: { label: "Reviewing", variant: "info" },
  available: { label: "Available", variant: "success" },
  unavailable: { label: "Unavailable", variant: "danger" },
  closed: { label: "Closed", variant: "default" },
};

export const builtInStatusMaps = {
  order: orderStatusMap,
  payment: paymentStatusMap,
  cargo: cargoStatusMap,
  product: productStatusMap,
  request: requestStatusMap,
};

const defaultStatusMap: Record<string, StatusConfig> = {
  ...orderStatusMap,
  ...paymentStatusMap,
  ...cargoStatusMap,
  ...productStatusMap,
  ...requestStatusMap,
};

export default function StatusBadge({ status, statusMap, className }: StatusBadgeProps) {
  const map = statusMap ?? defaultStatusMap;
  const config = map[status];

  return (
    <Badge variant={config?.variant ?? "default"} className={className}>
      {config?.label ?? status}
    </Badge>
  );
}
