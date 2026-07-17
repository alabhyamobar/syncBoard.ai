import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api";
import { useAuth } from "../hooks";
import { useNavigate } from "react-router-dom";
import { BACKEND_URL } from "../api/axios";

const SignInForms = ({ switchToLogin }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError("");

    try {
      const res = await api.post("/auth/register", data);
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
        error.response?.data?.message || "Signup failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white mb-1">
        Create account
      </h1>

      <p className="text-black/60 dark:text-zinc-400 font-bold text-xs uppercase mb-6 tracking-wide">
        Start your journey with us 🚀
      </p>

      {serverError && (
        <div className="mb-4 p-3.5 text-sm font-bold bg-red-100 border-[3px] border-red-500 text-red-700 shadow-[3px_3px_0px_0px_#ef4444]">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Username
          </label>
          <input
            type="text"
            placeholder="your_username"
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Minimum 3 characters",
              },
            })}
            className="w-full px-4 py-3 border-[3px] border-neon-border bg-card-bg text-black dark:text-white font-semibold placeholder:text-black/30 dark:placeholder:text-zinc-400 outline-none shadow-[3px_3px_0px_0px_var(--shadow-pink)] focus:shadow-[5px_5px_0px_0px_var(--shadow-pink)] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all"
          />
          {errors.username && (
            <p className="text-red-650 font-bold text-xs mt-2 uppercase tracking-wide">
              {errors.username.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Invalid email format",
              },
            })}
            className="w-full px-4 py-3 border-[3px] border-neon-border bg-card-bg text-black dark:text-white font-semibold placeholder:text-black/30 dark:placeholder:text-zinc-400 outline-none shadow-[3px_3px_0px_0px_var(--shadow-pink)] focus:shadow-[5px_5px_0px_0px_var(--shadow-pink)] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all"
          />
          {errors.email && (
            <p className="text-red-650 font-bold text-xs mt-2 uppercase tracking-wide">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Minimum 6 characters",
                },
              })}
              className="w-full px-4 py-3 border-[3px] border-neon-border bg-card-bg text-black dark:text-white font-semibold placeholder:text-black/30 dark:placeholder:text-zinc-400 outline-none shadow-[3px_3px_0px_0px_var(--shadow-pink)] focus:shadow-[5px_5px_0px_0px_var(--shadow-pink)] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black dark:text-purple-400 font-bold text-xs uppercase hover:underline dark:hover:text-purple-300 cursor-pointer"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {errors.password && (
            <p className="text-red-650 font-bold text-xs mt-2 uppercase tracking-wide">
              {errors.password.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-purple-300 dark:bg-purple-500 border-[3px] border-neon-border font-black uppercase tracking-wider text-black dark:text-black shadow-[4px_4px_0px_0px_var(--shadow-cyan)] hover:shadow-[6px_6px_0px_0px_var(--shadow-cyan)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_var(--shadow-cyan)] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
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
        className="w-full flex items-center justify-center gap-3 py-3 border-[3px] border-neon-border bg-card-bg text-black dark:text-white font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_var(--shadow-cyan)] hover:shadow-[6px_6px_0px_0px_var(--shadow-cyan)] active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_var(--shadow-cyan)] transition-all cursor-pointer"
      >
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      <p className="text-center text-black/80 dark:text-zinc-300 font-bold text-xs sm:text-sm mt-6 uppercase tracking-wide">
        Already have an account?{" "}
        <span
          onClick={switchToLogin}
          className="text-purple-600 dark:text-purple-400 underline cursor-pointer hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
        >
          Login
        </span>
      </p>
    </div>
  );
};

export default SignInForms;