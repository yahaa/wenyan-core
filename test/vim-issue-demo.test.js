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

describe("Issue demonstration: Vim config escaping", () => {
    it("should correctly render Vim configuration without garbled output", async () => {
        // The exact example from the issue
        const markdown = '```vim\nnoremap <Up> <Nop>\nnoremap <Down> <Nop>\n```';
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
        
        console.log('\n=== ISSUE DEMONSTRATION ===');
        console.log('Expected result:');
        console.log('  noremap <Up> <Nop>');
        console.log('  noremap <Down> <Nop>');
        console.log('\nActual innerHTML (with proper escaping):');
        console.log(' ', innerHTML);
        console.log('\nActual text content:');
        console.log(' ', codeElement.textContent);
        console.log('===========================\n');
        
        // Verify the fix: should NOT have the garbled output from the issue
        // The issue showed: &amp;amp;amp;amp;amp;amp;amp;amp;lt;Up&amp;amp;amp;amp;amp;amp;amp;gt;
        expect(innerHTML).not.toContain('&amp;amp;amp;amp;');
        expect(innerHTML).not.toContain('&amp;amp;amp;');
        expect(innerHTML).not.toContain('&amp;lt;');
        expect(innerHTML).not.toContain('&amp;gt;');
        
        // Should have properly escaped entities (only once)
        expect(innerHTML).toContain('&lt;Up&gt;');
        expect(innerHTML).toContain('&lt;Nop&gt;');
        expect(innerHTML).toContain('&lt;Down&gt;');
        
        // The text content should be readable
        expect(codeElement.textContent).toContain('<Up>');
        expect(codeElement.textContent).toContain('<Nop>');
        expect(codeElement.textContent).toContain('<Down>');
        expect(codeElement.textContent).toContain('noremap');
    });

    it("should handle complex Vim mappings with multiple special characters", async () => {
        const markdown = `\`\`\`vim
nnoremap <Left> <Nop>
nnoremap <Right> <Nop>
nnoremap <C-h> <C-w>h
inoremap <C-j> <Esc>
\`\`\``;
        
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
        
        console.log('\nComplex Vim mappings innerHTML:', innerHTML);
        console.log('Text content:', codeElement.textContent);
        
        // Should not have any double-escaped entities
        expect(innerHTML).not.toContain('&amp;amp;');
        expect(innerHTML).not.toContain('&amp;lt;');
        
        // Should have all the mappings correctly escaped
        expect(innerHTML).toContain('&lt;Left&gt;');
        expect(innerHTML).toContain('&lt;Right&gt;');
        expect(innerHTML).toContain('&lt;C-h&gt;');
        expect(innerHTML).toContain('&lt;C-w&gt;');
        expect(innerHTML).toContain('&lt;C-j&gt;');
        expect(innerHTML).toContain('&lt;Esc&gt;');
    });
});
