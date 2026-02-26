"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { gameService } from "@/services/adminService";
import { Game } from "@/types";
import { Trash2, Save, ArrowLeft, Plus, X } from "lucide-react";

export default function GameDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<Partial<Game>>({
    name: "",
    description: "",
    rules: "",
    status: "OPEN",
    ticket_types: [],
  });

  // 1. Fetch Game Data
  useEffect(() => {
    fetchGame();
  }, [id]);

  const fetchGame = async () => {
    try {
      const response = await gameService.getGame(id!);
      console.log(response);
      setFormData(response.data || {});
    } catch (error) {
      console.error("Failed to load game", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Update
  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      await gameService.updateGame(id!, formData);
      alert("Game updated successfully!");
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
    return <div className="p-10 text-center">Loading Game Data...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Actions */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <Trash2 size={20} />
          </button>
          <button
            type="button"
            onClick={handleUpdate}
            disabled={isUpdating}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save size={18} /> {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Info */}
        <div className="md:col-span-2 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-800">
              General Information
            </h2>
            <div className="space-y-4">
              <input
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-xl"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Game Name"
              />
              <textarea
                className="w-full p-4 bg-slate-50 border-none rounded-2xl min-h-[120px]"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Description"
              />
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h2 className="text-lg font-black text-slate-800 mb-4">
              Pricing Matrix
            </h2>
            <div className="space-y-3">
              {formData?.ticket_types?.map((tt, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl"
                >
                  <div className="flex-1">
                    <span className="text-[10px] font-black text-indigo-500 uppercase">
                      {tt.category}
                    </span>
                    <p className="text-sm font-bold text-slate-700">
                      {tt.name}
                    </p>
                  </div>
                  <div className="flex items-center bg-white rounded-xl px-3 border border-slate-200">
                    <span className="text-xs font-bold text-slate-400 mr-2">
                      ETB
                    </span>
                    <input
                      type="number"
                      className="w-20 p-2 font-black text-right outline-none"
                      value={tt.price}
                      onChange={(e) => {
                        const newTypes = [...(formData.ticket_types ?? [])];
                        newTypes[index].price = parseFloat(e.target.value) || 0;
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
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <label className="text-[10px] font-black text-slate-400 uppercase">
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
              className="w-full mt-2 p-3 bg-slate-50 rounded-xl font-bold text-sm outline-none border-2 border-transparent focus:border-indigo-500"
            >
              <option value="OPEN">OPEN</option>
              <option value="CLOSED">CLOSED</option>
              <option value="MAINTENANCE">ON MAINTENANCE</option>
              <option value="UPCOMING">UPCOMING</option>
            </select>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <h3 className="font-bold mb-2">Internal Rules</h3>
            <textarea
              className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm text-slate-300 min-h-[150px]"
              value={formData.rules}
              onChange={(e) =>
                setFormData({ ...formData, rules: e.target.value })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
