import Link from "next/link";
import { notFound } from "next/navigation";

import { ArrowLeftIcon } from "@/components/icons";
import { Breadcrumbs } from "@/components/layout";
import { Badge } from "@/components/ui";
import { formatUsd } from "@/lib/helpers/pricing";
import { createClient } from "@/lib/supabase/server";
import { type RequestStatus } from "@/lib/supabase/types";

import RespondForm from "./RespondForm";

const statusVariant: Record<RequestStatus, "default" | "success" | "warning" | "danger" | "info"> =
  {
    pending: "warning",
    reviewing: "info",
    available: "success",
    unavailable: "danger",
    closed: "default",
  };

const statusLabel: Record<RequestStatus, string> = {
  pending: "Pending",
  reviewing: "Reviewing",
  available: "Available",
  unavailable: "Unavailable",
  closed: "Closed",
};

interface RequestDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailPage({ params }: RequestDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: request } = await supabase
    .from("product_requests")
    .select("*, profiles!product_requests_customer_id_fkey(full_name, email, phone)")
    .eq("id", id)
    .single();

  if (!request) {
    notFound();
  }

  const profile = request.profiles as {
    full_name: string | null;
    email: string;
    phone: string | null;
  } | null;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Requests", href: "/admin/requests" },
          { label: request.product_name },
        ]}
      />

      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/admin/requests"
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {request.product_name}
        </h1>
        <Badge variant={statusVariant[request.status] ?? "default"}>
          {statusLabel[request.status] ?? request.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Request Details */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Request Details
          </h2>

          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Customer</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {profile?.full_name ?? "Unknown"}
                {profile?.email && <span className="ml-2 text-gray-500">({profile.email})</span>}
              </dd>
            </div>

            {profile?.phone && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Phone</dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100">{profile.phone}</dd>
              </div>
            )}

            {request.product_url && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Product URL
                </dt>
                <dd className="text-sm">
                  <a
                    href={request.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    {request.product_url}
                  </a>
                </dd>
              </div>
            )}

            {request.description && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Description
                </dt>
                <dd className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {request.description}
                </dd>
              </div>
            )}

            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Source Price (USD)
              </dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {request.source_price_usd == null
                  ? "Not specified"
                  : formatUsd(request.source_price_usd)}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">Submitted</dt>
              <dd className="text-sm text-gray-900 dark:text-gray-100">
                {new Date(request.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Respond Form */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Respond</h2>
          <div className="mt-4">
            <RespondForm
              requestId={request.id}
              adminId={user?.id ?? ""}
              currentStatus={request.status}
              currentResponse={request.admin_response}
              currentEstimatedPrice={request.estimated_price_php}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
