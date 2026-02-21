import { use } from "react";
import EditUserForm from "./editUserForm";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the promise-based params for Next.js 15
  const resolvedParams = use(params);
  const userId = resolvedParams.id;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-12 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold">Edit User Profile</h1>
          <p className="text-blue-100 mt-2">
            Update account details and permissions for User ID:{" "}
            <span className="font-mono text-sm bg-blue-800 px-2 py-1 rounded">
              {userId}
            </span>
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <EditUserForm userId={userId} />
        </div>
      </main>
    </div>
  );
}
