import React, {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  addNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (message: string, type: NotificationType) => {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setNotifications((current) => current.filter((n) => n.id !== id));
      }, 5000);
    },
    []
  );

  const notificationColors: Record<NotificationType, string> = {
    info: "bg-blue-500",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    error: "bg-red-500",
  };

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {createPortal(
        <div className="fixed top-5 right-5 z-[100] space-y-2 w-80">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 text-white rounded-md shadow-lg ${
                notificationColors[n.type]
              }`}
            >
              {n.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
