"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { adminService } from "@/services/adminService";

export default function UserTable() {
  const router = useRouter();
  const { user: thisUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    sortBy: "firstName",
    sortOrder: "asc",
  });
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  const clearFilters = () => {
    setFilters({
      role: "all",
      status: "all",
      sortBy: "firstName",
      sortOrder: "asc",
    });
    setSearch("");
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];

    let result = [...users];

    // Exclude current user
    result = result.filter((u) => u.id !== thisUser?.id);

    // Apply search filter
    if (search) {
      const searchTerm = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.first_name?.toLowerCase().includes(searchTerm) ||
          u.last_name?.toLowerCase().includes(searchTerm) ||
          u.email?.toLowerCase().includes(searchTerm) ||
          u.phone?.toLowerCase().includes(searchTerm),
      );
    }

    // Apply role filter
    if (filters.role !== "all") {
      result = result.filter((u) => u.role === filters.role);
    }

    // Apply status filter
    if (filters.status !== "all") {
      const isActive = filters.status === "active";
      result = result.filter((u) => u.is_active === isActive);
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue, bValue;

      switch (filters.sortBy) {
        case "firstName":
          aValue = a.first_name?.toLowerCase() || "";
          bValue = b.first_name?.toLowerCase() || "";
          break;
        case "email":
          aValue = a.email?.toLowerCase() || "";
          bValue = b.email?.toLowerCase() || "";
          break;
        case "role":
          aValue = a.role?.toLowerCase() || "";
          bValue = b.role?.toLowerCase() || "";
          break;
        case "dateJoined":
          aValue = new Date(a.created_at || "").getTime();
          bValue = new Date(b.created_at || "").getTime();
          break;
        case "lastUpdated":
          aValue = new Date(a.updated_at || "").getTime();
          bValue = new Date(b.updated_at || "").getTime();
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return result;
  }, [users, search, filters, thisUser]);
  return (
    <>
      {/* Search and Filters Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        {/* Filter Options Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Role:
                </label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange("role", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Status:
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Sort by:
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="firstName">Name</option>
                  <option value="email">Email</option>
                  <option value="role">Role</option>
                  <option value="dateJoined">Date Joined</option>
                  <option value="lastUpdated">Last Updated</option>
                </select>

                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm ml-1"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>

              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            </div>
          </div>
        )}
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
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Last Updated
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
                  if (e.key === "Enter") router.push(`/admin/users/${user.id}`);
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
                        {user.first_name} {user.last_name}
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
                  {new Date(user.created_at || Date.now()).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.updated_at
                    ? new Date(user.updated_at).toLocaleDateString()
                    : new Date(
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

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No users found matching your criteria
            </p>
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        isLoading={isActionLoading}
        onClose={() => setModalConfig({ isOpen: false, userId: null })}
        onConfirm={confirmToggle}
      />
    </>
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
