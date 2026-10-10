import React, { useState, useMemo } from 'react';
import { Table, TableHead, TableRow, TableCell, TableBody, TableSortLabel, TablePagination, TextField, Box } from '@mui/material';

export interface TableColumn<T> {
  label: string;
  field: keyof T | string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
}

interface TableWithPaginationProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowsPerPage?: number;
  rowStyle?: (row: T) => React.CSSProperties;
  extraToolbar?: React.ReactNode;
}

function TableWithPagination<T extends { [key: string]: any }>({ columns, data, rowsPerPage = 50, rowStyle, extraToolbar }: TableWithPaginationProps<T>) {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState<string>('');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<{ [key: string]: string }>({});

  const handleSort = (field: string) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrder('asc');
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const filteredData = useMemo(() => {
    return data.filter(row =>
      columns.every(col => {
        const fieldKey = String(col.field);
        if (col.filterable && filters[fieldKey]) {
          const val = String(row[fieldKey] ?? '').toLowerCase();
          return val.includes(filters[fieldKey].toLowerCase());
        }
        return true;
      })
    );
  }, [data, columns, filters]);

  const sortedData = useMemo(() => {
    if (!orderBy) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[orderBy] ?? '';
      const bVal = b[orderBy] ?? '';
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, orderBy, order]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedData.slice(start, start + rowsPerPage);
  }, [sortedData, page, rowsPerPage]);

  return (
    <Box>
      <Table>
        <TableHead>
          <TableRow>
            {extraToolbar && (
              <TableCell colSpan={columns.length} style={{ paddingBottom: 0, borderBottom: 'none' }}>
                {extraToolbar}
              </TableCell>
            )}
          </TableRow>
          <TableRow>
            {columns.map(col => (
              <TableCell key={String(col.field)} align={col.align || 'left'}>
                {col.sortable ? (
                  <TableSortLabel
                    active={orderBy === col.field}
                    direction={orderBy === col.field ? order : 'asc'}
                    onClick={() => handleSort(String(col.field))}
                  >
                    {col.label}
                  </TableSortLabel>
                ) : col.label}
                {col.filterable && (
                  <TextField
                    size="small"
                    variant="standard"
                    placeholder={`Filtrar`}
                    value={filters[String(col.field)] || ''}
                    onChange={e => handleFilterChange(String(col.field), e.target.value)}
                    sx={{ mt: 1, width: '100%' }}
                  />
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedData.map((row, idx) => (
            <TableRow key={row.id_documento || idx} style={rowStyle ? rowStyle(row) : {}}>
              {columns.map(col => (
                <TableCell key={String(col.field)} align={col.align || 'left'}>
                  {col.render ? col.render(row) : String(row[col.field] ?? '')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={sortedData.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={() => {}}
        rowsPerPageOptions={[rowsPerPage]}
      />
    </Box>
  );
}

export default TableWithPagination;
