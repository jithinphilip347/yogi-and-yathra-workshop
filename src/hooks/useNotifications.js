import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import notificationApi from "@/libs/notificationApi";

/**
 * Hook to fetch paginated notifications with deterministic query keys per filter set.
 */
export const useNotifications = (filters = {}) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  const normalizedFilters = {
    page: filters.page || 1,
    per_page: filters.per_page || 20,
    unread: filters.unread !== undefined ? filters.unread : null,
    category: filters.category || null,
    type: filters.type || null,
  };

  return useQuery({
    queryKey: ["notifications", normalizedFilters],
    queryFn: async () => {
      const response = await notificationApi.getNotifications(filters);
      return response.data;
    },
    enabled: !!isAuthenticated,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to fetch unread notification count for the navbar badge.
 */
export const useUnreadNotificationCount = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const response = await notificationApi.getUnreadCount();
      return response.data?.data?.count ?? 0;
    },
    enabled: !!isAuthenticated,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to mark a single notification as read.
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Hook to mark all unread notifications as read.
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Hook to delete / dismiss a notification.
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export default useNotifications;
