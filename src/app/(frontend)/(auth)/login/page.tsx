import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold">Welcome back</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your Pabakal account</p>
      </div>
      <LoginForm />
    </div>
  );
}
