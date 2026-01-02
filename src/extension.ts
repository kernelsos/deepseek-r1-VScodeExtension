import * as vscode from 'vscode';
import ollama from 'ollama';
import { getWebviewContent } from './webview';

export function activate(context: vscode.ExtensionContext) {
    console.log('llm-ex is now active!');

    const disposable = vscode.commands.registerCommand('llm-ex.start', () => {
        const panel = vscode.window.createWebviewPanel(
            'qwen2.5:7b',
            'Chat with Llama',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = getWebviewContent();

        panel.webview.onDidReceiveMessage(
            async (message) => {
                if (message.command === 'chat') {
                    const userPrompt = message.text;
                    let responseText = '';

                    try {
                        const streamResponse = await ollama.chat({
                            model: 'qwen2.5:7b',
                            messages: [{ role: 'user', content: userPrompt }],
                            stream: true
                        });

                        for await (const part of streamResponse) {
                            responseText += part.message?.content ?? '';
                            panel.webview.postMessage({
                                command: 'chatResponse',
                                text: responseText
                            });
                        }
                    } catch (err) {
                        panel.webview.postMessage({
                            command: 'chatResponse',
                            text: `Error: ${String(err)}`
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