import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin } from 'lucide-react';

export default function SelecteurHebergement({ onSelect, lang = 'fr' }) {
  const [type, setType] = useState('');
  const [categorie, setCategorie] = useState('');
  const [numero, setNumero] = useState('');

  const categoriesEmplacement = [
    { value: 'Emplacement 6A', label: '6A' },
    { value: 'Emplacement 10A', label: '10A' },
    { value: 'Emplacement Eau+10A', label: 'Eau + 10A' }
  ];

  const categoriesMobilhome = [
    { value: 'Chalet Eco', label: 'Chalet Éco 1 ch' },
    { value: 'Chalet Classique', label: 'Chalet Classique 1 ch' },
    { value: 'Mobil-home Eco', label: 'MH Éco' },
    { value: 'Mobil-home Eco Clim', label: 'MH Éco Clim' },
    { value: 'Mobil-home Classique', label: 'MH Classique' },
    { value: 'Mobil-home Classique Clim', label: 'MH Classique Clim' },
    { value: 'Mobil-home Classique 3ch', label: 'MH Classique 3 ch' },
    { value: 'Confort+ 2ch', label: 'MH Confort+ 2 ch' },
    { value: 'Confort+ 3ch', label: 'MH Confort+ 3 ch' },
    { value: 'Premium 2ch', label: 'MH Premium 2 ch' },
    { value: 'Premium 3ch', label: 'MH Premium 3 ch' },
    { value: 'Premium Twins', label: 'MH Premium Twins' },
    { value: 'Cottage Premium', label: 'Cottage Premium' }
  ];

  const handleTypeChange = (value) => {
    setType(value);
    setCategorie('');
    setNumero('');
    onSelect(null);
  };

  const handleCategorieChange = (value) => {
    setCategorie(value);
    setNumero('');
    onSelect(null);
  };

  const handleNumeroChange = (value) => {
    setNumero(value);
    onSelect({
      type,
      categorie,
      numero: value
    });
  };

  return (
    <Card className="border-2 border-[#00AEEF]">
      <CardContent className="p-6 space-y-4">
        <div>
          <label className="font-heading text-gray-700 mb-2 block">
            {lang === 'fr' ? 'Type d\'hébergement' : 'Accommodation type'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant={type === 'Emplacement' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('Emplacement')}
              className="h-20 flex flex-col gap-2"
            >
              <MapPin className="w-6 h-6" />
              <span>{lang === 'fr' ? 'Emplacement' : 'Pitch'}</span>
            </Button>
            <Button
              type="button"
              variant={type === 'Mobilhome' ? 'default' : 'outline'}
              onClick={() => handleTypeChange('Mobilhome')}
              className="h-20 flex flex-col gap-2"
            >
              <Home className="w-6 h-6" />
              <span>{lang === 'fr' ? 'Mobil-home' : 'Mobile home'}</span>
            </Button>
          </div>
        </div>

        {type && (
          <div>
            <label className="font-heading text-gray-700 mb-2 block">
              {lang === 'fr' ? 'Catégorie' : 'Category'}
            </label>
            <Select value={categorie} onValueChange={handleCategorieChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={lang === 'fr' ? 'Sélectionner...' : 'Select...'} />
              </SelectTrigger>
              <SelectContent>
                {(type === 'Emplacement' ? categoriesEmplacement : categoriesMobilhome).map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {categorie && (
          <div>
            <label className="font-heading text-gray-700 mb-2 block">
              {lang === 'fr' ? 'Numéro' : 'Number'}
            </label>
            <Select value={numero} onValueChange={handleNumeroChange}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder={lang === 'fr' ? 'Choisir un numéro...' : 'Choose a number...'} />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 50 }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>
                    {type === 'Emplacement' ? `E${n}` : `MH${n}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {numero && (
          <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
            <p className="font-heading text-green-700 text-center">
              ✓ {type === 'Emplacement' ? `E${numero}` : `MH${numero}`} - {categorie}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}