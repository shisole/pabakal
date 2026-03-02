"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart/CartProvider";
import { ShoppingBagIcon } from "@/components/icons";
import { Button, Card, EmptyState, Input, Textarea } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    address_line: "",
    city: "",
    province: "",
    zip_code: "",
    customer_notes: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
          delivery_address: form.address_line,
          delivery_city: form.city,
          delivery_province: form.province,
          delivery_zip: form.zip_code,
          customer_notes: form.customer_notes || null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to place order");
      }

      const data = (await res.json()) as { orderId: string };
      globalThis.location.href = `/checkout/confirmation?orderId=${data.orderId}`;
    } catch {
      setIsSubmitting(false);
      alert("Something went wrong. Please try again.");
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>
        <EmptyState
          icon={<ShoppingBagIcon className="h-12 w-12" />}
          title="Your cart is empty"
          description="Add some items to your cart before checking out."
          action={
            <Link href="/products">
              <Button>Browse Products</Button>
            </Link>
          }
          className="mt-12"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Checkout</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        {/* Delivery address */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Delivery Address
          </h2>
          <div className="mt-4 space-y-4">
            <Input
              id="address_line"
              name="address_line"
              label="Address"
              placeholder="Street address, house no., barangay"
              value={form.address_line}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="city"
                name="city"
                label="City / Municipality"
                placeholder="e.g. Quezon City"
                value={form.city}
                onChange={handleChange}
                required
              />
              <Input
                id="province"
                name="province"
                label="Province"
                placeholder="e.g. Metro Manila"
                value={form.province}
                onChange={handleChange}
                required
              />
            </div>
            <Input
              id="zip_code"
              name="zip_code"
              label="ZIP Code"
              placeholder="e.g. 1100"
              value={form.zip_code}
              onChange={handleChange}
              required
            />
          </div>
        </Card>

        {/* Order summary */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
            Order Summary
          </h2>
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {item.name}
                    {item.variantName && (
                      <span className="ml-1 text-gray-500">({item.variantName})</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatPhp(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-heading text-xl font-bold text-gray-900 dark:text-white">
                {formatPhp(subtotal)}
              </span>
            </div>
          </div>
        </Card>

        {/* Customer notes */}
        <Card className="p-6">
          <Textarea
            id="customer_notes"
            name="customer_notes"
            label="Order Notes (optional)"
            placeholder="Any special instructions for your order..."
            rows={3}
            value={form.customer_notes}
            onChange={handleChange}
          />
        </Card>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Placing Order..." : "Place Order"}
        </Button>
      </form>
    </div>
  );
}
