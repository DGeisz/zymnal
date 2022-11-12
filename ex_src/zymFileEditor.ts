import * as vscode from "vscode";

export class ZymFileEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new ZymFileEditor(context);
    const providerRegistration = vscode.window.registerCustomEditorProvider(
      ZymFileEditor.viewType,
      provider
    );
    return providerRegistration;
  }

  private static readonly viewType = "zym.zymFileEditor";

  constructor(context: vscode.ExtensionContext) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): void | Thenable<void> {
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

    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() == document.uri.toString()) {
          updateWebView();
        }
      }
    );

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      /* Handle messages from the front */
    });

    webviewPanel.webview.onDidReceiveMessage((e) => {
      switch (e.type) {
        case "save": {
          this.updateTextDocument(document, e.document);
        }
      }
    });

    updateWebView();
  }

  private updateTextDocument(document: vscode.TextDocument, json: any) {
    const edit = new vscode.WorkspaceEdit();

    // Just replace the entire document every time for this example extension.
    // A more complete extension should compute minimal edits instead.
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      JSON.stringify(json)
    );

    return vscode.workspace.applyEdit(edit);
  }

  private getHtmlForWebview = (_webview: vscode.Webview): string => {
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
