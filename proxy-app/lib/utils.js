export function respondHttpError(response, code, message) {
  return new Response(message, {
    status: code,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function parseProxyUrl(proxyUrl) {
  try {
    const parsed = new URL(proxyUrl);
    const protocol = parsed.protocol.replace(':', '');
    const host = parsed.host;
    const port = parsed.port || (protocol === 'socks5' ? 1080 : 80);
    const auth = parsed.username || parsed.password 
      ? {
          username: decodeURIComponent(parsed.username),
          password: decodeURIComponent(parsed.password),
        }
      : null;

    return { protocol, host, port, auth };
  } catch (error) {
    return null;
  }
}