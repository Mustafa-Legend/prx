import { parse } from 'node-html-parser';

export class Rewriter {
  private proxyBasePath: string;

  constructor(proxyBasePath: string = '/api/proxy') {
    this.proxyBasePath = proxyBasePath;
  }

  makeProxyUrl(absoluteUrl: string): string {
    return `${this.proxyBasePath}?url=${encodeURIComponent(absoluteUrl)}`;
  }

  rewriteHtml(html: string, baseUrl: string): string {
    try {
      if (!html || typeof html !== 'string') return html;

      const root = parse(html);
      
      // Add or update base tag
      let baseTag = root.querySelector('base');
      if (!baseTag) {
        const head = root.querySelector('head');
        if (head) {
          head.insertAdjacentHTML('afterbegin', `<base href="${baseUrl}">`);
        }
      } else {
        baseTag.setAttribute('href', baseUrl);
      }

      // Rewrite attributes: href, src, action
      const attributes = ['href', 'src', 'action', 'data-src', 'poster'];
      attributes.forEach(attr => {
        const elements = root.querySelectorAll(`[${attr}]`);
        elements.forEach(element => {
          const value = element.getAttribute(attr);
          if (!value || 
              value.startsWith('javascript:') || 
              value.startsWith('#') || 
              value.startsWith('mailto:') ||
              value.startsWith('tel:')) return;
          
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
        if (!srcset) return;
        
        const newSrcset = srcset.split(',')
          .map(part => {
            const trimmed = part.trim();
            const parts = trimmed.split(/\s+/);
            if (parts.length === 0) return trimmed;
            
            const url = parts[0];
            const descriptors = parts.slice(1);
            const absoluteUrl = this.absolutizeUrl(url, baseUrl);
            
            return absoluteUrl 
              ? `${this.makeProxyUrl(absoluteUrl)} ${descriptors.join(' ')}`.trim()
              : trimmed;
          })
          .join(', ');
        
        element.setAttribute('srcset', newSrcset);
      });

      // Rewrite CSS URLs in style tags
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

      // Rewrite meta refresh URLs
      const metaRefresh = root.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        const content = metaRefresh.getAttribute('content');
        if (content) {
          const match = content.match(/url=(.+)$/i);
          if (match) {
            const refreshUrl = match[1];
            const absoluteUrl = this.absolutizeUrl(refreshUrl, baseUrl);
            if (absoluteUrl) {
              metaRefresh.setAttribute('content', content.replace(
                refreshUrl, 
                this.makeProxyUrl(absoluteUrl)
              ));
            }
          }
        }
      }

      return root.toString();
    } catch (error) {
      console.error('HTML rewriting error:', error);
      return html;
    }
  }

  adjustSetCookieHeader(headerValue: string): string {
    // Remove domain and secure flags
    return headerValue
      .replace(/;?\s*Domain=[^;]+/gi, '')
      .replace(/;?\s*Secure/gi, '')
      .replace(/;?\s*HttpOnly/gi, '');
  }

  absolutizeUrl(url: string, base: string): string | null {
    if (!url || !base) return null;
    
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('#')) return null;
    
    try {
      if (url.startsWith('//')) {
        const baseUrl = new URL(base);
        return `${baseUrl.protocol}${url}`;
      }
      
      return new URL(url, base).toString();
    } catch (error) {
      console.error('URL absolutization error:', error, url, base);
      return null;
    }
  }
}