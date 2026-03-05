import os
import re

# Fix role-*.html files
careers_html = open('careers.html', 'r', encoding='utf-8').read()
nav_start = careers_html.find('<!-- Navigation -->')
theme_end = careers_html.find('</button>', careers_html.find('<!-- Floating Theme Toggle -->')) + len('</button>')
correct_nav_block = careers_html[nav_start:theme_end]

for file in os.listdir('.'):
    if file.startswith('role-') and file.endswith('.html'):
        content = open(file, 'r', encoding='utf-8').read()
        target_start = content.find('<!-- Navigation -->')
        target_end_idx = content.find('<header class="role-hero')
        if target_start != -1 and target_end_idx != -1:
            new_content = content[:target_start] + correct_nav_block + '\n\n    ' + content[target_end_idx:]
            
            # ensure body closes properly
            if '</body>' not in new_content:
                new_content = new_content.replace('</html>', '</body>\n</html>')
            
            open(file, 'w', encoding='utf-8').write(new_content)

# Fix careers.html outer anchor tags
careers_html = open('careers.html', 'r', encoding='utf-8').read()
careers_html = re.sub(r'<a href="(role-[^"]+)" target="_blank" class="(job-card[^"]*)">', r'<div onclick="window.open(\'\1\', \'_blank\')" class="\2" style="cursor:pointer;">', careers_html)
careers_html = careers_html.replace('</a>\n\n                <!-- Role', '</div>\n\n                <!-- Role')
careers_html = careers_html.replace('</a>\n\n            </div>', '</div>\n\n            </div>')
open('careers.html', 'w', encoding='utf-8').write(careers_html)
print('Done fixing HTML!')
