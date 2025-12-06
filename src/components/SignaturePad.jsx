import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RotateCcw, Check } from 'lucide-react';

export default function SignaturePad({ onSave, disabled = false, lang = 'fr' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Redimensionner le canvas à sa taille d'affichage
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0077A8';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    setIsDrawing(true);
    setHasSignature(true);
    
    // Calcul précis des coordonnées avec le ratio canvas/affichage
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing || disabled) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    // Calcul précis des coordonnées avec le ratio canvas/affichage
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = ((e.touches ? e.touches[0].clientX : e.clientX) - rect.left) * scaleX;
    const y = ((e.touches ? e.touches[0].clientY : e.clientY) - rect.top) * scaleY;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <Card className="border-2 border-[#00AEEF]/30 rounded-xl">
      <CardContent className="p-6">
        <h3 className="font-heading text-xl text-[#0077A8] mb-4">
          ✒️ {lang === 'fr' ? 'Signature électronique' : 'Electronic signature'}
        </h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white mb-4 relative">
          <canvas
            ref={canvasRef}
            className="w-full touch-none"
            style={{ height: '200px', cursor: 'crosshair' }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm font-body">
                {lang === 'fr' ? '✍️ Signez ici' : '✍️ Sign here'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={clearSignature}
            variant="outline"
            className="flex-1 border-2 border-gray-300"
            disabled={!hasSignature || disabled}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {lang === 'fr' ? 'Effacer' : 'Clear'}
          </Button>
          <Button
            onClick={saveSignature}
            className="flex-1 bg-[#22c55e] hover:bg-[#16a34a] text-white"
            disabled={!hasSignature || disabled}
          >
            <Check className="w-4 h-4 mr-2" />
            {lang === 'fr' ? 'Valider' : 'Confirm'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}