import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebviewContent } from './webview';

interface ContextFile {
    path: string;
    content: string;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('llm-ex is now active!');
    
    let abortController: AbortController | null = null;

    const disposable = vscode.commands.registerCommand('llm-ex.start', async () => {
        const panel = vscode.window.createWebviewPanel(
            'llmChat',
            'Chat with LLM',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'getModels') {
                    // Fetch available models from Ollama
                    try {
                        const modelsList = await ollama.list();
                        panel.webview.postMessage({
                            command: 'modelsList',
                            models: modelsList.models
                        });
                    } catch (err) {
                        vscode.window.showErrorMessage('Failed to fetch models: ' + String(err));
                        panel.webview.postMessage({
                            command: 'modelsList',
                            models: []
                        });
                    }
                } else if (message.command === 'addCurrentFile') {
                    // Add current active file to context
                    const editor = vscode.window.activeTextEditor;
                    if (editor) {
                        const document = editor.document;
                        const selection = editor.selection;
                        
                        let content: string;
                        let path: string;
                        
                        if (!selection.isEmpty) {
                            // If text is selected, only include selected text
                            content = document.getText(selection);
                            path = `${document.fileName} (selected)`;
                        } else {
                            // Include entire file
                            content = document.getText();
                            path = document.fileName;
                        }
                        
                        panel.webview.postMessage({
                            command: 'filesAdded',
                            files: [{ path, content }]
                        });
                    } else {
                        vscode.window.showWarningMessage('No active file open!');
                    }
                } else if (message.command === 'addMultipleFiles') {
                    // Open file picker to select multiple files
                    const fileUris = await vscode.window.showOpenDialog({
                        canSelectMany: true,
                        canSelectFiles: true,
                        canSelectFolders: false,
                        openLabel: 'Add to Context'
                    });
                    
                    if (fileUris && fileUris.length > 0) {
                        const files: ContextFile[] = [];
                        
                        for (const uri of fileUris) {
                            try {
                                const document = await vscode.workspace.openTextDocument(uri);
                                files.push({
                                    path: uri.fsPath,
                                    content: document.getText()
                                });
                            } catch (err) {
                                vscode.window.showErrorMessage(`Failed to read file ${uri.fsPath}: ${err}`);
                            }
                        }
                        
                        if (files.length > 0) {
                            panel.webview.postMessage({
                                command: 'filesAdded',
                                files
                            });
                        }
                    }
                } else if (message.command === 'chat') {
                    const userPrompt = message.text;
                    const selectedModel = message.model;
                    const contextFiles: ContextFile[] = message.contextFiles || [];
                    let responseText = '';
                    
                    // Build the full prompt with context
                    let fullPrompt = '';
                    
                    if (contextFiles.length > 0) {
                        fullPrompt += 'Here are the files for context:\n\n';
                        contextFiles.forEach((file, index) => {
                            fullPrompt += `--- File ${index + 1}: ${file.path} ---\n`;
                            fullPrompt += `${file.content}\n\n`;
                        });
                        fullPrompt += '--- End of context files ---\n\n';
                    }
                    
                    fullPrompt += `User question: ${userPrompt}`;
                    
                    // Create new abort controller for this request
                    abortController = new AbortController();

                    try {
                        const streamResponse = await ollama.chat({
                            model: selectedModel,
                            messages: [{ role: 'user', content: fullPrompt }],
                            stream: true
                        });

                        for await (const part of streamResponse) {
                            // Check if aborted
                            if (abortController.signal.aborted) {
                                break;
                            }

                            responseText += part.message?.content ?? '';
                            panel.webview.postMessage({
                                command: 'chatResponse',
                                text: responseText
                            });
                        }

                        // Notify completion
                        panel.webview.postMessage({
                            command: 'chatComplete'
                        });

                    } catch (err) {
                        panel.webview.postMessage({
                            command: 'chatError',
                            text: String(err)
                        });
                    } finally {
                        abortController = null;
                    }
                } else if (message.command === 'stop') {
                    // Abort the current generation
                    if (abortController) {
                        abortController.abort();
                        panel.webview.postMessage({
                            command: 'chatComplete'
                        });
                    }
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}