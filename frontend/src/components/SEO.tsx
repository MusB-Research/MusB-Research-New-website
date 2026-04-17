import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  ogType?: 'website' | 'article';
}

const SEO = ({ title, description, canonical, ogType = 'website' }: SEOProps) => {
  useEffect(() => {
    // 1. Set Title
    document.title = title;

    // 2. Set Meta Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // 3. Set Canonical Link
    const linkCanonical = canonical || window.location.href;
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute('href', linkCanonical);

    // 4. Set Open Graph Tags
    const setOG = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    setOG('og:title', title);
    setOG('og:description', description);
    setOG('og:type', ogType);
    setOG('og:url', linkCanonical);

  }, [title, description, canonical, ogType]);

  return null; // Side-effect component
};

export default SEO;
