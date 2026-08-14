export interface PendingVoucher {
  uuid: string;
  id: string;
  type: "sales" | "purchases";
  date: string;
  thirdParty: string;
  amount: number;
  currency: string;
  status: "Listo" | "Error" | "Duplicado";
  message: string;
}
