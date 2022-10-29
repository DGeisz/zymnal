"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZymFileEditor = void 0;
const vscode = require("vscode");
class ZymFileEditor {
    constructor(context) {
        this.getHtmlForWebview = (_webview) => {
            const localUrl = "http://localhost:3000/vscode.js";
            // const onDiskPath = vscode.Uri.file(
            //   path.join(context.extensionPath, "katex", "katex.js")
            // );
            // // And get the special URI to use with the webview
            // const katexJs = panel.webview.asWebviewUri(
            //   vscode.Uri.file(path.join(context.extensionPath, "katex", "katex.js"))
            // );
            // const katexCss = panel.webview.asWebviewUri(
            //   vscode.Uri.file(path.join(context.extensionPath, "katex", "katex.js"))
            // );
            return `
		<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.css" integrity="sha384-bYdxxUwYipFNohQlHt0bjN/LCpueqWz13HufFEV1SUatKs1cm4L6fFgCi1jT643X" crossorigin="anonymous">

        <!-- The loading of KaTeX is deferred to speed up page rendering -->
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.js" integrity="sha384-Qsn9KnoKISj6dI8g7p1HBlNpVx0I8p1SvlwOldgi3IorMle61nQy4zEahWYtljaz" crossorigin="anonymous"></script>
			</head>
			<body>
				<div id="root"></div>
				<script src="${localUrl}" />
			</body>
		</html>
	`;
        };
    }
    static register(context) {
        const provider = new ZymFileEditor(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(ZymFileEditor.viewType, provider);
        return providerRegistration;
    }
    resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        const updateWebView = () => {
            webviewPanel.webview.postMessage({
                type: "update",
                text: document.getText(),
            });
        };
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument((e) => {
            if (e.document.uri.toString() == document.uri.toString()) {
                updateWebView();
            }
        });
        webviewPanel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
        webviewPanel.webview.onDidReceiveMessage((e) => {
            /* Handle messages from the front */
        });
        updateWebView();
    }
}
exports.ZymFileEditor = ZymFileEditor;
ZymFileEditor.viewType = "zym.zymFileEditor";
//# sourceMappingURL=zymFileEditor.js.map