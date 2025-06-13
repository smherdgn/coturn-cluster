export type UserSession = {
  userId: string;
  socketId: string;
  roomId: string;
  status: 'connected' | 'signaling' | 'in-call' | 'left';
  joinedAt: number;
};

// İki ayrı indexleme: hem socketId hem userId üzerinden erişim için
const storeBySocketId = new Map<string, UserSession>();
const storeByUserId = new Map<string, UserSession>();

// Yeni session ekle
export const addSession = (userId: string, socketId: string): void => {
  const session: UserSession = {
    userId,
    socketId,
    roomId: '',
    status: 'connected',
    joinedAt: Date.now(),
  };
  storeBySocketId.set(socketId, session);
  storeByUserId.set(userId, session);
};

// Güncelle (userId veya socketId ile çağrılabilir)
export const updateSession = (
  id: string,
  partial: Partial<UserSession>
): void => {
  let session = storeBySocketId.get(id) || storeByUserId.get(id);
  if (session) {
    const updated = { ...session, ...partial };
    storeBySocketId.set(session.socketId, updated);
    storeByUserId.set(session.userId, updated);
  }
};

// socketId ile sil
export const removeSession = (socketId: string): void => {
  const session = storeBySocketId.get(socketId);
  if (session) {
    storeBySocketId.delete(socketId);
    storeByUserId.delete(session.userId);
  }
};

// socketId ile getir
export const getSession = (socketId: string): UserSession | undefined => {
  return storeBySocketId.get(socketId);
};

// userId ile getir
export const getUserSession = (userId: string): UserSession | undefined => {
  return storeByUserId.get(userId);
};

// userId ile sil
export const removeSessionByUser = (userId: string): void => {
  const session = storeByUserId.get(userId);
  if (session) {
    storeByUserId.delete(userId);
    storeBySocketId.delete(session.socketId);
  }
};

// Tüm oturumları getir
export const getAllSessions = (): UserSession[] => {
  return Array.from(storeBySocketId.values());
};

// Belirli oda için oturumları getir
export const findSessionsByRoom = (roomId: string): UserSession[] => {
  return Array.from(storeBySocketId.values()).filter(
    (s) => s.roomId === roomId
  );
};

// Oda içindeki kullanıcı sayısı
export const countUsersInRoom = (roomId: string): number => {
  return findSessionsByRoom(roomId).length;
};

// Tüm oturumları temizle
export const clearAllSessions = (): void => {
  storeBySocketId.clear();
  storeByUserId.clear();
};
