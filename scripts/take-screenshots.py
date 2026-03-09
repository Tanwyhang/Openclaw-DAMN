from playwright.sync_api import sync_playwright
import time

def take_screenshots():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # 16:9 ratio for nice github display
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        
        # 1. Landing Page
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        time.sleep(2) # let video and blend modes settle
        page.screenshot(path='public/screenshot-landing.png')
        print("Captured landing page")
        
        # 2. Dashboard
        page.goto('http://localhost:3000/dashboard')
        page.wait_for_load_state('networkidle')
        time.sleep(2) # wait for sphere to generate and render
        page.screenshot(path='public/screenshot-dashboard.png')
        print("Captured dashboard")
        
        # 3. Knowledge Inspector Modal
        # Open via evaluate to bypass canvas click intercept
        page.evaluate('''
            () => {
                // Find a dot to simulate a click
                const canvas = document.querySelector('canvas');
                // Create a simulated dot click
                const rect = canvas.getBoundingClientRect();
                const clickEvent = new MouseEvent('pointerdown', {
                    clientX: rect.left + 200,
                    clientY: rect.top + 200,
                    bubbles: true
                });
                canvas.dispatchEvent(clickEvent);
                const upEvent = new MouseEvent('pointerup', {
                    clientX: rect.left + 200,
                    clientY: rect.top + 200,
                    bubbles: true
                });
                canvas.dispatchEvent(upEvent);
            }
        ''')
        time.sleep(2)
        
        # Click the Inspect button via DOM
        page.evaluate('''
            () => {
                const btns = Array.from(document.querySelectorAll('button'));
                const inspectBtn = btns.find(b => b.textContent.includes('Inspect'));
                if (inspectBtn) inspectBtn.click();
            }
        ''')
        
        time.sleep(1) # wait for modal
        page.screenshot(path='public/screenshot-inspector.png')
        print("Captured inspector modal")
            
        # 4. Terminal Page
        page.goto('http://localhost:3000/terminal')
        page.wait_for_load_state('networkidle')
        time.sleep(1)
        # Type a command to make it look active
        page.keyboard.type("list")
        page.keyboard.press("Enter")
        time.sleep(1)
        page.screenshot(path='public/screenshot-terminal.png')
        print("Captured terminal")
        
        browser.close()

if __name__ == "__main__":
    take_screenshots()