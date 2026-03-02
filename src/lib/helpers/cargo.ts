import { type CargoStatus } from "@/lib/supabase/types";

const CARGO_STATUS_ORDER: CargoStatus[] = [
  "purchased",
  "packed",
  "shipped",
  "in_transit",
  "arrived",
  "distributed",
];

/** Check if a product linked to this cargo is a pre-order (cargo hasn't arrived yet). */
export function isPreOrder(cargoStatus: CargoStatus | null | undefined): boolean {
  if (!cargoStatus) return false;
  const idx = CARGO_STATUS_ORDER.indexOf(cargoStatus);
  const arrivedIdx = CARGO_STATUS_ORDER.indexOf("arrived");
  return idx < arrivedIdx;
}

/** Get the index of a cargo status for timeline rendering. */
export function getCargoStatusIndex(status: CargoStatus): number {
  return CARGO_STATUS_ORDER.indexOf(status);
}

/** Get human-readable label for a cargo status. */
export function getCargoStatusLabel(status: CargoStatus): string {
  const labels: Record<CargoStatus, string> = {
    purchased: "Purchased",
    packed: "Packed",
    shipped: "Shipped",
    in_transit: "In Transit",
    arrived: "Arrived in PH",
    distributed: "Distributed",
  };
  return labels[status];
}

/** Get the ordered list of all cargo statuses. */
export function getCargoStatusOrder(): CargoStatus[] {
  return [...CARGO_STATUS_ORDER];
}
