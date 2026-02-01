import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { TripWithExpenses, statusLabels } from '@/types/reports';

export type ExportFormat = 'excel' | 'pdf' | 'csv';

interface ExportOptions {
  trips: TripWithExpenses[];
  contractors: Record<string, string>;
  format: ExportFormat;
  summaryStats?: {
    totalTrips: number;
    completedTrips: number;
    activeTrips: number;
    cancelledTrips: number;
    actualRevenue: number;
    actualExpenses: number;
    actualProfit: number;
    potentialRevenue: number;
    potentialProfit: number;
  };
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', { 
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  }).format(value);
};

const getHeaders = () => [
  '№',
  'Маршрут',
  'Описание груза',
  'Дата отправления',
  'Водитель',
  'Телефон водителя',
  'ТС',
  'Госномер',
  'Контрагент',
  'Вес (кг)',
  'Объём (м³)',
  'Доход (₽)',
  'Расходы (₽)',
  'Прибыль (₽)',
  'Статус'
];

const getRowData = (trip: TripWithExpenses, index: number, contractors: Record<string, string>) => [
  index + 1,
  `${trip.pointA} → ${trip.pointB}`,
  trip.cargo?.description || '—',
  format(new Date(trip.departureDate), 'dd.MM.yyyy', { locale: ru }),
  trip.driver.name,
  trip.driver.phone || '—',
  `${trip.vehicle.brand} ${trip.vehicle.model}`,
  trip.vehicle.licensePlate,
  contractors[trip.contractorId] || 'Неизвестный',
  trip.cargo?.weight || 0,
  trip.cargo?.volume || 0,
  formatCurrency(trip.cargo?.value || 0),
  formatCurrency(trip.totalExpenses),
  formatCurrency(trip.isProfitActual ? trip.actualProfit : trip.potentialProfit),
  statusLabels[trip.status]
];

export const exportToExcel = ({ trips, contractors, summaryStats }: Omit<ExportOptions, 'format'>) => {
  const workbook = XLSX.utils.book_new();
  
  // Main data sheet
  const headers = getHeaders();
  const data = trips.map((trip, index) => getRowData(trip, index, contractors));
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...data]);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // №
    { wch: 30 },  // Маршрут
    { wch: 25 },  // Описание груза
    { wch: 15 },  // Дата
    { wch: 20 },  // Водитель
    { wch: 15 },  // Телефон
    { wch: 20 },  // ТС
    { wch: 12 },  // Госномер
    { wch: 20 },  // Контрагент
    { wch: 10 },  // Вес
    { wch: 10 },  // Объём
    { wch: 15 },  // Доход
    { wch: 15 },  // Расходы
    { wch: 15 },  // Прибыль
    { wch: 12 },  // Статус
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Рейсы');
  
  // Summary sheet if stats provided
  if (summaryStats) {
    const summaryData = [
      ['Сводка по отчёту'],
      [''],
      ['Показатель', 'Значение'],
      ['Всего рейсов', summaryStats.totalTrips],
      ['Завершено', summaryStats.completedTrips],
      ['В работе', summaryStats.activeTrips],
      ['Отменено', summaryStats.cancelledTrips],
      [''],
      ['Финансовые показатели'],
      ['Фактическая выручка', `${formatCurrency(summaryStats.actualRevenue)} ₽`],
      ['Фактические расходы', `${formatCurrency(summaryStats.actualExpenses)} ₽`],
      ['Фактическая прибыль', `${formatCurrency(summaryStats.actualProfit)} ₽`],
      [''],
      ['Потенциальная выручка', `${formatCurrency(summaryStats.potentialRevenue)} ₽`],
      ['Потенциальная прибыль', `${formatCurrency(summaryStats.potentialProfit)} ₽`],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');
  }
  
  // Generate filename with date
  const fileName = `отчет_рейсы_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
};

export const exportToPDF = ({ trips, contractors, summaryStats }: Omit<ExportOptions, 'format'>) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  doc.setFontSize(16);
  doc.text('Отчёт по рейсам', 14, 15);
  
  doc.setFontSize(10);
  doc.text(`Дата формирования: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ru })}`, 14, 22);
  
  // Summary section if stats provided
  let startY = 30;
  if (summaryStats) {
    doc.setFontSize(12);
    doc.text('Сводка:', 14, startY);
    
    doc.setFontSize(9);
    const summaryText = [
      `Всего: ${summaryStats.totalTrips} | Завершено: ${summaryStats.completedTrips} | В работе: ${summaryStats.activeTrips} | Отменено: ${summaryStats.cancelledTrips}`,
      `Факт. выручка: ${formatCurrency(summaryStats.actualRevenue)} ₽ | Расходы: ${formatCurrency(summaryStats.actualExpenses)} ₽ | Прибыль: ${formatCurrency(summaryStats.actualProfit)} ₽`
    ];
    
    summaryText.forEach((text, i) => {
      doc.text(text, 14, startY + 6 + (i * 5));
    });
    
    startY += 20;
  }
  
  // Table headers (shortened for PDF)
  const headers = [
    '№',
    'Маршрут',
    'Дата',
    'Водитель',
    'ТС',
    'Контрагент',
    'Доход',
    'Расходы',
    'Прибыль',
    'Статус'
  ];
  
  // Table data
  const tableData = trips.map((trip, index) => [
    index + 1,
    `${trip.pointA} → ${trip.pointB}`.substring(0, 30),
    format(new Date(trip.departureDate), 'dd.MM.yy'),
    trip.driver.name.substring(0, 15),
    trip.vehicle.licensePlate,
    (contractors[trip.contractorId] || '—').substring(0, 15),
    formatCurrency(trip.cargo?.value || 0),
    formatCurrency(trip.totalExpenses),
    formatCurrency(trip.isProfitActual ? trip.actualProfit : trip.potentialProfit),
    statusLabels[trip.status]
  ]);
  
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 40 },
      2: { cellWidth: 18 },
      3: { cellWidth: 25 },
      4: { cellWidth: 22 },
      5: { cellWidth: 25 },
      6: { cellWidth: 22, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 22, halign: 'right' },
      9: { cellWidth: 20 },
    },
    didDrawPage: (data) => {
      // Footer with page number
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Страница ${data.pageNumber} из ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    },
  });
  
  // Generate filename with date
  const fileName = `отчет_рейсы_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export const exportToCSV = ({ trips, contractors }: Omit<ExportOptions, 'format'>) => {
  const headers = getHeaders();
  const data = trips.map((trip, index) => getRowData(trip, index, contractors));
  
  const escapeCsvCell = (cell: any): string => {
    const str = String(cell ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const csvRows = [
    headers.map(escapeCsvCell).join(','),
    ...data.map(row => row.map(escapeCsvCell).join(','))
  ];
  
  const csvString = csvRows.join('\n');
  const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fileName = `отчет_рейсы_${format(new Date(), 'dd-MM-yyyy')}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return fileName;
};

export const exportReport = (options: ExportOptions): string => {
  switch (options.format) {
    case 'excel':
      return exportToExcel(options);
    case 'pdf':
      return exportToPDF(options);
    case 'csv':
      return exportToCSV(options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
};
