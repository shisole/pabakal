import { redirect } from "next/navigation";

import { StatusBadge, builtInStatusMaps } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

import RequestForm from "./RequestForm";

export const metadata = {
  title: "Request a Product | Pabakal",
};

export default async function RequestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/request");
  }

  const { data: requests } = await supabase
    .from("product_requests")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-heading text-2xl font-bold text-gray-900 dark:text-white">
        Request a Product
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Can&apos;t find what you need? Tell us and we&apos;ll check if it&apos;s available in the
        US.
      </p>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <RequestForm userId={user.id} />
      </div>

      {/* Request History */}
      {requests && requests.length > 0 && (
        <div className="mt-12">
          <h2 className="font-heading text-xl font-bold text-gray-900 dark:text-white">
            Your Requests
          </h2>
          <div className="mt-4 space-y-4">
            {requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {req.product_name}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={req.status} statusMap={builtInStatusMaps.request} />
                </div>

                {req.admin_response && (
                  <div className="mt-3 rounded-xl bg-primary-50 px-4 py-3 dark:bg-primary-950">
                    <p className="text-xs font-medium text-primary-700 dark:text-primary-300">
                      Admin Response
                    </p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {req.admin_response}
                    </p>
                    {req.estimated_price_php && (
                      <p className="mt-1 text-sm font-semibold text-primary-600">
                        Estimated price: {formatPhp(req.estimated_price_php)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
