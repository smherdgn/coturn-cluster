import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import type { Node, DebugInfo, Service } from "../types";
import { useNotification } from "../contexts/NotificationContext";

// --- API Fonksiyonları (Veriyi çeken/değiştiren asıl mantık) ---

const fetchNodes = (): Promise<Node[]> => api("/nodes");

const addNode = (newNodeData: {
  autoRegisterNginx: boolean;
  ip?: string;
  ports?: object;
}) =>
  api<Node>("/nodes", { method: "POST", body: JSON.stringify(newNodeData) });

const deleteNode = (nodeId: string) =>
  api(`/nodes/remove/${nodeId}`, { method: "DELETE" });

const restartNode = (nodeId: string) =>
  api(`/nodes/${nodeId}/restart`, { method: "POST" });

const fetchNodeLogs = (nodeId: string): Promise<string> =>
  api(`/nodes/${nodeId}/logs`, { isText: true });

const fetchServices = (): Promise<Service[]> => api("/services");
const fetchDebugInfo = (): Promise<DebugInfo> => api("/debug");

// --- Custom Hooklar ---

/**
 * Tüm node'ları getiren custom hook.
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
