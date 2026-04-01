import os
import sys
import django
from PIL import Image, ImageDraw, ImageFont
import tempfile
from datetime import datetime

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'musb_backend.settings')
django.setup()

from api.models import Study, Document
from django.core.files import File

def generate_pdf(title, filename, logo_path, text_content):
    # Create a white image (A4 size approx @ 72 dpi: 595x842)
    img = Image.new('RGB', (600, 800), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    
    # Try to load the logo
    try:
        if os.path.exists(logo_path):
            logo = Image.open(logo_path)
            logo.thumbnail((150, 150))
            img.paste(logo, (225, 20)) # Center logo at top
        else:
            draw.text((225, 50), "MUSB RESEARCH", fill=(0, 100, 0))
    except Exception as e:
        print(f"Warning: Could not load logo: {e}")
        draw.text((225, 50), "MUSB RESEARCH", fill=(0, 0, 0))

    # Add Title
    draw.text((50, 180), f"Document: {title}", fill=(0, 0, 0))
    draw.text((50, 200), f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", fill=(100, 100, 100))
    draw.text((50, 220), "-" * 80, fill=(200, 200, 200))
    
    # Add dummy content
    y_offset = 260
    lines = text_content.split('\n')
    for line in lines:
        draw.text((50, y_offset), line.strip(), fill=(50, 50, 50))
        y_offset += 25

    # Save as PDF
    pdf_path = os.path.join(tempfile.gettempdir(), filename)
    img.save(pdf_path, 'PDF', resolution=100.0)
    return pdf_path

def seed_documents():
    # Find all studies
    studies = Study.objects.all()
    if not studies.exists():
        print("Error: No studies found in database. Please run seed scripts first.")
        return

    # Path to logo in frontend
    logo_path = os.path.join(os.getcwd(), '..', 'frontend', 'public', 'logo.jpg')
    
    # Standard dummy documents for every study
    docs_to_create = [
        {
            "title": "Institutional Review Board (IRB) Approval", 
            "filename": "irb_approval_v1.0.pdf", 
            "version": "1.0",
            "content": "OFFICIAL NOTICE OF APPROVAL\n\nThis study protocol has been reviewed and approved by the Ethics Committee.\nAll safety protocols are found to be in compliance with international guidelines.\nApproval ID: IRB-2026-XQ-409\nStatus: FULL APPROVAL"
        },
        {
            "title": "Study Protocol & Methodology", 
            "filename": "study_protocol_v2.1.pdf", 
            "version": "2.1",
            "content": "STUDY PROTOCOL\n\nPhase: Phase II Clinical Evaluation\nTarget Enrollment: Varied by site\nPrimary Endpoint: Safety and Tolerability\nSecondary Endpoint: Clinical Efficacy"
        },
        {
            "title": "Investigator Brochure", 
            "filename": "investigator_brochure_2026.pdf", 
            "version": "2026.0",
            "content": "INVESTIGATOR BROCHURE\n\nConfidential information for clinical investigators.\nSummary of chemical, pharmaceutical, and clinical data.\nUpdated for the 2026 clinical year."
        },
        {
            "title": "Safety Monitoring Report", 
            "filename": "safety_report_q1.pdf", 
            "version": "1.0",
            "content": "INTERIM SAFETY REPORT - Q1\n\nNo Significant Adverse Effects (SAE) reported.\nLaboratory values remain within normal therapeutic ranges.\nClinical monitoring is ongoing."
        }
    ]

    for study in studies:
        print(f"Checking documents for study: {study.title} ({study.protocol_id})")
        # Check if we already have these docs
        existing_titles = set(Document.objects.filter(study=study).values_list('title', flat=True))
        
        for dc in docs_to_create:
            if dc['title'] in existing_titles:
                print(f" - {dc['title']} already exists. Skipping.")
                continue

            unique_filename = f"{study.protocol_id or 'std'}_{dc['filename']}"
            pdf_path = generate_pdf(dc['title'], unique_filename, logo_path, dc['content'])
            
            with open(pdf_path, 'rb') as f:
                django_file = File(f, name=unique_filename)
                doc = Document.objects.create(
                    study=study,
                    title=dc['title'],
                    version=dc['version'],
                    file=django_file
                )
                print(f" - Created: {doc.title} (v{doc.version}) -> {doc.file.name}")
            
            # Cleanup temp file
            try:
                os.remove(pdf_path)
            except:
                pass

    print("Successfully seeded placeholder documents for all studies.")

if __name__ == "__main__":
    seed_documents()
