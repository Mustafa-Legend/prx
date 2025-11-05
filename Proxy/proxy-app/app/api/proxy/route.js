import { NextResponse } from 'next/server';
import { config, getRandomUserAgent } from '../../../lib/config';
import { Rewriter } from '../../../lib/rewriter';
import { respondHttpError, parseProxyUrl } from '../../../lib/utils';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url2') || searchParams.get('url');

  if (!targetUrl) {
    return respondHttpError(400, 'Missing target');
  }

  try {
    const parsedUrl = new URL(targetUrl);
    const host = parsedUrl.host;

    // Check allowed hosts
    if (config.ALLOWED_HOSTS !== '*' && 
        Array.isArray(config.ALLOWED_HOSTS) && 
        !config.ALLOWED_HOSTS.includes(host)) {
      return respondHttpError(403, 'Host not allowed by proxy whitelist');
    }

    // Prepare fetch options
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
      },
      redirect: 'follow',
    };

    // Apply upstream proxy if configured
    if (config.UPSTREAM_PROXY) {
      // Note: Vercel serverless functions don't support SOCKS proxies natively
      // You might need a proxy service or different approach for SOCKS
      console.log('Upstream proxy configured but may not work in Vercel:', config.UPSTREAM_PROXY);
    }

    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      return respondHttpError(response.status, `Upstream error: ${response.statusText}`);
    }

    // Get response body and headers
    const body = await response.text();
    const headers = Object.fromEntries(response.headers);

    // Process headers
    const newHeaders = {};
    const rewriter = new Rewriter();

    for (const [key, value] of Object.entries(headers)) {
      const lowerKey = key.toLowerCase();

      if (config.STRIP_SECURITY_HEADERS && [
        'content-security-policy',
        'x-frame-options', 
        'x-content-type-options'
      ].includes(lowerKey)) {
        continue;
      }

      if (lowerKey === 'set-cookie') {
        const adjustedCookies = Array.isArray(value) 
          ? value.map(cookie => rewriter.adjustSetCookieHeader(cookie))
          : rewriter.adjustSetCookieHeader(value);
        newHeaders[key] = adjustedCookies;
      } else {
        newHeaders[key] = value;
      }
    }

    // Rewrite HTML content if needed
    let finalBody = body;
    const contentType = headers['content-type'] || '';

    if (contentType.includes('text/html')) {
      finalBody = rewriter.rewriteHtml(body, targetUrl);
    }

    return new Response(finalBody, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return respondHttpError(502, `Proxy error: ${error.message}`);
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}