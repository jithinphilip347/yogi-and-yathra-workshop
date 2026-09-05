import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import courseApi from "@/libs/courseApi";
import toast from "react-hot-toast";

/**
 * Custom TanStack Query Hook for Daily Class Certificate Experience (Sprint 3)
 *
 * Ensures:
 * 1. Server-side authoritative eligibility & attendance stats.
 * 2. Idempotent claim mutation with automatic cache invalidation.
 * 3. Graceful error handling without frontend calculation drift.
 */
export const useDailyClassCertificate = (dailyClassId, isEnrolled = true) => {
  const queryClient = useQueryClient();

  const queryKey = ["daily-class-certificate-eligibility", dailyClassId];

  // 1. Fetch Eligibility & Attendance Stats from authoritative backend
  const {
    data: eligibility,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!dailyClassId) return null;
      const res = await courseApi.getDailyClassCertificateEligibility(dailyClassId);
      return res.data?.data || res.data || null;
    },
    enabled: Boolean(dailyClassId && isEnrolled),
    staleTime: 30 * 1000, // 30 seconds freshness
    refetchOnWindowFocus: false,
  });

  // 2. Claim Certificate Mutation
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!dailyClassId) throw new Error("Daily Class ID is required.");
      const res = await courseApi.claimDailyClassCertificate(dailyClassId);
      return res.data?.data || res.data;
    },
    onSuccess: (certPayload) => {
      toast.success("Certificate claimed successfully!");

      // Optimistically / actively update the local eligibility query cache
      queryClient.setQueryData(queryKey, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          eligible: true,
          is_claimed: true,
          status: "issued",
          certificate: certPayload,
        };
      });

      // Invalidate relevant queries so everything across the app syncs
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["user-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
    },
    onError: (err) => {
      console.error("Daily Class certificate claim error:", err);
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to claim certificate. Please check your eligibility and try again.";
      toast.error(message);
    },
  });

  return {
    eligibility,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    claimCertificate: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
};

export default useDailyClassCertificate;
