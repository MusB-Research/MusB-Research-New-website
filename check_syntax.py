import sys
import os

files = [
    r'd:\MusB Research Website-1\frontend\src\views\SponsorDashboard\ParticipantDataPanel.tsx',
    r'd:\MusB Research Website-1\frontend\src\views\SponsorDashboard\DashboardPanel.tsx',
    r'd:\MusB Research Website-1\frontend\src\views\SponsorDashboard\SponsorDashboardShared.tsx',
    r'd:\MusB Research Website-1\frontend\src\views\SponsorDashboard\TeamManagementPanel.tsx'
]

def check_brackets(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    stack = []
    brackets = {'(': ')', '{': '}', '[': ']'}
    for i, char in enumerate(content):
        if char in brackets.keys():
            stack.append((char, i))
        elif char in brackets.values():
            if not stack:
                return f"Unmatched closing bracket {char} at index {i}"
            opener, pos = stack.pop()
            if brackets[opener] != char:
                return f"Mismatched bracket {opener} at {pos} with {char} at {i}"
    if stack:
        opener, pos = stack[0]
        return f"Unclosed bracket {opener} at {pos}"
    return "OK"

for f in files:
    try:
        print(f"{os.path.basename(f)}: {check_brackets(f)}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
