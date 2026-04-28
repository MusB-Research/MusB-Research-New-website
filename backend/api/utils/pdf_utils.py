import os
import base64
import io
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from PyPDF2 import PdfReader, PdfWriter
from PIL import Image
from django.conf import settings

def decode_and_draw_signature(can, sig_data, px, py, width=120, height=45):
    """Refactored helper to decode base64 signature and draw it on canvas"""
    try:
        if not sig_data: return
        img_data = sig_data
        if 'base64,' in img_data:
            img_data = img_data.split('base64,')[1]
        sig_img = Image.open(io.BytesIO(base64.b64decode(img_data)))
        can.drawInlineImage(sig_img, px - (width/2), py - (height/2), width=width, height=height)
    except Exception as e:
        print(f"Signature decoding error: {e}")

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as PlatypusImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

def generate_signed_consent_pdf(consent_obj):
    """
    Overlays signatures onto the original consent template PDF based on predefined coordinates.
    """
    if not consent_obj.template or not consent_obj.template.file:
        return None

    template_path = consent_obj.template.file.path
    if not os.path.exists(template_path):
        return None

    # Predefined fields from template
    fields = consent_obj.template.placed_fields or []
    if not fields:
        # Fallback to legacy if no fields, but for this new workflow we expect fields
        return None

    # 1. Group fields by page (1-based index)
    pages_to_fields = {}
    for f in fields:
        p = f.get('page', 1)
        if p not in pages_to_fields:
            pages_to_fields[p] = []
        pages_to_fields[p].append(f)

    # 2. Prepare for PyPDF2 merge
    reader = PdfReader(template_path)
    writer = PdfWriter()

    # PDF dimensions (Letter is 612 x 792 points)
    WIDTH, HEIGHT = 612, 792

    for i in range(len(reader.pages)):
        page = reader.pages[i]
        page_num = i + 1

        if page_num in pages_to_fields:
            # Create overlay for this specific page
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            
            for f in pages_to_fields[page_num]:
                f_type = f.get('type')
                # Map percentage (0-100) to points. 
                # Note: ReportLab (0,0) is BOTTOM LEFT. Frontend (0,0) is TOP LEFT.
                # So y_points = HEIGHT - (y_percent * HEIGHT / 100)
                px = (f.get('x', 0) / 100.0) * WIDTH
                py = HEIGHT - ((f.get('y', 0) / 100.0) * HEIGHT)

                # DRAW LOGIC
                if f_type == 'Participant Signature':
                    decode_and_draw_signature(can, consent_obj.participant_signature, px, py)
                elif f_type in ['Participant Name', 'Legal Full Name', 'Full Name']:
                    can.setFont("Helvetica-Bold", 10)
                    can.drawString(px, py, consent_obj.full_name or "")
                elif f_type in ['Participant Date', 'Date', 'Signed Date']:
                    can.setFont("Helvetica", 10)
                    dt = consent_obj.participant_signed_at or consent_obj.agreed_at
                    can.drawString(px, py, dt.strftime("%Y-%m-%d %H:%M") if dt else "")
                elif f_type == 'CC Signature':
                    decode_and_draw_signature(can, consent_obj.cc_signature, px, py)
                elif f_type in ['CC Name', 'Coordinator Name']:
                    can.setFont("Helvetica-Bold", 10)
                    can.drawString(px, py, consent_obj.cc_name or "")
                elif f_type in ['PI Verification', 'PI Signature']:
                    decode_and_draw_signature(can, consent_obj.pi_signature, px, py)
                elif f_type == 'PI Name':
                    can.setFont("Helvetica-Bold", 10)
                    can.drawString(px, py, consent_obj.pi_name or "")

            can.save()
            packet.seek(0)
            overlay_reader = PdfReader(packet)
            if len(overlay_reader.pages) > 0:
                page.merge_page(overlay_reader.pages[0])

        writer.add_page(page)

    # 3. Finalize
    output_stream = io.BytesIO()
    writer.write(output_stream)
    
    study_id = consent_obj.study.protocol_id if (consent_obj.study and consent_obj.study.protocol_id) else str(consent_obj.pk)
    filename = f"Consent_{study_id}_{consent_obj.pk}.pdf"
    consent_obj.signed_pdf.save(filename, ContentFile(output_stream.getvalue()), save=False)
    return filename

def generate_signed_questionnaire_pdf(instance):
    """
    Generates a signed PDF for a QuestionnaireScheduleInstance by overlaying sigs.
    """
    template = instance.study_questionnaire.template
    if not template or not template.pdf_file:
        return None

    template_path = template.pdf_file.path
    if not os.path.exists(template_path):
        return None

    fields = template.placed_fields or []
    if not fields:
        # If no fields placed, we still want to indicate completion if needed
        return None

    pages_to_fields = {}
    for f in fields:
        p = f.get('page', 1)
        if p not in pages_to_fields: pages_to_fields[p] = []
        pages_to_fields[p].append(f)

    reader = PdfReader(template_path)
    writer = PdfWriter()
    WIDTH, HEIGHT = 612, 792

    for i in range(len(reader.pages)):
        page = reader.pages[i]
        page_num = i + 1
        if page_num in pages_to_fields:
            packet = io.BytesIO()
            can = canvas.Canvas(packet, pagesize=letter)
            for f in pages_to_fields[page_num]:
                f_type = f.get('type')
                px = (f.get('x', 0) / 100.0) * WIDTH
                py = HEIGHT - ((f.get('y', 0) / 100.0) * HEIGHT)

                if f_type == 'Participant Signature':
                    decode_and_draw_signature(can, instance.participant_signature, px, py)
                elif f_type in ['Participant Name', 'Name']:
                    can.setFont("Helvetica-Bold", 10)
                    can.drawString(px, py, instance.participant.full_name or "")
                elif f_type in ['Participant Date', 'Date']:
                    can.setFont("Helvetica", 10)
                    dt = instance.participant_signed_at
                    can.drawString(px, py, dt.strftime("%Y-%m-%d %H:%M") if dt else "")
                elif f_type == 'CC Signature':
                    decode_and_draw_signature(can, instance.coordinator_signature, px, py)
                elif f_type == 'PI Signature':
                    decode_and_draw_signature(can, instance.pi_signature, px, py)

            can.save()
            packet.seek(0)
            overlay_reader = PdfReader(packet)
            if len(overlay_reader.pages) > 0:
                page.merge_page(overlay_reader.pages[0])
        writer.add_page(page)

    output_stream = io.BytesIO()
    writer.write(output_stream)
    
    filename = f"Signed_Instrument_{instance.pk}.pdf"
    instance.signed_pdf.save(filename, ContentFile(output_stream.getvalue()), save=False)
    return filename

