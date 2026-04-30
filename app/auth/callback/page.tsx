"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      await supabase.auth.getSession();
      router.push("/"); // redirect to chat/home
    };

    handleAuth();
  }, []);

  return <p className="p-5">Logging you in...</p>;
}