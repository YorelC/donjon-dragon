import re, sys

html = open(sys.argv[1], encoding='utf-8').read()
slugs = sorted(set(re.findall(r"monster/fr/([^'\"]+)", html)))
out = sys.argv[2] if len(sys.argv) > 2 else None
if out:
    with open(out, 'w', encoding='utf-8') as f:
        for s in slugs:
            f.write(s + '\n')
print(f"{len(slugs)} slugs written to {out}" if out else f"{len(slugs)} slugs found")