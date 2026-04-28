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
    Generates a PDF containing the consent content and signatures dynamically.
    If study.consent_pdf_template is present, it uses that as the base.
    """
    study = consent_obj.study
    if not study:
        return None

    output_stream = io.BytesIO()
    
    # Check if we have a template
    use_template = bool(study.consent_pdf_template)
    template_path = None
    if use_template:
        template_path = study.consent_pdf_template.path
        if not os.path.exists(template_path):
            use_template = False

    if not use_template:
        # Legacy / Dynamic Generation
        doc = SimpleDocTemplate(output_stream, pagesize=letter,
                                rightMargin=72, leftMargin=72,
                                topMargin=72, bottomMargin=18)
        
        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(name='Justify', alignment=4)) # 4=TA_JUSTIFY
        
        Story = []
        
        # Title
        title = f"Informed Consent Form: {study.title}"
        Story.append(Paragraph(title, styles['Title']))
        Story.append(Spacer(1, 12))
        
        # Protocol ID
        proto = f"Protocol: {study.protocol_id}"
        Story.append(Paragraph(proto, styles['Heading2']))
        Story.append(Spacer(1, 12))
        
        # Content
        content = study.consent_content or ""
        for p in content.split('\n'):
            if p.strip():
                safe_p = p.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
                Story.append(Paragraph(safe_p, styles['Normal']))
                Story.append(Spacer(1, 6))
                
        Story.append(Spacer(1, 24))
        
        # Signatures
        Story.append(Paragraph("<b>Electronic Signatures</b>", styles['Heading2']))
        Story.append(Spacer(1, 12))
        
        # Participant Signature
        Story.append(Paragraph(f"<b>Participant Name:</b> {consent_obj.full_name or ''}", styles['Normal']))
        dt = consent_obj.participant_signed_at or consent_obj.agreed_at
        Story.append(Paragraph(f"<b>Date:</b> {dt.strftime('%Y-%m-%d %H:%M') if dt else ''}", styles['Normal']))
        if consent_obj.participant_signature:
            try:
                img_data = consent_obj.participant_signature
                if 'base64,' in img_data:
                    img_data = img_data.split('base64,')[1]
                img = PlatypusImage(io.BytesIO(base64.b64decode(img_data)), width=2*inch, height=0.75*inch)
                Story.append(img)
            except Exception as e:
                Story.append(Paragraph("(Signature Error)", styles['Normal']))
        Story.append(Spacer(1, 12))
        
        # LAR Section
        if consent_obj.is_lar:
            Story.append(Paragraph(f"<b>LAR Name:</b> {consent_obj.lar_name or ''}", styles['Normal']))
            Story.append(Paragraph(f"<b>LAR Relationship:</b> {consent_obj.lar_relationship or ''}", styles['Normal']))
            Story.append(Paragraph(f"<b>Reason for LAR:</b> {consent_obj.lar_reason or ''}", styles['Normal']))
            Story.append(Spacer(1, 12))
        
        # Coordinator Signature
        if consent_obj.cc_verified:
            Story.append(Paragraph(f"<b>Coordinator Name:</b> {consent_obj.cc_name or ''}", styles['Normal']))
            dt_cc = consent_obj.cc_verified_at
            Story.append(Paragraph(f"<b>Date:</b> {dt_cc.strftime('%Y-%m-%d %H:%M') if dt_cc else ''}", styles['Normal']))
            if consent_obj.cc_signature:
                try:
                    img_data = consent_obj.cc_signature
                    if 'base64,' in img_data:
                        img_data = img_data.split('base64,')[1]
                    img = PlatypusImage(io.BytesIO(base64.b64decode(img_data)), width=2*inch, height=0.75*inch)
                    Story.append(img)
                except Exception as e:
                    Story.append(Paragraph("(Signature Error)", styles['Normal']))
            Story.append(Spacer(1, 12))
            
        # PI Signature
        if consent_obj.pi_verified:
            Story.append(Paragraph(f"<b>PI Name:</b> {consent_obj.pi_name or ''}", styles['Normal']))
            dt_pi = consent_obj.pi_verified_at
            Story.append(Paragraph(f"<b>Date:</b> {dt_pi.strftime('%Y-%m-%d %H:%M') if dt_pi else ''}", styles['Normal']))
            if consent_obj.pi_signature:
                try:
                    img_data = consent_obj.pi_signature
                    if 'base64,' in img_data:
                        img_data = img_data.split('base64,')[1]
                    img = PlatypusImage(io.BytesIO(base64.b64decode(img_data)), width=2*inch, height=0.75*inch)
                    Story.append(img)
                except Exception as e:
                    Story.append(Paragraph("(Signature Error)", styles['Normal']))
        
        doc.build(Story)
    else:
        # TEMPLATE OVERLAY / APPEND
        reader = PdfReader(template_path)
        writer = PdfWriter()
        
        # Add all pages from template
        for page in reader.pages:
            writer.add_page(page)
            
        # Create a dedicated signature page at the end
        packet = io.BytesIO()
        can = canvas.Canvas(packet, pagesize=letter)
        
        y_cursor = 750
        can.setFont("Helvetica-Bold", 16)
        can.drawString(72, y_cursor, "Clinical Research Study - Electronic Signatures")
        y_cursor -= 40
        
        can.setFont("Helvetica-Bold", 10)
        can.drawString(72, y_cursor, f"Study: {study.title}")
        y_cursor -= 15
        can.setFont("Helvetica", 9)
        can.drawString(72, y_cursor, f"Protocol: {study.protocol_id}")
        y_cursor -= 40
        
        # Participant
        can.setFont("Helvetica-Bold", 11)
        can.drawString(72, y_cursor, "PARTICIPANT ACCEPTANCE")
        y_cursor -= 20
        can.setFont("Helvetica", 10)
        can.drawString(72, y_cursor, f"Name: {consent_obj.full_name or ''}")
        y_cursor -= 15
        dt = consent_obj.participant_signed_at or consent_obj.agreed_at
        can.drawString(72, y_cursor, f"Signed At: {dt.strftime('%Y-%m-%d %H:%M') if dt else ''}")
        y_cursor -= 50
        if consent_obj.participant_signature:
            decode_and_draw_signature(can, consent_obj.participant_signature, 72 + 60, y_cursor + 25)
        
        # LAR
        if consent_obj.is_lar:
            y_cursor -= 40
            can.setFont("Helvetica-Bold", 11)
            can.drawString(72, y_cursor, "LEGAL AUTHORIZED REPRESENTATIVE (LAR)")
            y_cursor -= 20
            can.setFont("Helvetica", 10)
            can.drawString(72, y_cursor, f"LAR Name: {consent_obj.lar_name or ''}")
            y_cursor -= 15
            can.drawString(72, y_cursor, f"Relationship: {consent_obj.lar_relationship or ''}")
            y_cursor -= 40

        # Coordinator
        if consent_obj.cc_verified:
            y_cursor -= 40
            can.setFont("Helvetica-Bold", 11)
            can.drawString(72, y_cursor, "CLINICAL COORDINATOR VERIFICATION")
            y_cursor -= 20
            can.setFont("Helvetica", 10)
            can.drawString(72, y_cursor, f"Coordinator Name: {consent_obj.cc_name or ''}")
            y_cursor -= 15
            dt_cc = consent_obj.cc_verified_at
            can.drawString(72, y_cursor, f"Verified At: {dt_cc.strftime('%Y-%m-%d %H:%M') if dt_cc else ''}")
            y_cursor -= 50
            if consent_obj.cc_signature:
                decode_and_draw_signature(can, consent_obj.cc_signature, 72 + 60, y_cursor + 25)

        # PI
        if consent_obj.pi_verified:
            y_cursor -= 40
            can.setFont("Helvetica-Bold", 11)
            can.drawString(72, y_cursor, "PRINCIPAL INVESTIGATOR APPROVAL")
            y_cursor -= 20
            can.setFont("Helvetica", 10)
            can.drawString(72, y_cursor, f"PI Name: {consent_obj.pi_name or ''}")
            y_cursor -= 15
            dt_pi = consent_obj.pi_verified_at
            can.drawString(72, y_cursor, f"Approved At: {dt_pi.strftime('%Y-%m-%d %H:%M') if dt_pi else ''}")
            y_cursor -= 50
            if consent_obj.pi_signature:
                decode_and_draw_signature(can, consent_obj.pi_signature, 72 + 60, y_cursor + 25)

        can.save()
        packet.seek(0)
        sig_reader = PdfReader(packet)
        writer.add_page(sig_reader.pages[0])
        
        writer.write(output_stream)
    
    study_id = study.protocol_id or str(study.pk)
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

