"use client";

import { useEffect, useState, use } from "react";

import { Breadcrumbs } from "@/components/layout";
import { Button, Input, Select, Skeleton, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { type Category, type Product } from "@/lib/supabase/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category_id: "",
    description: "",
    brand: "",
    condition: "new",
    cost_usd: "",
    selling_price_php: "",
    compare_at_price_php: "",
    quantity_total: "",
    tags: "",
    is_featured: false,
  });

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const [{ data: productData }, { data: categoryData }] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      ]);

      if (productData) {
        setProduct(productData);
        setForm({
          name: productData.name,
          category_id: productData.category_id ?? "",
          description: productData.description ?? "",
          brand: productData.brand ?? "",
          condition: productData.condition,
          cost_usd: String(productData.cost_usd),
          selling_price_php: String(productData.selling_price_php),
          compare_at_price_php: productData.compare_at_price_php
            ? String(productData.compare_at_price_php)
            : "",
          quantity_total: String(productData.quantity_total),
          tags: productData.tags.join(", "),
          is_featured: productData.is_featured,
        });
      }
      if (categoryData) setCategories(categoryData);
      setLoading(false);
    }
    void fetchData();
  }, [id]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const target = e.target;
    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({ ...prev, [target.name]: target.checked }));
    } else {
      setForm((prev) => ({ ...prev, [target.name]: target.value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: form.name,
      category_id: form.category_id || null,
      description: form.description || null,
      brand: form.brand || null,
      condition: form.condition,
      cost_usd: Number.parseFloat(form.cost_usd) || 0,
      selling_price_php: Number.parseFloat(form.selling_price_php) || 0,
      compare_at_price_php: form.compare_at_price_php
        ? Number.parseFloat(form.compare_at_price_php)
        : null,
      quantity_total: Number.parseInt(form.quantity_total, 10) || 0,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      is_featured: form.is_featured,
    };

    console.log("Updating product:", id, payload);
    // TODO: PATCH to /api/products/[id]
    setSubmitting(false);
  }

  const conditionOptions = [
    { value: "new", label: "New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
  ];

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400">Product not found.</div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Products", href: "/admin/products" },
          { label: product.name, href: `/admin/products/${id}` },
          { label: "Edit" },
        ]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="name"
          name="name"
          label="Product Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <Select
          id="category_id"
          name="category_id"
          label="Category"
          value={form.category_id}
          onChange={handleChange}
          options={categoryOptions}
          placeholder="Select a category"
        />

        <Textarea
          id="description"
          name="description"
          label="Description"
          value={form.description}
          onChange={handleChange}
          rows={4}
        />

        <Input id="brand" name="brand" label="Brand" value={form.brand} onChange={handleChange} />

        <Select
          id="condition"
          name="condition"
          label="Condition"
          value={form.condition}
          onChange={handleChange}
          options={conditionOptions}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="cost_usd"
            name="cost_usd"
            label="Cost (USD)"
            type="number"
            step="0.01"
            min="0"
            value={form.cost_usd}
            onChange={handleChange}
            required
          />

          <Input
            id="selling_price_php"
            name="selling_price_php"
            label="Selling Price (PHP)"
            type="number"
            step="0.01"
            min="0"
            value={form.selling_price_php}
            onChange={handleChange}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="compare_at_price_php"
            name="compare_at_price_php"
            label="Compare-at Price (PHP)"
            type="number"
            step="0.01"
            min="0"
            value={form.compare_at_price_php}
            onChange={handleChange}
          />

          <Input
            id="quantity_total"
            name="quantity_total"
            label="Quantity"
            type="number"
            min="0"
            value={form.quantity_total}
            onChange={handleChange}
            required
          />
        </div>

        <Input
          id="tags"
          name="tags"
          label="Tags"
          value={form.tags}
          onChange={handleChange}
          placeholder="tag1, tag2, tag3"
        />

        <div className="flex items-center gap-2">
          <input
            id="is_featured"
            name="is_featured"
            type="checkbox"
            checked={form.is_featured}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
          />
          <label
            htmlFor="is_featured"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Featured product
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => globalThis.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
