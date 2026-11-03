import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export type ExportCell = string | number | null;
export type ExportRow = Record<string, ExportCell>;

@Injectable({
  providedIn: 'root',
})
export class ReportExportService {
  exportCsv(filename: string, rows: ExportRow[]): void {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    const csvRows = [
      headers.map(header => this.escapeCsv(header)).join(','),
      ...rows.map(row =>
        headers
          .map(header => this.escapeCsv(row[header] ?? ''))
          .join(','),
      ),
    ];

    const csvContent = '\uFEFF' + csvRows.join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });

    this.downloadBlob(blob, filename);
  }

  exportExcel(
    stockRows: ExportRow[],
    operationRows: ExportRow[],
    filename: string,
  ): void {
    const workbook = XLSX.utils.book_new();

    const stockSheet = XLSX.utils.json_to_sheet(stockRows);
    const operationSheet = XLSX.utils.json_to_sheet(operationRows);

    XLSX.utils.book_append_sheet(
      workbook,
      stockSheet,
      'Stock Report',
    );

    XLSX.utils.book_append_sheet(
      workbook,
      operationSheet,
      'Operations',
    );

    XLSX.writeFile(workbook, filename);
  }

  private escapeCsv(value: ExportCell): string {
    const text = String(value ?? '');

    return `"${text.replace(/"/g, '""')}"`;
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    URL.revokeObjectURL(url);
  }
}