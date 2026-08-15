"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useToastManager } from "src/components/ui/toast";
import { useCompany } from "src/contexts/company-context";
import { readOptionalStringParam, readPositiveIntegerParam } from "src/lib/helpers/query-state";
import { buildCompanyPathKey, revalidateCompanyScope } from "src/lib/helpers/swr";
import { ConciliationsPageData, ConciliationsQueryState, ConciliationTab, PendingVoucher } from "src/types/conciliations";

const itemsPerPage = 4;

let pendingVouchersStore: PendingVoucher[] = [
  {
    uuid: "sales-1",
    id: "FC-A-0001-00000124",
    type: "sales",
    date: "2026-08-10",
    thirdParty: "Acme Corp S.A.",
    amount: 150000,
    currency: "ARS",
    status: "Listo",
    message: "Comprobante procesado correctamente mediante OCR.",
  },
  {
    uuid: "sales-2",
    id: "FC-B-0002-00000456",
    type: "sales",
    date: "2026-08-09",
    thirdParty: "Juan Pérez",
    amount: 45000,
    currency: "ARS",
    status: "Error",
    message: "Error de conexión con la API de facturación externa.",
  },
  {
    uuid: "sales-3",
    id: "FC-A-0001-00000124",
    type: "sales",
    date: "2026-08-10",
    thirdParty: "Acme Corp S.A.",
    amount: 150000,
    currency: "ARS",
    status: "Duplicado",
    message: "Este comprobante ya existe en la base de datos (ID duplicado).",
  },
  {
    uuid: "sales-4",
    id: "FC-A-0003-00000789",
    type: "sales",
    date: "2026-08-08",
    thirdParty: "Globex Corporation",
    amount: 2200,
    currency: "USD",
    status: "Listo",
    message: "Lectura de montos e impuestos exitosa.",
  },
  {
    uuid: "sales-5",
    id: "FC-A-0003-00000789",
    type: "sales",
    date: "2026-08-08",
    thirdParty: "Globex Corporation",
    amount: 2200,
    currency: "USD",
    status: "Duplicado",
    message: "Detectado comprobante idéntico importado en el mismo lote.",
  },
  {
    uuid: "sales-6",
    id: "FC-C-0005-00000012",
    type: "sales",
    date: "2026-08-07",
    thirdParty: "Consumidor Final",
    amount: 12500,
    currency: "ARS",
    status: "Error",
    message: "El CUIT del emisor no coincide con la empresa activa.",
  },
  {
    uuid: "sales-7",
    id: "FC-A-0001-00000128",
    type: "sales",
    date: "2026-08-06",
    thirdParty: "Tech Solutions SRL",
    amount: 85000,
    currency: "ARS",
    status: "Listo",
    message: "OCR finalizado con alta confianza.",
  },
  {
    uuid: "purchases-1",
    id: "FC-A-0010-00023456",
    type: "purchases",
    date: "2026-08-11",
    thirdParty: "Movistar Argentina",
    amount: 32000,
    currency: "ARS",
    status: "Listo",
    message: "Servicio de telecomunicaciones validado.",
  },
  {
    uuid: "purchases-2",
    id: "FC-C-0044-00008812",
    type: "purchases",
    date: "2026-08-10",
    thirdParty: "Librería San Martín",
    amount: 4500,
    currency: "ARS",
    status: "Error",
    message: "Monto total no coincide con la suma de los conceptos y el IVA.",
  },
  {
    uuid: "purchases-3",
    id: "FC-A-0010-00023456",
    type: "purchases",
    date: "2026-08-11",
    thirdParty: "Movistar Argentina",
    amount: 32000,
    currency: "ARS",
    status: "Duplicado",
    message: "Posible carga duplicada del mismo abono mensual.",
  },
  {
    uuid: "purchases-4",
    id: "FC-A-0022-00001234",
    type: "purchases",
    date: "2026-08-09",
    thirdParty: "Amazon Web Services",
    amount: 450,
    currency: "USD",
    status: "Listo",
    message: "Invoice en USD parseada correctamente.",
  },
  {
    uuid: "purchases-5",
    id: "FC-A-0022-00001234",
    type: "purchases",
    date: "2026-08-09",
    thirdParty: "Amazon Web Services",
    amount: 450,
    currency: "USD",
    status: "Duplicado",
    message: "Factura en USD duplicada por error de importación.",
  },
  {
    uuid: "purchases-6",
    id: "FC-B-0088-00000999",
    type: "purchases",
    date: "2026-08-08",
    thirdParty: "Papelera Oeste",
    amount: 18900,
    currency: "ARS",
    status: "Error",
    message: "Fecha del comprobante fuera del período fiscal actual.",
  },
];

