// ============================================
// ADMIN UI: Site Approver Management Component
// File: frontend/src/components/admin/SiteApproversManagement.jsx
// ============================================

import React, { useState, useEffect } from 'react';
import { Edit, Save, X, Users, Check, AlertTriangle } from 'lucide-react';

const SiteApproversManagement = () => {
    const [sites, setSites] = useState([]);
    const [areaManagers, setAreaManagers] = useState([]);
    const [safetyOfficers, setSafetyOfficers] = useState([]);
    const [siteLeaders, setSiteLeaders] = useState([]);
    const [editingSiteId, setEditingSiteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [editForm, setEditForm] = useState({
        area_manager_id: '',
        safety_officer_id: '',
        site_leader_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Load sites with approvers
            const sitesResponse = await fetch('/api/site-approvers', { headers });
            const sitesData = await sitesResponse.json();

            if (sitesData.success) {
                setSites(sitesData.data);
            }

            // Load all approvers
            const amResponse = await fetch('/api/users/approvers/area-managers', { headers });
            const amData = await amResponse.json();
            if (amData.success) setAreaManagers(amData.data);

            const soResponse = await fetch('/api/users/approvers/safety-officers', { headers });
            const soData = await soResponse.json();
            if (soData.success) setSafetyOfficers(soData.data);

            const slResponse = await fetch('/api/users/approvers/site-leaders', { headers });
            const slData = await slResponse.json();
            if (slData.success) setSiteLeaders(slData.data);

        } catch (error) {
            console.error('Error loading data:', error);
            setError('Failed to load data. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (site) => {
        setEditingSiteId(site.site_id);
        setEditForm({
            area_manager_id: site.area_manager_id || '',
            safety_officer_id: site.safety_officer_id || '',
            site_leader_id: site.site_leader_id || ''
        });
        setError('');
        setSuccess('');
    };

    const handleCancel = () => {
        setEditingSiteId(null);
        setEditForm({
            area_manager_id: '',
            safety_officer_id: '',
            site_leader_id: ''
        });
        setError('');
    };

    const handleSave = async (siteId) => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/site-approvers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    site_id: siteId,
                    area_manager_id: editForm.area_manager_id || null,
                    safety_officer_id: editForm.safety_officer_id || null,
                    site_leader_id: editForm.site_leader_id || null
                })
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(`Approvers assigned successfully for site ${siteId}`);
                setEditingSiteId(null);
                loadData(); // Reload to show updated data

                // Clear success message after 3 seconds
                setTimeout(() => setSuccess(''), 3000);
            } else {
                setError(data.message || 'Failed to assign approvers');
            }
        } catch (error) {
            console.error('Error saving approvers:', error);
            setError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="w-7 h-7 text-blue-600" />
                    Site Approvers Management
                </h1>
                <p className="text-gray-600 mt-1">
                    Assign approvers to each site. These approvers will be automatically selected when creating PTW for the respective site.
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
                    <Check className="w-5 h-5" />
                    {success}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                    <AlertTriangle className="w-5 h-5" />
                    {error}
                </div>
            )}

            {/* Sites Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Site
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Area Manager
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Safety Officer
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Site Leader
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sites.map((site) => (
                            <tr key={site.site_id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {site.site_name}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {site.site_code} • {site.location}
                                        </div>
                                    </div>
                                </td>

                                {/* Area Manager */}
                                <td className="px-6 py-4">
                                    {editingSiteId === site.site_id ? (
                                        <select
                                            value={editForm.area_manager_id}
                                            onChange={(e) => setEditForm({ ...editForm, area_manager_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Select Area Manager --</option>
                                            {areaManagers.map((am) => (
                                                <option key={am.id} value={am.id}>
                                                    {am.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div>
                                            {site.area_manager_name ? (
                                                <>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {site.area_manager_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {site.area_manager_email}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Not assigned</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Safety Officer */}
                                <td className="px-6 py-4">
                                    {editingSiteId === site.site_id ? (
                                        <select
                                            value={editForm.safety_officer_id}
                                            onChange={(e) => setEditForm({ ...editForm, safety_officer_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Select Safety Officer --</option>
                                            {safetyOfficers.map((so) => (
                                                <option key={so.id} value={so.id}>
                                                    {so.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div>
                                            {site.safety_officer_name ? (
                                                <>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {site.safety_officer_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {site.safety_officer_email}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Not assigned</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Site Leader */}
                                <td className="px-6 py-4">
                                    {editingSiteId === site.site_id ? (
                                        <select
                                            value={editForm.site_leader_id}
                                            onChange={(e) => setEditForm({ ...editForm, site_leader_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Select Site Leader --</option>
                                            {siteLeaders.map((sl) => (
                                                <option key={sl.id} value={sl.id}>
                                                    {sl.full_name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div>
                                            {site.site_leader_name ? (
                                                <>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {site.site_leader_name}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {site.site_leader_email}
                                                    </div>
                                                </>
                                            ) : (
                                                <span className="text-sm text-gray-400 italic">Not assigned</span>
                                            )}
                                        </div>
                                    )}
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 text-right">
                                    {editingSiteId === site.site_id ? (
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleSave(site.site_id)}
                                                disabled={saving}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4 mr-1" />
                                                {saving ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                disabled={saving}
                                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleEdit(site)}
                                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {sites.length === 0 && (
                    <div className="text-center py-12">
                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No sites found</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Please add sites first before assigning approvers.
                        </p>
                    </div>
                )}
            </div>

            {/* Instructions */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">📋 How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Click "Edit" to assign approvers to a site</li>
                    <li>Select approvers from the dropdown (optional for Safety Officer and Site Leader)</li>
                    <li>Click "Save" to confirm the assignment</li>
                    <li>When a supervisor creates a PTW and selects this site, these approvers will be automatically pre-selected</li>
                    <li>At least one approver (Area Manager) should be assigned to each site</li>
                </ul>
            </div>
        </div>
    );
};

export default SiteApproversManagement;