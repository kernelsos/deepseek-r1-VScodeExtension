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

        .header {
            margin-bottom: 20px;
        }

        h2 {
            color: var(--vscode-foreground);
            font-size: 1.5em;
            font-weight: 600;
            margin-bottom: 10px;
        }

        .model-selector-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
        }

        .model-selector-container label {
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }

        #modelSelect {
            padding: 6px 12px;
            background-color: var(--vscode-dropdown-background);
            color: var(--vscode-dropdown-foreground);
            border: 1px solid var(--vscode-dropdown-border);
            border-radius: 5px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            cursor: pointer;
            outline: none;
            min-width: 200px;
        }

        #modelSelect:focus {
            border-color: var(--vscode-focusBorder);
        }

        #modelSelect:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        #chatContainer {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }

        .message {
            display: flex;
            flex-direction: column;
            max-width: 80%;
            animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .user-message {
            align-self: flex-end;
        }

        .assistant-message {
            align-self: flex-start;
        }

        .message-header {
            font-size: 0.85em;
            margin-bottom: 5px;
            opacity: 0.8;
            font-weight: 600;
        }

        .user-message .message-header {
            text-align: right;
            color: var(--vscode-textLink-foreground);
        }

        .assistant-message .message-header {
            color: var(--vscode-textPreformat-foreground);
        }

        .message-content {
            padding: 12px 16px;
            border-radius: 8px;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .user-message .message-content {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-bottom-right-radius: 4px;
        }

        .assistant-message .message-content {
            background-color: var(--vscode-input-background);
            color: var(--vscode-foreground);
            border: 1px solid var(--vscode-panel-border);
            border-bottom-left-radius: 4px;
        }

        .empty-state {
            text-align: center;
            color: var(--vscode-descriptionForeground);
            padding: 40px 20px;
            font-size: 0.95em;
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
            padding: 12px 15px;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            resize: none;
            min-height: 44px;
            max-height: 200px;
            outline: none;
            overflow-y: auto;
        }

        #prompt:focus {
            border-color: var(--vscode-focusBorder);
            outline: 1px solid var(--vscode-focusBorder);
        }

        #prompt::placeholder {
            color: var(--vscode-input-placeholderForeground);
        }

        #actionBtn {
            padding: 12px 24px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            font-weight: 500;
            transition: all 0.2s;
            align-self: flex-end;
            min-width: 80px;
        }

        #actionBtn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }

        #actionBtn:active {
            transform: scale(0.98);
        }

        #actionBtn.stop-btn {
            background-color: var(--vscode-errorForeground);
        }

        #actionBtn.stop-btn:hover {
            background-color: var(--vscode-errorForeground);
            opacity: 0.9;
        }

        /* Scrollbar styling */
        #chatContainer::-webkit-scrollbar,
        #prompt::-webkit-scrollbar {
            width: 8px;
        }

        #chatContainer::-webkit-scrollbar-track,
        #prompt::-webkit-scrollbar-track {
            background: var(--vscode-editor-background);
        }

        #chatContainer::-webkit-scrollbar-thumb,
        #prompt::-webkit-scrollbar-thumb {
            background: var(--vscode-scrollbarSlider-background);
            border-radius: 4px;
        }

        #chatContainer::-webkit-scrollbar-thumb:hover,
        #prompt::-webkit-scrollbar-thumb:hover {
            background: var(--vscode-scrollbarSlider-hoverBackground);
        }
    </style>
</head>
<body>
    <div class="header">
        <h2>🤖 Chat with LLM</h2>
        <div class="model-selector-container">
            <label for="modelSelect">Model:</label>
            <select id="modelSelect">
                <option value="">Loading models...</option>
            </select>
        </div>
    </div>
    
    <div id="chatContainer">
        <div class="empty-state">Select a model and start a conversation...</div>
    </div>
    
    <div id="inputContainer">
        <textarea id="prompt" rows="1" placeholder="Ask something... (Press Enter to send)"></textarea>
        <button id="actionBtn">Send</button>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const actionBtn = document.getElementById('actionBtn');
        const promptInput = document.getElementById('prompt');
        const chatContainer = document.getElementById('chatContainer');
        const modelSelect = document.getElementById('modelSelect');
        
        let isGenerating = false;
        let currentAssistantMessage = null;

        // Request available models on load
        vscode.postMessage({ command: 'getModels' });

        // Auto-resize textarea
        promptInput.addEventListener('input', () => {
            promptInput.style.height = 'auto';
            promptInput.style.height = Math.min(promptInput.scrollHeight, 200) + 'px';
        });

        // Send message on Enter (without Shift)
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (isGenerating) {
                    stopGeneration();
                } else {
                    sendMessage();
                }
            }
        });

        actionBtn.addEventListener('click', () => {
            if (isGenerating) {
                stopGeneration();
            } else {
                sendMessage();
            }
        });

        function sendMessage() {
            const text = promptInput.value.trim();
            const selectedModel = modelSelect.value;
            
            if (!text) return;
            if (!selectedModel) {
                alert('Please select a model first!');
                return;
            }
            
            // Remove empty state if exists
            const emptyState = chatContainer.querySelector('.empty-state');
            if (emptyState) {
                emptyState.remove();
            }

            // Add user message
            addMessage('user', text);
            
            // Send to extension
            vscode.postMessage({ 
                command: 'chat', 
                text: text,
                model: selectedModel
            });
            
            // Clear input and reset height
            promptInput.value = '';
            promptInput.style.height = 'auto';
            
            // Update UI state
            isGenerating = true;
            actionBtn.textContent = 'Stop';
            actionBtn.classList.add('stop-btn');
            promptInput.disabled = true;
            modelSelect.disabled = true;

            // Create assistant message placeholder
            currentAssistantMessage = addMessage('assistant', '');
            scrollToBottom();
        }

        function stopGeneration() {
            vscode.postMessage({ command: 'stop' });
            resetUI();
        }

        function resetUI() {
            isGenerating = false;
            actionBtn.textContent = 'Send';
            actionBtn.classList.remove('stop-btn');
            promptInput.disabled = false;
            modelSelect.disabled = false;
            promptInput.focus();
            currentAssistantMessage = null;
        }

        function addMessage(role, content) {
            const messageDiv = document.createElement('div');
            messageDiv.className = \`message \${role}-message\`;
            
            const header = document.createElement('div');
            header.className = 'message-header';
            header.textContent = role === 'user' ? 'You' : modelSelect.options[modelSelect.selectedIndex].text;
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = content;
            
            messageDiv.appendChild(header);
            messageDiv.appendChild(contentDiv);
            chatContainer.appendChild(messageDiv);
            
            scrollToBottom();
            return contentDiv;
        }

        function scrollToBottom() {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        window.addEventListener('message', event => {
            const { command, text, models } = event.data;
            
            if (command === 'modelsList') {
                modelSelect.innerHTML = '';
                
                if (models && models.length > 0) {
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = model.name;
                        modelSelect.appendChild(option);
                    });
                } else {
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No models found';
                    modelSelect.appendChild(option);
                }
            } else if (command === 'chatResponse') {
                if (currentAssistantMessage) {
                    currentAssistantMessage.textContent = text;
                    scrollToBottom();
                }
            } else if (command === 'chatComplete') {
                resetUI();
            } else if (command === 'chatError') {
                if (currentAssistantMessage) {
                    currentAssistantMessage.textContent = \`Error: \${text}\`;
                    currentAssistantMessage.style.color = 'var(--vscode-errorForeground)';
                }
                resetUI();
            }
        });
    </script>
</body>
</html>
`;
}