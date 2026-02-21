"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/adminService";
import { Button } from "@/components/ui/Button";
import {
  Save,
  ArrowLeft,
  ShieldCheck,
  User as UserIcon,
  Mail,
  Info,
} from "lucide-react";
import { User } from "@/types";

export default function EditUserForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<User>>({
    first_name: "",
    last_name: "",
    email: "",
    role: "visitor",
  });
  const [initialData, setInitialData] = useState<Partial<User>>({});
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedFields = Object.keys(formData).reduce((acc, key) => {
      const typedKey = key as keyof User;
      // Only include if it's actually different and not just an empty string
      if (
        formData[typedKey] !== initialData[typedKey] &&
        formData[typedKey] !== ""
      ) {
        acc[typedKey] = formData[typedKey];
      }
      return acc;
    }, {} as any);

    // 2. If nothing changed, don't even make the API call
    if (Object.keys(updatedFields).length === 0) {
      alert("No changes detected.");
      return;
    }
    setSaving(true);
    try {
      console.log(updatedFields);
      await adminService.updateUser(userId, updatedFields);
      router.push("/admin/users");
      router.refresh(); // Refresh server components to show new data
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user.");
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
    <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
      {/* Section 1: Identity */}
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
          <UserIcon size={20} />
          <h2>Personal Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              <input
                type="text"
                required
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={formData.first_name ?? ""}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
            </label>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              required
              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail size={16} /> Email Address
          </label>
          <input
            type="email"
            required
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
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
              className={`flex-1 flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition ${formData.role === "user" ? "border-blue-600 bg-blue-50" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="role"
                  checked={formData.role === "visitor"}
                  onChange={() => setFormData({ ...formData, role: "visitor" })}
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
                  onChange={() => setFormData({ ...formData, role: "admin" })}
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
  );
}
