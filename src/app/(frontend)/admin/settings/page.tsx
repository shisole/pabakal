"use client";

import { useEffect, useState } from "react";

import { TrashIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Button, Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { type Category, type ExchangeRate } from "@/lib/supabase/types";

export default function SettingsPage() {
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [newRate, setNewRate] = useState("");
  const [rateSubmitting, setRateSubmitting] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySubmitting, setCategorySubmitting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();

      const [{ data: rateData }, { data: categoryData }] = await Promise.all([
        supabase
          .from("exchange_rates")
          .select("*")
          .order("effective_date", { ascending: false })
          .limit(1)
          .single(),
        supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      ]);

      if (rateData) setCurrentRate(rateData);
      if (categoryData) setCategories(categoryData);
    }
    void fetchData();
  }, []);

  async function handleSetRate(e: React.FormEvent) {
    e.preventDefault();
    if (!newRate) return;
    setRateSubmitting(true);

    const payload = {
      rate: Number.parseFloat(newRate),
      effective_date: new Date().toISOString().split("T")[0],
    };

    console.log("Setting exchange rate:", payload);
    // TODO: POST to /api/settings/exchange-rate
    setRateSubmitting(false);
    setNewRate("");
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setCategorySubmitting(true);

    const slug = newCategoryName
      .trim()
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, "-")
      .replaceAll(/^-|-$/g, "");

    const payload = {
      name: newCategoryName.trim(),
      slug,
    };

    console.log("Creating category:", payload);
    // TODO: POST to /api/settings/categories
    setCategorySubmitting(false);
    setNewCategoryName("");
  }

  const handleDeleteCategory = async (categoryId: string) => {
    console.log("Deleting category:", categoryId);
    // TODO: DELETE /api/settings/categories/[id]
    setCategories((prev) => prev.filter((c) => c.id !== categoryId));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Settings" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Exchange Rate (USD to PHP)
          </h2>

          {currentRate && (
            <div className="mb-4 rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                1 USD = {currentRate.rate} PHP
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Effective since {new Date(currentRate.effective_date).toLocaleDateString()}
              </p>
            </div>
          )}

          <form onSubmit={handleSetRate} className="flex gap-3">
            <Input
              id="new_rate"
              type="number"
              step="0.01"
              min="0"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              placeholder="e.g., 56.50"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={rateSubmitting || !newRate}>
              {rateSubmitting ? "Saving..." : "Set Rate"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Categories
          </h2>

          {categories.length > 0 ? (
            <ul className="mb-4 divide-y divide-gray-100 dark:divide-gray-800">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.slug}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              No categories created yet.
            </p>
          )}

          <form onSubmit={handleAddCategory} className="flex gap-3">
            <Input
              id="new_category"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name"
              className="flex-1"
            />
            <Button
              type="submit"
              size="sm"
              disabled={categorySubmitting || !newCategoryName.trim()}
            >
              {categorySubmitting ? "Adding..." : "Add"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
