import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import notificationApi from "@/libs/notificationApi";
import toast from "react-hot-toast";

export const NOTIFICATION_PREFERENCES_QUERY_KEY = ["notification-preferences"];

/**
 * Hook to fetch the authenticated user's effective notification preferences.
 */
export const useNotificationPreferences = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY,
    queryFn: async () => {
      const response = await notificationApi.getNotificationPreferences();
      return response?.data?.data || response?.data || {};
    },
    enabled: !!isAuthenticated,
    staleTime: 60 * 1000, // 1 minute
  });
};

/**
 * Hook to update notification preferences with optimistic UI updates.
 */
export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedPreferences) => {
      const response = await notificationApi.updateNotificationPreferences(updatedPreferences);
      return response?.data?.data || response?.data || {};
    },
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });

      // Snapshot the previous value
      const previousPreferences = queryClient.getQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY);

      // Optimistically update to the new value
      queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, (old) => {
        if (!old) return newPreferences;
        const merged = { ...old };
        for (const [cat, channels] of Object.entries(newPreferences)) {
          merged[cat] = { ...(merged[cat] || {}), ...channels };
        }
        return merged;
      });

      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, context.previousPreferences);
      }
      toast.error(err?.response?.data?.message || "Failed to update notification preferences.");
    },
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(NOTIFICATION_PREFERENCES_QUERY_KEY, data);
      }
      toast.success("Notification preferences updated.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_QUERY_KEY });
    },
  });
};
