import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../hooks";

const AcceptInvite = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workspaceInfo, setWorkspaceInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const fetchInviteInfo = async () => {
      try {
        const res = await api.get(`/workspace/invite-info/${token}`);
        if (res.data?.workspace) {
          setWorkspaceInfo(res.data.workspace);
        }
      } catch (err) {
        console.error("Error fetching invite info:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load invitation details. The invitation link may be invalid or expired."
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchInviteInfo();
    }
  }, [token]);

  const handleAccept = async () => {
    setProcessing(true);
    setError("");
    try {
      await api.patch(`/workspace/accept-invite/${token}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError(
        err.response?.data?.message || "Failed to accept the invitation."
      );
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    setProcessing(true);
    setError("");
    try {
      await api.delete(`/workspace/decline-invite/${token}`);
      navigate("/dashboard");
    } catch (err) {
      console.error("Error declining invite:", err);
      setError(
        err.response?.data?.message || "Failed to decline the invitation."
      );
      setProcessing(false);
    }
  };

  const handleAuthRedirect = () => {
    localStorage.setItem("pendingInviteToken", token);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-main-bg flex flex-col justify-center items-center p-6 selection:bg-cyan-300 font-sans transition-colors duration-200">
      <div className="max-w-md w-full bg-card-bg border-[4px] border-neon-border shadow-[6px_6px_0px_0px_var(--shadow-purple)] sm:shadow-[8px_8px_0px_0px_var(--shadow-purple)] p-6 sm:p-8 text-center space-y-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
          Workspace Invitation
        </h1>

        {loading ? (
          <div className="py-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-black dark:border-white border-t-purple-400 dark:border-t-purple-500 rounded-full animate-spin"></div>
            <p className="text-sm font-bold uppercase text-zinc-500">Loading Invitation...</p>
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-100 dark:bg-red-950/45 border-2 border-red-500 text-red-700 dark:text-red-300 font-black text-sm uppercase">
              {error}
            </div>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/")}
              className="w-full py-3 bg-card-bg border-[3px] border-neon-border text-black dark:text-white font-black uppercase text-sm shadow-[3px_3px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
            >
              {user ? "Go to Dashboard" : "Go to Sign In"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-bold text-zinc-650 dark:text-zinc-400 uppercase tracking-wide">
                You have been invited by <span className="font-extrabold text-black dark:text-white underline">{workspaceInfo?.invitedBy}</span> to join:
              </p>
              <div className="p-4 bg-cyan-100 dark:bg-cyan-950/45 border-[3px] border-neon-border font-black text-xl text-black dark:text-white uppercase tracking-wide shadow-[3px_3px_0px_0px_var(--shadow-purple)]">
                🏢 {workspaceInfo?.name}
              </div>
            </div>

            {user ? (
              <div className="space-y-6">
                <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p>Logged in as: <span className="font-black text-black dark:text-white">{user.email}</span></p>
                  {workspaceInfo?.email && user.email.toLowerCase() !== workspaceInfo.email.toLowerCase() && (
                    <div className="p-2.5 bg-orange-100 dark:bg-orange-950/40 border border-orange-500 text-orange-850 dark:text-orange-355 font-bold uppercase text-[10px] tracking-tight leading-tight">
                      ⚠️ Note: This invite was sent to {workspaceInfo.email}.
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleDecline}
                    disabled={processing}
                    className="flex-1 py-3 bg-card-bg border-[3px] border-neon-border text-black dark:text-white font-black uppercase text-sm hover:bg-zinc-50 dark:hover:bg-hover-bg hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_var(--shadow-purple)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={processing}
                    className="flex-1 py-3 bg-purple-300 dark:bg-purple-600 border-[3px] border-neon-border text-black dark:text-white font-black uppercase text-sm shadow-[3px_3px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    {processing ? "Joining..." : "Accept & Join"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-amber-105 dark:bg-amber-950/30 border-2 border-dashed border-amber-600 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase leading-tight">
                  Please log in or sign up to accept this invitation.
                </div>
                <button
                  onClick={handleAuthRedirect}
                  className="w-full py-3.5 bg-cyan-300 border-[3px] border-neon-border font-black uppercase text-sm text-black shadow-[4px_4px_0px_0px_var(--shadow-white)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_var(--shadow-white)] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                >
                  Log In or Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;
