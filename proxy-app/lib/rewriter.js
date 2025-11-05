import { parse } from 'node-html-parser';

export class Rewriter {
  constructor(proxyBasePath = '/api/proxy') {
    this.proxyBasePath = proxyBasePath;
  }

  makeProxyUrl(absoluteUrl) {
    return `${this.proxyBasePath}?url=${encodeURIComponent(absoluteUrl)}`;
  }

  rewriteHtml(html, baseUrl) {
    try {
      const root = parse(html);
      
      // Rewrite attributes
      const attributes = ['href', 'src', 'action'];
      attributes.forEach(attr => {
        const elements = root.querySelectorAll(`[${attr}]`);
        elements.forEach(element => {
          const value = element.getAttribute(attr);
          if (!value || value.startsWith('javascript:') || value.startsWith('#')) return;
          
          const absoluteUrl = this.absolutizeUrl(value, baseUrl);
          if (absoluteUrl) {
            element.setAttribute(attr, this.makeProxyUrl(absoluteUrl));
          }
        });
      });

      // Rewrite srcset
      const srcsetElements = root.querySelectorAll('[srcset]');
      srcsetElements.forEach(element => {
        const srcset = element.getAttribute('srcset');
        const newSrcset = srcset.split(',')
          .map(part => {
            const [url, ...descriptors] = part.trim().split(/\s+/);
            const absoluteUrl = this.absolutizeUrl(url, baseUrl);
            return absoluteUrl 
              ? `${this.makeProxyUrl(absoluteUrl)} ${descriptors.join(' ')}`.trim()
              : part;
          })
          .join(', ');
        element.setAttribute('srcset', newSrcset);
      });

      // Rewrite CSS URLs
      const styleElements = root.querySelectorAll('style');
      styleElements.forEach(style => {
        let cssContent = style.innerHTML;
        cssContent = cssContent.replace(/url\(([^)]+)\)/gi, (match, url) => {
          const cleanUrl = url.replace(/['"]/g, '').trim();
          const absoluteUrl = this.absolutizeUrl(cleanUrl, baseUrl);
          return absoluteUrl 
            ? `url("${this.makeProxyUrl(absoluteUrl)}")`
            : match;
        });
        style.set_content(cssContent);
      });

      return root.toString();
    } catch (error) {
      console.error('HTML rewriting error:', error);
      return html;
    }
  }

  adjustSetCookieHeader(headerValue) {
    return headerValue.replace(/;?\s*Domain=[^;]+/gi, '');
  }

  absolutizeUrl(url, base) {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('data:')) return null;
    
    try {
      if (url.startsWith('//')) {
        const baseUrl = new URL(base);
        return `${baseUrl.protocol}${url}`;
      }
      
      if (url.startsWith('/')) {
        const baseUrl = new URL(base);
        return `${baseUrl.origin}${url}`;
      }
      
      return new URL(url, base).toString();
    } catch (error) {
      console.error('URL absolutization error:', error);
      return null;
    }
  }
}