import { Skeleton } from "src/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "src/components/ui/table";

export function VoucherSkeleton() {
  return (
    <div className="rounded-[12px] overflow-hidden bg-[#111113] border border-[#1F1F23]">
      <Table className="text-[13px] text-[#FFFFFF]">
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i} className="bg-[#141417] border-b-[#1F1F23] hover:bg-[#1A1A1D]">
              <TableCell>
                <Skeleton className="h-4 w-16 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-6 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-24 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20 bg-[#2A2A2E]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-20 ml-auto bg-[#2A2A2E]" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="h-4 w-20 ml-auto bg-[#2A2A2E]" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8 rounded-full ml-auto bg-[#2A2A2E]" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
