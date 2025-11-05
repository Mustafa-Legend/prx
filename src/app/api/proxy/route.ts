import { NextRequest } from 'next/server';
import { config, getRandomUserAgent } from '@/lib/config';
import { Rewriter } from '@/lib/rewriter';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url2') || searchParams.get('url');

    console.log('🔍 Request for URL:', targetUrl);

    if (!targetUrl) {
      return new Response('Missing target URL', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Validate URL
    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch (error) {
      return new Response('Invalid target URL', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const host = parsedUrl.host;

    // Check allowed hosts
    if (config.ALLOWED_HOSTS !== '*' && 
        Array.isArray(config.ALLOWED_HOSTS) && 
        !config.ALLOWED_HOSTS.includes(host)) {
      return new Response('Host not allowed by proxy whitelist', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Prepare fetch options
    const fetchOptions = {
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow' as RequestRedirect,
    };

    console.log('🌐 Fetching:', targetUrl);

    const response = await fetch(targetUrl, fetchOptions);
    
    if (!response.ok) {
      return new Response(`Upstream error: ${response.status} ${response.statusText}`, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Get response body and headers
    const contentType = response.headers.get('content-type') || '';
    let body;

    if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      body = await response.text();
    } else {
      body = await response.arrayBuffer();
    }

    // Process headers
    const newHeaders = new Headers();
    const rewriter = new Rewriter();

    // Copy all headers from original response
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();

      // Skip security headers if configured
      if (config.STRIP_SECURITY_HEADERS && [
        'content-security-policy',
        'x-frame-options', 
        'x-content-type-options'
      ].includes(lowerKey)) {
        return;
      }

      // Process cookies
      if (lowerKey === 'set-cookie') {
        const adjustedCookie = rewriter.adjustSetCookieHeader(value);
        newHeaders.append(key, adjustedCookie);
      } else {
        newHeaders.set(key, value);
      }
    });

    // Rewrite HTML content if needed
    let finalBody = body;
    if (contentType.includes('text/html') && typeof body === 'string') {
      console.log('📝 Rewriting HTML content...');
      finalBody = rewriter.rewriteHtml(body, targetUrl);
    }

    // Set CORS headers
    newHeaders.set('Access-Control-Allow-Origin', '*');
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    newHeaders.set('Access-Control-Allow-Headers', '*');

    console.log('✅ Response ready');

    return new Response(finalBody, {
      status: response.status,
      headers: newHeaders,
    });

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return new Response(`Proxy error: ${error.message}`, {
      status: 502,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
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