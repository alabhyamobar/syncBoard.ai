import React, { useState } from "react";
import { useForm } from "react-hook-form";
import api from "../api/axios";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";

const SignInForms = ({ switchToLogin }) => {
  const { login } = useAuth();
  const navigate = useNavigate()

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

      navigate("/dashboard")

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
      

      <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-2">
        Create account
      </h1>

      <p className="text-gray-400 text-sm mb-6">
        Start your journey with us 🚀
      </p>


      {serverError && (
        <div className="mb-4 p-3 text-sm bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">


        <div>
          <label className="text-xs sm:text-sm text-gray-400">
            USERNAME
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
            className="mt-2 w-full px-4 py-3 rounded-lg 
            bg-white/5 border border-white/10 
            text-white placeholder:text-gray-500 
            outline-none 
            focus:border-purple-400 
            focus:ring-2 focus:ring-purple-500/20 
            transition"
          />

          {errors.username && (
            <p className="text-red-400 text-xs mt-1">
              {errors.username.message}
            </p>
          )}
        </div>


        <div>
          <label className="text-xs sm:text-sm text-gray-400">
            EMAIL
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
            className="mt-2 w-full px-4 py-3 rounded-lg 
            bg-white/5 border border-white/10 
            text-white placeholder:text-gray-500 
            outline-none 
            focus:border-purple-400 
            focus:ring-2 focus:ring-purple-500/20 
            transition"
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
              className="mt-2 w-full px-4 py-3 rounded-lg 
              bg-white/5 border border-white/10 
              text-white placeholder:text-gray-500 
              outline-none 
              focus:border-purple-400 
              focus:ring-2 focus:ring-purple-500/20 
              transition"
            />


            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {errors.password && (
            <p className="text-red-400 text-xs mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-full 
          bg-gradient-to-r from-purple-400 to-purple-600 
          text-black font-medium 
          hover:scale-[1.02] hover:shadow-lg 
          transition-all duration-300 
          disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      {/* DIVIDER */}
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        <span className="px-3 text-gray-500 text-xs">OR</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      {/* GOOGLE */}
      <button className="w-full flex items-center justify-center gap-3 py-3 rounded-full 
        border border-white/10 text-white 
        hover:bg-white/5 hover:scale-[1.02] 
        transition-all duration-200">
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="google"
          className="w-5 h-5"
        />
        Continue with Google
      </button>

      {/* FOOTER */}
      <p className="text-center text-gray-400 text-xs sm:text-sm mt-6">
        Already have an account?{" "}
        <span
          onClick={switchToLogin}
          className="text-purple-400 cursor-pointer hover:underline"
        >
          Login
        </span>
      </p>
    </div>
  );
};

export default SignInForms;