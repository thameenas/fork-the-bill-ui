import { useEffect } from 'react';

interface MetaTagConfig {
  title?: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogUrl?: string;
  ogImage?: string;
  ogType?: string;
}

export const useMetaTags = (config: MetaTagConfig) => {
  useEffect(() => {
    const originalTitle = document.title;
    const metaTags: HTMLMetaElement[] = [];

    // Set page title
    if (config.title) {
      document.title = config.title;
    }

    // Helper function to create or update meta tag
    const setMetaTag = (property: string, content: string, isProperty = true) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let metaTag = document.querySelector(selector) as HTMLMetaElement;
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (isProperty) {
          metaTag.setAttribute('property', property);
        } else {
          metaTag.setAttribute('name', property);
        }
        document.head.appendChild(metaTag);
        metaTags.push(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };

    // Set meta tags
    if (config.description) {
      setMetaTag('description', config.description, false);
    }

    if (config.ogTitle) {
      setMetaTag('og:title', config.ogTitle);
    }

    if (config.ogDescription) {
      setMetaTag('og:description', config.ogDescription);
    }

    if (config.ogUrl) {
      setMetaTag('og:url', config.ogUrl);
    }

    if (config.ogImage) {
      setMetaTag('og:image', config.ogImage);
    }

    if (config.ogType) {
      setMetaTag('og:type', config.ogType);
    }

    // Cleanup function
    return () => {
      document.title = originalTitle;
      // Note: We don't remove meta tags on cleanup as they might be needed for sharing
      // The tags will be updated when the hook is called again with new values
    };
  }, [config.title, config.description, config.ogTitle, config.ogDescription, config.ogUrl, config.ogImage, config.ogType]);
};
