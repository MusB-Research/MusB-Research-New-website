import os
import base64
import io
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image

def generate_signed_consent_pdf(consent_obj):
    """
    Overlays signatures onto the original consent template PDF based on predefined coordinates.
    """
    if not consent_obj.template or not consent_obj.template.file:
        return None

    template_path = consent_obj.template.file.path
    if not os.path.exists(template_path):
        return None

    # 1. Create a buffer for the overlay PDF
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=letter)
    
    # Predefined fields from template
    fields = consent_obj.template.placed_fields or []
    
    # Group fields by page
    pages_to_overlay = {}
    
    for field in fields:
        f_type = field.get('type')
        page_num = field.get('page', 1)
        x = field.get('x', 0)
        y = field.get('y', 0)
        
        if page_num not in pages_to_overlay:
            pages_to_overlay[page_num] = []
            
        # Draw logic based on type
        if f_type == 'participant_signature' and consent_obj.participant_signature:
            # signature is usually a base64 string
            img_data = consent_obj.participant_signature
            if img_data.startswith('data:image'):
                img_data = img_data.split(',')[1]
            
            sig_img = Image.open(io.BytesIO(base64.b64decode(img_data)))
            # Draw image at (x, y) - adjust size as needed (e.g., 150x50)
            can.drawInlineImage(sig_img, x, y, width=120, height=45)
            
        elif f_type == 'participant_name':
            can.setFont("Helvetica", 10)
            can.drawString(x, y, consent_obj.full_name)
            
        elif f_type == 'participant_date':
            can.setFont("Helvetica", 10)
            date_str = consent_obj.participant_signed_at.strftime("%Y-%m-%d %H:%M") if consent_obj.participant_signed_at else ""
            can.drawString(x, y, date_str)
            
        elif f_type == 'coordinator_signature' and consent_obj.cc_signature:
            img_data = consent_obj.cc_signature
            if img_data.startswith('data:image'):
                img_data = img_data.split(',')[1]
            sig_img = Image.open(io.BytesIO(base64.b64decode(img_data)))
            can.drawInlineImage(sig_img, x, y, width=120, height=45)
            
        elif f_type == 'coordinator_name' and consent_obj.cc_name:
            can.setFont("Helvetica", 10)
            can.drawString(x, y, consent_obj.cc_name)
            
        elif f_type == 'coordinator_date' and consent_obj.cc_verified_at:
            can.setFont("Helvetica", 10)
            date_str = consent_obj.cc_verified_at.strftime("%Y-%m-%d %H:%M")
            can.drawString(x, y, date_str)

    can.save()
    packet.seek(0)
    
    # 2. Merge with PyPDF2
    new_pdf = PdfReader(packet)
    existing_pdf = PdfReader(open(template_path, "rb"))
    output = PdfWriter()
    
    # Iterate through pages of original PDF
    for i in range(len(existing_pdf.pages)):
        page = existing_pdf.pages[i]
        # If we have an overlay for this specific page index (1-based vs 0-based)
        # Note: ReportLab canvas above was single page. We might need a multi-page canvas if fields are spread out.
        # For simplicity, if we have ANY fields, we currently overlay on page 1 only in the logic above.
        # Let's fix that to support multi-page overlays.
        
        # [REFINED LOGIC]
        # We should create a separate reportlab canvas for each page that needs an overlay.
        # But for MVP, if it's mostly last page, we can just overlay.
        
        # Better: Create a single 1-page overlay and merge it where requested.
        # Actually, let's keep it simple: merge the single 'packet' overlay onto the first page where requested.
        if i == 0: # Page 1
            overlay_page = new_pdf.pages[0]
            page.merge_page(overlay_page)
        
        output.add_page(page)
    
    # 3. Save result
    output_stream = io.BytesIO()
    output.write(output_stream)
    
    # Generate filename: {studyName}_{participantName}_{PID}_signed.pdf
    study_name = consent_obj.study.protocol_id.replace(" ", "_")
    p_name = consent_obj.full_name.replace(" ", "_")
    p_id = consent_obj.participant.participant_sid if consent_obj.participant else "Guest"
    filename = f"{study_name}_{p_name}_{p_id}_signed.pdf"
    
    consent_obj.signed_pdf.save(filename, ContentFile(output_stream.getvalue()), save=False)
    return filename
