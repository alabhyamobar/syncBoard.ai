import React, { useState, useEffect, useRef } from "react";
import api from "../api";
import { useAuth, useTheme } from "../hooks";
import { useNavigate } from "react-router-dom";
import "./DashBoard.css";

const DashBoard = () => {
  const { user, logout, logoutAll } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tabs and data aggregation states
  const [activeTab, setActiveTab] = useState("workspaces");
  const [allDocuments, setAllDocuments] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [allInvites, setAllInvites] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    workspaces: "",
    projects: "",
    members: "",
    invites: ""
  });

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  const handleLogoutAll = async () => {
    setShowProfileMenu(false);
    await logoutAll();
  };

  // Invite states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedWorkspaceForInvite, setSelectedWorkspaceForInvite] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("VIEWER");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspace");
      if (res.data && res.data.workspaces) {
        setWorkspaces(res.data.workspaces);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    }
  };

  const fetchAllProjects = async (currentWorkspaces = workspaces) => {
    if (!currentWorkspaces || currentWorkspaces.length === 0) return;
    setLoadingDocs(true);
    try {
      const docPromises = currentWorkspaces.map(ws => {
        const wsId = ws.workspaceId?._id || ws.workspaceId;
        const wsName = ws.workspaceId?.name || "Unknown";
        return api.get(`/document/workspace/${wsId}`)
          .then(res => {
            return (res.data.data || []).map(doc => ({
              ...doc,
              workspaceName: wsName,
              workspaceId: wsId
            }));
          })
          .catch(err => {
            console.error("Error fetching docs for ws:", wsId, err);
            return [];
          });
      });
      const results = await Promise.all(docPromises);
      setAllDocuments(results.flat());
    } catch (error) {
      console.error("Error aggregating projects:", error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchAllMembers = async (currentWorkspaces = workspaces) => {
    if (!currentWorkspaces || currentWorkspaces.length === 0) return;
    setLoadingMembers(true);
    try {
      const memberPromises = currentWorkspaces.map(ws => {
        const wsId = ws.workspaceId?._id || ws.workspaceId;
        const wsName = ws.workspaceId?.name || "Unknown";
        return api.get(`/workspace/${wsId}/members`)
          .then(res => {
            return (res.data.members || []).map(m => ({
              ...m,
              workspaceName: wsName,
              workspaceId: wsId
            }));
          })
          .catch(err => {
            console.error("Error fetching members for ws:", wsId, err);
            return [];
          });
      });
      const results = await Promise.all(memberPromises);
      const uniqueUsersMap = {};
      results.flat().forEach(m => {
        const key = m.userId?._id || m.email;
        if (!key) return;
        if (!uniqueUsersMap[key]) {
          uniqueUsersMap[key] = {
            userId: m.userId,
            email: m.email || m.userId?.email,
            username: m.userId?.username || m.email?.split('@')[0] || "Teammate",
            workspaces: []
          };
        }
        uniqueUsersMap[key].workspaces.push({
          workspaceName: m.workspaceName,
          role: m.role,
          status: m.status
        });
      });
      setAllMembers(Object.values(uniqueUsersMap));
    } catch (error) {
      console.error("Error aggregating members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAllInvites = async () => {
    setLoadingInvites(true);
    try {
      const res = await api.get("/workspace/invites");
      if (res.data && res.data.invites) {
        setAllInvites(res.data.invites);
      }
    } catch (error) {
      console.error("Error fetching invites:", error);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleAcceptInvite = async (inviteToken) => {
    try {
      await api.patch(`/workspace/accept-invite/${inviteToken}`);
      fetchWorkspaces();
      fetchAllInvites();
    } catch (error) {
      console.error("Error accepting invite:", error);
    }
  };

  const handleDeclineInvite = async (inviteToken) => {
    try {
      await api.delete(`/workspace/decline-invite/${inviteToken}`);
      fetchAllInvites();
    } catch (error) {
      console.error("Error declining invite:", error);
    }
  };

  useEffect(() => {
    const pendingToken = localStorage.getItem("pendingInviteToken");
    if (pendingToken) {
      localStorage.removeItem("pendingInviteToken");
      navigate(`/accept-invite/${pendingToken}`);
      return;
    }
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (workspaces && workspaces.length > 0) {
      fetchAllProjects(workspaces);
      fetchAllMembers(workspaces);
      fetchAllInvites();
    }
  }, [workspaces]);

  const addWorkspace = async () => {
    if (!name.trim()) return;
    try {
      await api.post("/workspace", { name });
      setName("");
      setShowModal(false);
      fetchWorkspaces(); 
    } catch (error) {
      console.error("Error creating workspace:", error);
    }
  };

  const inviteMemberToWorkspace = async () => {
    if (!inviteEmail.trim()) return;
    setInviteError("");
    setInviteSuccess("");
    try {
      await api.post(`/workspace/${selectedWorkspaceForInvite._id}/members/invite`, {
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteSuccess("Member successfully invited!");
      setInviteEmail("");
      setInviteRole("VIEWER");
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Error inviting member:", error);
      setInviteError(
        error.response?.data?.message || "Failed to send invitation. Make sure the user exists."
      );
    }
  };

  const avatarColors = ["bg-purple-300", "bg-orange-300", "bg-emerald-300", "bg-cyan-300", "bg-rose-300"];

  const filteredWorkspaces = workspaces.filter(m => 
    (m.workspaceId?.name || "").toLowerCase().includes(searchQueries.workspaces.toLowerCase())
  );
  
  const filteredProjects = allDocuments.filter(doc => 
    (doc.title || "").toLowerCase().includes(searchQueries.projects.toLowerCase()) || 
    (doc.workspaceName || "").toLowerCase().includes(searchQueries.projects.toLowerCase())
  );
  
  const filteredMembers = allMembers.filter(m => 
    (m.username || "").toLowerCase().includes(searchQueries.members.toLowerCase()) || 
    (m.email || "").toLowerCase().includes(searchQueries.members.toLowerCase())
  );
  
  const filteredInvites = allInvites.filter(inv => 
    (inv.workspaceId?.name || "").toLowerCase().includes(searchQueries.invites.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#FAF8F5] dark:bg-[#121214] text-black dark:text-white overflow-hidden selection:bg-cyan-300 font-sans relative transition-colors duration-200">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav className={`
        fixed md:relative z-50 flex flex-col 
        w-[280px] h-full 
        bg-white dark:bg-[#150e2a] border-r-[4px] border-black dark:border-[#8b5cf6]
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Logo */}
        <div className="p-6 border-b-[4px] border-black dark:border-[#8b5cf6] flex items-center justify-between bg-cyan-300">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black dark:bg-[#ec4899] flex items-center justify-center border-2 border-white dark:border-[#8b5cf6] shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fff]">
              <span className="font-extrabold text-white dark:text-white text-xs tracking-tighter uppercase">SB</span>
            </div>
            <span className="font-black text-lg tracking-tight uppercase text-black">
              syncboard<span className="text-purple-600 dark:text-purple-400">.ai</span>
            </span>
          </div>
          <button 
            className="md:hidden text-black hover:text-purple-600 transition-colors cursor-pointer"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          <div>
            <div className="px-4 text-xs font-black tracking-wider text-black/40 dark:text-zinc-500 uppercase mb-4">
              Overview
            </div>
            <div className="space-y-3">
              {[
                { id: "workspaces", label: "Workspaces", count: workspaces.length },
                { id: "projects", label: "Projects", count: allDocuments.length },
                { id: "members", label: "Members", count: allMembers.length },
                { id: "invites", label: "Invites", count: allInvites.length }
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full px-4 py-3 border-[3px] border-black dark:border-[#8b5cf6] flex justify-between items-center font-black uppercase transition-all cursor-pointer ${
                      isActive
                        ? "bg-purple-300 dark:bg-purple-600 text-black dark:text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#06b6d4] translate-x-[-2px] translate-y-[-2px]"
                        : "bg-white dark:bg-[#1a1435] text-black dark:text-white hover:bg-cyan-50 dark:hover:bg-[#251d4a] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#ec4899] active:translate-x-0 active:translate-y-0 active:shadow-none"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="text-xs bg-white dark:bg-zinc-800 border-2 border-black dark:border-[#8b5cf6] text-black dark:text-white px-2.5 py-0.5 font-bold shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#06b6d4]">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card */}
        <div ref={profileMenuRef} className="relative mx-4 mb-4">
          {showProfileMenu && (
            <div className="absolute bottom-[calc(100%+10px)] left-0 right-0 bg-white dark:bg-[#1a1435] border-[3px] border-black dark:border-[#8b5cf6] shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#ec4899] z-50 p-2.5 space-y-2 select-none">
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2.5 border-[2px] border-black dark:border-[#8b5cf6] bg-yellow-100 hover:bg-yellow-200 dark:bg-[#251d4a] dark:hover:bg-[#322765] font-black uppercase text-xs tracking-wider transition-all cursor-pointer text-black dark:text-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#8b5cf6] active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Log Out
              </button>
              <button
                onClick={handleLogoutAll}
                className="w-full text-left px-3.5 py-2.5 border-[2px] border-black dark:border-red-500 bg-red-100 hover:bg-red-200 dark:bg-red-950/45 dark:hover:bg-red-950/70 font-black uppercase text-xs tracking-wider transition-all cursor-pointer text-red-600 dark:text-red-400 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#ef4444] dark:hover:shadow-[3px_3px_0px_0px_#ef4444] active:translate-x-0 active:translate-y-0 active:shadow-none"
              >
                Log Out All Devices
              </button>
            </div>
          )}

          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-4 border-[3px] border-black dark:border-[#8b5cf6] bg-emerald-300 dark:bg-emerald-500 text-black dark:text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fde047] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fde047] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#fde047] transition-all cursor-pointer flex items-center gap-3 select-none"
          >
            <div className="w-10 h-10 border-[2px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#1a1435] flex items-center justify-center shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#fde047] overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-cyan-200 dark:bg-cyan-300 text-black dark:text-black flex items-center justify-center text-xs font-black uppercase">
                  {user?.username ? user.username.slice(0, 2) : "U"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-black dark:text-black">
              <p className="text-sm font-black truncate">{user?.username || "User"}</p>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white dark:bg-cyan-100 px-1.5 py-0.5 border border-black dark:border-black shadow-[1px_1px_0px_0px_#000] dark:shadow-[1px_1px_0px_0px_#000] text-black dark:text-black">Free plan</span>
                <svg className={`w-3.5 h-3.5 transition-transform duration-200 text-black ${showProfileMenu ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Topbar */}
        <header className="flex justify-between items-center px-6 lg:px-10 py-5 border-b-[4px] border-black dark:border-[#8b5cf6] bg-white dark:bg-[#150e2a] sticky top-0 z-20 transition-colors duration-200">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-black dark:text-white hover:text-purple-600 rounded-lg transition-colors border-2 border-transparent active:border-black"
              onClick={() => setIsSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">
              {activeTab === "workspaces" && "Workspaces"}
              {activeTab === "projects" && "Canvases"}
              {activeTab === "members" && "Teammates"}
              {activeTab === "invites" && "Invitations"}
            </h1>
          </div>

          <div className="flex gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 bg-white dark:bg-zinc-800 border-[3px] border-black dark:border-[#8b5cf6] text-black dark:text-white shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#22d3ee] hover:shadow-[5px_5px_0px_0px_#000] dark:hover:shadow-[5px_5px_0px_0px_#22d3ee] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <div className="relative hidden sm:block">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchQueries[activeTab] || ""}
                onChange={(e) => setSearchQueries(prev => ({ ...prev, [activeTab]: e.target.value }))}
                className="w-[200px] lg:w-[280px] bg-white dark:bg-[#221a48] border-[3px] border-black dark:border-[#8b5cf6] pl-10 pr-4 py-2.5 text-sm text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-zinc-400 font-bold shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#ec4899] focus:shadow-[4px_4px_0px_0px_#000] dark:focus:shadow-[4px_4px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 outline-none transition-all"
                placeholder={`Search ${activeTab}...`}
              />
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-cyan-300 border-[3px] border-black dark:border-white font-black uppercase text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#fff] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#fff] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#fff] transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">New</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-[#FAF8F5] dark:bg-[#0f0a1c] transition-colors duration-200 relative">
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none" 
            style={{ 
              backgroundImage: 'linear-gradient(to right, var(--pattern-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--pattern-grid) 1px, transparent 1px)', 
              backgroundSize: '30px 30px' 
            }}
          />
          
          {/* Personalized Welcome Banner */}
          <div className="border-[4px] border-black dark:border-white bg-cyan-300 dark:bg-cyan-400 p-6 mb-10 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#8b5cf6] relative overflow-hidden transition-all duration-200 text-black dark:text-black">
            <div 
              className="absolute inset-0 opacity-[0.08] pointer-events-none" 
              style={{ 
                backgroundImage: 'radial-gradient(#000000 18%, transparent 18%)', 
                backgroundSize: '8px 8px' 
              }}
            />
            <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none text-9xl font-black select-none z-0">Sync</div>
            <h2 className="text-3xl font-black uppercase tracking-tight mb-2 text-black dark:text-black relative z-10">Welcome Back, {user?.username || "Builder"}!</h2>
            <p className="font-bold text-sm text-black/80 dark:text-black/70 max-w-2xl relative z-10">
              Logged in as <span className="underline">{user?.email}</span>. Here is your collaborative board manager. Create workspaces, configure active boards, and invite teammates to co-create in real-time.
            </p>
          </div>

          {activeTab === "workspaces" && (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {[
                  { label: "Total Workspaces", value: workspaces.length, color: "bg-[#FF87B2] dark:shadow-[6px_6px_0px_0px_#06b6d4]" },
                  { label: "Owned Workspaces", value: workspaces.filter(w => w.role === 'OWNER').length, color: "bg-[#60A5FA] dark:shadow-[6px_6px_0px_0px_#ec4899]" },
                  { label: "Shared Workspaces", value: workspaces.filter(w => w.role !== 'OWNER').length, color: "bg-[#2DD4BF] dark:shadow-[6px_6px_0px_0px_#22d3ee]" },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`border-[4px] border-black dark:border-white ${stat.color.split(" ")[0]} text-black p-6 shadow-[6px_6px_0px_0px_#000] ${stat.color.split(" ").slice(1).join(" ")} hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[8px_8px_0px_0px_#000] dark:hover:shadow-[8px_8px_0px_0px_#fff] transition-all`}
                  >
                    <p className="text-xs font-black uppercase tracking-wider text-black/60 dark:text-black/50 mb-2">{stat.label}</p>
                    <h2 className="text-4xl font-black">{stat.value}</h2>
                  </div>
                ))}
              </div>

              {/* Workspace Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                {filteredWorkspaces.map((memberDoc) => {
                  const ws = memberDoc.workspaceId || {};
                  const name = ws.name || "Unknown";
                  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const role = memberDoc.role;
                  
                  const colorClass = avatarColors[ws._id ? (ws._id.charCodeAt(ws._id.length - 1) % avatarColors.length) : 0];
                  
                  const roleColors = {
                    OWNER: "bg-emerald-300 dark:bg-emerald-300 dark:text-black",
                    ADMIN: "bg-cyan-300 dark:bg-cyan-300 dark:text-black",
                    EDITOR: "bg-orange-300 dark:bg-orange-300 dark:text-black",
                    VIEWER: "bg-gray-200 dark:bg-purple-300 dark:text-black"
                  };
                  const roleColor = roleColors[role] || "bg-gray-200";

                  return (
                    <div
                      key={ws._id || memberDoc._id}
                      onClick={() => navigate(`/workspace/${ws._id}`)}
                      className="relative bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-6 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899] hover:shadow-[10px_10px_0px_0px_#000] dark:hover:shadow-[10px_10px_0px_0px_#06b6d4] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0px_0px_#000] dark:active:shadow-[3px_3px_0px_0px_#06b6d4] transition-all cursor-pointer flex flex-col h-[220px]"
                    >
                      <div className="flex justify-between items-start mb-auto relative z-10">
                        <div className={`w-14 h-14 border-[3px] border-black dark:border-[#8b5cf6] flex items-center justify-center shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] font-black text-lg ${colorClass}`}>
                          <span>{initials}</span>
                        </div>
                        
                        {/* Invite Button for Admin/Owner */}
                        {(role === "OWNER" || role === "ADMIN") && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedWorkspaceForInvite(ws);
                              setShowInviteModal(true);
                            }}
                            className="px-3 py-1.5 text-xs bg-cyan-300 border-[2px] border-black dark:border-white font-black uppercase tracking-wider text-black dark:text-black shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#8b5cf6] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] dark:hover:shadow-[3px_3px_0px_0px_#8b5cf6] active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer"
                          >
                            + Invite
                          </button>
                        )}
                      </div>

                      <div className="relative z-10">
                        <h3 className="text-xl font-extrabold mb-1 truncate text-black dark:text-white">{name}</h3>
                        <div className="flex items-center gap-2 text-xs font-bold text-black/50 dark:text-zinc-400 mb-4">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                            1
                          </span>
                          <span>·</span>
                          <span>Just now</span>
                        </div>

                        <span className={`inline-flex px-3 py-1 text-xs font-black uppercase border-[2px] border-black dark:border-white shadow-[2px_2px_0px_0px_#000] dark:shadow-[2px_2px_0px_0px_#8b5cf6] ${roleColor}`}>
                          {role}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Create New Card */}
                <div
                  onClick={() => setShowModal(true)}
                  className="border-[4px] border-dashed border-black dark:border-[#8b5cf6] bg-cyan-50 dark:bg-[#1e173e] hover:bg-cyan-100 dark:hover:bg-[#251d4a] hover:shadow-[6px_6px_0px_0px_#000] dark:hover:shadow-[6px_6px_0px_0px_#ec4899] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-14 h-14 border-[3px] border-black dark:border-white bg-white dark:bg-zinc-800 flex items-center justify-center shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#fff] mb-3">
                    <svg className="w-6 h-6 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-black dark:text-zinc-300 font-black uppercase text-sm tracking-wide">Create Workspace</span>
                </div>
              </div>
            </>
          )}

          {activeTab === "projects" && (
            <>
              {loadingDocs ? (
                <div className="text-center py-20 font-black uppercase text-black/60 dark:text-zinc-400">Loading canvases...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="border-[4px] border-dashed border-black dark:border-[#8b5cf6] p-12 text-center bg-white dark:bg-[#1a1435] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899] rotate-[-0.5deg]">
                  <p className="font-black uppercase text-lg mb-2 text-black dark:text-white">No Canvases Found</p>
                  <p className="text-sm font-bold text-black/60 dark:text-zinc-400 uppercase">Go to a workspace to design canvases</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filteredProjects.map((doc) => (
                    <div
                      key={doc._id}
                      onClick={() => navigate(`/workspace/${doc.workspaceId}`)}
                      className="bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-6 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899] hover:shadow-[10px_10px_0px_0px_#000] dark:hover:shadow-[10px_10px_0px_0px_#06b6d4] hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer flex flex-col h-[180px]"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-orange-300 border-2 border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_0px_#000] text-black inline-block mb-3 truncate max-w-full">
                          🏢 {doc.workspaceName}
                        </span>
                        <h3 className="text-xl font-extrabold mb-2 truncate text-black dark:text-white">
                          🎨 {doc.title}
                        </h3>
                        <p className="text-xs font-bold text-black/50 dark:text-zinc-450 uppercase mt-auto">
                          Updated: {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "members" && (
            <>
              {loadingMembers ? (
                <div className="text-center py-20 font-black uppercase text-black/60 dark:text-zinc-400">Loading teammates...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="border-[4px] border-dashed border-black dark:border-[#8b5cf6] p-12 text-center bg-white dark:bg-[#1a1435] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899]">
                  <p className="font-black uppercase text-lg mb-2 text-black dark:text-white">No Teammates Found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
                  {filteredMembers.map((m) => (
                    <div
                      key={m.userId?._id || m.email}
                      className="bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-6 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899] flex flex-col min-h-[200px]"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 border-[3px] border-black dark:border-[#8b5cf6] bg-cyan-300 text-black flex items-center justify-center font-black text-sm shadow-[2px_2px_0px_0px_#000]">
                          {(m.username || "U").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-base truncate text-black dark:text-white uppercase tracking-tight">{m.username}</h4>
                          <p className="text-xs font-bold text-black/60 dark:text-zinc-400 truncate">{m.email}</p>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t-2 border-black dark:border-white/10 space-y-2">
                        <p className="text-[10px] font-black uppercase text-black/40 dark:text-zinc-500">Shared Workspaces</p>
                        <div className="flex flex-wrap gap-1.5">
                          {m.workspaces.map((ws, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950 border border-black dark:border-white/30 px-2 py-0.5 text-black dark:text-white rounded-none"
                              title={`${ws.workspaceName} (${ws.status})`}
                            >
                              {ws.workspaceName} ({ws.role})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "invites" && (
            <>
              {loadingInvites ? (
                <div className="text-center py-20 font-black uppercase text-black/60 dark:text-zinc-400">Loading invitations...</div>
              ) : filteredInvites.length === 0 ? (
                <div className="border-[4px] border-dashed border-black dark:border-[#8b5cf6] p-12 text-center bg-white dark:bg-[#1a1435] shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899]">
                  <p className="font-black uppercase text-lg mb-2 text-black dark:text-white">No Pending Invitations</p>
                  <p className="text-sm font-bold text-black/60 dark:text-zinc-400 uppercase">You have accepted or cleared all pending invites</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                  {filteredInvites.map((inv) => (
                    <div
                      key={inv._id}
                      className="bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-6 shadow-[6px_6px_0px_0px_#000] dark:shadow-[6px_6px_0px_0px_#ec4899] flex flex-col h-[200px]"
                    >
                      <div className="flex-1">
                        <h4 className="font-black text-lg text-black dark:text-white uppercase tracking-tight mb-2 truncate">
                          🏢 {inv.workspaceId?.name || "Workspace Invitation"}
                        </h4>
                        <p className="text-xs font-bold text-black/60 dark:text-zinc-400 uppercase mb-4">
                          Role Offered: <span className="underline font-black">{inv.role}</span>
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleAcceptInvite(inv.inviteToken)}
                          className="flex-1 py-3 bg-emerald-300 border-[2.5px] border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(inv.inviteToken)}
                          className="flex-1 py-3 bg-red-400 border-[2.5px] border-black font-black uppercase text-xs shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-none transition-all cursor-pointer text-black"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Modern Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div 
            className="relative bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#ec4899] w-full max-w-md"
          >
            <h2 className="text-2xl font-black uppercase mb-1">New Workspace</h2>
            <p className="text-black/60 dark:text-zinc-400 font-bold text-xs uppercase tracking-wide mb-6">Create a collaborative space for your team</p>

            <div className="mb-8">
              <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
                Workspace Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className="w-full px-5 py-4 bg-white dark:bg-[#221a48] border-[3px] border-black dark:border-[#8b5cf6] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-450 font-bold shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] focus:shadow-[5px_5px_0px_0px_#000] dark:focus:shadow-[5px_5px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 outline-none transition-all"
                placeholder="e.g. Acme Marketing"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black dark:border-white bg-white dark:bg-[#1a1435] text-black dark:text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#ec4899] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#ec4899] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addWorkspace}
                className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black dark:border-white bg-cyan-300 text-black dark:text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#8b5cf6] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#8b5cf6] transition-all cursor-pointer"
              >
                Create Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteModal && selectedWorkspaceForInvite && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setShowInviteModal(false);
              setInviteEmail("");
              setInviteRole("VIEWER");
              setInviteError("");
              setInviteSuccess("");
            }}
          />
          <div 
            className="relative bg-white dark:bg-[#1a1435] border-[4px] border-black dark:border-[#8b5cf6] p-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] dark:shadow-[10px_10px_0px_0px_#ec4899] w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
          >
            <h2 className="text-2xl font-black uppercase mb-1">Invite Member</h2>
            <p className="text-black/60 dark:text-zinc-400 font-bold text-xs uppercase tracking-wide mb-6">
              Add a teammate to <span className="underline">{selectedWorkspaceForInvite.name}</span>
            </p>

            {inviteError && (
              <div className="mb-4 p-3.5 text-sm font-bold bg-red-100 border-[3px] border-red-500 text-red-700 shadow-[3px_3px_0px_0px_#ef4444]">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="mb-4 p-3.5 text-sm font-bold bg-emerald-100 border-[3px] border-emerald-500 text-emerald-700 shadow-[3px_3px_0px_0px_#10b981]">
                {inviteSuccess}
              </div>
            )}

            <div className="mb-6">
              <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
                Teammate's Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                autoFocus
                className="w-full px-5 py-4 bg-white dark:bg-[#221a48] border-[3px] border-black dark:border-[#8b5cf6] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-zinc-450 font-bold shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] focus:shadow-[5px_5px_0px_0px_#000] dark:focus:shadow-[5px_5px_0px_0px_#ec4899] focus:-translate-x-0.5 focus:-translate-y-0.5 outline-none transition-all"
                placeholder="teammate@example.com"
              />
            </div>

            <div className="mb-8">
              <label className="block text-xs font-black uppercase tracking-wider text-black dark:text-zinc-200 mb-2">
                Teammate's Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-5 py-4 bg-white dark:bg-[#221a48] border-[3px] border-black dark:border-[#8b5cf6] text-black dark:text-white font-bold shadow-[3px_3px_0px_0px_#000] dark:shadow-[3px_3px_0px_0px_#ec4899] outline-none cursor-pointer"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail("");
                  setInviteRole("VIEWER");
                  setInviteError("");
                  setInviteSuccess("");
                }}
                className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black dark:border-white bg-white dark:bg-[#1a1435] text-black dark:text-white shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#ec4899] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#ec4899] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={inviteMemberToWorkspace}
                className="flex-1 px-5 py-4 font-black uppercase border-[3px] border-black dark:border-white bg-cyan-300 text-black dark:text-black shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#8b5cf6] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0px_0px_#000] dark:active:shadow-[2px_2px_0px_0px_#8b5cf6] transition-all cursor-pointer"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashBoard;