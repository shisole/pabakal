import Link from "next/link";

import { Breadcrumbs } from "@/components/layout";
import { Badge, Button, EmptyState } from "@/components/ui";
import { formatPhp } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Payments | Pabakal Admin",
};

export default async function PaymentsPage() {
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select("*, orders(order_number, profiles(full_name))")
    .eq("verified", false)
    .order("created_at", { ascending: false });

  return (
    <div>
      <Breadcrumbs
        items={[{ label: "Dashboard", href: "/admin/dashboard" }, { label: "Payments" }]}
      />

      <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Payment Verification Queue
      </h1>

      {payments && payments.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-md dark:bg-gray-900">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Order</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Customer</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                  Reference
                </th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">
                  Amount
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Proof</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments.map((payment) => {
                const order = payment.orders as {
                  order_number: string;
                  profiles: { full_name: string | null } | null;
                } | null;
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${payment.order_id}`}
                        className="font-medium text-primary-600 hover:underline"
                      >
                        {order?.order_number ?? payment.order_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {order?.profiles?.full_name ?? "Unknown"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info" size="sm">
                        {payment.method.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                      {payment.reference_number ?? "N/A"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatPhp(payment.amount_php)}
                    </td>
                    <td className="px-4 py-3">
                      {payment.proof_url ? (
                        <a
                          href={payment.proof_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:underline"
                        >
                          View Proof
                        </a>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${payment.order_id}`}>
                        <Button size="sm">Review</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="All clear!" description="No payments pending verification." />
      )}
    </div>
  );
}
