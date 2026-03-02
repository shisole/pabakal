import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Enter your new password below</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
