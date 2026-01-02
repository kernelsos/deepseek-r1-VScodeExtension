import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebviewContent } from './webview';

export function activate(context: vscode.ExtensionContext) {
    console.log('llm-ex is now active!');
    
    let abortController: AbortController | null = null;

    const disposable = vscode.commands.registerCommand('llm-ex.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'qwen2.5:7b',
            'Chat with Qwen',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'chat') {
                    const userPrompt = message.text;
                    let responseText = '';
                    
                
                    abortController = new AbortController();

                    try {
                        const streamResponse = await ollama.chat({
                            model: 'qwen2.5:7b',
                            messages: [{ role: 'user', content: userPrompt }],
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