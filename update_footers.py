import os
import re

# Read the correct footer block with links
footer_str = """    <footer class="footer">
        <div class="container footer-content" style="text-align: center;">
            <div class="footer-logo" style="margin-bottom: 2rem;">
                <img src="logo.png" alt="Launch Lords" style="height: 60px; width: auto; filter: invert(1);">
            </div>
            
            <div class="footer-founders" style="margin-bottom: 1.5rem; color: var(--text-muted); font-size: 0.9rem;">
                <p style="margin-bottom: 0.25rem;"><strong>Founder & CEO:</strong> Shubhankar Bagchi</p>
                <p><strong>Co-founder:</strong> Kartikey Awasthi</p>
            </div>

            <div class="footer-socials" style="margin-bottom: 1.5rem; display: flex; justify-content: center; gap: 1.5rem;">
                <a href="https://x.com/launchlords" target="_blank" class="footer-link" aria-label="Twitter">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </a>
                <a href="https://www.instagram.com/launch_lords/" target="_blank" class="footer-link" aria-label="Instagram">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://www.linkedin.com/company/launchlords/" target="_blank" class="footer-link" aria-label="LinkedIn">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61587816046655&sk=about_details" target="_blank" class="footer-link" aria-label="Facebook">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
            </div>

            <p class="footer-bottom-text">
                &copy; <span id="year"></span> Launch Lords. All rights reserved. <span class="footer-dot">&bull;</span> <a href="privacy-policy.html" target="_blank" class="footer-link">Privacy Policy</a> <span class="footer-dot">&bull;</span> <a href="terms.html" target="_blank" class="footer-link">Terms of Service</a>
            </p>
        </div>
    </footer>"""

# Apply to all HTML files
for file in os.listdir('.'):
    if file.endswith('.html'):
        content = open(file, 'r', encoding='utf-8').read()
        
        # Regex to find footer and replace
        new_content = re.sub(r'<footer class="footer">.*?</footer>', footer_str, content, flags=re.DOTALL)
        open(file, 'w', encoding='utf-8').write(new_content)

print('Updated structure and footers')
