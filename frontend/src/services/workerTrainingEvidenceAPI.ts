// frontend/src/services/workerTrainingEvidenceAPI.ts
import api from './api';

export interface WorkerTrainingEvidence {
    id?: number;
    team_member_id: number;
    permit_id: number;
    file_path: string;
    file_name: string;
    uploaded_at?: string;
    worker_name?: string;
    worker_role?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export const workerTrainingEvidenceAPI = {
    /**
     * Upload training evidence for a team member
     */
    upload: async (
        teamMemberId: number,
        permitId: number,
        files: File[]
    ): Promise<ApiResponse<WorkerTrainingEvidence[]>> => {
        try {
            const formData = new FormData();
            formData.append('team_member_id', teamMemberId.toString());
            formData.append('permit_id', permitId.toString());

            files.forEach(file => {
                formData.append('training_evidence', file);
            });

            const response = await api.post('/training-evidence', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return response.data;
        } catch (error: any) {
            console.error('Error uploading training evidence:', error);
            throw error;
        }
    },

    /**
     * Get training evidence for a specific team member
     */
    getByTeamMember: async (teamMemberId: number): Promise<ApiResponse<WorkerTrainingEvidence[]>> => {
        try {
            const response = await api.get(`/training-evidence/team-member/${teamMemberId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching team member training evidence:', error);
            throw error;
        }
    },

    /**
     * Get all training evidence for a permit
     */
    getByPermit: async (permitId: number): Promise<ApiResponse<WorkerTrainingEvidence[]>> => {
        try {
            const response = await api.get(`/training-evidence/permit/${permitId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error fetching permit training evidence:', error);
            throw error;
        }
    },

    /**
     * Delete training evidence
     */
    delete: async (evidenceId: number): Promise<ApiResponse<void>> => {
        try {
            const response = await api.delete(`/training-evidence/${evidenceId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting training evidence:', error);
            throw error;
        }
    },

    /**
     * Get full URL for training evidence file
     */
    getFileUrl: (filePath: string): string => {
        if (!filePath) return '';
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        // Get base API URL
        let apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

        // Remove trailing slash
        apiUrl = apiUrl.replace(/\/+$/, '');

        // Ensure filePath starts with /
        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

        // If the API URL doesn't end with /api, and the path doesn't start with /api,
        // we might need to adjust. But usually VITE_API_URL should include /api.

        // CRITICAL FIX: The backend serves static files at /api/uploads
        // If the stored path is just /uploads/..., we ensure the final URL includes /api/uploads

        // Case 1: apiUrl includes /api (e.g. https://domain.com/api)
        // normalizedPath is /uploads/...
        // Result: https://domain.com/api/uploads/... (CORRECT)

        // Case 2: apiUrl is root (e.g. https://domain.com)
        // normalizedPath is /uploads/...
        // Result: https://domain.com/uploads/... (WRONG - this hits frontend router)

        // Force check: if we are building a URL that points to /uploads, it SHOULD probably be /api/uploads
        if (!apiUrl.endsWith('/api') && !normalizedPath.startsWith('/api')) {
            // If normalized path starts with /uploads, prepend /api
            if (normalizedPath.startsWith('/uploads')) {
                return `${apiUrl}/api${normalizedPath}`;
            }
        }

        return `${apiUrl}${normalizedPath}`;
    },
};

export default workerTrainingEvidenceAPI;
