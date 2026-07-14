import React, { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { Tldraw } from "tldraw";
import { io } from "socket.io-client";
import { useAuth } from "../../hooks";
import "tldraw/tldraw.css";

const TldrawCanvas = ({ snapshot, onSave, onMount, docId, readOnly = false }) => {
  const { user } = useAuth();
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const socketRef = useRef(null);
  const lastEmitRef = useRef(0);
  
  // Track cursor positions and presence list
  const [remoteCursors, setRemoteCursors] = useState({});
  const [presenceList, setPresenceList] = useState([]);
  const [cameraVersion, setCameraVersion] = useState(0);

  const initialSnapshotRef = useRef(snapshot);

  // ── Resolve and structure the snapshot safely for Tldraw ────────
  const resolvedSnapshot = useMemo(() => {
    const snap = initialSnapshotRef.current;
    if (!snap || typeof snap !== "object") return undefined;

    let storeObj = null;
    let schemaObj = null;
    let isWrapped = false;

    if (snap.document && typeof snap.document === "object" && snap.document.store) {
      storeObj = snap.document.store;
      schemaObj = snap.document.schema;
      isWrapped = true;
    } else if (snap.store) {
      storeObj = snap.store;
      schemaObj = snap.schema;
    }

    if (storeObj) {
      const clonedStore = {};
      Object.keys(storeObj).forEach((key) => {
        const record = storeObj[key];
        if (record && typeof record === "object") {
          const fixedRecord = { ...record };
          if (fixedRecord.meta === undefined) {
            fixedRecord.meta = {};
          }
          clonedStore[key] = fixedRecord;
        } else {
          clonedStore[key] = record;
        }
      });

      if (isWrapped) {
        return {
          ...snap,
          document: {
            store: clonedStore,
            schema: schemaObj,
          },
        };
      } else {
        return {
          store: clonedStore,
          schema: schemaObj,
        };
      }
    }

    return snap;
  }, []);

  // ── WebSockets connection management ─────────────────────────────
  useEffect(() => {
    if (readOnly) return;

    // Connect to WebSocket server
    const socket = io("http://localhost:3000", {
      withCredentials: true,
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    // Join room for this canvas document
    socket.emit("join-canvas", {
      documentId: docId,
      userId: user?._id || "anon",
      username: user?.username || user?.email?.split("@")[0] || "Collaborator",
    });

    // Handle presence updates
    socket.on("presence-update", (users) => {
      setPresenceList(users);
    });

    // Handle remote mouse cursor moves
    socket.on("cursor-update", ({ userId, username, x, y }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { username, x, y, lastActive: Date.now() },
      }));
    });

    // Handle remote collaborators leaving
    socket.on("user-left", ({ userId }) => {
      setRemoteCursors((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    });

    // Handle remote shape updates
    socket.on("canvas-update", ({ snapshot: remoteChanges }) => {
      const editor = editorRef.current;
      if (!editor || !remoteChanges) return;

      editor.store.mergeRemoteChanges(() => {
        // Process added records
        if (remoteChanges.added) {
          Object.values(remoteChanges.added).forEach((record) => {
            editor.store.put([record]);
          });
        }
        // Process updated records
        if (remoteChanges.updated) {
          Object.values(remoteChanges.updated).forEach(([_, record]) => {
            editor.store.put([record]);
          });
        }
        // Process removed records
        if (remoteChanges.removed) {
          Object.keys(remoteChanges.removed).forEach((id) => {
            editor.store.remove([id]);
          });
        }
      });
    });

    // Cleanup inactive cursors periodically
    const cursorCleanupInterval = setInterval(() => {
      const now = Date.now();
      setRemoteCursors((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach((key) => {
          if (now - next[key].lastActive > 5000) {
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 2000);

    return () => {
      socket.disconnect();
      clearInterval(cursorCleanupInterval);
    };
  }, [docId, user, readOnly]);

  // ── Handle local pointer moves to emit coordinates ───────────────
  const handlePointerMove = useCallback(() => {
    const editor = editorRef.current;
    const socket = socketRef.current;
    if (!editor || !socket || readOnly) return;

    const point = editor.inputs.currentPagePoint;
    const now = Date.now();
    
    // Throttle broadcasts to 50ms intervals
    if (now - lastEmitRef.current > 50) {
      socket.emit("cursor-move", { x: point.x, y: point.y });
      lastEmitRef.current = now;
    }
  }, [readOnly]);

  // ── Handle tldraw mount ──────────────────────────────────────────
  const handleMount = useCallback(
    (editor) => {
      editorRef.current = editor;

      if (onMount) onMount(editor);

      editor.updateInstanceState({ isGridMode: true });

      if (readOnly) return () => {};

      // 1. Listen for user-initiated shape adjustments to broadcast
      const unsubChanges = editor.store.listen(
        (event) => {
          if (socketRef.current) {
            socketRef.current.emit("canvas-change", {
              snapshot: event.changes,
            });
          }

          // Debounced DB persistence
          clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => {
            if (socketRef.current) {
              socketRef.current.emit("save-canvas", {
                snapshot: editor.getSnapshot(),
              });
            }
            if (onSave) {
              onSave(editor.getSnapshot());
            }
          }, 4000);
        },
        { source: "user", scope: "document" }
      );

      // 2. Listen for viewport camera moves (zoom/pan) to force re-render cursor overlay positions
      const unsubCamera = editor.store.listen(
        () => {
          setCameraVersion((v) => v + 1);
        },
        { scope: "instance" }
      );

      return () => {
        unsubChanges();
        unsubCamera();
        clearTimeout(saveTimerRef.current);
      };
    },
    [onSave, onMount, readOnly]
  );

  // Render pointers mapped to viewport screen coordinates
  const renderPointers = () => {
    const editor = editorRef.current;
    if (!editor) return null;

    return Object.entries(remoteCursors).map(([userId, c]) => {
      try {
        const screenPoint = editor.pageToScreen({ x: c.x, y: c.y });
        
        // Hide if coordinates fallback to negative or exceed outer viewport margins
        if (screenPoint.x < 0 || screenPoint.y < 0) return null;

        return (
          <div
            key={userId}
            style={{
              position: "absolute",
              left: screenPoint.x,
              top: screenPoint.y,
              transform: "translate(-2px, -2px)",
              pointerEvents: "none",
              zIndex: 9999,
            }}
            className="transition-all duration-75 ease-out"
          >
            <svg className="w-5 h-5 text-cyan-500 fill-current drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" viewBox="0 0 24 24">
              <path d="M7 2v18l5-5h6L7 2z" stroke="black" strokeWidth={2.5} />
            </svg>
            <span className="ml-2.5 px-2 py-0.5 bg-cyan-300 text-black text-[10px] font-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] uppercase tracking-wide whitespace-nowrap">
              {c.username}
            </span>
          </div>
        );
      } catch (err) {
        return null;
      }
    });
  };

  return (
    <div className="w-full h-full relative" onPointerMove={handlePointerMove}>
      {/* Dynamic Cursor Overlay */}
      {editorRef.current && renderPointers()}

      {/* active room collaborators list bubble */}
      {presenceList.length > 1 && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-1 bg-white/95 dark:bg-[#150e2a]/95 border-[3px] border-black dark:border-[#8b5cf6] p-2.5 shadow-[4px_4px_0px_0px_#000] dark:shadow-[4px_4px_0px_0px_#8b5cf6]">
          <span className="w-2.5 h-2.5 bg-emerald-400 border-2 border-black rounded-full animate-pulse mr-1"></span>
          <span className="text-[10px] font-black uppercase text-black dark:text-white tracking-wider mr-2">Online:</span>
          <div className="flex -space-x-2.5">
            {presenceList.map((p, idx) => {
              const colors = ["bg-purple-300", "bg-cyan-300", "bg-orange-300", "bg-emerald-300", "bg-rose-300"];
              const randomColor = colors[p.userId.charCodeAt(p.userId.length - 1) % colors.length];
              return (
                <div
                  key={idx}
                  title={`${p.username} is drawing`}
                  className={`w-7 h-7 rounded-none border-2 border-black flex items-center justify-center text-[10px] font-black text-black uppercase shadow-[1px_1px_0px_0px_#000] ${randomColor}`}
                >
                  {p.username.slice(0, 2)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Tldraw
        key={docId}
        snapshot={resolvedSnapshot}
        onMount={handleMount}
        isReadOnly={readOnly}
        inferDarkMode
      />
    </div>
  );
};

export default TldrawCanvas;
