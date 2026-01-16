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

describe("Double-escaping prevention tests", () => {
    it("should not double-escape when processing multiple times", async () => {
        const markdown = '```vim\nnoremap <Up> <Nop>\n```';
        const html = await renderMarkdown(markdown);
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const wenyanElement = document.createElement('div');
        wenyanElement.id = 'wenyan';
        wenyanElement.innerHTML = html;
        
        const customCss = 'body { margin: 0; }';
        const highlightCss = '';
        
        // Process once
        await getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, false, false);
        
        const firstPass = wenyanElement.querySelector('pre code').innerHTML;
        console.log('First pass innerHTML:', firstPass);
        
        // Simulate reading and writing outerHTML (which happens in real usage)
        const serialized = wenyanElement.outerHTML;
        console.log('Serialized outerHTML sample:', serialized.substring(0, 300));
        
        // Parse it again
        const dom2 = new JSDOM(serialized);
        const document2 = dom2.window.document;
        const wenyanElement2 = document2.body.firstChild;
        
        const secondPass = wenyanElement2.querySelector('pre code').innerHTML;
        console.log('Second pass innerHTML:', secondPass);
        
        // Should be the same - no additional escaping
        expect(secondPass).toBe(firstPass);
        
        // Should not have double-escaped entities
        expect(secondPass).not.toContain('&amp;amp;');
        expect(secondPass).not.toContain('&amp;lt;');
        expect(secondPass).not.toContain('&amp;gt;');
        
        // Should still have the properly escaped entities
        expect(secondPass).toContain('&lt;Up&gt;');
        expect(secondPass).toContain('&lt;Nop&gt;');
    });

    it("should handle ampersands correctly without double-escaping", async () => {
        const markdown = '```javascript\nconst x = a && b;\n```';
        const html = await renderMarkdown(markdown);
        
        const dom = new JSDOM(html);
        const document = dom.window.document;
        const wenyanElement = document.createElement('div');
        wenyanElement.id = 'wenyan';
        wenyanElement.innerHTML = html;
        
        const customCss = 'body { margin: 0; }';
        const highlightCss = '';
        
        await getContentForGzhCustomCss(wenyanElement, customCss, highlightCss, false, false);
        
        const innerHTML = wenyanElement.querySelector('pre code').innerHTML;
        console.log('Ampersand test innerHTML:', innerHTML);
        
        // Should have &amp; for the && operator
        expect(innerHTML).toContain('&amp;&amp;');
        // Should not have triple-escaped ampersands
        expect(innerHTML).not.toContain('&amp;amp;amp;');
        
        // Serialize and parse again
        const serialized = wenyanElement.outerHTML;
        const dom2 = new JSDOM(serialized);
        const wenyanElement2 = dom2.window.document.body.firstChild;
        const secondPass = wenyanElement2.querySelector('pre code').innerHTML;
        
        console.log('Ampersand test second pass:', secondPass);
        
        // Should still be the same
        expect(secondPass).toBe(innerHTML);
        expect(secondPass).not.toContain('&amp;amp;amp;');
    });
});
