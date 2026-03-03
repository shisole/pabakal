"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button, Input, Textarea } from "@/components/ui";
import { formatPhp, formatUsd, usdToPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/client";

interface RequestFormProps {
  userId: string;
}

/** Default rate used while the real one loads or if fetch fails. */
const FALLBACK_RATE = 56.5;
/** Shipping & handling fee as a percentage of the converted PHP price. */
const SERVICE_FEE_PCT = 0.15;
/** Estimated per-item shipping allocation in PHP. */
const SHIPPING_ALLOC_PHP = 150;

export default function RequestForm({ userId }: RequestFormProps) {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [description, setDescription] = useState("");
  const [sourcePrice, setSourcePrice] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(FALLBACK_RATE);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("exchange_rates")
      .select("rate")
      .order("effective_date", { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data?.rate) setExchangeRate(data.rate);
      });
  }, []);

  const breakdown = useMemo(() => {
    const usd = Number.parseFloat(sourcePrice);
    if (!usd || usd <= 0) return null;
    const convertedPhp = usdToPhp(usd, exchangeRate);
    const serviceFee = Math.round(convertedPhp * SERVICE_FEE_PCT);
    const total = Math.round(convertedPhp + serviceFee + SHIPPING_ALLOC_PHP);
    return { usd, convertedPhp, serviceFee, shippingAlloc: SHIPPING_ALLOC_PHP, total };
  }, [sourcePrice, exchangeRate]);

  const toggleBreakdown = useCallback(() => setShowBreakdown((v) => !v), []);

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
      source_price_usd: sourcePrice ? Number.parseFloat(sourcePrice) : null,
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
    setSourcePrice("");
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

      <div>
        <Input
          label="Price on the website (USD, optional)"
          type="number"
          placeholder="29.99"
          min={0}
          step="0.01"
          value={sourcePrice}
          onChange={(e) => setSourcePrice(e.target.value)}
        />
        {breakdown !== null && (
          <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Estimated total:{" "}
                <span className="font-semibold text-primary-600 dark:text-primary-400">
                  {formatPhp(breakdown.total)}
                </span>
              </p>
              <button
                type="button"
                onClick={toggleBreakdown}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {showBreakdown ? "Hide breakdown" : "How is this calculated?"}
              </button>
            </div>

            {showBreakdown && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-3 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>
                    Product price ({formatUsd(breakdown.usd)} &times; {exchangeRate})
                  </span>
                  <span>{formatPhp(breakdown.convertedPhp)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee (15% — sourcing &amp; handling)</span>
                  <span>{formatPhp(breakdown.serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping allocation (per-item share of balikbayan box)</span>
                  <span>{formatPhp(breakdown.shippingAlloc)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-semibold text-gray-900 dark:border-gray-700 dark:text-gray-100">
                  <span>Estimated total</span>
                  <span>{formatPhp(breakdown.total)}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-gray-500 dark:text-gray-500">
                  This is a rough estimate. The final price may vary based on the actual exchange
                  rate at purchase time, exact shipping weight, and product availability. We&apos;ll
                  confirm the real price before you commit.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <Button type="submit" disabled={loading || !productName.trim()}>
        {loading ? "Submitting..." : "Submit Request"}
      </Button>
    </form>
  );
}
