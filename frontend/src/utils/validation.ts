
// Basic phone validation:
// - Must be exactly 10 digits
// - Strips spaces and dashes first
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
    const cleaned = phoneNumber.replace(/[\s-]/g, '');
    const regex = /^\d{10}$/;
    return regex.test(cleaned);
};

export const validatePhoneNumber = (phone: string): string | null => {
    if (!phone) return 'Phone number is required';
    if (!isValidPhoneNumber(phone)) {
        return 'Phone number must be exactly 10 digits';
    }
    return null;
};
