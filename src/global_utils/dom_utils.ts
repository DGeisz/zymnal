export function removeAllChildren(node: HTMLElement) {
  while (node.lastChild) {
    node.removeChild(node.lastChild);
  }
}
