import { describe, it, expect, beforeAll } from "vitest";
import { JSDOM } from "jsdom";
import {
    configureMarked,
    renderMarkdown,
    getContentForGzhCustomCss
} from "../src/main.js";

beforeAll(async() => {
    await configureMarked();
});

describe("Code block escaping tests", () => {
    it("should not double-escape special characters like < and > in code blocks", async () => {
        // Test with Vim configuration that contains < and >
        const markdown = '```vim\nnoremap <Up> <Nop>\nnoremap <Down> <Nop>\n```';
        const html = await renderMarkdown(markdown);
        
        // Create a DOM to process
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const wenyanElement = document.createElement('div');
        wenyanElement.id = 'wenyan';
        wenyanElement.innerHTML = html;
        
        // Apply the processing that causes the issue
        const customCss = 'body { margin: 0; }';
        const highlightCss = '';
        
        await getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, false, false);
        
        const codeElement = wenyanElement.querySelector('pre code');
        const innerHTML = codeElement.innerHTML;
        
        console.log('Code block innerHTML:', innerHTML);
        
        // Should not have multiple layers of escaping like &amp;amp;amp;...
        expect(innerHTML).not.toContain('&amp;amp;');
        // Should contain properly escaped entities
        expect(innerHTML).toContain('&lt;');
        expect(innerHTML).toContain('&gt;');
        // Should not have the original < > characters (they should be escaped)
        expect(innerHTML).not.toMatch(/<Up>/);
        expect(innerHTML).not.toMatch(/<Nop>/);
    });

    it("should preserve highlight.js span tags while fixing escaping", async () => {
        const markdown = '```javascript\nconst x = a < b && c > d;\n```';
        const html = await renderMarkdown(markdown);
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const wenyanElement = document.createElement('div');
        wenyanElement.id = 'wenyan';
        wenyanElement.innerHTML = html;
        
        const customCss = 'body { margin: 0; }';
        const highlightCss = '';
        
        await getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, false, false);
        
        const codeElement = wenyanElement.querySelector('pre code');
        const innerHTML = codeElement.innerHTML;
        
        console.log('JavaScript code innerHTML:', innerHTML);
        
        // Should still have highlight.js span tags
        expect(innerHTML).toContain('<span class="hljs-');
        // Should not have double-escaped entities
        expect(innerHTML).not.toContain('&amp;amp;');
        // Should have properly escaped < and >
        expect(innerHTML).toContain('&lt;');
        expect(innerHTML).toContain('&gt;');
    });

    it("should handle newlines and spaces correctly", async () => {
        const markdown = '```bash\necho "hello  world"\nls -la\n```';
        const html = await renderMarkdown(markdown);
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const wenyanElement = document.createElement('div');
        wenyanElement.id = 'wenyan';
        wenyanElement.innerHTML = html;
        
        const customCss = 'body { margin: 0; }';
        const highlightCss = '';
        
        await getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, false, false);
        
        const codeElement = wenyanElement.querySelector('pre code');
        const innerHTML = codeElement.innerHTML;
        
        console.log('Bash code innerHTML:', innerHTML);
        
        // Should have <br> tags for newlines
        expect(innerHTML).toContain('<br>');
        // Should have non-breaking spaces
        expect(innerHTML).toMatch(/\u00A0/);
        // Should not have double-escaped entities
        expect(innerHTML).not.toContain('&amp;amp;');
    });
});
