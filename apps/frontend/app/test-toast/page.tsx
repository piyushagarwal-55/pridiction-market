"use client";

import { toast } from "sonner";

export default function TestToastPage() {
  return (
    <div className="min-h-screen bg-[#1F3D2B] p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-3xl font-bold text-[#f3ebdd] mb-8">Toast Test Page</h1>
        
        <button
          onClick={() => toast.error("Minimum bet is 5 USDT")}
          className="w-full px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
        >
          Test Error Toast (Min Bet)
        </button>

        <button
          onClick={() => toast.success("✅ Bet Placed Successfully!", {
            description: "YES • 10 USDT • Market: Test Market"
          })}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
        >
          Test Success Toast
        </button>

        <button
          onClick={() => toast.info("Processing transaction...")}
          className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Test Info Toast
        </button>

        <button
          onClick={() => toast("Custom message", {
            style: {
              background: '#1f3d2b',
              color: '#f3ebdd',
              border: '1px solid #c2a14d',
            }
          })}
          className="w-full px-4 py-3 bg-[#c2a14d] text-[#0a0e0c] rounded-lg font-semibold hover:bg-[#b08d57]"
        >
          Test Custom Styled Toast
        </button>
      </div>
    </div>
  );
}
