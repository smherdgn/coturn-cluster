export type UserSession = {
  userId: string;
  socketId: string;
  roomId: string;
  status: 'connected' | 'signaling' | 'in-call' | 'left';
  joinedAt: number;
};

const store = new Map<string, UserSession>();

export function setUserSession(userId: string, session: UserSession): void {
  store.set(userId, session);
}

export function getUserSession(userId: string): UserSession | undefined {
  return store.get(userId);
}

export function getAllSessions(): UserSession[] {
  return Array.from(store.values());
}

export function removeSessionBySocket(socketId: string): void {
  for (const [uid, session] of store) {
    if (session.socketId === socketId) {
      store.delete(uid);
      break;
    }
  }
}

export function findSessionsByRoom(roomId: string): UserSession[] {
  return Array.from(store.values()).filter((s) => s.roomId === roomId);
}
