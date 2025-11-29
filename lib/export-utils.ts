import * as XLSX from "xlsx";

/**
 * Export selected IP addresses to Excel
 */
export function exportSelectedIPs(ipAddresses: any[], filename = "selected-ip-addresses.xlsx") {
  const data = ipAddresses.map((ip) => ({
    "IP Address": ip.address,
    "Subnet": ip.subnet,
    "Gateway": ip.gateway || "",
    "DNS": ip.dns || "",
    "Status": ip.status,
    "Assigned To": ip.assignedTo || "Not assigned",
    "Location": ip.location || "",
    "Notes": ip.notes || "",
    "Created At": new Date(ip.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "IP Addresses");

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row) => String(row[key as keyof typeof row] || "").length)
      ),
      maxWidth
    ),
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export selected equipment to Excel
 */
export function exportSelectedEquipment(equipment: any[], filename = "selected-equipment.xlsx") {
  const data = equipment.map((eq) => ({
    "Name": eq.name,
    "Type": eq.type,
    "Manufacturer": eq.manufacturer || "",
    "Model": eq.model || "",
    "Serial Number": eq.serialNumber || "",
    "MAC Address": eq.macAddress || "",
    "Location": eq.location || "",
    "Operator": eq.operator || "",
    "Status": eq.status,
    "IP Address": eq.ipAddress || "Not assigned",
    "Last Seen": eq.lastSeen ? new Date(eq.lastSeen).toLocaleDateString() : "Never",
    "Notes": eq.notes || "",
    "Created At": new Date(eq.createdAt).toLocaleDateString(),
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment");

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(data[0] || {}).map((key) => ({
    wch: Math.min(
      Math.max(
        key.length,
        ...data.map((row) => String(row[key as keyof typeof row] || "").length)
      ),
      maxWidth
    ),
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, filename);
}

/**
 * Export data to CSV
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]) {
  const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data));
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: any[], filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

