import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { createPageUrl } from '../utils';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log l'erreur (pourrait être envoyé à un service de monitoring)
    if (typeof window !== 'undefined') {
      const errorLog = {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      };
      
      console.error('Error details:', errorLog);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // Recharger la page si l'erreur persiste
    if (this.state.errorCount >= 3) {
      window.location.reload();
    }
  };

  handleGoHome = () => {
    sessionStorage.clear();
    window.location.href = createPageUrl('Home');
  };

  render() {
    if (this.state.hasError) {
      const lang = sessionStorage.getItem('user_language') || 'fr';
      
      return (
        <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-red-50 to-white">
          <Card className="max-w-lg w-full border-2 border-red-300 shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              
              <h1 className="font-heading text-2xl text-[#0077A8] mb-3">
                {lang === 'fr' ? '😔 Oups, une erreur est survenue' : '😔 Oops, an error occurred'}
              </h1>
              
              <p className="text-gray-600 mb-6">
                {lang === 'fr' 
                  ? "Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer ou revenir à l'accueil."
                  : "We're sorry, something went wrong. Please try again or go back to home."}
              </p>

              {this.state.errorCount >= 3 && (
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    {lang === 'fr'
                      ? "L'erreur persiste. La page va être rechargée automatiquement."
                      : "The error persists. The page will be reloaded automatically."}
                  </p>
                </div>
              )}

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-gray-100 rounded-lg text-xs">
                  <summary className="cursor-pointer font-bold text-red-600 mb-2">
                    Détails techniques (dev only)
                  </summary>
                  <pre className="overflow-auto text-gray-700">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  variant="outline"
                  className="flex-1 border-2 border-[#00AEEF] text-[#0077A8] rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Réessayer' : 'Retry'}
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-[#00AEEF] hover:bg-[#0077A8] rounded-xl"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {lang === 'fr' ? 'Retour accueil' : 'Go home'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;