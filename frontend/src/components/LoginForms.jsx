import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

const LoginForms = ({switchToSignup}) => {
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
      navigate("/dashboard");

    } catch (error) {
      setServerError(
        error.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-4 py-8">
      
      {/* 🔥 FORM CARD */}
      <div className="
        w-full max-w-md 
        p-6 sm:p-8 
        rounded-2xl 
        bg-white/5 backdrop-blur-xl 
        border border-white/10 
        shadow-[0_0_40px_rgba(139,92,246,0.15)]
      ">
        
        {/* 🔥 HEADER */}
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
          Welcome back
        </h1>

        <p className="text-gray-400 text-sm mb-6">
          Sign in to your account to continue.
        </p>

        {/* 🔴 ERROR */}
        {serverError && (
          <div className="mb-4 p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            {serverError}
          </div>
        )}

        {/* 🔥 FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* EMAIL */}
          <div>
            <label className="text-xs sm:text-sm text-gray-400">
              EMAIL
            </label>

            <input
              type="email"
              placeholder="you@example.com"
              {...register("email", { required: "Email is required" })}
              className="
                mt-2 w-full px-4 py-3 rounded-lg 
                bg-white/5 border border-white/10 
                text-white placeholder:text-gray-500 
                outline-none 
                focus:border-purple-400 
                focus:ring-2 focus:ring-purple-500/20 
                transition
              "
            />

            {errors.email && (
              <p className="text-red-400 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>


          <div>
            <label className="text-xs sm:text-sm text-gray-400">
              PASSWORD
            </label>

            <input
              type="password"
              placeholder="••••••••"
              {...register("password", { required: "Password is required" })}
              className="
                mt-2 w-full px-4 py-3 rounded-lg 
                bg-white/5 border border-white/10 
                text-white placeholder:text-gray-500 
                outline-none 
                focus:border-purple-400 
                focus:ring-2 focus:ring-purple-500/20 
                transition
              "
            />

            {errors.password && (
              <p className="text-red-400 text-xs mt-1">
                {errors.password.message}
              </p>
            )}

            <div className="text-right mt-2">
              <button
                type="button"
                className="text-xs sm:text-sm text-purple-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </div>


          <button
            type="submit"
            disabled={loading}
            className="
              w-full py-3 rounded-full 
              bg-gradient-to-r from-purple-400 to-[#C8B8F0]
              text-black font-medium 
              hover:scale-[1.02] hover:shadow-lg 
              transition-all duration-300 
              disabled:opacity-50
            "
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* 🔥 DIVIDER */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <span className="px-3 text-gray-500 text-xs">OR</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>


        <button
          className="
            w-full flex items-center justify-center gap-3 py-3 rounded-full 
            border border-white/10 text-white 
            hover:bg-white/5 hover:scale-[1.02] 
            transition-all duration-200
          "
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="w-5 h-5"
          />
          Continue with Google
        </button>


        <p className="text-center text-gray-400 text-xs sm:text-sm mt-6">
          Don’t have an account?{" "}
          <span
            onClick={switchToSignup}
            className="text-purple-400 cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginForms;