import os
import re

def resolve_conflicts(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to find conflict blocks and resolve them
    # Note: This is specific to this task
    
    # 1. Imports in serializers/views
    pattern1 = r'<<<<<<< HEAD\n\s+(ClinicalAuditLog, PIIRevealLog)\n=======\n\s+(StaffMember, Advisor, ClinicalCollaborator)\n>>>>>>> [a-f0-9]+'
    content = re.sub(pattern1, r'\1,\n    \2', content)
    
    # 2. Serializers in views
    pattern2 = r'<<<<<<< HEAD\n\s+(TeamMemberSerializer, ClinicalAuditLogSerializer, PIIRevealLogSerializer)\n=======\n\s+(TeamMemberSerializer, StaffMemberSerializer, AdvisorSerializer,\n\s+ClinicalCollaboratorSerializer)\n>>>>>>> [a-f0-9]+'
    content = re.sub(pattern2, r'\1,\n    \2', content)
    
    # 3. Layout button
    pattern3 = r'<<<<<<< HEAD\n\s+className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-red-100 text-red-600 font-black text-sm uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm group"\n=======\n\s+className="w-\[38px\] h-\[38px\] rounded-full border-\[1.5px\] border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 ml-1"\n\s+title="Logout"\n>>>>>>> [a-f0-9]+'
    # Keep the second part (circular button)
    content = re.sub(pattern3, r'className="w-[38px] h-[38px] rounded-full border-[1.5px] border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition-all shrink-0 ml-1"\n                                            title="Logout"', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    files = [
        "c:/Users/baren/OneDrive/Desktop/MusB Research Website-1/backend/api/serializers.py",
        "c:/Users/baren/OneDrive/Desktop/MusB Research Website-1/backend/api/views.py",
        "c:/Users/baren/OneDrive/Desktop/MusB Research Website-1/frontend/src/components/Layout.tsx"
    ]
    for f in files:
        if os.path.exists(f):
            resolve_conflicts(f)
            print(f"Processed {f}")
