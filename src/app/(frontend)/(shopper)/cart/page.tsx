"use client";

import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";
import { MinusIcon, PlusIcon, ShoppingBagIcon, TrashIcon } from "@/components/icons";
import { Button, Card, EmptyState } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Your Cart</h1>
        <EmptyState
          icon={<ShoppingBagIcon className="h-12 w-12" />}
          title="Your cart is empty"
          description="Browse our products and add items to your cart."
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
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">Your Cart</h1>

      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <Card key={`${item.productId}-${item.variantId}`} className="flex gap-4 p-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <ShoppingBagIcon className="h-8 w-8" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{item.name}</h3>
                  {item.variantName && <p className="text-sm text-gray-500">{item.variantName}</p>}
                  <p className="mt-1 text-sm font-medium text-primary-600">
                    {formatPhp(item.price)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
                  aria-label="Remove item"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity - 1)
                    }
                    className="rounded-lg border border-gray-200 p-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    aria-label="Decrease quantity"
                  >
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.maxQuantity}
                    className="rounded-lg border border-gray-200 p-1 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    aria-label="Increase quantity"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <span className="font-heading text-sm font-bold text-gray-900 dark:text-gray-100">
                  {formatPhp(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Order summary */}
      <Card className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            {formatPhp(subtotal)}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500">Shipping calculated at checkout.</p>
        <Link href="/checkout" className="mt-4 block">
          <Button className="w-full">Proceed to Checkout</Button>
        </Link>
      </Card>
    </div>
  );
}
