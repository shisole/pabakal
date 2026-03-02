import { notFound } from "next/navigation";

import { isPreOrder } from "@/lib/helpers/cargo";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*), categories(*), cargos(*)")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!product) notFound();

  const preOrder = isPreOrder(product.cargos?.status);
  const availableQty = product.quantity_total - product.quantity_sold - product.quantity_reserved;

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("product_id", product.id)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(10);

  const avgRating =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Image gallery */}
        <div className="space-y-4">
          {product.product_images && product.product_images.length > 0 ? (
            <>
              <div className="aspect-square overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
                <img
                  src={product.product_images[0].url}
                  alt={product.product_images[0].alt_text ?? product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              {product.product_images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.product_images.slice(1).map((img) => (
                    <div
                      key={img.id}
                      className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                    >
                      <img
                        src={img.url}
                        alt={img.alt_text ?? product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800">
              No image
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          {product.categories && <p className="text-sm text-gray-500">{product.categories.name}</p>}
          <h1 className="mt-1 font-heading text-3xl font-bold text-gray-900 dark:text-white">
            {product.name}
          </h1>

          {product.brand && <p className="mt-1 text-sm text-gray-500">by {product.brand}</p>}

          {reviews && reviews.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-medium text-yellow-500">
                {"★".repeat(Math.round(avgRating))}
                {"☆".repeat(5 - Math.round(avgRating))}
              </span>
              <span className="text-sm text-gray-500">
                {avgRating.toFixed(1)} ({reviews.length} review{reviews.length === 1 ? "" : "s"})
              </span>
            </div>
          )}

          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-heading text-3xl font-bold text-primary-600">
              {formatPhp(product.selling_price_php)}
            </span>
            {product.compare_at_price_php && (
              <span className="text-lg text-gray-400 line-through">
                {formatPhp(product.compare_at_price_php)}
              </span>
            )}
          </div>

          {/* Badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            {preOrder && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                Pre-Order
                {product.cargos?.estimated_arrival &&
                  ` — ETA ${new Date(product.cargos.estimated_arrival).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}`}
              </span>
            )}
            {product.condition !== "new" && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {product.condition === "like_new"
                  ? "Like New"
                  : product.condition.charAt(0).toUpperCase() + product.condition.slice(1)}
              </span>
            )}
            {availableQty <= 3 && availableQty > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
                Only {availableQty} left
              </span>
            )}
          </div>

          {/* Variants */}
          {product.product_variants && product.product_variants.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Options</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {product.product_variants.map((v) => (
                  <span
                    key={v.id}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700"
                  >
                    {v.name}
                    {v.price_adjustment_php !== 0 && (
                      <span className="ml-1 text-gray-500">
                        ({v.price_adjustment_php > 0 ? "+" : ""}
                        {formatPhp(v.price_adjustment_php)})
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-gray-600 dark:text-gray-400">
                {product.description}
              </p>
            </div>
          )}

          {/* Tags */}
          {product.tags && product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Add to cart placeholder — will be a client component */}
          <div className="mt-8">
            <button
              type="button"
              className="btn-primary w-full rounded-xl py-3"
              disabled={availableQty <= 0}
            >
              {availableQty <= 0 ? "Sold Out" : preOrder ? "Pre-Order Now" : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      {reviews && reviews.length > 0 && (
        <section className="mt-12">
          <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            Customer Reviews
          </h2>
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm text-yellow-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {review.profiles?.full_name ?? "Anonymous"}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
