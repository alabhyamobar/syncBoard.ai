import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, subClient, isRedisReady } from "./redis.js";
import { updateDocumentCanvas } from "../module/document/document.services.js";
import config from "../config/config.js";

// Active rooms fallback for presence & in-memory state caching
const activeRoomsFallback = {}; // Format: { [roomId]: { [socketId]: { userId, username } } }
const shapeLocks = {};          // Format: { [documentId]: { [shapeId]: { userId, username, updatedAt } } }

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        config.FRONTEND_DEV_URL, 
        config.FRONTEND_PROD_URL,
        "https://syncboard-ai.vercel.app",
        "https://sync-board-ai.vercel.app"
      ],
      credentials: true,
    },
  });

  // Attach Redis adapter if connected
  if (isRedisReady) {
    console.log("[Socket.io] Redis is active. Attaching @socket.io/redis-adapter...");
    io.adapter(createAdapter(redisClient, subClient));
  } else {
    console.log("[Socket.io] Operating in local memory fallback adapter mode.");
  }

  // Helper to fetch online presence list dynamically
  const getRoomPresenceList = async (roomId) => {
    if (isRedisReady) {
      try {
        const hashData = await redisClient.hgetall(`room:presence:${roomId}`);
        if (!hashData) return [];
        return Object.values(hashData).map(val => JSON.parse(val));
      } catch (err) {
        console.error("[Redis] Failed to fetch presence hash:", err);
      }
    }
    return activeRoomsFallback[roomId] ? Object.values(activeRoomsFallback[roomId]) : [];
  };

  io.on("connection", (socket) => {
    console.log("Client connected to socket:", socket.id);

    // Join room representing the document canvas
    socket.on("join-canvas", async ({ documentId, userId, username }) => {
      const roomId = `canvas:${documentId}`;
      socket.join(roomId);

      socket.documentId = documentId;
      socket.userId = userId;
      socket.username = username;

      const userMeta = { userId, username };

      if (isRedisReady) {
        try {
          await redisClient.hset(`room:presence:${roomId}`, socket.id, JSON.stringify(userMeta));
          await redisClient.expire(`room:presence:${roomId}`, 86400);
        } catch (err) {
          console.error("[Redis] Failed to hset room presence:", err);
        }
      } else {
        if (!activeRoomsFallback[roomId]) {
          activeRoomsFallback[roomId] = {};
        }
        activeRoomsFallback[roomId][socket.id] = userMeta;
      }

      console.log(`User ${username} (${userId}) joined room ${roomId}`);

      // Broadcast updated presence list
      const usersList = await getRoomPresenceList(roomId);
      io.to(roomId).emit("presence-update", usersList);

      // Send active shape selection locks for overlapping control
      if (shapeLocks[documentId]) {
        socket.emit("shape-selection-update", { locks: shapeLocks[documentId] });
      }
    });

    // High-frequency, low-latency live cursor position updates
    socket.on("cursor-move", ({ x, y }) => {
      if (socket.documentId && socket.userId) {
        socket.to(`canvas:${socket.documentId}`).emit("cursor-update", {
          userId: socket.userId,
          username: socket.username,
          x,
          y,
        });
      }
    });

    // Real-time canvas shape deltas (Added / Updated / Removed)
    socket.on("canvas-change", ({ snapshot }) => {
      if (socket.documentId && snapshot) {
        const docId = socket.documentId;

        // Broadcast delta snapshot to all other collaborators in the canvas room instantly
        socket.to(`canvas:${docId}`).emit("canvas-update", {
          snapshot,
          userId: socket.userId,
          username: socket.username,
        });
      }
    });

    // Overlapping control: broadcast shape selection / locking
    socket.on("shape-select", ({ selectedIds }) => {
      if (!socket.documentId || !socket.userId) return;
      const docId = socket.documentId;

      if (!shapeLocks[docId]) {
        shapeLocks[docId] = {};
      }

      // Clear previous locks held by this user
      Object.keys(shapeLocks[docId]).forEach((shapeId) => {
        if (shapeLocks[docId][shapeId].userId === socket.userId) {
          delete shapeLocks[docId][shapeId];
        }
      });

      // Set new shape locks for selected IDs
      if (Array.isArray(selectedIds)) {
        selectedIds.forEach((id) => {
          shapeLocks[docId][id] = {
            userId: socket.userId,
            username: socket.username,
            updatedAt: Date.now(),
          };
        });
      }

      // Broadcast active shape selection locks to all room members
      io.to(`canvas:${docId}`).emit("shape-selection-update", {
        locks: shapeLocks[docId],
      });
    });

    // Debounced canvas save trigger to MongoDB
    socket.on("save-canvas", async ({ snapshot }) => {
      if (socket.documentId && socket.userId) {
        try {
          await updateDocumentCanvas({
            documentId: socket.documentId,
            userId: socket.userId,
            content: snapshot,
          });
          console.log(`Auto-saved canvas snapshot for document ${socket.documentId} by ${socket.username}`);
        } catch (err) {
          console.error("Failed to auto-save canvas snapshot:", err);
        }
      }
    });

    // Clean up on disconnect
    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      if (socket.documentId) {
        const roomId = `canvas:${socket.documentId}`;
        const docId = socket.documentId;

        // Clean up shape locks held by this user
        if (shapeLocks[docId] && socket.userId) {
          Object.keys(shapeLocks[docId]).forEach((shapeId) => {
            if (shapeLocks[docId][shapeId].userId === socket.userId) {
              delete shapeLocks[docId][shapeId];
            }
          });
          io.to(roomId).emit("shape-selection-update", { locks: shapeLocks[docId] });
        }
        
        if (isRedisReady) {
          try {
            await redisClient.hdel(`room:presence:${roomId}`, socket.id);
            const remaining = await redisClient.hlen(`room:presence:${roomId}`);
            if (remaining === 0) {
              await redisClient.del(`room:presence:${roomId}`);
            }
          } catch (err) {
            console.error("[Redis] Failed to hdel presence entry on disconnect:", err);
          }
        } else {
          if (activeRoomsFallback[roomId]) {
            delete activeRoomsFallback[roomId][socket.id];
            if (Object.keys(activeRoomsFallback[roomId]).length === 0) {
              delete activeRoomsFallback[roomId];
            }
          }
        }

        const remainingUsers = await getRoomPresenceList(roomId);
        io.to(roomId).emit("presence-update", remainingUsers);
        socket.to(roomId).emit("user-left", { userId: socket.userId });
      }
    });
  });

  return io;
};
