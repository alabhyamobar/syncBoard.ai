import React, { useState } from "react";
import { motion } from "framer-motion";
import LoginForms from "../components/LoginForms";
import SignInForms from "../components/SignInForms";
import { useTheme } from "../hooks";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen flex bg-[#FAF8F5] dark:bg-[#121214] overflow-hidden relative font-sans text-black dark:text-white transition-colors duration-200">
      
      {/* Theme Toggle Button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-white dark:bg-zinc-800 border-[3px] border-black dark:border-white text-black dark:text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Logo block */}
      <div className="absolute top-6 left-6 z-20 bg-cyan-300 border-[3px] border-black dark:border-white px-5 py-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] rotate-[-2deg] transition-all duration-200">
        <h1 className="text-black text-lg sm:text-xl font-black tracking-tight uppercase">
          syncboard<span className="text-purple-600 dark:text-purple-400">.ai</span>
        </h1>
      </div>
 
      {/* LEFT VISUAL PANEL */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-12 bg-purple-300 dark:bg-purple-950/60 border-r-[4px] border-black dark:border-white relative transition-colors duration-200">
        {/* Brutalist polka dot background pattern */}
        <div 
          className="absolute inset-0 opacity-15 dark:opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'radial-gradient(var(--pattern-dot) 20%, transparent 20%), radial-gradient(var(--pattern-dot) 20%, transparent 20%)', 
            backgroundPosition: '0 0, 10px 10px', 
            backgroundSize: '20px 20px' 
          }}
        />
        {/* Floating Brutalist Sticker Badges */}
        <div className="absolute top-12 left-12 rotate-[-6deg] bg-orange-300 border-[3px] border-black font-black uppercase text-xs px-3.5 py-2 shadow-[4px_4px_0px_0px_#000] hover:scale-105 hover:-rotate-[4deg] transition-all duration-150 cursor-default select-none text-black z-15 wobble-hover">
          ⚡ COLLABORATE
        </div>
        <div className="absolute bottom-12 right-12 rotate-[8deg] bg-pink-300 border-[3px] border-black font-black uppercase text-xs px-3.5 py-2 shadow-[4px_4px_0px_0px_#000] hover:scale-105 hover:rotate-[6deg] transition-all duration-150 cursor-default select-none text-black z-15 wobble-hover">
          🎨 DESIGN & BUILD
        </div>
        <div className="relative border-[4px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#1a1435] p-6 shadow-[10px_10px_0px_0px_#000] dark:shadow-[10px_10px_0px_0px_#22d3ee] max-w-md rotate-[1deg] transition-all duration-200">
          <img
            src="https://plus.unsplash.com/premium_vector-1721569648469-97f6c6017148?w=600&auto=format&fit=crop&q=60"
            alt="auth visual"
            className="w-full border-[3px] border-black dark:border-[#8b5cf6] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fde047] mb-6 transition-all duration-200"
          />
          <h2 className="text-2xl font-extrabold text-black dark:text-white uppercase tracking-tight mb-2">Real-time Collab Board</h2>
          <p className="text-black/80 dark:text-zinc-300 font-medium">Design, think, and sync with your team instantly. High-performance canvases for modern teams.</p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-[#FAF8F5] dark:bg-[#0f0a1c] relative transition-colors duration-200">
        {/* Decorative background grid elements for right side */}
        <div 
          className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none" 
          style={{ 
            backgroundImage: 'linear-gradient(to right, var(--pattern-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--pattern-grid) 1px, transparent 1px)', 
            backgroundSize: '40px 40px' 
          }}
        />
        
        <motion.div
          key={isLogin ? "login" : "signup"} 
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-md p-8 bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#ec4899] transition-all duration-200"
        >
          {isLogin ? (
            <LoginForms switchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignInForms switchToLogin={() => setIsLogin(true)} />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
