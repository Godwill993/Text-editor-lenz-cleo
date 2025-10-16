/*
    script.js
    Adds "bold" toggle functionality for a contenteditable editor.
    Requires in HTML:
        - an element with id="editor" and contenteditable="true"
        - a button with id="boldBtn" (optional)
*/

(function () {
    const editor = document.getElementById('editor');
    const boldBtn = document.getElementById('boldBtn');

    function isSelectionInsideEditor() {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) return false;
        let node = sel.anchorNode;
        while (node) {
            if (node === editor) return true;
            node = node.parentNode;
        }
        return false;
    }

    function toggleBold() {
        // Prefer the (widely supported) execCommand for contenteditable.
        // Fall back to manual wrapping when execCommand not available.
        if (!editor) return;
        editor.focus();

        if (typeof document.execCommand === 'function' && document.queryCommandSupported && document.queryCommandSupported('bold')) {
            document.execCommand('bold', false, null);
            updateButtonState();
            return;
        }

        // Fallback: wrap selection in <strong>
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !isSelectionInsideEditor()) return;

        const range = sel.getRangeAt(0);
        if (range.collapsed) return;

        try {
            const strong = document.createElement('strong');
            strong.appendChild(range.extractContents());
            range.insertNode(strong);

            // Move selection to the newly inserted strong node
            sel.removeAllRanges();
            const newRange = document.createRange();
            newRange.selectNodeContents(strong);
            sel.addRange(newRange);
        } catch (e) {
            // If surroundContents fails (e.g., partially selected nodes), try a simple execCommand as last resort
            try { document.execCommand('bold', false, null); } catch (err) { /* noop */ }
        }
        updateButtonState();
    }

    function updateButtonState() {
        if (!boldBtn) return;
        let pressed = false;
        try {
            pressed = !!document.queryCommandState && document.queryCommandState('bold');
        } catch (e) {
            // ignore
        }
        boldBtn.classList.toggle('active', pressed);
        boldBtn.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    }

    // Click handler for toolbar button
    if (boldBtn) {
        boldBtn.addEventListener('click', function (e) {
            e.preventDefault();
            toggleBold();
            editor && editor.focus();
        });
    }

    // Keyboard shortcut: Ctrl/Cmd + B
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === 'b') {
            // Only act when selection is inside editor (if editor exists)
            if (!editor || isSelectionInsideEditor()) {
                e.preventDefault();
                toggleBold();
            }
        }
    });

    // Update button state when selection changes or editor receives focus
    document.addEventListener('selectionchange', updateButtonState);
    if (editor) {
        editor.addEventListener('keyup', updateButtonState);
        editor.addEventListener('mouseup', updateButtonState);
    }

    // Initial state
    updateButtonState();

    // Export for debugging (optional)
    window.__editorBold = { toggleBold, updateButtonState };
})();