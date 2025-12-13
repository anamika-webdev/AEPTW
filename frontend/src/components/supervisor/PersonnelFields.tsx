// frontend/src/components/supervisor/PersonnelFields.tsx
// Dynamic personnel fields based on permit type

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Check, X, AlertTriangle } from 'lucide-react';
import type { PermitType } from '../../types';

interface PersonnelFieldsProps {
    selectedCategories: PermitType[];
    formData: any;
    setFormData: (updater: (prev: any) => any) => void;
}

export default function PersonnelFields({ selectedCategories, formData, setFormData }: PersonnelFieldsProps) {
    // Helper to check for categories safely (handling potentially missing types)
    const hasCategory = (cat: PermitType) => selectedCategories.includes(cat);

    // Determine requirements based on selected categories
    const isConfinedSpace = hasCategory('Confined_Space');
    const isHotWork = hasCategory('Hot_Work');
    const isElectrical = hasCategory('Electrical');
    const isGeneral = hasCategory('General');
    const isHeight = hasCategory('Height');

    // Logic for Common Fields (First Aider, AED)
    // Updated requirements:
    // General: Supervisor, First Aider, AED
    // Hot Work: Supervisor, Fire watcher, fire fighter, first aider, AED availability
    // Electrical: Supervisor, Fire fighter, first aider, AED availability
    // Height: Supervisor, First Aider, AED
    // Confined Space: Supervisor, Entrant, Attendant, Stand-by, First Aider, AED

    // First Aider & AED are required for ALL permit types
    const requiresFirstAiderAndAED = isGeneral || isHotWork || isElectrical || isHeight || isConfinedSpace;

    // Fire Fighter is required for Hot Work and Electrical
    const requiresFireFighter = isHotWork || isElectrical;

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
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
                        className="bg-white"
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
                        className="bg-white"
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
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-800">Note:</span> Personnel requirements are dynamically updated based on your selected permit categories.
                </p>
            </div>

            {/* Always Required: Supervisor */}
            <div className="p-6 border-2 rounded-lg border-blue-200 bg-blue-50/50">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                    Permit Supervisor
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
                    {renderNameContactPair(400, 'Supervisor Name', 4400, 'Supervisor Contact')}
                </div>
            </div>

            {/* Confined Space Specific Personnel */}
            {isConfinedSpace && (
                <div className="p-6 border-2 rounded-lg border-purple-200 bg-purple-50/50">
                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-purple-600 rounded-full"></span>
                        Confined Space Personnel
                    </h3>
                    <div className="space-y-0 bg-white p-4 rounded-lg shadow-sm border border-purple-100">
                        {renderNameContactPair(398, 'Entrant Name', 4398, 'Entrant Contact')}
                        {renderNameContactPair(399, 'Attendant Name', 4399, 'Attendant Contact')}
                        {renderNameContactPair(401, 'Stand-by Person Name', 4401, 'Stand-by Person Contact')}
                    </div>
                </div>
            )}

            {/* Fire Safety Team (Hot Work OR Electrical) */}
            {requiresFireFighter && (
                <div className="p-6 border-2 rounded-lg border-red-200 bg-red-50/50">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-red-600 rounded-full"></span>
                        Fire Safety Team
                    </h3>
                    <div className="space-y-0 bg-white p-4 rounded-lg shadow-sm border border-red-100">
                        {/* Fire Watcher - Only for Hot Work */}
                        {isHotWork && renderNameContactPair(500, 'Fire Watcher Name', 4500, 'Fire Watcher Contact')}

                        {/* Fire Fighter - Hot Work OR Electrical */}
                        {renderNameContactPair(504, 'Fire Fighter Name', 4504, 'Fire Fighter Contact')}

                        {/* Checkbox for Fire Fighter Availability Confirmation (Optional/Additional as per table "availability" wording) */}
                        <div className="mt-4 pt-4 border-t border-red-100">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="fire-fighter-available"
                                    checked={formData.checklistTextResponses[503] === 'Yes'}
                                    onChange={(e) => handleTextChange(503, e.target.checked ? 'Yes' : 'No')}
                                    className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                                />
                                <Label htmlFor="fire-fighter-available" className="text-sm font-medium text-slate-800">
                                    Fire Fighter Available on Site <span className="text-red-500">*</span>
                                </Label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* First Aider & AED (General, Hot Work, Electrical, Height) */}
            {requiresFirstAiderAndAED && (
                <div className="p-6 border-2 rounded-lg border-emerald-200 bg-emerald-50/50">
                    <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-8 bg-emerald-600 rounded-full"></span>
                        Emergency Response Team
                    </h3>
                    <div className="space-y-0 bg-white p-4 rounded-lg shadow-sm border border-emerald-100">
                        {renderNameContactPair(501, 'First Aider Name', 4501, 'First Aider Contact')}
                        {renderNameContactPair(502, 'AED Certified Person Name', 4502, 'AED Certified Person Contact')}
                    </div>
                </div>
            )}
        </div>
    );
}
