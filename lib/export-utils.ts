/**
 * Data Export Utilities
 * Support for exporting data to CSV, JSON, and other formats
 */

export interface ExportOptions {
  filename?: string
  headers?: string[]
  dateFormat?: string
}

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(
  data: any[],
  headers?: string[]
): string {
  if (!data || data.length === 0) {
    return ""
  }

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0])
  
  // Create header row
  const headerRow = csvHeaders.map(escapeCSVValue).join(",")
  
  // Create data rows
  const dataRows = data.map((row) =>
    csvHeaders
      .map((header) => {
        const value = row[header]
        return escapeCSVValue(value)
      })
      .join(",")
  )

  return [headerRow, ...dataRows].join("\n")
}

/**
 * Escape CSV special characters
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)
  
  // If contains comma, newline, or quote, wrap in quotes and escape internal quotes
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Download CSV file
 */
export function downloadCSV(
  data: any[],
  filename: string = "export.csv",
  headers?: string[]
): void {
  const csv = convertToCSV(data, headers)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Download JSON file
 */
export function downloadJSON(
  data: any,
  filename: string = "export.json"
): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: "application/json;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export devotees list
 */
export function exportDevotees(devotees: any[]): void {
  const headers = [
    "Name",
    "Email",
    "Mobile",
    "Status",
    "Total Donations",
    "Total Pujas",
    "Joined Date",
  ]

  const data = devotees.map((devotee) => ({
    "Name": devotee.name,
    "Email": devotee.email || "",
    "Mobile": devotee.mobile || "",
    "Status": devotee.status,
    "Total Donations": devotee.totalDonations || 0,
    "Total Pujas": devotee.totalPujas || 0,
    "Joined Date": formatDate(devotee.joiningDate),
  }))

  downloadCSV(data, `devotees-${getCurrentDate()}.csv`, headers)
}

/**
 * Export donations list
 */
export function exportDonations(donations: any[]): void {
  const headers = [
    "Donation No",
    "Donor",
    "Type",
    "Purpose",
    "Amount",
    "Date",
    "Receipt Status",
  ]

  const data = donations.map((donation) => ({
    "Donation No": donation.donationNo,
    "Donor": donation.devotee?.name || donation.donorName || "Anonymous",
    "Type": donation.donationType,
    "Purpose": donation.purpose,
    "Amount": donation.amount,
    "Date": formatDate(donation.donationDate),
    "Receipt Status": donation.acknowledgmentSent ? "Sent" : "Pending",
  }))

  downloadCSV(data, `donations-${getCurrentDate()}.csv`, headers)
}

/**
 * Export puja requests
 */
export function exportPujaRequests(requests: any[]): void {
  const headers = [
    "Request No",
    "Devotee",
    "Type",
    "Deity",
    "Date",
    "Status",
    "Cost",
  ]

  const data = requests.map((request) => ({
    "Request No": request.requestNo,
    "Devotee": request.devotee?.name,
    "Type": request.pujaType,
    "Deity": request.deityName || "",
    "Date": formatDate(request.requestedDate),
    "Status": request.status,
    "Cost": request.actualCost || request.estimatedCost || 0,
  }))

  downloadCSV(data, `puja-requests-${getCurrentDate()}.csv`, headers)
}

/**
 * Export vouchers
 */
export function exportVouchers(vouchers: any[]): void {
  const headers = [
    "Voucher No",
    "Type",
    "Date",
    "Description",
    "Amount",
    "Status",
  ]

  const data = vouchers.map((voucher) => ({
    "Voucher No": voucher.voucherNo,
    "Type": voucher.voucherType,
    "Date": formatDate(voucher.voucherDate),
    "Description": voucher.description,
    "Amount": voucher.totalAmount,
    "Status": voucher.status,
  }))

  downloadCSV(data, `vouchers-${getCurrentDate()}.csv`, headers)
}

/**
 * Format date for export
 */
function formatDate(date: string | Date): string {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

/**
 * Get current date string (YYYY-MM-DD)
 */
function getCurrentDate(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Generate PDF report (requires external library)
 * This is a placeholder - you would use a library like jsPDF or similar
 */
export function generatePDFReport(
  title: string,
  data: any[],
  columns: string[]
): void {
  console.log("[v0] PDF generation requires external library (jsPDF, pdfkit, etc.)")
  console.log("Title:", title)
  console.log("Columns:", columns)
  // TODO: Implement PDF generation
}

/**
 * Print financial report
 */
export function printFinancialReport(report: any): void {
  const printWindow = window.open("", "", "width=800,height=600")
  if (!printWindow) return

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.title || "Financial Report"}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-weight: bold; background-color: #f9f9f9; }
        .date { text-align: right; margin-bottom: 20px; color: #666; }
      </style>
    </head>
    <body>
      <h1>${report.title || "Financial Report"}</h1>
      <div class="date">Generated: ${new Date().toLocaleDateString("en-IN")}</div>
      <table>
        <thead>
          <tr>
            ${report.headers?.map((h: string) => `<th>${h}</th>`).join("") || ""}
          </tr>
        </thead>
        <tbody>
          ${report.rows?.map((r: any) => `
            <tr>
              ${Array.isArray(r) ? r.map((cell: any) => `<td>${cell}</td>`).join("") : ""}
            </tr>
          `).join("") || ""}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.print()
}
