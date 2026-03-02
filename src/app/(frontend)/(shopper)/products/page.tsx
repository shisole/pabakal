import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, product_images(*), categories(*)", { count: "exact" })
    .eq("status", "active");

  if (params.q) {
    query = query.ilike("name", `%${params.q}%`);
  }

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  switch (params.sort) {
    case "price_asc": {
      query = query.order("selling_price_php", { ascending: true });
      break;
    }
    case "price_desc": {
      query = query.order("selling_price_php", { ascending: false });
      break;
    }
    default: {
      query = query.order("created_at", { ascending: false });
    }
  }

  const page = Number(params.page) || 1;
  const perPage = 12;
  const from = (page - 1) * perPage;
  query = query.range(from, from + perPage - 1);

  const { data: products, count } = await query;
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  const totalPages = Math.ceil((count ?? 0) / perPage);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">
        {params.q ? `Results for "${params.q}"` : "All Products"}
      </h1>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href="/products"
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            params.category
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              : "bg-primary-600 text-white"
          }`}
        >
          All
        </Link>
        {categories?.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}${params.q ? `&q=${params.q}` : ""}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              params.category === cat.slug
                ? "bg-primary-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Product grid */}
      {products && products.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => {
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
                  {product.brand && <p className="text-xs text-gray-500">{product.brand}</p>}
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-heading text-lg font-bold text-primary-600">
                      {new Intl.NumberFormat("en-PH", {
                        style: "currency",
                        currency: "PHP",
                        minimumFractionDigits: 0,
                      }).format(product.selling_price_php)}
                    </span>
                    {product.compare_at_price_php && (
                      <span className="text-xs text-gray-400 line-through">
                        {new Intl.NumberFormat("en-PH", {
                          style: "currency",
                          currency: "PHP",
                          minimumFractionDigits: 0,
                        }).format(product.compare_at_price_php)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-gray-500">No products found.</p>
          <Link href="/products" className="mt-2 text-sm text-primary-600 hover:underline">
            Clear filters
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/products?page=${page - 1}${params.category ? `&category=${params.category}` : ""}${params.q ? `&q=${params.q}` : ""}${params.sort ? `&sort=${params.sort}` : ""}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Previous
            </Link>
          )}
          <span className="rounded-lg px-3 py-1.5 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/products?page=${page + 1}${params.category ? `&category=${params.category}` : ""}${params.q ? `&q=${params.q}` : ""}${params.sort ? `&sort=${params.sort}` : ""}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
