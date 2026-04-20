"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for reset link");
    }
  };

  return (
    <div className="flex flex-col gap-3 p-10 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">Forgot Password</h2>

      <input
        className="border p-2"
        placeholder="Enter your email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white p-2"
        onClick={handleReset}
      >
        Send Reset Link
      </button>
    </div>
  );
}