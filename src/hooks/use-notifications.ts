"use client";

import useSWR from "swr";
import { useRouter } from "next/navigation";
import { buildCompanyPathKey, companyPathFetcher } from "src/lib/helpers/swr";
import { useCompany } from "src/contexts/company-context";
import { CompanyNotificationRecord } from "src/types/notification";

export function useNotifications() {
  const router = useRouter();
  const { activeCompanyId } = useCompany();
  const key = buildCompanyPathKey(activeCompanyId, "/api/notifications");
  const { data, isLoading } = useSWR(
    key,
    ([companyId, requestPath]) => companyPathFetcher<CompanyNotificationRecord[]>(companyId, requestPath),
    {
      refreshInterval: 0,
      revalidateOnFocus: true,
      refreshWhenHidden: false,
    }
  );

  const handleOpenNotification = async (notification: CompanyNotificationRecord): Promise<void> => {
    router.push(`${notification.targetPath}&notificationId=${notification.id}`);
  };

  return {
    notifications: data || [],
    isLoading,
    handleOpenNotification,
  };
}
