import { useEffect, useState } from 'react';
import { X, Check, Clock, AlertCircle, Calendar, Trash2 } from 'lucide-react';

interface Notification {
    id: number;
    permit_id: number | null;
    related_permit_id?: number | null;
    permit_serial?: string;
    notification_type: 'PTW_APPROVED' | 'PTW_REJECTED' | 'APPROVAL_REQUEST' | 'EXTENSION_REQUEST' | 'PTW_CLOSED';
    message: string;
    is_read: boolean;
    created_at: string;
}

interface AllNotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewPermit?: (permitId: number) => void;
}

export default function AllNotificationsModal({ isOpen, onClose, onViewPermit }: AllNotificationsModalProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchAllNotifications();
        }
    }, [isOpen]);

    const fetchAllNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            // Fetch all notifications (read and unread)
            const response = await fetch('/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.success) {
                setNotifications(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching all notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Error deleting notification', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'PTW_APPROVED': return <Check className="w-5 h-5 text-green-600" />;
            case 'PTW_REJECTED': return <AlertCircle className="w-5 h-5 text-red-600" />;
            case 'APPROVAL_REQUEST': return <Clock className="w-5 h-5 text-orange-600" />;
            case 'EXTENSION_REQUEST': return <Clock className="w-5 h-5 text-orange-600" />;
            case 'PTW_CLOSED': return <Check className="w-5 h-5 text-gray-600" />;
            default: return <Clock className="w-5 h-5 text-gray-600" />;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">All Notifications</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <div key={n.id} className={`flex items-start gap-4 p-4 rounded-lg border ${n.is_read ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-100'}`}>
                                <div className={`p-2 rounded-full flex-shrink-0 ${n.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                                    {getIcon(n.notification_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {n.permit_serial || 'System Notification'}
                                        </span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(n.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">{n.message}</p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-2 py-1 rounded-full ${n.is_read ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-700'}`}>
                                            {n.is_read ? 'Read' : 'Unread'}
                                        </span>
                                        <div className="flex gap-2">
                                            {(n.permit_id || n.related_permit_id) && onViewPermit && (
                                                <button
                                                    onClick={() => {
                                                        const pid = n.related_permit_id || n.permit_id;
                                                        if (pid) {
                                                            onViewPermit(pid);
                                                            onClose();
                                                        }
                                                    }}
                                                    className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                                                >
                                                    View Permit
                                                </button>
                                            )}
                                            <button
                                                onClick={() => deleteNotification(n.id)}
                                                className="text-xs text-red-600 hover:text-red-800"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
