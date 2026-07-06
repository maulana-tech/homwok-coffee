"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  cn,
} from "@homwok/ui";

export interface DataTableColumn<T> {
  /** Object key used for the default cell value + as the React key of the column. */
  key: string;
  /** Column heading text (rendered uppercase). */
  header: string;
  /** Custom cell renderer. Falls back to `String(row[key])` when omitted. */
  render?: (row: T) => ReactNode;
  /** Extra classes applied to both the header + body cells of this column. */
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  /** Rendered in a trailing, right-aligned "Aksi" cell. */
  actions?: (row: T) => ReactNode;
  /** Stable key per row. Defaults to the row index. */
  getRowKey?: (row: T, index: number) => string | number;
  /** Extra classes per row — handy for status emphasis (e.g. border-l-4). */
  rowClassName?: (row: T) => string | undefined;
  emptyText?: string;
}

const SKELETON_ROWS = 5;

/**
 * Generic, prop-driven brutalist table. Presentational only — the page owns the
 * data + mutations. Shows Skeleton rows while loading and an empty state.
 */
export function DataTable<T>({
  columns,
  rows,
  isLoading = false,
  actions,
  getRowKey,
  rowClassName,
  emptyText = "Tidak ada data",
}: DataTableProps<T>) {
  const colSpan = columns.length + (actions ? 1 : 0);

  return (
    <div className="rounded-lg border border-border bg-background overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border hover:bg-transparent">
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  "uppercase font-medium tracking-tight text-primary",
                  col.className,
                )}
              >
                {col.header}
              </TableHead>
            ))}
            {actions && (
              <TableHead className="uppercase font-medium tracking-tight text-primary text-right">
                Aksi
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: SKELETON_ROWS }).map((_, r) => (
              <TableRow
                key={`skeleton-${r}`}
                className="border-b border-border hover:bg-transparent"
              >
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton className="h-5 w-full" />
                  </TableCell>
                ))}
                {actions && (
                  <TableCell>
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={colSpan}
                className="text-center py-12 uppercase text-sm tracking-widest text-muted-foreground"
              >
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, i) => (
              <TableRow
                key={getRowKey ? getRowKey(row, i) : i}
                className={cn("border-b border-border", rowClassName?.(row))}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-right">{actions(row)}</TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
