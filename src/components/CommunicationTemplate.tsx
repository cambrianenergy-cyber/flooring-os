"use client";
import React from "react";

interface CommunicationTemplateProps {
  recipient: string;
  subject: string;
  message: string;
  sender?: string;
}

export default function CommunicationTemplate({ recipient, subject, message, sender }: CommunicationTemplateProps) {
  return (
    <div className="max-w-lg mx-auto p-4 border rounded bg-white">
      <h2 className="text-xl font-bold mb-2">Message to {recipient}</h2>
      <div className="mb-2">Subject: <span className="font-semibold">{subject}</span></div>
      <div className="mb-4">{message}</div>
      {sender && <div className="mt-2 text-xs text-gray-500">Sent by: {sender}</div>}
    </div>
  );
}
