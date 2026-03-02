import SignupForm from "@/components/auth/SignupForm";

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="font-heading text-3xl font-bold">Create an account</h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Join Pabakal and shop US products</p>
      </div>
      <SignupForm />
    </div>
  );
}
