import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Composant Lazy Loading pour les inventaires
 * Ne charge le contenu que lorsqu'il devient visible à l'écran
 */
export default function LazyInventaire({ children, placeholder, threshold = 0.1 }) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true);
            setHasLoaded(true);
            // Une fois chargé, on peut déconnecter l'observer
            observer.disconnect();
          }
        });
      },
      {
        threshold,
        rootMargin: '50px' // Commence à charger 50px avant que l'élément soit visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [hasLoaded, threshold]);

  return (
    <div ref={containerRef} className="min-h-[200px]">
      {isVisible ? (
        children
      ) : (
        placeholder || (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#00AEEF]" />
          </div>
        )
      )}
    </div>
  );
}