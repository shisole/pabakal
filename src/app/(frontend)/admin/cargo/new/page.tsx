"use client";

import { useState } from "react";

import { Breadcrumbs } from "@/components/layout";
import { Button, Input, Textarea } from "@/components/ui";

export default function NewCargoPage() {
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    shipping_provider: "",
    tracking_number: "",
    total_shipping_cost_php: "",
    estimated_arrival: "",
    notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      shipping_provider: form.shipping_provider || null,
      tracking_number: form.tracking_number || null,
      total_shipping_cost_php: Number.parseFloat(form.total_shipping_cost_php) || 0,
      estimated_arrival: form.estimated_arrival || null,
      notes: form.notes || null,
    };

    console.log("Creating cargo:", payload);
    // TODO: POST to /api/cargo
    setSubmitting(false);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Cargo", href: "/admin/cargo" },
          { label: "New Cargo" },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        New Cargo Shipment
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="name"
          name="name"
          label="Cargo Name"
          value={form.name}
          onChange={handleChange}
          required
          placeholder='e.g., "Box #12 - March 2026"'
        />

        <Input
          id="shipping_provider"
          name="shipping_provider"
          label="Shipping Provider"
          value={form.shipping_provider}
          onChange={handleChange}
          placeholder="e.g., LBC, JRS, Forex Cargo"
        />

        <Input
          id="tracking_number"
          name="tracking_number"
          label="Tracking Number"
          value={form.tracking_number}
          onChange={handleChange}
          placeholder="Enter tracking number"
        />

        <Input
          id="total_shipping_cost_php"
          name="total_shipping_cost_php"
          label="Total Shipping Cost (PHP)"
          type="number"
          step="0.01"
          min="0"
          value={form.total_shipping_cost_php}
          onChange={handleChange}
          placeholder="0.00"
        />

        <Input
          id="estimated_arrival"
          name="estimated_arrival"
          label="Estimated Arrival"
          type="date"
          value={form.estimated_arrival}
          onChange={handleChange}
        />

        <Textarea
          id="notes"
          name="notes"
          label="Notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Any additional notes about this cargo"
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Cargo"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => globalThis.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
