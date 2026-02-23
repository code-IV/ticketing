"use client";
import { useState, useEffect, useMemo } from "react";
import { User } from "@/types";
import {
  Search,
  UserPlus,
  Mail,
  ShieldCheck,
  ShieldX,
  Shield,
  CircleUser,
  Trash2,
  Edit2,
  Filter,
  Zap,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
export default function UserManagementPage() {
  const { user: thisUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fix 2: Wrap loadUsers in useEffect so it actually runs
  useEffect(() => {
    loadUsers();
  }, []);

  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setIsLoading(true); // Ensure loading state is active
      setError(null);
      const response = await adminService.getAllUsers();
      setUsers(response.data?.users || []);
    } catch (error) {
      console.error("Failed to load users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRequest = (id: string) => {
    setModalConfig({ isOpen: true, userId: id });
  };

  const confirmToggle = async () => {
    if (!modalConfig.userId) return;

    setIsActionLoading(true);
    try {
      const response = await adminService.toggleUserActive(modalConfig.userId);
      const updatedUser = response.data?.user;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === modalConfig.userId
            ? { ...u, is_active: updatedUser?.is_active ?? !u.is_active }
            : u,
        ),
      );

      // Close modal
      setModalConfig({ isOpen: false, userId: null });
    } catch (error) {
      setError("Failed to update user status. Please try again.");
      setModalConfig({ isOpen: false, userId: null });
    } finally {
      setIsActionLoading(false);
    }
  };

  const stats = useMemo(
    () => ({
      // Use fallback value to ensure it never breaks
      total: users?.length || 0,
      admins: users?.filter((u) => u.role === "admin").length || 0,
      activeToday: Math.floor((users?.length || 0) * 0.4),
    }),
    [users],
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((u) => {
      // 1. Check if the user is NOT the currently logged-in admin
      const isNotMe = u.id !== thisUser?.id;

      // 2. Apply search criteria
      const matchesSearch =
        u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase());

      return isNotMe && matchesSearch;
    });
  }, [users, search, thisUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-10 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-300" />
            Command Center
          </h1>
          <p className="text-blue-100 mt-2 opacity-90">
            Manage park visitors, staff permissions, and account security.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Users"
              value={stats.total}
              icon={<CircleUser className="text-blue-600" />}
            />
            <StatCard
              title="Administrators"
              value={stats.admins}
              icon={<ShieldCheck className="text-purple-600" />}
            />
            <StatCard
              title="New Signups (24h)"
              value={"+12"}
              icon={<Zap className="text-yellow-600" />}
            />
          </div>

          {/* Fix 4: Corrected flex-row class */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="border border-gray-200 text-gray-600"
              >
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>

            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date Joined
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter")
                        router.push(`/admin/users/${user.id}`);
                    }}
                    tabIndex={0}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                          {user.first_name ? user.first_name.charAt(0) : "U"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {user.first_name}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                          user.is_active
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-red-100 text-red-800 border-red-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
                        ></span>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(
                        user.created_at || Date.now(),
                      ).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleRequest(user.id);
                          }}
                          className={`p-2 w-3/4 rounded-lg transition-all duration-200 transform 
    hover:scale-110 hover:shadow-lg active:scale-95 ${
      user.is_active
        ? "hover:bg-red-50 text-red-600"
        : "hover:bg-green-50 text-green-600"
    }`}
                          title={
                            user.is_active ? "Deactivate User" : "Activate User"
                          }
                        >
                          {user.is_active ? (
                            <div className="w-full flex items-center">
                              <span>Deactivate </span>
                              <ShieldX size={20} />
                            </div>
                          ) : (
                            <div className="w-full flex items-center">
                              <span>Activate </span> <ShieldCheck size={20} />
                            </div>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        isLoading={isActionLoading}
        onClose={() => setModalConfig({ isOpen: false, userId: null })}
        onConfirm={confirmToggle}
      />
    </div>
  );
}

// Helper Components
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
    </div>
  );
}

interface RoleBadgeProps {
  role: string; // This explicitly requires a string, not an object
}

function RoleBadge({ role }: RoleBadgeProps) {
  const styles =
    role === "admin"
      ? "bg-purple-100 text-purple-700 border-purple-200"
      : "bg-blue-100 text-blue-700 border-blue-200";
  return (
    <span
      className={`px-2 py-1 rounded border text-xs font-bold uppercase ${styles}`}
    >
      {role}
    </span>
  );
}

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        <div className="p-6 text-center">
          {isLoading ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">
                Updating status...
              </p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="text-blue-600 h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Change User Status?
              </h3>
              <p className="text-gray-500 mt-2">
                This will immediately change the user's ability to access the
                park systems.
              </p>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                >
                  Confirm
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
