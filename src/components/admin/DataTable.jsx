import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

export default function DataTable({ columns, data, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-emerald-50/50">
            {columns.map((col, i) => (
              <TableHead key={i} className="font-semibold text-emerald-900">
                {col.header}
              </TableHead>
            ))}
            <TableHead className="font-semibold text-emerald-900">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} className="hover:bg-emerald-50/30">
              {columns.map((col, i) => (
                <TableCell key={i}>
                  {col.render ? col.render(row) : row[col.key]}
                </TableCell>
              ))}
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onEdit(row)}
                    className="h-8 w-8 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => onDelete(row)}
                    className="h-8 w-8 rounded-lg text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}