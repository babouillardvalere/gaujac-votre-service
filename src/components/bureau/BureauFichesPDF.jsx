import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Search, Calendar } from 'lucide-react';

export default function BureauFichesPDF({ lang }) {
  const isFrench = lang === 'fr';
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-400" />
          {isFrench ? '📋 Fiches PDF' : '📋 PDF Forms'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="py-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-heading">
            {isFrench ? 'Module Réception temporairement désactivé' : 'Reception module temporarily disabled'}
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {isFrench ? 'En cours de reconstruction' : 'Under reconstruction'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}