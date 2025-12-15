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
        if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
            return filePath;
        }

        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const baseUrl = apiUrl.replace('/api', '');
        const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;

        return `${baseUrl}${normalizedPath}`;
    },
};

export default workerTrainingEvidenceAPI;
