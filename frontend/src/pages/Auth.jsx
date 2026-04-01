import React, { useState } from "react";
import { motion } from "framer-motion";
import LoginForms from "../components/LoginForms";
import SignInForms from "../components/SignInForms";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0b0b0f] via-[#0d0d12] to-[#0b0b0f] overflow-hidden relative">

      <div className="absolute top-6 left-6 z-20">
        <h1
          className="text-white text-lg sm:text-xl font-semibold tracking-tight 
drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]"
        >
          syncboard<span className="text-purple-400">.ai</span>
        </h1>
      </div>

      {/* LEFT IMAGE */}
      <div className="hidden md:block w-1/2 relative overflow-hidden group">
        <div className="absolute w-[500px] h-[500px] bg-purple-500/20 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10"></div>

        <img
          src="https://plus.unsplash.com/premium_vector-1721569648469-97f6c6017148?w=600&auto=format&fit=crop&q=60"
          alt="auth visual"
          className="h-full w-full object-cover scale-105 animate-[zoom_20s_ease-in-out_infinite]"
        />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full md:w-1/2 flex items-center justify-center relative">
        <div className="absolute w-[400px] h-[400px] bg-purple-500/20 blur-[120px] rounded-full"></div>

        <motion.div
          key={isLogin ? "login" : "signup"} // 🔥 smooth switch animation
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md p-8 rounded-2xl 
          bg-white/5 backdrop-blur-xl 
          border border-white/10 
          shadow-[0_0_40px_rgba(139,92,246,0.15)]"
        >
          {isLogin ? (
            <LoginForms switchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignInForms switchToLogin={() => setIsLogin(true)} />
          )}
        </motion.div>
      </div>

      {/* 🔥 Zoom Animation */}
      <style>
        {`
          @keyframes zoom {
            0%, 100% { transform: scale(1.05); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
    </div>
  );
};

export default Auth;
