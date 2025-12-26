import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, X, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { JOB_ROLES } from '../../utils/jobRoles';
import { DEPARTMENTS } from '../../utils/departments';

interface BulkImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkImportModal({ onClose, onSuccess }: BulkImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [report, setReport] = useState<{ successful: number; failed: number; errors: string[] } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const isExcel = selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || selectedFile.name.endsWith('.xlsx');
            const isCSV = selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv');

            if (!isExcel && !isCSV) {
                alert('Please upload a valid CSV or Excel file');
                return;
            }
            setFile(selectedFile);
            if (isExcel) {
                parseExcelFile(selectedFile);
            } else {
                parseFile(selectedFile);
            }
        }
    };

    const processImportData = (data: any[]) => {
        // Clean and validate data
        const cleanData = data
            .filter((row: any) => {
                // Check if row has at least one non-empty required field
                return row.login_id || row.email || row.full_name;
            })
            .map((row: any) => {
                // Normalize Role aliases (supports comma separated)
                const roleInput = (row.role || '').toString();
                const roles = roleInput.split(',').map((r: string) => r.trim());
                const mappedRoles = roles.map((r: string) => {
                    const lowerRole = r.toLowerCase();
                    if (lowerRole.includes('supervisor')) return 'Requester';
                    if (lowerRole.includes('safety')) return 'Approver_Safety';
                    if (lowerRole.includes('owner') || lowerRole.includes('area')) return 'Approver_AreaOwner';
                    if (lowerRole.includes('site') && lowerRole.includes('lead')) return 'Approver_SiteLeader';
                    if (lowerRole.includes('worker')) return 'Worker';
                    if (lowerRole.includes('admin')) return 'Admin';
                    return r; // Fallback to original if no match
                });

                // Remove duplicates after mapping
                const uniqueRoles = Array.from(new Set(mappedRoles));
                const role = uniqueRoles.join(',');

                return {
                    ...row,
                    role,
                    // Ensure login_id matches constraints (simple cleanup)
                    login_id: row.login_id?.toString().replace(/[^a-zA-Z0-9_]/g, '_')
                };
            });

        setParsedData(cleanData);
    };

    const parseExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                // SheetJS might not lowercase headers by default, let's normalize them
                const normalizedData = jsonData.map((row: any) => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        newRow[key.trim().toLowerCase()] = row[key];
                    });
                    return newRow;
                });

                processImportData(normalizedData);
            } catch (error) {
                console.error('Excel Parsing Error:', error);
                alert('Failed to parse Excel file. Please ensure it is a valid .xlsx file.');
            }
        };
        reader.onerror = () => alert('Failed to read file');
        reader.readAsArrayBuffer(file);
    };

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy', // Better handling of empty lines
            transformHeader: (header) => header.trim().toLowerCase(), // Normalize headers
            transform: (value) => value.trim(), // Trim all values
            complete: (results) => {
                processImportData(results.data);
            },
            error: (error) => {
                console.error('CSV Parsing Error:', error);
                alert('Failed to parse CSV file');
            }
        });
    };

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        setImporting(true);
        setReport(null);

        try {
            const response = await fetch('/api/users/bulk-import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ users: parsedData })
            });

            const data = await response.json();

            if (data.success) {
                setReport(data.data);
                if (data.data.successful > 0) {
                    setTimeout(() => onSuccess(), 2000); // Trigger refresh after delay
                }
            } else {
                alert(data.message || 'Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            alert('Failed to import users');
        } finally {
            setImporting(false);
        }
    };

    const downloadTemplate = () => {
        // Data for Sheet 1: Import Template
        const templateData = [
            ["login_id", "full_name", "email", "password", "role", "department", "job_role", "site"],
            ["john_doe", "John Doe", "john@example.com", "Password123!", "Worker", "Operations", "Process Assistant", "Bangalore-1"],
            ["jane_smith", "Jane Smith", "jane@example.com", "SecurePass!1", "Supervisor", "WHS", "WHS Supervisor", "Mumbai-2"],
            ["safety_approver", "Safety Officer", "safety@example.com", "Safety123!", "Approver_Safety", "SLP", "SLP Manager", "Chennai-1"]
        ];

        // Data for Sheet 2: Reference Section
        const referenceData = [
            ["CATEGORY", "VALID OPTIONS / NOTES"],
            ["Valid Roles", "Worker, Requester, Approver_Safety, Approver_AreaOwner, Approver_SiteLeader, Admin"],
            ["Role Note", "\"Supervisor\" maps to \"Requester\""],
            ["Valid Departments", DEPARTMENTS.join(', ')],
            ["Valid Job Roles", JOB_ROLES.join(', ')]
        ];

        const wb = XLSX.utils.book_new();
        const wsTemplate = XLSX.utils.aoa_to_sheet(templateData);
        const wsReference = XLSX.utils.aoa_to_sheet(referenceData);

        // Adjust column widths for better readability
        const wscols = [
            { wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
            { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }
        ];
        wsTemplate['!cols'] = wscols;
        wsReference['!cols'] = [{ wch: 20 }, { wch: 80 }];

        XLSX.utils.book_append_sheet(wb, wsTemplate, "Import Template");
        XLSX.utils.book_append_sheet(wb, wsReference, "Reference Section");

        XLSX.writeFile(wb, "user_import_template.xlsx");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Bulk Import Users</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {!report ? (
                    <div className="space-y-6">
                        {/* Template Download */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900">Instructions</h4>
                                    <p className="mt-1 text-sm text-blue-700">
                                        Upload a CSV file with the following headers: <br />
                                        <code className="bg-blue-100 px-1 rounded">login_id, full_name, email, password, role, department, job_role, site</code>
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="flex items-center gap-2 mt-3 text-sm font-medium text-blue-700 hover:text-blue-800 hover:underline"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Template CSV
                                    </button>
                                </div>
                            </div>
                        </div>



                        {/* File Upload */}
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${file ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50'
                                }`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".csv"
                                className="hidden"
                            />
                            <Upload className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-orange-600' : 'text-gray-400'}`} />
                            {file ? (
                                <div>
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    <p className="mt-2 text-sm text-green-600">{parsedData.length} records found</p>
                                </div>
                            ) : (
                                <div>
                                    <p className="font-medium text-gray-900">Click to upload CSV</p>
                                    <p className="text-sm text-gray-500">or drag and drop file here</p>
                                </div>
                            )}
                        </div>

                        {/* Preview (First 5 records) */}
                        {parsedData.length > 0 && (
                            <div>
                                <h4 className="mb-2 text-sm font-medium text-gray-700">Preview (First 5 records)</h4>
                                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                {Object.keys(parsedData[0]).slice(0, 5).map((header) => (
                                                    <th key={header} className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                                                        {header}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {parsedData.slice(0, 5).map((row: any, i: number) => (
                                                <tr key={i}>
                                                    {Object.values(row).slice(0, 5).map((cell: any, j: number) => (
                                                        <td key={j} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!file || importing || parsedData.length === 0}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {importing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Import {parsedData.length} Users
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Report View */
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 text-green-800 bg-green-50 rounded-lg">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                            <div>
                                <h3 className="font-bold">Import Completed</h3>
                                <p>Successfully created {report.successful} users.</p>
                            </div>
                        </div>

                        {report.failed > 0 && (
                            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                                <h4 className="flex items-center gap-2 mb-2 font-bold text-red-800">
                                    <AlertCircle className="w-5 h-5" />
                                    {report.failed} Failed Records
                                </h4>
                                <ul className="pl-5 space-y-1 text-sm text-red-700 list-disc max-h-48 overflow-y-auto">
                                    {report.errors.map((err: string, i: number) => (
                                        <li key={i}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-white bg-gray-800 rounded-lg hover:bg-gray-900"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
