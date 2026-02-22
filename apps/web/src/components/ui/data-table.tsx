"use client"

import * as React from "react"
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

export type SortingDirection = "asc" | "desc"

export interface ColumnDef<TData, TValue = unknown> {
  id: string
  accessorKey?: keyof TData
  header: string | React.ReactNode
  cell?: (info: { row: TData; getValue: () => TValue }) => React.ReactNode
  enableSorting?: boolean
  enableHiding?: boolean
}

export interface DataTableState {
  sorting: {
    id: string
    direction: SortingDirection
  } | null
  globalFilter: string
  pageIndex: number
  pageSize: number
  rowSelection: Record<string, boolean>
}

export interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  getRowId?: (row: TData) => string
  initialState?: Partial<DataTableState>
  enableRowSelection?: boolean
  enableMultiRowSelection?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
  pageSizeOptions?: number[]
  className?: string
  emptyMessage?: string
  loading?: boolean
}

function getValueByPath<T>(obj: T, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function matchFilter(value: unknown, filter: string): boolean {
  if (value == null) return false
  const str = String(value).toLowerCase()
  return str.includes(filter.toLowerCase())
}

export function DataTable<TData extends Record<string, unknown>>({
  columns,
  data,
  getRowId,
  initialState,
  enableRowSelection = false,
  enableMultiRowSelection = true,
  onRowSelectionChange,
  pageSizeOptions = [10, 20, 30, 50, 100],
  className,
  emptyMessage = "No results.",
  loading = false,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<DataTableState["sorting"]>(
    initialState?.sorting ?? null
  )
  const [globalFilter, setGlobalFilter] = React.useState(
    initialState?.globalFilter ?? ""
  )
  const [pageIndex, setPageIndex] = React.useState(
    initialState?.pageIndex ?? 0
  )
  const [pageSize, setPageSize] = React.useState(
    initialState?.pageSize ?? 10
  )
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>(
    initialState?.rowSelection ?? {}
  )

  const sortedData = React.useMemo(() => {
    if (!sorting) return data

    return [...data].sort((a, b) => {
      const aValue = sorting.id in a ? a[sorting.id] : getValueByPath(a, sorting.id)
      const bValue = sorting.id in b ? b[sorting.id] : getValueByPath(b, sorting.id)

      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      return sorting.direction === "desc" ? -comparison : comparison
    })
  }, [data, sorting])

  const filteredData = React.useMemo(() => {
    if (!globalFilter) return sortedData

    return sortedData.filter((row) => {
      return columns.some((col) => {
        const key = col.accessorKey as string
        if (!key) return false
        const value = key in row ? row[key] : getValueByPath(row, key)
        return matchFilter(value, globalFilter)
      })
    })
  }, [sortedData, globalFilter, columns])

  const pageCount = Math.ceil(filteredData.length / pageSize)
  const paginatedData = React.useMemo(() => {
    const start = pageIndex * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, pageIndex, pageSize])

  const selectedRows = React.useMemo(() => {
    return data.filter((row, index) => {
      const id = getRowId ? getRowId(row) : String(index)
      return rowSelection[id]
    })
  }, [data, rowSelection, getRowId])

  React.useEffect(() => {
    onRowSelectionChange?.(selectedRows)
  }, [selectedRows, onRowSelectionChange])

  React.useEffect(() => {
    if (pageIndex >= pageCount && pageCount > 0) {
      setPageIndex(pageCount - 1)
    }
  }, [pageCount, pageIndex])

  const handleSort = (columnId: string) => {
    setSorting((prev) => {
      if (!prev || prev.id !== columnId) {
        return { id: columnId, direction: "asc" }
      }
      if (prev.direction === "asc") {
        return { id: columnId, direction: "desc" }
      }
      return null
    })
  }

  const toggleAllRowsSelected = (checked: boolean) => {
    if (checked) {
      const allIds: Record<string, boolean> = {}
      paginatedData.forEach((row, index) => {
        const id = getRowId ? getRowId(row) : String(index)
        allIds[id] = true
      })
      setRowSelection(allIds)
    } else {
      setRowSelection({})
    }
  }

  const toggleRowSelected = (rowId: string, checked: boolean) => {
    if (!enableMultiRowSelection) {
      setRowSelection(checked ? { [rowId]: true } : {})
    } else {
      setRowSelection((prev) => ({
        ...prev,
        [rowId]: checked,
      }))
    }
  }

  const allRowsSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, index) => {
      const id = getRowId ? getRowId(row) : String(index)
      return rowSelection[id]
    })

  const someRowsSelected =
    paginatedData.some((row, index) => {
      const id = getRowId ? getRowId(row) : String(index)
      return rowSelection[id]
    }) && !allRowsSelected

  return (
    <div data-slot="data-table" className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              setPageIndex(0)
            }}
            className="pl-9 pr-9"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {enableRowSelection && (
                <TableHead className="w-12">
                  {enableMultiRowSelection && (
                    <Checkbox
                      checked={allRowsSelected}
                      indeterminate={someRowsSelected}
                      onCheckedChange={(checked) =>
                        toggleAllRowsSelected(checked === true)
                      }
                      aria-label="Select all"
                    />
                  )}
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead key={column.id}>
                  {column.enableSorting !== false ? (
                    <button
                      onClick={() => handleSort(column.id)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {typeof column.header === "string" ? (
                        column.header
                      ) : (
                        column.header
                      )}
                      {sorting?.id === column.id ? (
                        sorting.direction === "asc" ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  ) : typeof column.header === "string" ? (
                    column.header
                  ) : (
                    column.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (enableRowSelection ? 1 : 0)}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = getRowId ? getRowId(row) : String(rowIndex)
                const isSelected = rowSelection[rowId]

                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(isSelected && "bg-muted/50")}
                  >
                    {enableRowSelection && (
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            toggleRowSelected(rowId, checked === true)
                          }
                          aria-label="Select row"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const key = column.accessorKey as string
                      const value = key
                        ? key in row
                          ? row[key]
                          : getValueByPath(row, key)
                        : undefined

                      return (
                        <TableCell key={column.id}>
                          {column.cell
                            ? column.cell({
                                row,
                                getValue: () => value as unknown,
                              })
                            : value != null
                              ? String(value)
                              : null}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length > 0 && `${selectedRows.length} selected`}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => {
                setPageSize(Number(value))
                setPageIndex(0)
              }}
            >
              <SelectTrigger size="sm" className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Page {pageCount > 0 ? pageIndex + 1 : 0} of {pageCount}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPageIndex(0)}
              disabled={pageIndex === 0}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-xs"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={pageIndex >= pageCount - 1}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
