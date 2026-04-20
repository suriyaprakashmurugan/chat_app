"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  const handleUpdate = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully");
    }
  };

  return (
    <div className="flex flex-col gap-3 p-10 max-w-sm mx-auto">
      <h2 className="text-xl font-bold">Reset Password</h2>

      <input
        type="password"
        className="border p-2"
        placeholder="Enter new password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button
        className="bg-green-500 text-white p-2"
        onClick={handleUpdate}
      >
        Update Password
      </button>
    </div>
  );
}