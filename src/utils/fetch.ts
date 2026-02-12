import fetch from 'node-fetch';

/**
 * Fetch with timeout using AbortController pattern.
 * Properly cleans up the timer when fetch completes.
 */
export function fetchWithTimeout(url: string, options: any = {}, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs);
    fetch(url, options)
      .then(res => { clearTimeout(timer); resolve(res); })
      .catch(err => { clearTimeout(timer); reject(err); });
  });
}
