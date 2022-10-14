// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "react2" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json

  context.subscriptions.push(
    vscode.commands.registerCommand("react2.helloWorld", () => {
      const panel = vscode.window.createWebviewPanel(
        "reactOne",
        "Let's React!",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
        }
      );

      panel.webview.html = getWebviewContent();
    })
  );
}

const getWebviewContent = () => {
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

// This method is called when your extension is deactivated
export function deactivate() {}
