import io
import base64
from reportlab.lib.pagesizes import LETTER
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.lib.units import inch
from django.core.files.base import ContentFile
from PIL import Image as PILImage

def generate_signed_consent_pdf(consent_record):
    """
    Generates a professional PDF document combining consent text and signatures.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20,
        alignment=1, # Center
        textColor=colors.HexColor('#2563eb')
    )
    
    header_style = ParagraphStyle(
        'Header',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.grey,
        spaceAfter=12
    )
    
    content_style = ParagraphStyle(
        'Content',
        parent=styles['Normal'],
        fontSize=11,
        leading=14,
        spaceAfter=12
    )

    elements = []
    has_template_file = bool(consent_record.template and consent_record.template.file)
    
    if not has_template_file:
        # 1. Header Information
        elements.append(Paragraph("MusB RESEARCH PORTAL - OFFICIAL RECORD", header_style))
        elements.append(Paragraph(f"Study: {consent_record.study.title} ({consent_record.study.protocol_id})", header_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # 2. Title
        elements.append(Paragraph("Informed Consent Agreement", title_style))
        elements.append(Spacer(1, 0.3 * inch))
        
        # 3. Consent Content
        content = consent_record.content_snapshot
        if not content and consent_record.template and consent_record.template.terms_content:
            content = consent_record.template.terms_content
        if not content:
            content = "Refer to study protocol for consent terms."
            
        # Handle multiple lines
        for line in content.split('\n'):
            if line.strip():
                elements.append(Paragraph(line, content_style))
            else:
                elements.append(Spacer(1, 0.1 * inch))
                
        elements.append(Spacer(1, 0.5 * inch))
        elements.append(Paragraph("<hr/>", styles['Normal']))
        elements.append(Spacer(1, 0.2 * inch))
    else:
        # Append only the signature page to the uploaded template
        elements.append(Paragraph("MusB RESEARCH PORTAL - OFFICIAL RECORD", header_style))
        elements.append(Paragraph(f"Study: {consent_record.study.title} ({consent_record.study.protocol_id})", header_style))
        elements.append(Spacer(1, 0.2 * inch))
        elements.append(Paragraph("Informed Consent - Signature Certificate", title_style))
        elements.append(Spacer(1, 0.3 * inch))
        elements.append(Paragraph("This page serves as the official signature certificate for the attached Informed Consent document.", content_style))
        elements.append(Spacer(1, 0.5 * inch))
    
    # 4. Signatures Table
    sig_data = []
    
    def process_signature(sig_str):
        if not sig_str:
            return None
        if sig_str.startswith('data:image'):
            try:
                sig_bytes = base64.b64decode(sig_str.split(',')[1])
                img_buffer = io.BytesIO(sig_bytes)
                
                # Sanitize image with PIL to avoid ReportLab transparency issues
                pil_img = PILImage.open(img_buffer)
                if pil_img.mode in ('RGBA', 'LA') or (pil_img.mode == 'P' and 'transparency' in pil_img.info):
                    alpha = pil_img.convert('RGBA').split()[-1]
                    bg = PILImage.new("RGB", pil_img.size, (255, 255, 255))
                    bg.paste(pil_img, mask=alpha)
                    pil_img = bg
                elif pil_img.mode != 'RGB':
                    pil_img = pil_img.convert('RGB')
                    
                clean_buffer = io.BytesIO()
                pil_img.save(clean_buffer, format='JPEG')
                clean_buffer.seek(0)
                
                return Image(clean_buffer, width=1.5*inch, height=0.5*inch)
            except Exception as e:
                print(f"Error processing signature image: {e}")
                return Paragraph("[Signature Image Error]", styles['Normal'])
        else:
            # Typed signature
            return Paragraph(f"<i>{sig_str}</i>", styles['Normal'])

    # Participant Column
    p_sig_element = process_signature(consent_record.participant_signature)
    p_col = [
        Paragraph("<b>PARTICIPANT</b>", styles['Normal']),
        Spacer(1, 0.1 * inch),
        Paragraph(f"Name: {consent_record.full_name}", styles['Normal']),
        Paragraph(f"Date: {consent_record.participant_signed_at.strftime('%Y-%m-%d %H:%M') if consent_record.participant_signed_at else '—'}", styles['Normal']),
        Spacer(1, 0.1 * inch),
        p_sig_element or Paragraph("[No Signature]", styles['Normal'])
    ]
    
    # Coordinator Column
    cc_sig_element = process_signature(consent_record.cc_signature)
    cc_col = [
        Paragraph("<b>COORDINATOR / STAFF</b>", styles['Normal']),
        Spacer(1, 0.1 * inch),
        Paragraph(f"Name: {consent_record.cc_name or '—'}", styles['Normal']),
        Paragraph(f"Date: {consent_record.cc_verified_at.strftime('%Y-%m-%d %H:%M') if consent_record.cc_verified_at else '—'}", styles['Normal']),
        Spacer(1, 0.1 * inch),
        cc_sig_element or Paragraph("[Awaiting Co-Signature]", styles['Normal'])
    ]
    
    # PI Column (if applicable)
    pi_col = []
    if consent_record.pi_verified or consent_record.pi_signature:
        pi_sig_element = process_signature(consent_record.pi_signature)
        pi_col = [
            Paragraph("<b>PRINCIPAL INVESTIGATOR</b>", styles['Normal']),
            Spacer(1, 0.1 * inch),
            Paragraph(f"Name: {consent_record.pi_name or '—'}", styles['Normal']),
            Paragraph(f"Date: {consent_record.pi_verified_at.strftime('%Y-%m-%d %H:%M') if consent_record.pi_verified_at else '—'}", styles['Normal']),
            Spacer(1, 0.1 * inch),
            pi_sig_element or Paragraph("[Signed Electronically]", styles['Normal'])
        ]

    # Create Signature Layout
    row = [p_col, cc_col]
    if pi_col:
        row.append(pi_col)
    
    sig_table = Table([row], colWidths=[2.2*inch] * len(row))
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    elements.append(sig_table)
    
    # Build PDF
    doc.build(elements)
    
    final_buffer = io.BytesIO()
    
    if has_template_file:
        try:
            from pypdf import PdfWriter, PdfReader
            merger = PdfWriter()
            
            template_bytes = consent_record.template.file.read()
            template_pdf = PdfReader(io.BytesIO(template_bytes))
            merger.append(template_pdf)
            
            sig_pdf = PdfReader(io.BytesIO(buffer.getvalue()))
            merger.append(sig_pdf)
            
            merger.write(final_buffer)
            merger.close()
        except Exception as e:
            print(f"Error merging PDF template: {e}")
            final_buffer = io.BytesIO(buffer.getvalue())
    else:
        final_buffer = io.BytesIO(buffer.getvalue())
        
    # Save to model
    filename = f"signed_consent_{consent_record.pk}.pdf"
    consent_record.signed_pdf.save(filename, ContentFile(final_buffer.getvalue()), save=False)
    buffer.close()
    final_buffer.close()
    return filename
