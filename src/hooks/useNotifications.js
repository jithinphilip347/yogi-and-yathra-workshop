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
 * Hook to mark a single notification as read with optimistic cache updates.
 */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousUnread = queryClient.getQueryData(["notifications", "unread-count"]);
      const previousNotifications = queryClient.getQueriesData({ queryKey: ["notifications"] });

      // Optimistically decrement unread count
      queryClient.setQueryData(["notifications", "unread-count"], (prev) =>
        typeof prev === "number" ? Math.max(0, prev - 1) : 0
      );

      // Optimistically update read status in active lists
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item) =>
            item.id === id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
          ),
        };
      });

      return { previousUnread, previousNotifications };
    },
    onError: (err, id, context) => {
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(["notifications", "unread-count"], context.previousUnread);
      }
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Hook to mark all unread notifications as read with optimistic cache updates.
 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousUnread = queryClient.getQueryData(["notifications", "unread-count"]);
      const previousNotifications = queryClient.getQueriesData({ queryKey: ["notifications"] });

      // Optimistically set unread count to 0
      queryClient.setQueryData(["notifications", "unread-count"], 0);

      // Optimistically set all items to read
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item) => ({
            ...item,
            is_read: true,
            read_at: item.read_at || new Date().toISOString(),
          })),
        };
      });

      return { previousUnread, previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(["notifications", "unread-count"], context.previousUnread);
      }
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

/**
 * Hook to delete / dismiss a notification with optimistic cache updates.
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousUnread = queryClient.getQueryData(["notifications", "unread-count"]);
      const previousNotifications = queryClient.getQueriesData({ queryKey: ["notifications"] });

      // Check if deleted item was unread to adjust count
      let wasUnread = false;
      previousNotifications.forEach(([, data]) => {
        if (data?.data) {
          const item = data.data.find((n) => n.id === id);
          if (item && !item.is_read) {
            wasUnread = true;
          }
        }
      });

      if (wasUnread) {
        queryClient.setQueryData(["notifications", "unread-count"], (prev) =>
          typeof prev === "number" ? Math.max(0, prev - 1) : 0
        );
      }

      // Optimistically remove notification from cached lists
      queryClient.setQueriesData({ queryKey: ["notifications"] }, (oldData) => {
        if (!oldData || !Array.isArray(oldData.data)) return oldData;
        return {
          ...oldData,
          data: oldData.data.filter((item) => item.id !== id),
          meta: oldData.meta
            ? { ...oldData.meta, total: Math.max(0, (oldData.meta.total || 0) - 1) }
            : oldData.meta,
        };
      });

      return { previousUnread, previousNotifications };
    },
    onError: (err, id, context) => {
      if (context?.previousUnread !== undefined) {
        queryClient.setQueryData(["notifications", "unread-count"], context.previousUnread);
      }
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};

export default useNotifications;
