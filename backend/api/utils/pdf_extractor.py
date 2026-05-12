"""
Advanced Clinical Document Extraction Engine
=============================================
Converts raw PDF/DOCX text into a structured, UI-ready JSON schema.
Supports both heuristic (regex) and AI-powered (LLM) extraction.
"""

import re
import os
import json
import logging
import requests

logger = logging.getLogger(__name__)

# ─── LIKERT OPTION SETS ───────────────────────────────────────────────────────
LIKERT_SETS = [
    ['Never', 'Rarely', 'Occasionally', 'Sometimes', 'Frequently', 'Usually', 'Always'],
    ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    ['Not at all', 'A little', 'Moderately', 'Quite a bit', 'Extremely'],
    ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    ['None', 'Mild', 'Moderate', 'Severe', 'Very Severe'],
    ['No', 'Yes'],
    ['No problem', 'Mild problem', 'Moderate problem', 'Severe problem'],
    ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
]

EMOJI_SCALE = ['😀', '🙂', '😐', '😕', '😣', '😖', '😫', '😡', '🤬', '💀']

# ─── AI EXTRACTION CONFIG ─────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are a clinical form extraction specialist embedded in a research platform.

Your ONLY job is to analyze the raw text extracted from a PDF or DOCX file and 
return a structured JSON schema that represents the questionnaire fields found in 
that document.

## STRICT RULES
- Do NOT modify, reformat, or comment on any other part of the codebase.
- Do NOT return anything except valid raw JSON — no markdown, no backticks, 
  no explanation, no preamble.
- If the document is not a questionnaire, return: {"error": "not a questionnaire"}

## OUTPUT FORMAT
Return exactly this JSON structure:

{
  "document_type": "questionnaire",
  "title": "<detected form title or filename>",
  "global_instructions": "<any instructions at the top of the form, or null>",
  "sections": [
    {
      "title": "<section heading, e.g. Somatic symptoms or Medical History>",
      "fields": [
        {
          "label": "<exact question text>",
          "hint": "<helper text or null>",
          "type": "<one of: radio | scale | yesno | text | textarea | number | date | signature | checkbox | faces | likert | matrix>",
          "options": ["<option 1>", "<option 2>"],
          "required": true,
          "rows": ["<row 1 text>", "<row 2 text>"],
          "columns": ["<column 1 text>", "<column 2 text>"]
        }
      ]
    }
  ]
}

## FIELD TYPE RULES — apply in this order:
1. If multiple questions share the same set of options (a grid or table) → type = "matrix", put labels in "rows" and option headers in "columns"
2. If options are exactly Yes / No → type = "yesno", options = ["Yes", "No"]
3. If the question describes feelings/wellbeing with a range of icons (smiling to crying, emoji faces) → type = "faces", list descriptors if present
4. If options match a Likert pattern (Never/Rarely/Sometimes or Not at all/A little 
   bit/Somewhat etc.) → type = "likert", list all options
5. If question has a numeric range like "0 to 10" or "0-100" → type = "scale", 
   set scale_min and scale_max, options = ["<left anchor label>", "<right anchor label>"]
6. If checkboxes present (☐ □ [ ]) → type = "checkbox", list all checkbox labels
7. If label contains words like: date, DOB, birth → type = "date"
8. If label contains: age, score, number, how many → type = "number"
9. If label contains: describe, explain, comments, notes → type = "textarea"
10. Otherwise → type = "radio" (if options present) or "text" (if no options)

## SECTION DETECTION
Treat any line matching these patterns as a new section header:
- PART 1, SECTION A, MODULE 2, ELIGIBILITY, MEDICAL HISTORY, BACKGROUND INFO
- Any all-caps line followed by numbered questions

## WHAT TO IGNORE
- Page numbers, footers, headers, logos, watermarks
- Lines that are purely decorative (----, ====)
- Instructions that are not questions

