"use client";
import React, { useState } from "react";

type ModernMessageSettingsProps = {
  drafts: { [id: string]: string };
  onClose: () => void;
};

export default function ModernMessageSettings({ drafts, onClose }: ModernMessageSettingsProps) {
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState("system");
  const [aiModel, setAiModel] = useState("gpt-4");
  const [aiTemperature, setAiTemperature] = useState(0.5);
  const [apiKey, setApiKey] = useState<string>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem("openai_api_key") || "" : "")
  );

  function handleSave() {
    // Save settings to localStorage or backend as needed
    localStorage.setItem("msg_notifications", notifications ? "1" : "0");
    localStorage.setItem("msg_theme", theme);
    localStorage.setItem("msg_ai_model", aiModel);
    localStorage.setItem("msg_ai_temp", aiTemperature.toString());
    if (apiKey) localStorage.setItem("openai_api_key", apiKey);
    onClose();
  }

  return (
    <div className="max-w-md mx-auto bg-gray-50 p-6 rounded shadow">
      <h3 className="font-semibold mb-4 text-lg">Message Settings</h3>
      <div className="mb-4">
        <label className="block mb-1 font-medium">OpenAI API Key</label>
        <input
          type="password"
          className="border rounded px-2 py-1 w-full"
          placeholder="sk-..."
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
        />
        <a
          href="https://platform.openai.com/account/api-keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-xs mt-1 inline-block"
        >Get your API key</a>
      </div>
      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={notifications}
            onChange={e => setNotifications(e.target.checked)}
          />
          Enable notifications
        </label>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Theme</label>
        <select
          className="border rounded px-2 py-1"
          value={theme}
          onChange={e => setTheme(e.target.value)}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">AI Model</label>
        <select
          className="border rounded px-2 py-1"
          value={aiModel}
          onChange={e => setAiModel(e.target.value)}
        >
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">AI Creativity</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={aiTemperature}
          onChange={e => setAiTemperature(Number(e.target.value))}
        />
        <span className="ml-2 text-xs">{aiTemperature}</span>
      </div>
      <div className="mb-4">
        <label className="block mb-1 font-medium">Drafts (per conversation)</label>
        <ul className="max-h-24 overflow-y-auto text-xs bg-white border rounded p-2">
          {Object.entries(drafts).map(([id, value]) => (
            <li key={id} className="mb-1">
              <span className="font-mono">{id}</span>: <span className="text-gray-700">{value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2 mt-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleSave}
        >Save</button>
        <button
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded"
          onClick={onClose}
        >Cancel</button>
      </div>
    </div>
  );
}