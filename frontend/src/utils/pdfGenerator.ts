
const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        if (!url) return '';
        if (url.startsWith('data:')) return url;

        // If url doesn't start with http/https, prepend API_URL
        // Ensure url has leading slash if needed
        let fullUrl = url;
        if (url.startsWith('http')) {
            fullUrl = url;
        } else if (url.startsWith('/')) {
            // Local assets (like /QR.png) vs backend uploads
            if (url.startsWith('/uploads') || url.startsWith('/api')) {
                fullUrl = `${API_URL}${url}`;
            } else {
                // Public folder assets
                fullUrl = window.location.origin + url;
            }
        } else {
            // Relative paths are assumed to be backend uploads
            fullUrl = `${API_URL}/${url}`;
        }

        console.log('Fetching image for PDF:', fullUrl);
        const response = await fetch(fullUrl, { mode: 'cors' });
        if (!response.ok) throw new Error(`Failed to fetch ${response.status}`);

        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Error loading image for PDF:', url, error);
        return '';
    }
};

export const downloadComprehensivePDF = async (permitsToDownload: any[]) => {
    // Dynamic import of jsPDF to avoid bundle size issues
    const { jsPDF } = await import('jspdf');
    // Ensure autotable is loaded
    await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = 20;

    // Helper to check page break
    const checkPageBreak = (heightNeeded: number) => {
        if (yPosition + heightNeeded > pageHeight - margin) {
            doc.addPage();
            yPosition = 20;
            return true;
        }
        return false;
    };

    // Helper to add photos
    const addPhotoGallery = async (title: string, photos: any[]) => {
        if (!photos || photos.length === 0) return;

        checkPageBreak(60);

        // Title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
        doc.text(title, margin + 3, yPosition + 5);
        yPosition += 15;

        // Grid config
        const imgWidth = 80;
        const imgHeight = 60;
        const gap = 10;
        let xPos = margin;

        // Process sequentially to manage layout
        for (const photo of photos) {
            const url = photo.file_path || photo.url || photo.image_url;
            if (!url) continue;

            try {
                const base64 = await getBase64FromUrl(url);
                if (base64) {
                    // Check if current row needs new page (mostly height check if wrapping)
                    // Actually we check if we are at start of row and need height

                    if (xPos === margin) { // New row
                        checkPageBreak(imgHeight + 15);
                    }

                    // Add Image
                    // Detect format
                    const format = base64.includes('image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(base64, format, xPos, yPosition, imgWidth, imgHeight);

                    // Caption
                    if (photo.description || photo.category) {
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        const caption = `${photo.category || ''}: ${photo.description || ''}`;
                        const splitCaption = doc.splitTextToSize(caption, imgWidth);
                        doc.text(splitCaption, xPos, yPosition + imgHeight + 5);
                    }

                    // Move X
                    xPos += imgWidth + gap;

                    // Wrap Row
                    if (xPos + imgWidth > pageWidth - margin) {
                        xPos = margin;
                        yPosition += imgHeight + 20; // +20 for caption space and gap
                    }
                }
            } catch (e) {
                console.error('Failed to add photo', e);
            }
        }
        // Ensure yPosition is updated after last row
        if (xPos !== margin) {
            yPosition += imgHeight + 20;
        }
    };

    // Title Page
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 102, 0); // Orange
    doc.text('Permit to Work (PTW)', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;
    doc.text('Comprehensive Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`Total Permits: ${permitsToDownload.length}`, pageWidth / 2, yPosition, { align: 'center' });

    // Add page break after title page
    doc.addPage();

    // Process each permit
    for (let index = 0; index < permitsToDownload.length; index++) {
        const permit = permitsToDownload[index];

        if (index > 0) {
            doc.addPage();
        }

        // Reset position for each permit
        yPosition = 20;

        // Permit Header with Serial Number
        doc.setFillColor(255, 102, 0);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`PTW #${permit.permit_serial || 'N/A'}`, margin + 5, yPosition + 8);
        yPosition += 17;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        // Helper function to add section
        const addSection = (title: string, content: [string, any][]) => {
            checkPageBreak(40);

            // Section Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
            doc.text(title, margin + 3, yPosition + 5);
            yPosition += 10;

            // Section Content
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            content.forEach(([label, value]) => {
                const displayValue = value !== null && value !== undefined ? String(value) : 'N/A';
                const lines = doc.splitTextToSize(displayValue, pageWidth - margin - 60); // Wrap text

                checkPageBreak(20);

                doc.setFont('helvetica', 'bold');
                doc.text(`${label}:`, margin + 3, yPosition);

                doc.setFont('helvetica', 'normal');

                // Print lines one by one to handle pagination
                lines.forEach((line: string) => {
                    checkPageBreak(10);
                    doc.text(line, margin + 55, yPosition);
                    yPosition += 5;
                });

                // Add small spacing after each item
                yPosition += 1;
            });
            yPosition += 3;
        };

        // 1. Basic Information
        addSection('BASIC INFORMATION', [
            ['Permit Type', permit.permit_type || 'N/A'],
            ['Status', permit.status || 'N/A'],
            ['Site', permit.site_name || 'N/A'],
            ['Work Location', permit.work_location || 'N/A'],
            ['Work Description', permit.work_description || 'N/A'],
            ['Issue Department', permit.issue_department || 'N/A'],
        ]);

        // 2. Time Information
        addSection('TIME DETAILS', [
            ['Start Time', permit.start_time ? new Date(permit.start_time).toLocaleString() : 'N/A'],
            ['End Time', permit.end_time ? new Date(permit.end_time).toLocaleString() : 'N/A'],
            ['Created At', permit.created_at ? new Date(permit.created_at).toLocaleString() : 'N/A'],
            ['Updated At', permit.updated_at ? new Date(permit.updated_at).toLocaleString() : 'N/A'],
        ]);

        // 3. Personnel Information
        addSection('PERSONNEL', [
            ['Permit Initiator', permit.permit_initiator || 'N/A'],
            ['Initiator Contact', permit.permit_initiator_contact || 'N/A'],
            ['Receiver Name', permit.receiver_name || 'N/A'],
            ['Receiver Contact', permit.receiver_contact || 'N/A'],
            ['Created By', permit.created_by_name || 'N/A'],
        ]);

        // 4. Team Members
        if (permit.team_members && permit.team_members.length > 0) {
            addSection('TEAM MEMBERS', [
                ['Total Team Size', permit.team_members.length],
                ['Team Details', permit.team_members.map((tm: any, idx: number) =>
                    `${idx + 1}. ${tm.worker_name || 'N/A'} - ${tm.worker_role || 'N/A'}${tm.badge_id ? ` (Badge: ${tm.badge_id})` : ''}`
                ).join('\n')],
            ]);
        }

        // 5. Hazards
        if (permit.hazards && permit.hazards.length > 0) {
            addSection('IDENTIFIED HAZARDS', [
                ['Total Hazards', permit.hazards.length],
                ['Hazard List', permit.hazards.map((h: any, idx: number) =>
                    `${idx + 1}. ${h.name || h.hazard_name || 'N/A'}${h.description ? ` - ${h.description}` : ''}`
                ).join('\n')],
                ['Other Hazards', permit.other_hazards || 'None'],
            ]);
        }

        // 5.5. Evidence Photos (Pre-work)
        if (permit.evidence && permit.evidence.length > 0) {
            await addPhotoGallery('PRE-WORK EVIDENCE PHOTOS', permit.evidence);
        }

        // 6. Control Measures
        if (permit.control_measures) {
            addSection('CONTROL MEASURES', [
                ['Control Measures', permit.control_measures],
            ]);
        }

        // 7. PPE Requirements
        if (permit.ppe && permit.ppe.length > 0) {
            addSection('PPE REQUIREMENTS', [
                ['Total PPE Items', permit.ppe.length],
                ['PPE List', permit.ppe.map((p: any, idx: number) =>
                    `${idx + 1}. ${p.name || p.ppe_name || 'N/A'}${p.description ? ` - ${p.description}` : ''}`
                ).join('\n')],
            ]);
        }

        // 8. Checklist Responses
        if (permit.checklist_responses && permit.checklist_responses.length > 0) {
            const responses = permit.checklist_responses.map((cr: any, idx: number) => {
                const question = cr.question_text || cr.question || 'Question';
                const response = cr.response || 'N/A';
                const remarks = cr.remarks ? ` (${cr.remarks})` : '';
                return `${idx + 1}. ${question}: ${response}${remarks}`;
            }).join('\n');

            addSection('CHECKLIST RESPONSES', [
                ['Total Questions', permit.checklist_responses.length],
                ['Responses', responses],
            ]);
        }

        // 9. SWMS Information
        if (permit.swms_file_url || permit.swms_text) {
            addSection('SWMS (Safe Work Method Statement)', [
                ['SWMS File', permit.swms_file_url || 'No file attached'],
                ['SWMS Text', permit.swms_text || 'No text provided'],
            ]);
        }

        // 9.5 Extensions
        if (permit.extensions && permit.extensions.length > 0) {
            addSection('EXTENSIONS', [
                ['Total Extensions', permit.extensions.length],
                ['Details', permit.extensions.map((e: any, i: number) =>
                    `#${i + 1} [${e.status}] New End: ${new Date(e.new_end_time).toLocaleString()}\nReason: ${e.reason}\nApprovers: SL(${e.site_leader_status}), SO(${e.safety_officer_status})`
                ).join('\n\n')]
            ]);
        }

        // 10. Approvals
        addSection('APPROVALS', [
            ['Area Owner', permit.area_manager_name || 'Not assigned'],
            ['AM Status', permit.area_manager_status || 'Pending'],
            ['AM Approved At', permit.area_manager_approved_at ? new Date(permit.area_manager_approved_at).toLocaleString() : 'N/A'],
            ['Safety Officer', permit.safety_officer_name || 'Not assigned'],
            ['SO Status', permit.safety_officer_status || 'Pending'],
            ['SO Approved At', permit.safety_officer_approved_at ? new Date(permit.safety_officer_approved_at).toLocaleString() : 'N/A'],
            ['Site Leader', permit.site_leader_name || 'Not assigned'],
            ['SL Status', permit.site_leader_status || 'Pending'],
            ['SL Approved At', permit.site_leader_approved_at ? new Date(permit.site_leader_approved_at).toLocaleString() : 'N/A'],
        ]);

        // 10.5. Safety Observations (Dragonfly)
        checkPageBreak(50);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setFillColor(230, 242, 255); // Light blue
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(0, 51, 102); // Dark blue
        doc.text('SAFETY OBSERVATIONS (DRAGONFLY)', margin + 3, yPosition + 5);
        yPosition += 12;

        try {
            const qrBase64 = await getBase64FromUrl('/QR.png');
            if (qrBase64) {
                // Adjusting to 80x25 to match the banner aspect ratio better and prevent squashing
                doc.addImage(qrBase64, 'PNG', margin + 3, yPosition, 80, 25);
                yPosition += 30;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text('Report safety concerns or observations during work execution.', margin + 3, yPosition);
                yPosition += 7;

                doc.setTextColor(0, 102, 204); // Link color
                doc.setFont('helvetica', 'bold');
                doc.text('Submit Safety Observation:', margin + 3, yPosition);
                yPosition += 5;
                doc.setFont('helvetica', 'normal');
                doc.textWithLink('https://atoz.amazon.work/safety_observations', margin + 3, yPosition, { url: 'https://atoz.amazon.work/safety_observations' });

                doc.setTextColor(0, 0, 0); // Reset
                doc.setFontSize(8);
                doc.text('Scan the QR code or click the link above to access the system.', margin + 3, yPosition + 7);

                yPosition += 15;
            } else {
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
                doc.text('Dragonfly System: https://atoz.amazon.work/safety_observations', margin + 3, yPosition);
                yPosition += 10;
            }
        } catch (e) {
            console.error('Error adding Dragonfly section', e);
        }

        // 11. Signatures
        checkPageBreak(60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 7, 'F');
        doc.text('SIGNATURES', margin + 3, yPosition + 5);
        yPosition += 15;

        const signatures = [
            { label: 'Issuer', data: permit.issuer_signature },
            { label: 'Receiver', data: permit.receiver_signature },
            { label: 'Area Owner', data: permit.area_manager_signature },
            { label: 'Safety Officer', data: permit.safety_officer_signature },
            { label: 'Site Leader', data: permit.site_leader_signature }
        ];

        const sigWidth = 40;
        const sigHeight = 20;
        const sigGap = 10;
        let xSig = margin;

        let hasSignatureImages = false;

        for (const sig of signatures) {
            if (sig.data && (sig.data.startsWith('data:image') || sig.data.startsWith('http'))) {
                hasSignatureImages = true;

                // Check row wrap
                if (xSig + sigWidth > pageWidth - margin) {
                    xSig = margin;
                    yPosition += sigHeight + 10;
                    checkPageBreak(sigHeight + 15);
                }

                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(sig.label, xSig, yPosition);

                try {
                    // Detect format loosely or default to PNG if base64
                    const format = sig.data.includes('image/jpeg') ? 'JPEG' : 'PNG';
                    doc.addImage(sig.data, format, xSig, yPosition + 2, sigWidth, sigHeight);
                } catch (e) {
                    console.error('Error rendering signature:', sig.label, e);
                    doc.setFont('helvetica', 'italic');
                    doc.text('(Error)', xSig, yPosition + 10);
                }

                xSig += sigWidth + sigGap;
            }
        }

        if (hasSignatureImages) {
            yPosition += sigHeight + 15;
        } else {
            // Fallback to text status if no images found (or old data)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            const textSignatures = [
                ['Issuer Signature', permit.issuer_signature ? (permit.issuer_signature.startsWith('data:') ? 'Signed' : permit.issuer_signature) : 'Not signed'],
                ['Receiver Signature', permit.receiver_signature ? (permit.receiver_signature.startsWith('data:') ? 'Signed' : permit.receiver_signature) : 'Not signed']
            ];

            textSignatures.forEach(([label, value]) => {
                doc.text(`${label}: ${value}`, margin + 5, yPosition);
                yPosition += 5;
            });
            yPosition += 5;
        }

        // 12. Additional Information
        addSection('ADDITIONAL INFORMATION', [
            ['Permit ID', permit.id || 'N/A'],
            ['Permit Serial', permit.permit_serial || 'N/A'],
            ['Comments', permit.comments || 'None'],
            ['Rejection Reason', permit.rejection_reason || 'N/A'],
        ]);

        // 13. Closure Details
        if (permit.closure) {
            // Parse signature from remarks
            let closureRemarks = permit.closure.remarks || '';
            let signatureData = '';
            const sigToken = 'Signed by: ';
            const sigIndex = closureRemarks.indexOf(sigToken);

            if (sigIndex !== -1) {
                signatureData = closureRemarks.substring(sigIndex + sigToken.length).trim();
                closureRemarks = closureRemarks.substring(0, sigIndex).trim();
            }

            addSection('CLOSURE DETAILS', [
                ['Closed By', permit.closure.closed_by_name || 'N/A'],
                ['Closed At', new Date(permit.closure.closed_at).toLocaleString()],
                ['Housekeeping Done', permit.closure.housekeeping_done ? 'Yes' : 'No'],
                ['Tools Removed', permit.closure.tools_removed ? 'Yes' : 'No'],
                ['Locks Removed', permit.closure.locks_removed ? 'Yes' : 'No'],
                ['Area Restored', permit.closure.area_restored ? 'Yes' : 'No'],
                ['Remarks', closureRemarks || 'None']
            ]);

            // Add Signature Image if exists
            if (signatureData && signatureData.startsWith('data:image')) {
                checkPageBreak(50);

                doc.setFont('helvetica', 'bold');
                doc.text('Closure Signature:', margin + 3, yPosition);
                yPosition += 7;

                try {
                    const format = signatureData.includes('image/png') ? 'PNG' : 'JPEG';
                    doc.addImage(signatureData, format, margin + 3, yPosition, 80, 40);
                    yPosition += 45;
                } catch (e) {
                    console.error('Error adding signature image', e);
                    doc.setFont('helvetica', 'italic');
                    doc.text('(Signature image could not be rendered)', margin + 3, yPosition);
                    yPosition += 10;
                }
            }
        }

        // 14. Closure Evidence Photos
        if (permit.closure_evidence && permit.closure_evidence.length > 0) {
            await addPhotoGallery('CLOSURE EVIDENCE PHOTOS', permit.closure_evidence);
        }
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text('Amazon EPTW System - Comprehensive PTW Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('This document contains complete permit details for record-keeping and audit purposes.', pageWidth / 2, pageHeight - 6, { align: 'center' });

    // Save the PDF
    const filename = permitsToDownload.length === 1
        ? `PTW_Complete_${permitsToDownload[0].permit_serial}_${new Date().toISOString().split('T')[0]}.pdf`
        : `PTW_Complete_Report_${permitsToDownload.length}_permits_${new Date().toISOString().split('T')[0]}.pdf`;

    doc.save(filename);
};
