export function execute(code: string, target: HTMLElement): void {
  eval(code);
  const run = new Function(code);
  run();
  setTimeout('globalThis.compromised = true', 1);
  target.innerHTML = code;
  target.insertAdjacentHTML('beforeend', code);
  target.setAttribute('onclick', code);
  document.createElement('script');
}

export async function load(name: string): Promise<unknown> {
  return import(name);
}
