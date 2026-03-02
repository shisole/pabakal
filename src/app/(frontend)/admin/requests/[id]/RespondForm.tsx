"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Select, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { type RequestStatus } from "@/lib/supabase/types";

interface RespondFormProps {
  requestId: string;
  adminId: string;
  currentStatus: RequestStatus;
  currentResponse: string | null;
  currentEstimatedPrice: number | null;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewing", label: "Reviewing" },
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "closed", label: "Closed" },
];

export default function RespondForm({
  requestId,
  adminId,
  currentStatus,
  currentResponse,
  currentEstimatedPrice,
}: RespondFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [response, setResponse] = useState(currentResponse ?? "");
  const [estimatedPrice, setEstimatedPrice] = useState(currentEstimatedPrice?.toString() ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("product_requests")
      .update({
        status,
        admin_response: response.trim() || null,
        estimated_price_php: estimatedPrice ? Number.parseFloat(estimatedPrice) : null,
        responded_by: adminId,
        responded_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600 dark:bg-green-950 dark:text-green-400">
          Response saved successfully.
        </div>
      )}

      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(e) => setStatus(e.target.value as RequestStatus)}
      />

      <Textarea
        label="Response"
        placeholder="Write your response to the customer..."
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        rows={4}
      />

      <Input
        label="Estimated Price (PHP)"
        type="number"
        placeholder="1500"
        min={0}
        step="0.01"
        value={estimatedPrice}
        onChange={(e) => setEstimatedPrice(e.target.value)}
      />

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Response"}
      </Button>
    </form>
  );
}
