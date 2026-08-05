export function downloadCSV(filename: string, headers: string[], data: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const stringCell = String(cell);
    if (stringCell.includes(',') || stringCell.includes('"') || stringCell.includes('\n')) {
      return `"${stringCell.replace(/"/g, '""')}"`;
    }
    return stringCell;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...data.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
