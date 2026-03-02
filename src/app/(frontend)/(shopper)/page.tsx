import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*, product_images(*)")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:py-24">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Wala diyan? <span className="text-primary-600">Kami na.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600 dark:text-gray-300">
            Quality US products delivered to the Philippines via balikbayan box. Honest prices,
            authentic goods.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/products"
              className="btn-primary inline-flex items-center rounded-xl px-6 py-3"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
            Shop by Category
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group rounded-2xl border border-gray-200 bg-white p-4 text-center transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <h3 className="font-medium text-gray-900 group-hover:text-primary-600 dark:text-gray-100">
                  {cat.name}
                </h3>
                {cat.description && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{cat.description}</p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
              Featured Products
            </h2>
            <Link
              href="/products"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {featuredProducts.map((product) => {
              const image = product.product_images?.[0];
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group rounded-2xl border border-gray-200 bg-white p-3 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="aspect-square overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                    {image && (
                      <img
                        src={image.url}
                        alt={image.alt_text ?? product.name}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <div className="mt-3">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {product.name}
                    </h3>
                    <p className="mt-1 font-heading text-lg font-bold text-primary-600">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                        minimumFractionDigits: 0,
                      }).format(product.selling_price_php)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Pasabuy CTA */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-2xl bg-gradient-to-r from-accent-500 to-accent-600 p-8 text-center text-white sm:p-12">
          <h2 className="font-heading text-2xl font-bold sm:text-3xl">
            Can&apos;t find what you&apos;re looking for?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-accent-100">
            Request any US product and we&apos;ll check availability and pricing for you.
          </p>
          <Link
            href="/request"
            className="mt-6 inline-flex items-center rounded-xl bg-white px-6 py-3 font-medium text-accent-600 transition-colors hover:bg-accent-50"
          >
            Request a Product
          </Link>
        </div>
      </section>
    </div>
  );
}
