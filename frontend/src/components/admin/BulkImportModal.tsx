import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

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
            if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
                alert('Please upload a valid CSV file');
                return;
            }
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: 'greedy', // Better handling of empty lines
            transformHeader: (header) => header.trim().toLowerCase(), // Normalize headers
            transform: (value) => value.trim(), // Trim all values
            complete: (results) => {
                // Clean and validate data
                const cleanData = results.data
                    .filter((row: any) => {
                        // Check if row has at least one non-empty required field
                        return row.login_id || row.email || row.full_name;
                    })
                    .map((row: any) => {
                        // Normalize Role aliases
                        let role = row.role || '';
                        const lowerRole = role.toLowerCase();
                        if (lowerRole.includes('supervisor')) role = 'Requester';
                        else if (lowerRole.includes('safety')) role = 'Approver_Safety';
                        else if (lowerRole.includes('area')) role = 'Approver_AreaManager';
                        else if (lowerRole.includes('site') && lowerRole.includes('lead')) role = 'Approver_SiteLeader';
                        else if (lowerRole.includes('worker')) role = 'Worker';
                        else if (lowerRole.includes('admin')) role = 'Admin';

                        return {
                            ...row,
                            role,
                            // Ensure login_id matches constraints (simple cleanup)
                            login_id: row.login_id?.replace(/[^a-zA-Z0-9_]/g, '_')
                        };
                    });

                setParsedData(cleanData);
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
        const csvContent = "login_id,full_name,email,password,role,department,job_role\njohn_doe,John Doe,john@example.com,Password123!,Worker,Operations,Packer\nJaneSmith,Jane Smith,jane@example.com,SecurePass!1,Requester,Safety,Supervisor";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', 'user_import_template.csv');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
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
                                        <code className="bg-blue-100 px-1 rounded">login_id, full_name, email, password, role, department, job_role</code>
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
                                            {parsedData.slice(0, 5).map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).slice(0, 5).map((cell: any, j) => (
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
                                    {report.errors.map((err, i) => (
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
