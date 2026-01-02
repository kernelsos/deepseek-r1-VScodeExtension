export function getWebviewContent(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        h2 {
            color: var(--vscode-foreground);
            margin-bottom: 20px;
            font-size: 1.5em;
            font-weight: 600;
        }

        #chatContainer {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
        }

        #response {
            white-space: pre-wrap;
            line-height: 1.6;
            color: var(--vscode-foreground);
        }

        #inputContainer {
            display: flex;
            gap: 10px;
            padding: 15px;
            background-color: var(--vscode-input-background);
            border: 1px solid var(--vscode-input-border);
            border-radius: 6px;
        }

        #prompt {
            flex: 1;
            padding: 10px 15px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            resize: vertical;
            min-height: 60px;
            outline: none;
        }

        #prompt:focus {
            border-color: var(--vscode-focusBorder);
            outline: 1px solid var(--vscode-focusBorder);
        }

        #prompt::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        #askBtn {
            padding: 10px 24px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: 500;
            transition: background-color 0.2s;
            align-self: flex-end;
        }

        #askBtn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        #askBtn:active {
            transform: scale(0.98);
        }

        #askBtn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        /* Scrollbar styling */
        #chatContainer::-webkit-scrollbar {
            width: 10px;
        }

        #chatContainer::-webkit-scrollbar-track {
            background: var(--vscode-editor-background);
        }

        #chatContainer::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 5px;
        }

        #chatContainer::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
    </style>
</head>
<body>
    <h2> Chat with LLM</h2>
    
    <div id="chatContainer">
        <div id="response">Start a conversation by typing your question below...</div>
    </div>
    
    <div id="inputContainer">
        <textarea id="prompt" rows="3" placeholder="Ask something..."></textarea>
        <button id="askBtn">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const askBtn = document.getElementById('askBtn');
        const promptInput = document.getElementById('prompt');

        askBtn.addEventListener('click', sendMessage);
        
        // Send message on Ctrl/Cmd + Enter
        promptInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                sendMessage();
            }
        });

        function sendMessage() {
            const text = promptInput.value.trim();
            if (!text) return;
            
            vscode.postMessage({ command: 'chat', text });
            promptInput.value = '';
            askBtn.disabled = true;
            askBtn.textContent = 'Thinking...';
        }

        window.addEventListener('message', event => {
            const { command, text } = event.data;
            if (command === 'chatResponse') {
                document.getElementById('response').innerText = text;
                askBtn.disabled = false;
                askBtn.textContent = 'Send';
            }
        });
    </script>
</body>
</html>
`;
}