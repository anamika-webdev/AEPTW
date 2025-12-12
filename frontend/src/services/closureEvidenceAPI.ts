// frontend/src/services/closureEvidenceAPI.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ClosureEvidence {
    id?: number;
    closure_id?: number;
    permit_id: number;
    file: File;
    file_path?: string;
    preview?: string;
    category: 'area_organization' | 'activity_completion' | 'before' | 'after' | 'other';
    description: string;
    timestamp: string;
    latitude: number | null;
    longitude: number | null;
    captured_by_name?: string;
}

class ClosureEvidenceAPI {
    async upload(permitId: number, evidences: ClosureEvidence[]): Promise<any> {
        const formData = new FormData();

        const descriptions: string[] = [];
        const categories: string[] = [];
        const timestamps: string[] = [];
        const latitudes: (number | null)[] = [];
        const longitudes: (number | null)[] = [];

        evidences.forEach((evidence) => {
            formData.append('images', evidence.file);
            descriptions.push(evidence.description || '');
            categories.push(evidence.category);
            timestamps.push(evidence.timestamp);
            latitudes.push(evidence.latitude);
            longitudes.push(evidence.longitude);
        });

        formData.append('descriptions', JSON.stringify(descriptions));
        formData.append('categories', JSON.stringify(categories));
        formData.append('timestamps', JSON.stringify(timestamps));
        formData.append('latitudes', JSON.stringify(latitudes));
        formData.append('longitudes', JSON.stringify(longitudes));

        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await axios.post(
            `${API_BASE_URL}/permits/${permitId}/closure/evidence`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    async get(permitId: number): Promise<any> {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');

        const response = await axios.get(
            `${API_BASE_URL}/permits/${permitId}/closure/evidence`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        return response.data;
    }

    getFileUrl(filePath: string): string {
        if (!filePath) return '';
        if (filePath.startsWith('http')) return filePath;
        const baseUrl = API_BASE_URL.replace('/api', '');
        return `${baseUrl}${filePath}`;
    }
}

export const closureEvidenceAPI = new ClosureEvidenceAPI();
export default closureEvidenceAPI;