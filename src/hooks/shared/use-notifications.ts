"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { apiRequest } from "src/lib/api/api-client";
import { useCompany } from "src/contexts/company-context";
import { notificationApiPath } from "src/lib/constants/notification";
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/platform/swr";
import { CompanyNotificationRecord, CompanyNotificationsResponse } from "src/types/notification/notification";

export function useNotifications() {
  const router = useRouter();
  const { activeCompanyId, loading: isCompanyLoading } = useCompany();
  const key = buildCompanyPathKey(activeCompanyId, notificationApiPath, !isCompanyLoading);
  const { data, isLoading, mutate } = useSWR(
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
    if (!activeCompanyId) {
      return;
    }

    await apiRequest(`${notificationApiPath}/${notification.id}`, {
      method: "DELETE",
      headers: { "x-company-id": activeCompanyId },
    });
    void mutate();
    router.push(notification.targetPath);
  };

  return {
    notifications: data?.notifications || [],
    isLoading,
    handleOpenNotification,
  };
}
