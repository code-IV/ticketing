"use client";
import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/Button";
import {
  Save,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ShieldX,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Clock,
  Info,
} from "lucide-react";
import { User } from "@/types";

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<User>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "visitor",
    is_active: true,
    created_at: "",
    updated_at: "",
  });
  const [initialData, setInitialData] = useState<Partial<User>>({});
  const [changesForReview, setChangesForReview] = useState<
    Record<string, { old: any; new: any }>
  >({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await adminService.getUserById(userId);
        const userData = response.data?.user || {};
        setFormData(userData);
        setInitialData(userData);
      } catch (err: any) {
        setError("Could not find user details.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const diff: Record<string, { old: any; new: any }> = {};

    // Your logic, but storing both old and new for the UI
    Object.keys(formData).forEach((key) => {
      const typedKey = key as keyof User;
      if (
        formData[typedKey] !== undefined && // Ensure we aren't checking uninitialized fields
        formData[typedKey] !== initialData[typedKey]
      ) {
        diff[typedKey] = {
          old: initialData[typedKey],
          new: formData[typedKey],
        };
      }
    });

    if (Object.keys(diff).length === 0) {
      alert("No changes detected.");
      return;
    }

    setChangesForReview(diff);
    setShowConfirm(true); // Open the modal
  };

  const handleFinalConfirm = async () => {
    setSaving(true);
    try {
      // Extract just the 'new' values for the payload
      const payload = Object.fromEntries(
        Object.entries(changesForReview).map(([key, val]) => [key, val.new]),
      );

      await adminService.updateUser(userId, payload);
      setShowConfirm(false); // Close modal
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user.");
      setShowConfirm(false); // Close modal so they can see the error on the main form
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-12 text-center text-gray-500 italic">
        Loading user data...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-12 px-6">
        <div className="max-w-4xl mx-auto flex justify-between">
          <div className="border-l border-white">
            <h1 className="text-3xl font-bold">Edit User Profile</h1>
            <p className="text-blue-100 mt-2 ">
              User ID:{" "}
              <span className="font-mono text-sm bg-blue-800 px-2 py-1 rounded">
                {userId}
              </span>
            </p>
          </div>
          <div className="flex flex-col flex-wrap gap-4 text-[11px] uppercase tracking-wider font-bold">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200 text-gray-500">
              <Calendar size={12} />
              <span>
                Created:{" "}
                <span className="text-gray-900">
                  {formData.created_at
                    ? new Date(formData.created_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-100 text-blue-600">
              <Clock size={12} />
              <span>
                Last Update:{" "}
                <span className="text-blue-900">
                  {formData.updated_at
                    ? new Date(formData.updated_at).toLocaleDateString()
                    : "N/A"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
            {/* Section 1: Identity */}
            <div className="p-8 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
                <div className="flex items-center gap-3 text-blue-900">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <UserIcon size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Personal Information</h2>{" "}
                    {formData.is_active ? (
                      <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                        <ShieldCheck size={18} className="stroke-[2.5px]" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Account Active
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                        <ShieldX size={18} className="stroke-[2.5px]" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          Deactivated
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.first_name ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.last_name ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={16} /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.email ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Phone size={16} /> Phone number
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.phone ?? ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Account Status
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        is_active: !formData.is_active,
                      })
                    }
                    className={`flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-md active:scale-95 ${
                      formData.is_active
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-red-200 bg-red-50 text-red-700"
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-sm uppercase tracking-wider">
                        {formData.is_active
                          ? "Account is Active"
                          : "Account Suspended"}
                      </span>
                      <span className="text-xs opacity-70 font-normal">
                        {formData.is_active
                          ? "The user can access all park systems."
                          : "Access is currently revoked."}
                      </span>
                    </div>

                    {formData.is_active ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold">
                          DEACTIVATE
                        </span>
                        <ShieldCheck size={28} className="fill-green-100" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-red-600">
                          ACTIVATE
                        </span>
                        <ShieldX size={28} className="fill-red-100" />
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Permissions */}
            <div className="p-8 bg-gray-50/50 space-y-6">
              <div className="flex items-center gap-2 text-purple-800 font-semibold mb-2">
                <ShieldCheck size={20} />
                <h2>Role & Permissions</h2>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label
                    className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${formData.role === "visitor" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        checked={formData.role === "visitor"}
                        onChange={() =>
                          setFormData({ ...formData, role: "visitor" })
                        }
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-bold text-gray-900">General User</p>
                        <p className="text-xs text-gray-500">
                          Standard park visitor access
                        </p>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${formData.role === "admin" ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        checked={formData.role === "admin"}
                        onChange={() =>
                          setFormData({ ...formData, role: "admin" })
                        }
                        className="w-4 h-4 text-purple-600"
                      />
                      <div>
                        <p className="font-bold text-gray-900">Administrator</p>
                        <p className="text-xs text-gray-500">
                          Full control over park operations
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 3: Actions */}
            <div className="p-8 flex items-center justify-between bg-white">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <ArrowLeft size={18} className="mr-2" /> Cancel
              </button>

              <div className="flex items-center gap-4">
                {error && (
                  <span className="text-red-600 text-sm flex items-center gap-1">
                    <Info size={14} /> {error}
                  </span>
                )}
                <Button
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-lg shadow-blue-200"
                >
                  {saving ? "Saving..." : "Save Changes"}
                  <Save size={18} className="ml-2" />
                </Button>
              </div>
            </div>
          </form>
        </div>
      </main>
      <UpdateConfirmModal
        isOpen={showConfirm}
        isLoading={saving}
        changes={changesForReview}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleFinalConfirm}
      />
    </div>
  );
}

function UpdateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  changes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  changes: Record<string, { old: any; new: any }>;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Info className="text-blue-600" size={22} />
            Review Changes
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Please confirm the following updates to this user profile.
          </p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {Object.keys(changes).length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No changes detected.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(changes).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 p-3 bg-blue-50/50 rounded-lg border border-blue-100"
                >
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    {key.replace("_", " ")}
                  </span>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 line-through decoration-red-300">
                      {String(value.old || "None")}
                    </span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="text-gray-900 font-semibold">
                      {String(value.new)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-[2] px-8 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
            ) : (
              "Confirm & Save"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
