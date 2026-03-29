/**
 * Generate a CSV file and trigger a download in the browser.
 * Properly escapes values containing commas, quotes, or newlines.
 */
export function downloadCSV(rows: string[][], filename: string) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\n\r]/.test(cell)) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
