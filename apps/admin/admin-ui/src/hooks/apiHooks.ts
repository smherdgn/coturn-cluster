import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type {
  Node,
  DebugInfo,
  Service,
  User,
  NginxStatus,
  SecurityStatus,
} from "../types";
import { useNotification } from "../contexts/NotificationContext";

// --- API Fonksiyonları ---

const fetchNodes = (): Promise<Node[]> => api("api/nodes");

const addNode = (newNodeData: {
  autoRegisterNginx: boolean;
  ip?: string;
  ports?: object;
}) =>
  api<Node>("api/nodes", { method: "POST", body: JSON.stringify(newNodeData) });

const deleteNode = (nodeId: string) =>
  api(`api/nodes/${nodeId}`, { method: "DELETE" });

const restartNode = (nodeId: string) =>
  api(`api/nodes/${nodeId}/restart`, { method: "POST" });

const fetchNodeLogs = (nodeId: string): Promise<string> =>
  api(`api/nodes/${nodeId}/logs`, { isText: true });

const fetchServices = (): Promise<Service[]> => api("api/services");
const fetchDebugInfo = (): Promise<DebugInfo> => api("api/debug");
const fetchK8sDashboardUrl = () =>
  api<{ url: string }>("api/k8s-dashboard-url");

const fetchUsers = (): Promise<User[]> => api("api/users");
const addUser = (userData: Omit<User, "id">) =>
  api<User>("api/users", { method: "POST", body: JSON.stringify(userData) });
const deleteUser = (userId: string | number) =>
  api(`api/users/${userId}`, { method: "DELETE" });

const fetchNginxStatus = (): Promise<NginxStatus> => api("api/nginx/status");
const fetchSecurityStatus = (): Promise<SecurityStatus> =>
  api("api/security/status");

// --- Custom Hooklar ---

/**
 * Tüm nodeları getiren custom hook
 */
export const useNodes = () => {
  return useQuery({
    queryKey: ["nodes"],
    queryFn: fetchNodes,
  });
};

/**
 * Yeni bir node eklemek için kullanılan mutation hook'u.
 */
export const useAddNode = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: addNode,
    onSuccess: (data) => {
      addNotification(`Node ${data.nodeId} added successfully!`, "success");
      // 'nodes' sorgusunu geçersiz kılarak listeyi otomatik yenile
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
    onError: (error) => {
      addNotification(`Failed to add node: ${error.message}`, "error");
    },
  });
};

/**
 * Bir nodeu silmek için kullanılan mutation hooku
 */
export const useDeleteNode = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: deleteNode,
    onSuccess: (_, nodeId) => {
      addNotification(`Node ${nodeId} deleted successfully.`, "success");
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
    onError: (error, nodeId) => {
      addNotification(
        `Failed to delete node ${nodeId}: ${error.message}`,
        "error"
      );
    },
  });
};

/**
 * Bir nodeu yeniden başlatmak için kullanılan mutation hooku
 */
export const useRestartNode = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();

  return useMutation({
    mutationFn: restartNode,
    onSuccess: (_, nodeId) => {
      addNotification(`Node ${nodeId} restart initiated.`, "success");
      queryClient.invalidateQueries({ queryKey: ["nodes"] });
    },
    onError: (error, nodeId) => {
      addNotification(
        `Failed to restart node ${nodeId}: ${error.message}`,
        "error"
      );
    },
  });
};

/**
 * Belirli bir nodeun loglarını getiren custom hook
 * `nodeId` null ise sorgu yapılmaz.
 */
export const useNodeLogs = (nodeId: string | null | undefined) => {
  return useQuery({
    // queryKey, nodeId'ye bağlı olmalı ki her node için ayrı cache tut
    queryKey: ["nodeLogs", nodeId],
    queryFn: () => fetchNodeLogs(nodeId!),

    // Sadece bir nodeId varsa bu sorguyu çalıştır
    enabled: !!nodeId,
  });
};

export const useServices = () => {
  return useQuery({
    queryKey: ["services"],
    queryFn: fetchServices,
  });
};

/**
 * Debug bilgilerini getiren custom hook
 */
export const useDebugInfo = () => {
  return useQuery({
    queryKey: ["debugInfo"],
    queryFn: fetchDebugInfo,
  });
};

/**
 * Nginx durumunu getiren custom hook, 10 saniyede bir veriyi yenileyecek
 */
export const useNginxStatus = () => {
  return useQuery({
    queryKey: ["nginxStatus"],
    queryFn: fetchNginxStatus,
    refetchInterval: 10000,
  });
};

/**
 * Güvenlik durumunu getiren custom hook
 */
export const useSecurityStatus = () => {
  return useQuery({
    queryKey: ["securityStatus"],
    queryFn: fetchSecurityStatus,
  });
};

/**
 * K8s dashboard url'sini getiren custom hook
 */
export const useK8sDashboardUrl = () => {
  return useQuery({
    queryKey: ["k8sDashboardUrl"],
    queryFn: fetchK8sDashboardUrl,
  });
};

export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });
};

export const useAddUser = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  return useMutation({
    mutationFn: addUser,
    onSuccess: (data) => {
      addNotification(`User "${data.username}" added successfully.`, "success");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      addNotification(`Failed to add user: ${error.message}`, "error");
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { addNotification } = useNotification();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (_, userId) => {
      addNotification(`User (ID: ${userId}) deleted successfully.`, "success");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error, userId) => {
      addNotification(
        `Failed to delete user (ID: ${userId}): ${error.message}`,
        "error"
      );
    },
  });
};
