// frontend/src/services/evidenceAPI.ts
// FIXED VERSION WITH ENHANCED ERROR HANDLING AND TIMEOUT

import api from './api';

export interface Evidence {
    id?: number;
    permit_id?: number;
    file: File;
    file_path?: string;
    preview?: string;
    category: 'ppe' | 'barricading' | 'tool_condition' | 'other';
    description: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    created_at?: string;
}

export interface EvidenceStats {
    total: number;
    by_category: Array<{
        category: string;
        count: number;
    }>;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

/**
 * Evidence API Service
 */
export const evidenceAPI = {
    /**
     * Upload evidences for a permit
     * @param permitId - The permit ID
     * @param evidences - Array of evidence objects
     * @returns Promise with uploaded evidence data
     */
    upload: async (
        permitId: number,
        evidences: Evidence[]
    ): Promise<ApiResponse<Evidence[]>> => {
        try {
            const formData = new FormData();

            // Add permit ID
            formData.append('permit_id', permitId.toString());

            // Add files
            evidences.forEach((evidence) => {
                formData.append('evidences', evidence.file);
            });

            // Add metadata as JSON
            const metadata = evidences.map((e) => ({
                category: e.category,
                description: e.description || '',
                timestamp: e.timestamp,
                latitude: e.latitude,
                longitude: e.longitude,
            }));
            formData.append('evidences_data', JSON.stringify(metadata));

            const response = await api.post('/uploads/evidence', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Error uploading evidence:', error);
            throw error;
        }
    },

    /**
     * Get all evidences for a specific permit
     * @param permitId - The permit ID
     * @returns Promise with array of evidences
     */
    getByPermitId: async (permitId: number): Promise<ApiResponse<Evidence[]>> => {
        try {
            const response = await api.get(`/permits/${permitId}/evidences`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching evidences:', error);
            throw error;
        }
    },

    /**
     * Get single evidence by ID
     * @param evidenceId - The evidence ID
     * @returns Promise with evidence data
     */
    getById: async (evidenceId: number): Promise<ApiResponse<Evidence>> => {
        try {
            const response = await api.get(`/uploads/evidence/${evidenceId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching evidence:', error);
            throw error;
        }
    },

    /**
     * Update evidence metadata
     * @param evidenceId - The evidence ID
     * @param category - New category
     * @param description - New description
     * @returns Promise with success status
     */
    update: async (
        evidenceId: number,
        category: Evidence['category'],
        description: string
    ): Promise<ApiResponse<void>> => {
        try {
            const response = await api.put(`/uploads/evidence/${evidenceId}`, {
                category,
                description,
            });
            return response.data;
        } catch (error: any) {
            console.error('Error updating evidence:', error);
            throw error;
        }
    },

    /**
     * Delete evidence
     * @param evidenceId - The evidence ID
     * @returns Promise with success status
     */
    delete: async (evidenceId: number): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete(`/uploads/evidence/${evidenceId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting evidence:', error);
            throw error;
        }
    },

    /**
     * Get evidences by category
     * @param category - Evidence category
     * @param permitId - Optional permit ID filter
     * @returns Promise with array of evidences
     */
    getByCategory: async (
        category: Evidence['category'],
        permitId?: number
    ): Promise<ApiResponse<Evidence[]>> => {
        try {
            const params = permitId ? { permit_id: permitId } : {};
            const response = await api.get(`/uploads/evidence/category/${category}`, {
                params,
            });
            return response.data;
        } catch (error: any) {
            console.error('Error fetching evidences by category:', error);
            throw error;
        }
    },

    /**
     * Get evidence statistics for a permit
     * @param permitId - The permit ID
     * @returns Promise with evidence statistics
     */
    getStats: async (permitId: number): Promise<ApiResponse<EvidenceStats>> => {
        try {
            const response = await api.get(`/permits/${permitId}/evidences/stats`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching evidence stats:', error);
            throw error;
        }
    },

    /**
     * Get full URL for evidence file
     * @param filePath - Relative file path
     * @returns Full URL
     */
    getFileUrl: (filePath: string): string => {
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        return `${baseUrl}${filePath}`;
    },
};

export default evidenceAPI;