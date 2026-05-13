"use client";
import { useState } from "react";
import { Service, AdminInitialData } from "@/types";

interface AdminDashboardProps {
  initialData: AdminInitialData;
}

export default function AdminDashboard({ initialData }: AdminDashboardProps) {
  const [hourlyRate, setHourlyRate] = useState<number>(initialData.hourly_rate);
  const [services, setServices] = useState<Service[]>(initialData.services);

  const [editingId, setEditingId] = useState<string | number | null>(null);

  const saveRate = async (newRate: number) => {
    console.log("Sending new rate to backend = ", newRate);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/admin/shop-rate", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hourly_rate: newRate }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update: ${res.status}`);
      }

      alert("Shop rate updated successfully in database!");
    } catch (error) {
      console.error("Error saving rate:", error);
      alert("Failed to save rate. Check console.");
    }
  };

  return (
    <div className="p-8 bg-neutral-950 min-h-screen text-white font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
              Admin Dashboard
            </h1>
            <p className="text-neutral-400 text-sm">
              Manage shop rate and service menu.
            </p>
          </div>
        </div>

        {/* GLOBAL SETTINGS CARD */}
        <section className="mb-12 p-8 border border-neutral-800 rounded-2xl bg-neutral-900 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
              Global Shop Rate
            </h2>
            <p className="text-neutral-400 text-sm max-w-sm">
              Updating this rate instantly recalculates estimated prices for all
              services on the public menu.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xl font-mono text-neutral-500">$</span>
            <input
              type="number"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              className="bg-neutral-950 border border-neutral-700 rounded-lg px-4 py-3 text-2xl font-mono text-emerald-400 w-32 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            <button
              onClick={() => saveRate(hourlyRate)}
              className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg font-bold transition-colors"
            >
              Save Rate
            </button>
          </div>
        </section>

        {/* SERVICE MANAGEMENT LIST */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              Service Menu Previews
            </h2>
            <button className="text-sm font-semibold text-emerald-400 hover:text-emerald-300">
              + Add New Service
            </button>
          </div>

          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-neutral-800 rounded-xl bg-neutral-900 overflow-hidden"
              >
                {/* EDIT MODE */}
                {editingId === service.id ? (
                  <div className="p-6 bg-neutral-800/30 border-l-4 border-emerald-500">
                    <p className="text-sm text-emerald-400 font-semibold mb-4">
                      Editing Service
                    </p>
                    <div className="grid gap-4 mb-4">
                      <input
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
                        defaultValue={service.name}
                      />
                      <textarea
                        className="w-full bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none h-24"
                        defaultValue={service.description}
                      />
                      <div className="flex items-center gap-4">
                        <label className="text-sm text-neutral-400">
                          Est. Hours:
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          className="w-32 bg-neutral-950 border border-neutral-700 rounded p-3 text-white focus:border-emerald-500 outline-none"
                          defaultValue={service.estimated_hours}
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded font-bold text-sm">
                        Save Changes
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="bg-neutral-700 hover:bg-neutral-600 px-4 py-2 rounded font-bold text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* PREVIEW MODE */
                  <div className="p-6 md:p-8 hover:bg-neutral-800/50 transition-colors flex flex-col md:flex-row justify-between md:items-center gap-6">
                    <div className="max-w-xl">
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {service.name}
                      </h2>
                      <p className="text-neutral-400 text-sm leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                          <span className="text-xs text-neutral-500 uppercase">
                            Est. Time
                          </span>
                          <p className="text-sm font-mono text-neutral-300">
                            {service.estimated_hours} hrs
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-neutral-500 uppercase">
                            Preview Price
                          </span>
                          <p className="text-2xl font-mono text-white">
                            ${(service.estimated_hours * hourlyRate).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="pl-6 border-l border-neutral-800">
                        <button
                          onClick={() => setEditingId(service.id)}
                          className="text-neutral-400 hover:text-white transition-colors bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-lg text-sm font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
