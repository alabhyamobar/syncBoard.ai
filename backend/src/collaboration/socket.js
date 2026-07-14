import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisClient, subClient, isRedisReady } from "./redis.js";
import { updateDocumentCanvas } from "../module/document/document.services.js";

// Fallback in-memory active users dictionary
const activeRoomsFallback = {}; // Format: { [roomId]: { [socketId]: { userId, username } } }

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_DEV_URL, 
        process.env.FRONTEND_PROD_URL 
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

  // Helper to fetch online list dynamically
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

      console.log(`User ${username} joined room ${roomId}`);

      // Broadcast presence update
      const usersList = await getRoomPresenceList(roomId);
      io.to(roomId).emit("presence-update", usersList);
    });

    // Broadcast cursor coordinates
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

    // Broadcast whiteboard shapes change
    socket.on("canvas-change", ({ snapshot }) => {
      if (socket.documentId) {
        socket.to(`canvas:${socket.documentId}`).emit("canvas-update", { snapshot });
      }
    });

    // Debounced canvas save trigger
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
