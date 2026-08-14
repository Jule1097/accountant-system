import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useToastManager } from "src/components/ui/toast";
import { PendingVoucher } from "src/types/conciliations";

const mockVouchersList: PendingVoucher[] = [
  {
    uuid: "sales-1",
    id: "FC-A-0001-00000124",
    type: "sales",
    date: "2026-08-10",
    thirdParty: "Acme Corp S.A.",
    amount: 150000.00,
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
    amount: 45000.00,
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
    amount: 150000.00,
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
    amount: 2200.00,
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
    amount: 2200.00,
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
    amount: 12500.00,
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
    amount: 85000.00,
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
    amount: 32000.00,
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
    amount: 4500.00,
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
    amount: 32000.00,
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
    amount: 450.00,
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
    amount: 450.00,
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
    amount: 18900.00,
    currency: "ARS",
    status: "Error",
    message: "Fecha del comprobante fuera del período fiscal actual.",
  }
];

export function useConciliations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const toastManager = useToastManager();

  const [vouchers, setVouchers] = useState<PendingVoucher[]>(mockVouchersList);
  const [loadingVouchers, setLoadingVouchers] = useState<Record<string, boolean>>({});

  const activeTab = searchParams.get("tab") === "purchases" ? "purchases" : "sales";
  const currentPage = Number(searchParams.get("page") || "1");

  const filteredVouchers = vouchers.filter((v) => v.type === activeTab);
  const totalCount = filteredVouchers.length;
  const totalPages = Math.ceil(totalCount / 4);
  const startIndex = (currentPage - 1) * 4;
  const paginatedVouchers = filteredVouchers.slice(startIndex, startIndex + 4);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", totalPages.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [totalPages, currentPage, pathname, router, searchParams]);

  const handleTabChange = (tab: "sales" | "purchases") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleReview = (id: string) => {
    toastManager.add({
      type: "success",
      title: "Revisión iniciada",
      description: `Iniciando revisión manual del comprobante ${id}.`,
    });
  };

  const handleRegenerate = (uuid: string, id: string) => {
    setLoadingVouchers((prev) => ({ ...prev, [uuid]: true }));
    setTimeout(() => {
      setLoadingVouchers((prev) => ({ ...prev, [uuid]: false }));
      toastManager.add({
        type: "success",
        title: "Regeneración completada",
        description: `El comprobante ${id} ha sido reprocesado correctamente.`,
      });
    }, 2000);
  };

  const handleDelete = (uuid: string) => {
    setVouchers((prev) => prev.filter((v) => v.uuid !== uuid));
    toastManager.add({
      type: "success",
      title: "Comprobante eliminado",
      description: "El comprobante duplicado ha sido removido de la cola correctamente.",
    });
  };

  return {
    activeTab,
    currentPage,
    totalPages,
    totalCount,
    startIndex,
    paginatedVouchers,
    loadingVouchers,
    handleTabChange,
    handlePageChange,
    handleReview,
    handleRegenerate,
    handleDelete,
  };
}
