import { redirect } from "next/navigation";

import { Card, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 dark:text-white">My Account</h1>

      <Card className="mt-8 p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
          Profile Information
        </h2>
        <div className="mt-4 space-y-4">
          <Input id="email" label="Email" value={user.email ?? ""} disabled readOnly />
          <Input
            id="full_name"
            label="Full Name"
            value={profile?.full_name ?? ""}
            disabled
            readOnly
          />
          <Input id="phone" label="Phone" value={profile?.phone ?? ""} disabled readOnly />
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <h2 className="font-heading text-lg font-semibold text-gray-900 dark:text-white">
          Default Address
        </h2>
        <div className="mt-4 space-y-4">
          <Input
            id="address_line"
            label="Address"
            value={profile?.address_line ?? ""}
            disabled
            readOnly
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="city"
              label="City / Municipality"
              value={profile?.city ?? ""}
              disabled
              readOnly
            />
            <Input
              id="province"
              label="Province"
              value={profile?.province ?? ""}
              disabled
              readOnly
            />
          </div>
          <Input id="zip_code" label="ZIP Code" value={profile?.zip_code ?? ""} disabled readOnly />
        </div>
      </Card>
    </div>
  );
}
