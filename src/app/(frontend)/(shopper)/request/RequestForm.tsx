"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Input, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

interface RequestFormProps {
  userId: string;
}

export default function RequestForm({ userId }: RequestFormProps) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [description, setDescription] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("product_requests").insert({
      customer_id: userId,
      product_name: productName.trim(),
      product_url: productUrl.trim() || null,
      description: description.trim() || null,
      budget_min_php: budgetMin ? Number.parseFloat(budgetMin) : null,
      budget_max_php: budgetMax ? Number.parseFloat(budgetMax) : null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setProductName("");
    setProductUrl("");
    setDescription("");
    setBudgetMin("");
    setBudgetMax("");
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
          Request submitted! We&apos;ll check availability and get back to you.
        </div>
      )}

      <Input
        label="Product Name"
        placeholder="e.g. CeraVe Moisturizing Cream 16oz"
        value={productName}
        onChange={(e) => setProductName(e.target.value)}
        required
      />

      <Input
        label="Product URL (optional)"
        placeholder="https://www.amazon.com/..."
        type="url"
        value={productUrl}
        onChange={(e) => setProductUrl(e.target.value)}
      />

      <Textarea
        label="Description (optional)"
        placeholder="Any details — size, color, variant, quantity, etc."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Budget Min (PHP)"
          type="number"
          placeholder="500"
          min={0}
          step="0.01"
          value={budgetMin}
          onChange={(e) => setBudgetMin(e.target.value)}
        />
        <Input
          label="Budget Max (PHP)"
          type="number"
          placeholder="2000"
          min={0}
          step="0.01"
          value={budgetMax}
          onChange={(e) => setBudgetMax(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={loading || !productName.trim()}>
        {loading ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
