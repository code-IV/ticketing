"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameService } from "@/services/adminService";
import { Game } from "@/types";
import { Trash2, Save, ArrowLeft, Plus, X } from "lucide-react";
import { useTheme } from '@/contexts/ThemeContext';

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isDarkTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Partial<Game>>({
    name: "",
    description: "",
    rules: "",
    status: "OPEN",
    ticket_types: [],
  });
  const [savedData, setSavedData] = useState<Partial<Game>>({});
  const [diff, setDiff] = useState<Partial<Game>>({});
  const [showModal, setShowModal] = useState(false);

  // 1. Fetch Game Data
  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const response = await gameService.getGame(id!);
      const data = response.data || {};
      setFormData(data);
      setSavedData(data);
    } catch (error) {
      console.error("Failed to load game", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic to find only changed fields
  const calculateChanges = () => {
    const changes: any = {};

    // Check simple fields
    (Object.keys(formData) as Array<keyof Game>).forEach((key) => {
      if (key !== "ticket_types" && formData[key] !== savedData[key]) {
        changes[key] = formData[key];
      }
    });

    // Check ticket_types (deep comparison)
    if (
      JSON.stringify(formData.ticket_types) !==
      JSON.stringify(savedData.ticket_types)
    ) {
      changes.ticket_types = formData.ticket_types;
    }

    return changes;
  };

  const triggerConfirm = () => {
    const changes = calculateChanges();
    if (Object.keys(changes).length === 0) {
      alert("No changes detected.");
      return;
    }
    setDiff(changes);
    setShowModal(true);
  };

  // 2. Handle Update
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      console.log(diff);
      await gameService.updateGame(id!, diff);
      setSavedData(formData);
      setShowModal(false);
    } catch (error) {
      alert("Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // 3. Handle Delete
  const handleDelete = async () => {
    if (
      window.confirm(
        "Are you sure? This will remove all associated ticket types.",
      )
    ) {
      try {
        await gameService.deleteGame(id!);
        router.push("/admin/games");
      } catch (error) {
        alert("Failed to delete game");
      }
    }
  };

  if (loading)
    return <div className={`p-10 text-center ${isDarkTheme ? 'text-gray-400' : ''}`}>Loading Game Data...</div>;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.back()}
            className={`flex items-center gap-2 ${isDarkTheme ? 'text-gray-400 hover:text-gray-200' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <ArrowLeft size={18} /> Back
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleDelete}
              className={`p-2 text-red-500 rounded-xl transition-colors ${isDarkTheme ? 'hover:bg-red-900/50' : 'hover:bg-red-50'}`}
            >
              <Trash2 size={20} />
            </button>
            <button
              type="button"
              onClick={triggerConfirm}
              disabled={isUpdating}
              className="flex items-center gap-2 style={{ backgroundColor: 'var(--accent)' }} text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save size={18} /> {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Column: Info */}
          <div className="md:col-span-2 space-y-6">
            <section className={`p-6 rounded-3xl border shadow-sm space-y-4 ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                General Information
              </h2>
              <div className="space-y-4">
                <input
                  className={`w-full p-4 border-none rounded-2xl font-bold text-xl ${isDarkTheme ? 'bg-bg3 text-white' : 'bg-slate-50'}`}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Game Name"
                />
                <textarea
                  className={`w-full p-4 border-none rounded-2xl min-h-[120px] ${isDarkTheme ? 'bg-bg3 text-white' : 'bg-slate-50'}`}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description"
                />
              </div>
            </section>

            <section className={`p-6 rounded-3xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-lg font-black mb-4 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                Pricing Matrix
              </h2>
              <div className="space-y-3">
                {formData?.ticket_types?.map((tt, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-2xl ${isDarkTheme ? 'bg-bg3' : 'bg-slate-50'}`}
                  >
                    <div className="flex-1">
                      <span className={`text-[10px] font-black uppercase ${isDarkTheme ? 'text-white' : 'text-accent'}`}>
                        {tt.category}
                      </span>
                      <p className={`text-sm font-bold ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
                        {tt.name}
                      </p>
                    </div>
                    <div className={`flex items-center rounded-xl px-3 border ${isDarkTheme ? 'bg-bg3 border-gray-600' : 'bg-white border-slate-200'}`}>
                      <span className={`text-xs font-bold mr-2 ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                        ETB
                      </span>
                      <input
                        type="number"
                        className={`w-20 p-2 font-black text-right outline-none ${isDarkTheme ? 'text-white' : ''}`}
                        value={tt.price}
                        onChange={(e) => {
                          const newTypes = (formData.ticket_types ?? []).map(
                            (t, i) =>
                              i === index
                                ? {
                                    ...t,
                                    price: parseFloat(e.target.value) || 0,
                                  }
                                : t,
                          );
                          setFormData({ ...formData, ticket_types: newTypes });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Status & Rules */}
          <div className="space-y-6">
            <div className={`p-6 rounded-3xl border shadow-sm ${isDarkTheme ? 'bg-[#0A0A0A] border-gray-700' : 'bg-white border-slate-100'}`}>
              <label className={`text-[10px] font-black uppercase ${isDarkTheme ? 'text-gray-500' : 'text-slate-400'}`}>
                Availability
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as
                      | "OPEN"
                      | "ON_MAINTENANCE"
                      | "CLOSED"
                      | "UPCOMING",
                  })
                }
                className={`w-full mt-2 p-3 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-white ${isDarkTheme ? 'bg-bg3 text-white' : 'bg-slate-50'}`}
              >
                <option value="OPEN">OPEN</option>
                <option value="CLOSED">CLOSED</option>
                <option value="ON_MAINTENANCE">ON MAINTENANCE</option>
                <option value="UPCOMING">UPCOMING</option>
              </select>
            </div>

            <div className={`p-6 rounded-3xl shadow-xl border border- ${isDarkTheme ? 'bg-[#0A0A0A]] text-white border-gray-700' : 'bg-slate-900 text-white border-slate-100'}`}>
              <h3 className="font-bold mb-2">Internal Rules</h3>
              <textarea
                className={`w-full border-none rounded-xl p-3 text-sm min-h-[150px] ${isDarkTheme ? 'bg-bg3 text-gray-300' : 'bg-slate-800 text-slate-300'}`}
                value={formData.rules}
                onChange={(e) =>
                  setFormData({ ...formData, rules: e.target.value })
                }
              />
            </div>
          </div>
        </div>
      </div>
      {showModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${isDarkTheme ? 'bg-black/60' : 'bg-slate-900/60'}`}>
          <div className={`w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 ${isDarkTheme ? 'bg-[#0A0A0A]' : 'bg-white'}`}>
            <div className="p-8">
              <h3 className={`text-2xl font-black mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                Review Changes
              </h3>
              <p className={`text-sm mb-6 ${isDarkTheme ? 'text-gray-400' : 'text-slate-500'}`}>
                The following fields will be updated:
              </p>

              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {Object.entries(diff).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-2xl border ${isDarkTheme ? 'bg-bg3 border-gray-700' : 'bg-slate-50 border-slate-100'}`}
                  >
                    <span className={`text-[10px] font-black uppercase block mb-1 ${isDarkTheme ? 'text-white' : 'text-accent'}`}>
                      {key}
                    </span>
                    <div className={`text-sm font-bold ${isDarkTheme ? 'text-gray-300' : 'text-slate-700'}`}>
                      {key === "ticket_types" ? (
                        `${(value as any[]).length} categories updated`
                      ) : (
                        <span className="break-words line-clamp-2">
                          {String(value)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 flex gap-3">
              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1 py-4 style={{ backgroundColor: 'var(--accent)' }} text-white rounded-2xl font-black shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isUpdating ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
