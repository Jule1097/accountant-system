"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr";
import { useCompany } from "src/contexts/company-context";
import { CompanyNotificationRecord, CompanyNotificationsResponse } from "src/types/notification/notification";

export function useNotifications() {
  const router = useRouter();
  const { activeCompanyId, loading: isCompanyLoading } = useCompany();
  const key = buildCompanyPathKey(activeCompanyId, "/api/notifications", !isCompanyLoading);
  const { data, isLoading } = useSWR(
    key,
    ([companyId, requestPath]) => companyPathFetcher<CompanyNotificationsResponse>(companyId, requestPath),
    {
      refreshInterval: (currentData: CompanyNotificationsResponse | undefined) =>
        currentData?.hasActiveParserBatch ? 30000 : 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenHidden: false,
    }
  );

  const handleOpenNotification = async (notification: CompanyNotificationRecord): Promise<void> => {
    router.push(`${notification.targetPath}&notificationId=${notification.id}`);
  };

  return {
    notifications: data?.notifications || [],
    isLoading,
    handleOpenNotification,
  };
}
