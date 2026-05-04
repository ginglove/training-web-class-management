import re

with open('backend/booking-service/src/controllers/booking.controller.js', 'r') as f:
    code = f.readlines()

definitions = []
usages = []

for idx, line in enumerate(code):
    line_num = idx + 1
    
    # Definition: const { rows ... } or let { rows ... }
    def_match = re.search(r'(const|let)\s*{\s*rows\s*(?::\s*(\w+))?\s*}\s*=\s*', line)
    if def_match:
        name = def_match.group(2) if def_match.group(2) else 'rows'
        definitions.append({'name': name, 'line': line_num})
        continue

    # Usage: rows[0], rows.length, rows.map, etc.
    if re.search(r'\brows\b', line):
        usages.append({'line': line_num, 'content': line.strip()})

print('Definitions:')
for d in definitions:
    print(f"  Line {d['line']}: {d['name']}")

print('\nUsages:')
for u in usages:
    print(f"  Line {u['line']}: {u['content']}")
