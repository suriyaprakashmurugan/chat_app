"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import GoogleLoginButton from "./GoogleLoginButton";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) alert(error.message);
    else alert("Check your email!");
  };

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) alert(error.message);
  };

  // const resetPassword = async () => {
  //   setLoading(true);
  //   const { error } = await supabase.auth.resetPasswordForEmail(email, {
  //     redirectTo: "http://localhost:3000/update-password",
  //   });
  //   setLoading(false);

  //   if (error) alert(error.message);
  //   else alert("Check your email to reset password");
  // };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <h1 className="text-3xl font-bold text-center mb-2 text-slate-900 dark:text-white">
            Chat App
          </h1>
          <p className="text-center text-slate-600 dark:text-slate-400 mb-8">
            Sign in to your account
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <input
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
                type="email"
                onChange={(e) => setEmail(e.target.value)}
                value={email}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <input
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="password"
                placeholder="••••••••"
                onChange={(e) => setPassword(e.target.value)}
                value={password}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading || !email || !password}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? "Loading..." : "Login"}
            </button>

            <button
              onClick={handleSignup}
              disabled={loading || !email || !password}
              className="w-full bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-slate-900 dark:text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? "Loading..." : "Sign Up"}
            </button>

            {/* <button
              onClick={resetPassword}
              disabled={loading || !email}
              className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 transition-colors duration-200"
            >
              Forgot Password?
            </button> */}
            <a href="/forgot-password" className="text-blue-500 text-sm">
              Forgot Password?
            </a>
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </div>
  );
}
