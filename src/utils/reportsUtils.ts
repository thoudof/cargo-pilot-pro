
// Вспомогательная функция для экранирования данных для CSV
export const escapeCsvCell = (cellData: any): string => {
  const stringData = String(cellData === null || cellData === undefined ? '' : cellData);
  if (stringData.includes(',') || stringData.includes('"') || stringData.includes('\n')) {
    return `"${stringData.replace(/"/g, '""')}"`;
  }
  return stringData;
};

