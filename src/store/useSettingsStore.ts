import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AppSettings } from "../types";

const defaultSettings: AppSettings = {
    aiProvider: "openai",
    openaiApiKey: "",
    openaiModel: "gpt-4o-mini",
    geminiApiKey: "",
    geminiModel: "gemini-2.0-flash",
    searchSources: {
        cake: true,
        job104: true,
    },
    userName: "Mengru Lai",
    userEmail: "mengru0503@gmail.com",
    userLocation: "台北市",
    userJobTitle: "積極求職中",
};

interface SettingsStore {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
    persist(
        (set) => ({
            settings: defaultSettings,
            updateSettings: (updates) =>
                set((state) => ({ settings: { ...state.settings, ...updates } })),
            resetSettings: () => set({ settings: defaultSettings }),
        }),
        {
            name: "ai-job-navigator-settings",
        }
    )
);
