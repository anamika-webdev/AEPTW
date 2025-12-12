// frontend/src/components/supervisor/PersonnelFields.tsx
// Dynamic personnel fields based on permit type

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, X, AlertTriangle } from 'lucide-react';

interface PersonnelFieldsProps {
    selectedCategories: string[];
    formData: any;
    setFormData: (updater: (prev: any) => any) => void;
}

export default function PersonnelFields({ selectedCategories, formData, setFormData }: PersonnelFieldsProps) {
    const isConfinedSpace = selectedCategories.includes('Confined Space');
    const isHotWork = selectedCategories.includes('Hot Work');

    const handleTextChange = (id: number, value: string) => {
        setFormData((prev: any) => ({
            ...prev,
            checklistTextResponses: {
                ...prev.checklistTextResponses,
                [id]: value
            }
        }));
    };

    const renderNameContactPair = (
        nameId: number,
        nameLabel: string,
        contactId: number,
        contactLabel: string,
        required: boolean = true
    ) => {
        const nameValue = formData.checklistTextResponses[nameId] || '';
        const contactValue = formData.checklistTextResponses[contactId] || '';

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-b border-slate-100">
                {/* Name Field */}
                <div>
                    <Label htmlFor={`field-${nameId}`} className="block mb-2 text-sm font-medium text-slate-900">
                        {nameLabel}
                        {required && <span className="ml-1 text-red-500 font-bold">*</span>}
                    </Label>
                    <Input
                        id={`field-${nameId}`}
                        type="text"
                        value={nameValue}
                        onChange={(e) => handleTextChange(nameId, e.target.value)}
                        placeholder="Enter full name"
                        required={required}
                        minLength={2}
                        autoComplete="off"
                    />
                    {nameValue !== '' && (
                        <>
                            {nameValue.trim().length === 0 ? (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Cannot contain only spaces
                                </p>
                            ) : nameValue.trim().length < 2 ? (
                                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                                    <AlertTriangle className="w-3 h-3" /> At least 2 characters required
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Valid
                                </p>
                            )}
                        </>
                    )}
                </div>

                {/* Contact Field */}
                <div>
                    <Label htmlFor={`field-${contactId}`} className="block mb-2 text-sm font-medium text-slate-900">
                        {contactLabel}
                        {required && <span className="ml-1 text-red-500 font-bold">*</span>}
                    </Label>
                    <Input
                        id={`field-${contactId}`}
                        type="tel"
                        value={contactValue}
                        onChange={(e) => handleTextChange(contactId, e.target.value)}
                        placeholder="Enter contact number"
                        required={required}
                        pattern="[0-9]{10}"
                        maxLength={10}
                        autoComplete="off"
                    />
                    {contactValue !== '' && (
                        <>
                            {!/^[0-9]{10}$/.test(contactValue) ? (
                                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                    <X className="w-3 h-3" /> Must be 10 digits
                                </p>
                            ) : (
                                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Valid
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Confined Space Specific Personnel */}
            {isConfinedSpace && (
                <div className="p-6 border-2 rounded-lg border-purple-200 bg-purple-50">
                    <h3 className="text-lg font-bold text-purple-900 mb-4">
                        Confined Space Personnel (Required)
                    </h3>
                    <div className="space-y-4 bg-white p-4 rounded-lg">
                        {renderNameContactPair(398, 'Entrant Name', 4398, 'Entrant Contact')}
                        {renderNameContactPair(399, 'Attendant Name', 4399, 'Attendant Contact')}
                        {renderNameContactPair(401, 'Stand-by Person Name', 4401, 'Stand-by Person Contact')}
                    </div>
                </div>
            )}

            {/* Hot Work Specific Personnel */}
            {isHotWork && (
                <div className="p-6 border-2 rounded-lg border-orange-200 bg-orange-50">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">
                        Hot Work Personnel (Required)
                    </h3>
                    <div className="space-y-4 bg-white p-4 rounded-lg">
                        {renderNameContactPair(500, 'Fire Watcher Name', 4500, 'Fire Watcher Contact')}
                    </div>
                </div>
            )}

            {/* Common Personnel (All Permits) */}
            <div className="p-6 border-2 rounded-lg border-blue-200 bg-blue-50">
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                    Required Personnel (All Permits)
                </h3>
                <div className="space-y-4 bg-white p-4 rounded-lg">
                    {renderNameContactPair(400, 'Supervisor Name', 4400, 'Supervisor Contact')}
                    {renderNameContactPair(501, 'First Aider Name', 4501, 'First Aider Contact')}
                    {renderNameContactPair(502, 'AED Certified Person Name', 4502, 'AED Certified Person Contact')}
                </div>
            </div>

            {/* Hot Work Additional Requirements */}
            {isHotWork && (
                <div className="p-6 border-2 rounded-lg border-red-200 bg-red-50">
                    <h3 className="text-lg font-bold text-red-900 mb-4">
                        Hot Work Safety Requirements
                    </h3>
                    <div className="space-y-3 bg-white p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="fire-fighter-available"
                                checked={formData.checklistTextResponses[503] === 'Yes'}
                                onChange={(e) => handleTextChange(503, e.target.checked ? 'Yes' : 'No')}
                                className="w-4 h-4 text-red-600"
                            />
                            <Label htmlFor="fire-fighter-available" className="text-sm font-medium">
                                Fire Fighter Available on Site
                                <span className="ml-1 text-red-500 font-bold">*</span>
                            </Label>
                        </div>

                        {formData.checklistTextResponses[503] === 'Yes' && (
                            <div className="ml-7 mt-3">
                                {renderNameContactPair(504, 'Fire Fighter Name', 4504, 'Fire Fighter Contact')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
