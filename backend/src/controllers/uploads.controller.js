const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for SWMS uploads
const swmsStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/swms');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, `swms-${uniqueSuffix}-${sanitizedFilename}`);
    }
});

const swmsUpload = multer({
    storage: swmsStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG are allowed.'));
        }
    }
});

// Configure multer for Signature uploads
const signatureStorage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads/signatures');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, null);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `sig-${uniqueSuffix}.png`);
    }
});

const signatureUpload = multer({
    storage: signatureStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
});

// Controller functions
exports.uploadSWMS = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/swms/${req.file.filename}`;
    res.json({
        success: true,
        message: 'SWMS uploaded successfully',
        data: { url: fileUrl }
    });
};

exports.uploadSignature = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No signature file uploaded' });
    }

    const fileUrl = `/uploads/signatures/${req.file.filename}`;
    res.json({
        success: true,
        message: 'Signature uploaded successfully',
        data: { url: fileUrl }
    });
};

exports.swmsMiddleware = swmsUpload.single('swms');
exports.signatureMiddleware = signatureUpload.single('signature');
