import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Gestionnaire d'erreurs réseau avec retry automatique
 */
export default function NetworkErrorHandler({ 
  error, 
  onRetry, 
  maxRetries = 3,
  retryCount = 0 
}) {
  const [isRetrying, setIsRetrying] = useState(false);
  const lang = sessionStorage.getItem('user_language') || 'fr';

  const isNetworkError = error?.message?.includes('network') || 
                         error?.message?.includes('fetch') ||
                         error?.code === 'ECONNABORTED';

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      await onRetry();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setIsRetrying(false);
    }
  };

  // Retry automatique pour les erreurs réseau (1 tentative max)
  useEffect(() => {
    if (isNetworkError && retryCount === 0) {
      const timer = setTimeout(() => {
        toast.info(lang === 'fr' 
          ? 'Nouvelle tentative automatique...' 
          : 'Automatic retry...');
        handleRetry();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isNetworkError, retryCount]);

  if (!error) return null;

  return (
    <Card className="border-2 border-red-300 bg-red-50 rounded-xl">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <WifiOff className="w-8 h-8 text-red-600" />
        </div>
        
        <h3 className="font-heading text-lg text-red-700 mb-2">
          {isNetworkError 
            ? (lang === 'fr' ? 'Problème de connexion' : 'Connection problem')
            : (lang === 'fr' ? 'Une erreur est survenue' : 'An error occurred')}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          {isNetworkError
            ? (lang === 'fr' 
                ? 'Vérifiez votre connexion internet et réessayez.'
                : 'Check your internet connection and try again.')
            : error.message}
        </p>

        {retryCount > 0 && retryCount < maxRetries && (
          <p className="text-xs text-gray-500 mb-4">
            {lang === 'fr' 
              ? `Tentative ${retryCount}/${maxRetries}`
              : `Attempt ${retryCount}/${maxRetries}`}
          </p>
        )}

        <Button
          onClick={handleRetry}
          disabled={isRetrying || retryCount >= maxRetries}
          className="bg-red-600 hover:bg-red-700 rounded-xl"
        >
          {isRetrying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {lang === 'fr' ? 'Nouvelle tentative...' : 'Retrying...'}
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              {lang === 'fr' ? 'Réessayer' : 'Retry'}
            </>
          )}
        </Button>

        {retryCount >= maxRetries && (
          <p className="text-xs text-red-600 mt-3">
            {lang === 'fr'
              ? 'Nombre maximal de tentatives atteint. Veuillez contacter le support.'
              : 'Maximum retry attempts reached. Please contact support.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}