"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AuthPage from "@/components/AuthPage";
import ChatPage from "@/components/ChatPage";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!session) return <AuthPage />;

  return (
    <div>
      <button onClick={() => supabase.auth.signOut()}>Logout</button>
      <ChatPage />
    </div>
  );
}