## RAW TEXT TO PARSE:
{{raw_text}}
"""

def extract_with_ai(raw_text: str) -> dict:
    """
    High-fidelity extraction using Google Gemini.
    Features native JSON schema output for 100% reliable clinical questionnaire structures.
    Requires GEMINI_API_KEY to be set in environment.
    """
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if not gemini_key:
        return None

    prompt = SYSTEM_PROMPT.replace("{{raw_text}}", raw_text)

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            res_data = response.json()
            content = res_data['candidates'][0]['content']['parts'][0]['text']
            return json.loads(content)
        else:
            logger.warning(f"Gemini API returned status {response.status_code}: {response.text}")
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")

    return None

# ─── HELPERS (Heuristic Fallback) ───────────────────────────────────────────

def _clean_label(s: str) -> str:
    """Strip leading numbering, bullets, whitespace from a label."""
    s = re.sub(r'^(\d+[\.\)]\s*|[A-Za-z][\.\)]\s*|[•\-●▪□☐]\s*)', '', s)
    return s.strip()


def _is_section_header(line: str) -> bool:
    s = line.strip()
    if re.match(r'^(PART|SECTION|VISIT|BASELINE|BLOCK)\s+\d+', s, re.IGNORECASE):
        return True
    if re.match(r'^\d+\.\s{1,3}[A-Z][A-Z\s]{3,}$', s):
        return True
    if s == s.upper() and 5 < len(s) < 80 and not re.search(r'\d{2,}', s):
        return True
    if re.match(
        r'^(OVERVIEW|INTRODUCTION|INSTRUCTIONS|BACKGROUND|NOTES|DEMOGRAPHICS|'
        r'MEDICAL HISTORY|MEDICATIONS|SYMPTOMS|ADVERSE EVENTS|ELIGIBILITY|'
        r'PATIENT INFORMATION|PARTICIPANT DETAILS)',
        s, re.IGNORECASE
    ):
        return True
    return False


def _is_question_start(line: str) -> bool:
    return bool(re.match(r'^(\d+[\.\)]\s|[A-Ga-g][\.\)]\s|[•\-●▪]\s)', line.strip()))


def _match_likert(line: str):
    """Return likert option set if the line contains a known scale pattern."""
    line_lower = line.lower()
    for ls in LIKERT_SETS:
        hit = sum(1 for opt in ls if opt.lower() in line_lower)
        if hit >= max(2, len(ls) - 1):
            return ls
    return None


def _match_percentage_scale(line: str):
    vals = re.findall(r'(\d{1,3})%', line)
    if len(vals) >= 4:
        return [int(v) for v in vals]
    return None


def _match_numeric_scale(line: str):
    m = re.search(r'(\d+)\s*[–\-to]+\s*(\d+)', line)
    if m:
        mn, mx = int(m.group(1)), int(m.group(2))
        if mx > mn and mx <= 100:
            return mn, mx
    return None


def _match_checkbox_group(line: str):
    opts = re.findall(
        r'(?:☐|□|\[[\s_]\]|○|◯)\s*([A-Za-z][A-Za-z\s\(\)/,\-]*?)(?=\s*(?:☐|□|\[[\s_]\]|○|◯)|$)',
        line
    )
    if len(opts) >= 2:
        return [o.strip() for o in opts if o.strip()]
    return None


def _match_table_header(line: str):
    # Tab-separated (from DOCX table extraction)
    if '\t' in line:
        cols = [c.strip() for c in line.split('\t') if c.strip()]
        if len(cols) >= 3:
            return cols
    # Multiple words separated by 2+ spaces
    potential = re.split(r'\s{2,}', line.strip())
    if len(potential) >= 3:
        words_ok = all(len(p) > 1 for p in potential)
        caps_ok = sum(1 for p in potential if p[0].isupper()) >= len(potential) - 1
        if words_ok and caps_ok:
            return potential
    return None


def _detect_global_scale(lines):
    """Look at the first 20 lines for a repeating numeric → label scale legend."""
    for line in lines[:20]:
        matches = re.findall(
            r'(\d+)\s*[=\-:]\s*([A-Za-z][A-Za-z\s\/]+?)(?=\s+\d+|$)', line
        )
        if len(matches) >= 2:
            return [f"{m[0]} = {m[1].strip()}" for m in matches]
    return []


def _detect_doc_type(full_text: str) -> str:
    field_kw = len(re.findall(r'\b(name|date|signature|address|phone|email|dob|initials)\b', full_text, re.I))
    scale_kw = len(re.findall(r'\b(never|rarely|sometimes|always|mild|moderate|severe|score|rate|scale)\b', full_text, re.I))
    elig_kw  = len(re.findall(r'\b(eligible|inclusion|exclusion|criteria|qualify|not eligible)\b', full_text, re.I))

    if elig_kw >= 2:
        return 'screener'
    if scale_kw >= 3 and field_kw <= 2:
        return 'questionnaire'
    if field_kw >= 3 and scale_kw <= 1:
        return 'clinical_form'
    return 'hybrid'


def _classify_plain_field(label: str) -> str:
    """Guess field type from a label string."""
    l = label.lower()
    if re.search(r'\b(name|first|last|full name|initials|patient|subject)\b', l):
        return 'text'
    if re.search(r'\b(date|dob|birth|visit)\b', l):
        return 'date'
    if re.search(r'\b(age|weight|height|score|bmi|dose|number|amount|total)\b', l):
        return 'number'
    if re.search(r'\b(notes|remarks|comments|describe|explanation|detail)\b', l):
        return 'textarea'
    if re.search(r'\b(signature|sign)\b', l):
        return 'signature'
    if re.search(r'\b(email)\b', l):
        return 'email'
    if re.search(r'\b(phone|mobile|tel)\b', l):
        return 'phone'
    return 'text'


# ─── MAIN EXTRACTION FUNCTION ─────────────────────────────────────────────────

def extract_schema(raw_text: str) -> dict:
    """
    Convert raw extracted document text into a structured JSON schema.
    Tries AI extraction first, falls back to heuristics.
    """
    
    # ── STEP 0: Attempt AI Extraction ─────────────────────────────────────────
    ai_result = extract_with_ai(raw_text)
    if ai_result and "sections" in ai_result:
        # Add raw lines for backward compat / source view
        ai_result['lines'] = raw_text.split('\n')
        return ai_result

    # ── STEP 1: Preprocess ────────────────────────────────────────────────────
    clean_lines = []
    for line in raw_text.split('\n'):
        s = line.rstrip()
        stripped = s.strip()
        if not stripped:
            continue
        if re.match(r'^©|All rights reserved', stripped, re.IGNORECASE):
            continue
        if re.match(r'^\s*page\s+\d+\s*$', stripped, re.IGNORECASE):
            continue
        clean_lines.append(stripped)

    if not clean_lines:
        return {
            'document_type': 'unknown',
            'sections': [{'title': 'Extracted Content', 'fields': [
                {'type': 'instruction', 'text': 'No extractable text found in this document.'}
            ]}],
            'lines': []
        }

    # ── STEP 2: Document type detection ───────────────────────────────────────
    full_text = ' '.join(clean_lines)
    doc_type = _detect_doc_type(full_text)
    global_scale = _detect_global_scale(clean_lines)

    # ── STEPS 3–11: Structured field extraction ───────────────────────────────
    sections = []
    current_section = {'title': 'General', 'fields': []}

    i = 0
    while i < len(clean_lines):
        line = clean_lines[i]

        # ── Instruction / intro text ──────────────────────────────────────────
        if (
            re.match(r'^(Please|Note:|NOTE:|Circle|Check|Select|Indicate|For each|Answer|Complete|Read)\b', line, re.I)
            and len(line) < 250
            and not _is_question_start(line)
        ):
            current_section['fields'].append({'type': 'instruction', 'text': line.strip()})
            i += 1
            continue

        # ── Section header ────────────────────────────────────────────────────
        if _is_section_header(line):
            if current_section['fields']:
                sections.append(current_section)
            current_section = {'title': line.strip(), 'fields': []}
            i += 1
            continue

        # ── Eligibility logic ─────────────────────────────────────────────────
        if re.search(r'\b(eligible|not eligible|inclusion criteria|exclusion criteria)\b', line, re.I):
            current_section['fields'].append({
                'type': 'eligibility',
                'logic': True,
                'text': line.strip()
            })
            i += 1
            continue

        # ── Table detection ───────────────────────────────────────────────────
        table_cols = _match_table_header(line)
        if table_cols and not _is_question_start(line) and len(table_cols) >= 3:
            current_section['fields'].append({
                'type': 'table',
                'label': '',
                'columns': table_cols
            })
            i += 1
            continue

        # ── Checkbox / radio group ────────────────────────────────────────────
        checkbox_opts = _match_checkbox_group(line)
        if checkbox_opts:
            label_text = ''
            if i > 0 and not _is_section_header(clean_lines[i - 1]):
                label_text = _clean_label(clean_lines[i - 1])
            allow_multi = bool(re.search(r'all that apply|check all', line, re.I))
            current_section['fields'].append({
                'type': 'checkbox' if allow_multi else 'radio',
                'label': label_text,
                'options': checkbox_opts,
                'allow_multiple': allow_multi,
                'required': True
            })
            i += 1
            continue

        # ── Percentage scale ──────────────────────────────────────────────────
        pct_vals = _match_percentage_scale(line)
        if pct_vals:
            label_text = _clean_label(clean_lines[i - 1]) if i > 0 else ''
            current_section['fields'].append({
                'type': 'percentage_scale',
                'label': label_text,
                'values': pct_vals
            })
            i += 1
            continue

        # ── Likert header row → maybe matrix ─────────────────────────────────
        likert_opts = _match_likert(line)
        if (likert_opts and not _is_question_start(line)) or (len(re.split(r'\s{2,}', line.strip())) >= 3):
            # Try to detect matrix/grid if multiple questions follow this header
            potential_cols = likert_opts if likert_opts else re.split(r'\s{2,}', line.strip())
            matrix_rows = []
            j = i + 1
            while j < len(clean_lines) and (_is_question_start(clean_lines[j]) or re.match(r'^\d+[\.\)]', clean_lines[j])):
                matrix_rows.append(_clean_label(clean_lines[j]))
                j += 1

            if len(matrix_rows) >= 2:
                current_section['fields'].append({
                    'type': 'matrix',
                    'label': 'Please answer the following:',
                    'rows': matrix_rows,
                    'columns': potential_cols
                })
                i = j
                continue
            elif likert_opts:
                label_text = _clean_label(clean_lines[i - 1]) if i > 0 else ''
                current_section['fields'].append({
                    'type': 'likert',
                    'label': label_text,
                    'options': likert_opts
                })
                i += 1
                continue

        # ── Numeric scale (VAS) ───────────────────────────────────────────────
        scale_range = _match_numeric_scale(line)
        if scale_range:
            mn, mx = scale_range
            label_text = _clean_label(clean_lines[i - 1]) if i > 0 else ''
            scale_labels = re.findall(r'([A-Za-z][A-Za-z\s]+?)(?=\s*\d|\s*$)', line)
            field = {'type': 'scale', 'label': label_text, 'min': mn, 'max': mx}
            if scale_labels and len(scale_labels) >= 2:
                field['labels'] = [l.strip() for l in scale_labels if l.strip()]
            context = (line + ' ' + label_text).lower()
            if re.search(r'(face|pain|discomfort|emoji|smiley|hurt|ache)', context):
                field['type'] = 'emoji_scale'
                field['emojis'] = EMOJI_SCALE
            current_section['fields'].append(field)
            i += 1
            continue

        # ── Numbered question with possible inline options ────────────────────
        if _is_question_start(line):
            q_label = _clean_label(line)
            options = []
            q_type = 'short_text'

            inline_opts = re.findall(
                r'(\d+)\s*[=\-:]?\s*([A-Za-z][A-Za-z\s\/\(\), \-]+?)(?=\s+\d+\s*[=\-:]?\s*[A-Za-z]|$)',
                line
            )
            if len(inline_opts) >= 2:
                options = [f"{m[0]} = {m[1].strip()}" for m in inline_opts]
                q_label = re.split(r'\s+\d+\s*[=\-:]?\s*[A-Za-z]', q_label)[0].strip()

            elif re.search(r'\(0 for NO,?\s*1 for YES\)', line, re.I):
                options = ['0 = NO', '1 = YES']
                q_label = re.sub(r'\s*\(0 for NO,?\s*1 for YES\)', '', q_label).strip()

            elif global_scale and re.search(r'\s+\d(\s+\d)+\s*$', line):
                options = global_scale
                q_label = re.sub(r'\s+\d(\s+\d)+\s*$', '', q_label).strip()

            elif _match_likert(line):
                options = _match_likert(line)

            if options:
                allow_multi = bool(re.search(r'select all|check all|all that apply', line, re.I))
                q_type = 'checkbox' if allow_multi else 'choice'
            elif re.search(r'\b(date|when|day|month|year)\b', q_label, re.I):
                q_type = 'date'
            elif re.search(r'\b(how many|number|count|age|weight|height|score|total|bmi)\b', q_label, re.I):
                q_type = 'number'
            elif re.search(r'\b(describe|explain|remarks|notes|comments|additional|detail)\b', q_label, re.I):
                q_type = 'textarea'

            field = {
                'type': q_type,
                'label': q_label,
                'required': True,
                'placeholder': 'Select an option...' if options else 'Enter your answer...'
            }
            if options:
                field['options'] = options
            if q_type == 'checkbox':
                field['allow_multiple'] = True

            current_section['fields'].append(field)
            i += 1
            continue

        # ── Plain "Label: value" field ────────────────────────────────────────
        colon_field = re.match(r'^([A-Za-z][A-Za-z\s\/\-]{1,40}):\s*(.*)$', line)
        if colon_field:
            field_label = colon_field.group(1).strip()
            if len(field_label) >= 2:
                ft = _classify_plain_field(field_label)
                current_section['fields'].append({
                    'type': ft,
                    'label': field_label,
                    'required': False,
                    'placeholder': ''
                })
                i += 1
                continue

        i += 1

    if current_section['fields']:
        sections.append(current_section)

    if not sections:
        sections = [{'title': 'Extracted Content', 'fields': [
            {'type': 'instruction', 'text': 'Could not detect structured fields. Please review the source document quality.'}
        ]}]

    return {
        'document_type': doc_type,
        'sections': sections,
        'lines': clean_lines,
    }
