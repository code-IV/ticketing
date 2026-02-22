import { useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';

interface ExportControlsProps {
  data: any;
  fileName?: string;
  title?: string;
  onExport?: (type: 'csv' | 'pdf' | 'print') => void;
}

export function ExportControls({ 
  data, 
  fileName = 'analytics-data', 
  title = 'Analytics Data',
  onExport 
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToCSV = () => {
    setIsExporting(true);
    
    try {
      // Convert data to CSV
      const csvContent = convertToCSV(data);
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onExport?.('csv');
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      // Simple PDF generation using browser print
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1f2937; margin-bottom: 20px; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                @media print { body { margin: 10px; } }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              ${generateTableHTML(data)}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        
        onExport?.('pdf');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const printData = () => {
    setIsExporting(true);
    
    try {
      const printWindow = window.open('', '_blank');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title} - Print</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1f2937; margin-bottom: 20px; }
                table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                @media print { body { margin: 10px; } }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              ${generateTableHTML(data)}
            </body>
          </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        
        onExport?.('print');
      }
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const convertToCSV = (data: any): string => {
    if (!data || Array.isArray(data) === false) return '';
    
    // Handle different data structures
    const headers = Object.keys(data[0] || {});
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map((row: any) => {
      return headers.map(header => {
        const value = row[header];
        // Handle nested objects and arrays
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        // Handle strings with commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',');
    }).join('\n');
    });
    
    return `${csvHeaders}\n${csvRows.join('\n')}`;
  };

  const generateTableHTML = (data: any): string => {
    if (!data || Array.isArray(data) === false) return '<p>No data available</p>';
    
    const headers = Object.keys(data[0] || {});
    const headerRow = headers.map(header => `<th>${formatHeader(header)}</th>`).join('');
    
    const bodyRows = data.map((row: any) => {
      const cells = headers.map(header => `<td>${formatCellValue(row[header])}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    return `
      <table>
        <thead>
          <tr>${headerRow}</tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>
    `;
  };

  const formatHeader = (header: string): string => {
    return header
      .replace(/_/g, ' ')
      .replace(/\b\w/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  };

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Export Options</h3>
        <div className="text-sm text-gray-500">
          {Array.isArray(data) ? `${data.length} records` : 'Data available'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV Export */}
        <button
          onClick={exportToCSV}
          disabled={isExporting || !data}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4 mr-2" />
          <span>Export CSV</span>
        </button>
        
        {/* PDF Export */}
        <button
          onClick={exportToPDF}
          disabled={isExporting || !data}
          className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          <span>Export PDF</span>
        </button>
        
        {/* Print */}
        <button
          onClick={printData}
          disabled={isExporting || !data}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Printer className="h-4 w-4 mr-2" />
          <span>Print</span>
        </button>
      </div>
      
      {isExporting && (
        <div className="mt-4 text-center text-sm text-gray-600">
          Exporting... Please wait.
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>• CSV: Download data for spreadsheet analysis</p>
        <p>• PDF: Generate formatted report document</p>
        <p>• Print: Direct print with optimized formatting</p>
      </div>
    </div>
  );
}
