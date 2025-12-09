// ExportPermitsButton.tsx - Reusable export component for All Permits page
// Location: frontend/src/components/common/ExportPermitsButton.tsx

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportPermitsButtonProps {
  permits: any[];
  fileName?: string;
  variant?: 'primary' | 'secondary';
}

export default function ExportPermitsButton({
  permits,
  fileName = 'PTW_Export',
  variant = 'primary'
}: ExportPermitsButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const exportToExcel = () => {
    setIsExporting(true);
    setShowDropdown(false);

    try {
      // Create CSV content
      const headers = [
        'Permit Serial',
        'Type',
        'Location',
        'Description',
        'Start Time',
        'End Time',
        'Status',
        'Site',
        'Created By',
        'Team Size'
      ];

      const rows = permits.map(permit => [
        permit.permit_serial || permit.permit_number || 'N/A',
        permit.permit_type || 'N/A',
        permit.work_location || 'N/A',
        (permit.work_description || 'N/A').replace(/"/g, '""'), // Escape quotes
        permit.start_time ? new Date(permit.start_time).toLocaleString() : 'N/A',
        permit.end_time ? new Date(permit.end_time).toLocaleString() : 'N/A',
        permit.status || 'N/A',
        permit.site_name || 'N/A',
        permit.created_by_name || permit.created_by || 'N/A',
        permit.team_size || 0
      ]);

      // Create CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Add BOM for Excel UTF-8 support
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(`✅ Successfully exported ${permits.length} permit(s) to Excel!`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('❌ Failed to export to Excel. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    setShowDropdown(false);

    try {
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${fileName}</title>
          <style>
            @page { 
              size: A4 landscape; 
              margin: 15mm;
            }
            body { 
              font-family: Arial, sans-serif; 
              padding: 0;
              margin: 0;
              font-size: 10px;
            }
            .header {
              background: #1e40af;
              color: white;
              padding: 15px;
              margin-bottom: 20px;
            }
            h1 { 
              margin: 0;
              font-size: 18px;
            }
            .report-info {
              background: #f3f4f6;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 15px;
              font-size: 9px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 9px;
            }
            th { 
              background: #1e40af; 
              color: white; 
              padding: 8px 5px;
              text-align: left;
              font-weight: 600;
              font-size: 9px;
            }
            td { 
              padding: 6px 5px; 
              border-bottom: 1px solid #e5e7eb;
              vertical-align: top;
            }
            tr:nth-child(even) { 
              background: #f9fafb; 
            }
            .status-active { color: #059669; font-weight: 600; }
            .status-pending { color: #d97706; font-weight: 600; }
            .status-closed { color: #6b7280; font-weight: 600; }
            .footer {
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 Permit to Work (PTW) Export Report</h1>
          </div>
          
          <div class="report-info">
            <strong>Generated:</strong> ${new Date().toLocaleString()} | 
            <strong>Total Permits:</strong> ${permits.length}
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 10%;">Permit Serial</th>
                <th style="width: 10%;">Type</th>
                <th style="width: 15%;">Location</th>
                <th style="width: 20%;">Description</th>
                <th style="width: 12%;">Start Time</th>
                <th style="width: 12%;">End Time</th>
                <th style="width: 10%;">Status</th>
                <th style="width: 11%;">Site</th>
              </tr>
            </thead>
            <tbody>
              ${permits.map(permit => `
                <tr>
                  <td>${permit.permit_serial || permit.permit_number || 'N/A'}</td>
                  <td>${permit.permit_type || 'N/A'}</td>
                  <td>${permit.work_location || 'N/A'}</td>
                  <td>${(permit.work_description || 'N/A').substring(0, 100)}${(permit.work_description || '').length > 100 ? '...' : ''}</td>
                  <td>${permit.start_time ? new Date(permit.start_time).toLocaleString() : 'N/A'}</td>
                  <td>${permit.end_time ? new Date(permit.end_time).toLocaleString() : 'N/A'}</td>
                  <td class="status-${(permit.status || '').toLowerCase().replace(/_/g, '-')}">${permit.status || 'N/A'}</td>
                  <td>${permit.site_name || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p><strong>Amazon EPTW System</strong> - Automated Report</p>
            <p>This document contains ${permits.length} permit record(s). Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `;

      // Open in new window for printing/saving as PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        // Trigger print dialog after content loads
        setTimeout(() => {
          printWindow.print();
        }, 500);

        alert('✅ PDF ready! Use Print > Save as PDF in the print dialog.');
      } else {
        alert('❌ Please allow popups to export to PDF.');
      }
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('❌ Failed to export to PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const buttonClasses = variant === 'primary'
    ? 'bg-orange-600 hover:bg-orange-700 text-white'
    : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300';

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting || permits.length === 0}
        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export Report
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {showDropdown && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 z-20 w-48 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg">
            <button
              onClick={exportToExcel}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left text-gray-700 transition-colors hover:bg-gray-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Export to Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center w-full gap-3 px-4 py-3 text-sm text-left text-gray-700 transition-colors border-t border-gray-200 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 text-red-600" />
              <span>Export to PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}