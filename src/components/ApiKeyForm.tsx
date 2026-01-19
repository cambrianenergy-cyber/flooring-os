import React, { useState } from "react";

interface ApiKeyFormProps {
  apiKey: string;
  onSave: (key: string) => void;
}

export default function ApiKeyForm({ apiKey, onSave }: ApiKeyFormProps) {
  const [key, setKey] = useState(apiKey || "");
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div className="bg-white p-4 rounded shadow mb-6 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold mb-2">OpenAI API Key</h2>
      <input
        type="text"
        className="border rounded px-2 py-1 w-full mb-2"
        placeholder="sk-..."
        value={key}
        onChange={e => setKey(e.target.value)}
      />
      <div className="flex gap-2 mb-2">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() => onSave(key)}
          disabled={!key.startsWith("sk-")}
        >
          Save API Key
        </button>
        <button
          className="text-blue-600 underline px-2"
          type="button"
          onClick={() => setShowInstructions(v => !v)}
        >
          {showInstructions ? "Hide" : "How to get your key?"}
        </button>
      </div>
      {showInstructions && (
        <div className="bg-gray-50 border rounded p-2 text-sm">
          <ol className="list-decimal ml-5">
            <li>Go to <a href="https://platform.openai.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">OpenAI API Keys</a> and log in.</li>
            <li>Click <b>Create new secret key</b>.</li>
            <li>Copy the key (starts with <b>sk-</b>).</li>
            <li>Paste it above and click <b>Save API Key</b>.</li>
          </ol>
        </div>
      )}
    </div>
  );
}
