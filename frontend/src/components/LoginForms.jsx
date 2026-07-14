import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks";
import { BACKEND_URL } from "../api/axios";

const LoginForms = ({ switchToSignup }) => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await api.post("/auth/login", data);
      const { accessToken, user } = res.data;
      login({ accessToken, user });
      const redirectPath = localStorage.getItem("redirect_after_login");
      if (redirectPath) {
        localStorage.removeItem("redirect_after_login");
        navigate(redirectPath);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      setServerError(
        error.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
        Welcome back
      </h1>

      <p className="text-black/60 dark:text-zinc-400 font-bold text-xs uppercase mb-6 tracking-wide">
        Sign in to your account to continue
      </p>

      {serverError && (
        <div className="mb-4 p-3.5 text-sm font-bold bg-red-100 border-[3px] border-red-500 text-red-700 shadow-[3px_3px_0px_0px_#ef4444]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            {...register("email", { required: "Email is required" })}
            className="w-full px-4 py-3 border-[3px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#251d4a] text-black dark:text-white font-semibold placeholder:text-black/30 dark:placeholder:text-zinc-400 outline-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] focus:shadow-[5px_5px_0px_0px_#000] dark:focus:shadow-[5px_5px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all"
          />
          {errors.email && (
            <p className="text-red-600 font-bold text-xs mt-2 uppercase tracking-wide">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            {...register("password", { required: "Password is required" })}
            className="w-full px-4 py-3 border-[3px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#251d4a] text-black dark:text-white font-semibold placeholder:text-black/30 dark:placeholder:text-zinc-400 outline-none shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] focus:shadow-[5px_5px_0px_0px_#000] dark:focus:shadow-[5px_5px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all"
          />
          {errors.password && (
            <p className="text-red-600 font-bold text-xs mt-2 uppercase tracking-wide">
              {errors.password.message}
            </p>
          )}

          <div className="text-right mt-2.5">
            <button
              type="button"
              className="text-xs font-bold text-black dark:text-zinc-300 uppercase underline hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-cyan-300 border-[3px] border-black dark:border-white font-black uppercase tracking-wider text-black dark:text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#8b5cf6] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#8b5cf6] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#8b5cf6] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center my-6">
        <div className="flex-1 h-[2px] bg-black dark:bg-zinc-700"></div>
        <span className="px-3 text-black dark:text-zinc-400 font-black text-xs uppercase tracking-wider">OR</span>
        <div className="flex-1 h-[2px] bg-black dark:bg-zinc-700"></div>
      </div>

      <button
        onClick={() => {
          window.location.href = `${BACKEND_URL}/api/auth/google`;
        }}
        className="w-full flex items-center justify-center gap-3 py-3 border-[3px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#1a1435] text-black dark:text-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#22d3ee] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#22d3ee] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#22d3ee] transition-all cursor-pointer"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      <p className="text-center text-black/80 dark:text-zinc-300 font-bold text-xs sm:text-sm mt-6 uppercase tracking-wide">
        Don’t have an account?{" "}
        <span
          onClick={switchToSignup}
          className="text-purple-600 dark:text-purple-400 underline cursor-pointer hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
        >
          Sign up
        </span>
      </p>
    </div>
  );
};

export default LoginForms;