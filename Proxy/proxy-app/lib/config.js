export const config = {
  ALLOWED_HOSTS: '*',
  
  UPSTREAM_PROXY: process.env.UPSTREAM_PROXY || 'socks5://gw.dataimpulse.com:824:59b29a23f8bc3ce6bb65__cr.au,us:93aa23f81ee1080e',
  
  MAX_REWRITE_BODY: 2 * 1024 * 1024,
  
  STRIP_SECURITY_HEADERS: true,
};

export function getRandomUserAgent() {
  const userAgents = [
    // Samsung Mobile User Agents
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/27.0 Chrome/125.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-M127G) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/29.0 Chrome/136.0.0.0 Mobile Safari/537.36',
    // ... (كل الـ User Agents من الملف الأصلي)
    'Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.13 (KHTML, like Gecko) Chrome/24.0.1290.1 Safari/537.13'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}