function readConciliationsQuery(searchParams: URLSearchParams): ConciliationsQueryState {
  return {
    batchId: readOptionalStringParam(searchParams, "batchId"),
    tab: searchParams.get("tab") === "purchases" ? "purchases" : "sales",
    page: readPositiveIntegerParam(searchParams, "page", 1),
  };
}

function buildConciliationsQueryString(query: ConciliationsQueryState): string {
  const params = new URLSearchParams();

  if (query.batchId) {
    params.set("batchId", query.batchId);
  }

  params.set("tab", query.tab);
  params.set("page", query.page.toString());
  return params.toString();
}

function buildConciliationsPath(query: ConciliationsQueryState): string {
  return `/conciliations?${buildConciliationsQueryString(query)}`;
}

function resolveConciliationsPage(query: ConciliationsQueryState): ConciliationsPageData {
  const filteredVouchers = pendingVouchersStore.filter((voucher) => voucher.type === query.tab);
  const totalCount = filteredVouchers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const currentPage = Math.min(query.page, totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;

  return {
    items: filteredVouchers.slice(startIndex, startIndex + itemsPerPage),
    totalCount,
    totalPages,
    currentPage,
    startIndex,
  };
}

export function useConciliations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();
  const { activeCompanyId } = useCompany();
  const [loadingVouchers, setLoadingVouchers] = useState<Record<string, boolean>>({});
  const query = useMemo(() => readConciliationsQuery(searchParams), [searchParams]);
  const key = buildCompanyPathKey(activeCompanyId, buildConciliationsPath(query));
  const { data, mutate } = useSWR(
    key,
    () => Promise.resolve(resolveConciliationsPage(query)),
    {
      keepPreviousData: true,
    }
  );

  useEffect(() => {
    if (!data || query.page <= data.totalPages) {
      return;
    }

    const nextQuery = {
      ...query,
      page: data.totalPages,
    };

    router.push(`${pathname}?${buildConciliationsQueryString(nextQuery)}`, { scroll: false });
  }, [data, pathname, query, router]);

  const syncQuery = (nextQuery: ConciliationsQueryState): void => {
    router.push(`${pathname}?${buildConciliationsQueryString(nextQuery)}`, { scroll: false });
  };

  const handleTabChange = (tab: ConciliationTab) => {
    syncQuery({
      ...query,
      tab,
      page: 1,
    });
  };

  const handlePageChange = (page: number) => {
    syncQuery({
      ...query,
      page,
    });
  };

  const handleReview = (id: string) => {
    toastManager.add({
      type: "success",
      title: "Revisión iniciada",
      description: `Iniciando revisión manual del comprobante ${id}.`,
    });
  };

  const handleRegenerate = (uuid: string, id: string) => {
    setLoadingVouchers((currentValue) => ({ ...currentValue, [uuid]: true }));

    window.setTimeout(async () => {
      setLoadingVouchers((currentValue) => ({ ...currentValue, [uuid]: false }));
      await mutate();
      toastManager.add({
        type: "success",
        title: "Regeneración completada",
        description: `El comprobante ${id} ha sido reprocesado correctamente.`,
      });
    }, 2000);
  };

  const handleDelete = async (uuid: string) => {
    pendingVouchersStore = pendingVouchersStore.filter((voucher) => voucher.uuid !== uuid);

    if (activeCompanyId) {
      await revalidateCompanyScope(activeCompanyId, ["/conciliations"]);
    }

    await mutate();
    toastManager.add({
      type: "success",
      title: "Comprobante eliminado",
      description: "El comprobante duplicado ha sido removido de la cola correctamente.",
    });
  };

  return {
    activeTab: query.tab,
    currentPage: data?.currentPage || query.page,
    totalPages: data?.totalPages || 1,
    totalCount: data?.totalCount || 0,
    startIndex: data?.startIndex || 0,
    paginatedVouchers: data?.items || [],
    loadingVouchers,
    handleTabChange,
    handlePageChange,
    handleReview,
    handleRegenerate,
    handleDelete,
  };
}
