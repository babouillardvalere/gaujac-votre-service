import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Camera, Upload } from 'lucide-react';
import { interventionCategories, interventionRules, interventionMessages, getCategoryOptions, isPhotoRequired, isUrgent } from './interventionCategories';
import { motion, AnimatePresence } from 'framer-motion';

export default function InterventionFormUnified({ lang = 'fr', onSubmit, context = 'sejour' }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const isFrench = lang === 'fr';
  const messages = interventionMessages[lang];
  const rules = interventionRules[lang];

  const handleCategoryClick = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setSelectedOptions([]);
  };

  const handleSubcategoryClick = (subcatId) => {
    setSelectedSubcategory(subcatId);
    setSelectedOptions([]);
  };

  const toggleOption = (optionId) => {
    setSelectedOptions(prev => 
      prev.includes(optionId) 
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const photoIsRequired = selectedOptions.some(optId => 
    isPhotoRequired(selectedCategory, optId)
  );

  const isUrgentIntervention = selectedOptions.some(optId => 
    isUrgent(selectedCategory, optId)
  );

  const category = selectedCategory ? interventionCategories[selectedCategory] : null;
  const depositWarning = category?.depositWarning;

  const canSubmit = selectedCategory && selectedOptions.length > 0 && description.length >= 10 && (!photoIsRequired || photo);

  const handleSubmit = () => {
    if (!canSubmit) return;
    
    onSubmit({
      category: selectedCategory,
      subcategory: selectedSubcategory,
      options: selectedOptions,
      description,
      photo,
      urgent: isUrgentIntervention
    });
  };

  return (
    <div className="space-y-4">
      {/* Sélection catégorie principale */}
      <Card className="border-2 border-[#00AEEF] rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#0077A8]">
            {isFrench ? '🔍 Choisir la catégorie' : '🔍 Choose category'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(interventionCategories).map(([key, cat]) => (
              <button
                key={key}
                onClick={() => handleCategoryClick(key)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedCategory === key
                    ? 'border-[#00AEEF] bg-[#e6f7ff] scale-105'
                    : 'border-gray-200 hover:border-[#00AEEF] hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">{cat.icon}</div>
                <p className="text-sm font-heading text-gray-700">
                  {isFrench ? cat.labelFr : cat.labelEn}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sous-catégories (si applicable) */}
      <AnimatePresence>
        {selectedCategory && category?.subcategories && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="border-2 border-purple-500 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-purple-700">
                  {isFrench ? '📂 Préciser le type' : '📂 Specify type'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(category.subcategories).map(([key, subcat]) => (
                    <button
                      key={key}
                      onClick={() => handleSubcategoryClick(key)}
                      className={`p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                        selectedSubcategory === key
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-2xl">{subcat.icon}</span>
                      <span className="font-heading text-gray-700">
                        {isFrench ? subcat.labelFr : subcat.labelEn}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options détaillées */}
      <AnimatePresence>
        {selectedCategory && (selectedSubcategory || !category?.subcategories) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="border-2 border-green-500 rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-700">
                  {isFrench ? '✅ Sélectionner le(s) problème(s)' : '✅ Select issue(s)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(() => {
                    let options = [];
                    if (category?.subcategories && selectedSubcategory) {
                      options = category.subcategories[selectedSubcategory]?.options || [];
                    } else {
                      options = category?.options || [];
                    }
                    
                    return options.map(option => (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(option.id)}
                        className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                          selectedOptions.includes(option.id)
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-2xl">{option.icon}</span>
                        <span className="flex-1 font-body text-gray-700">
                          {isFrench ? option.labelFr : option.labelEn}
                        </span>
                        {option.urgent && (
                          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                            {isFrench ? 'URGENT' : 'URGENT'}
                          </span>
                        )}
                      </button>
                    ));
                  })()}
                </div>

                {/* Avertissements */}
                {depositWarning && selectedOptions.length > 0 && (
                  <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-300">
                    <p className="text-sm text-yellow-900 font-body">{messages.depositWarning}</p>
                  </div>
                )}
                {isUrgentIntervention && (
                  <div className="mt-4 bg-red-50 p-3 rounded-lg border border-red-300">
                    <p className="text-sm text-red-900 font-heading flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {isFrench ? 'Intervention urgente - Notification immédiate' : 'Urgent intervention - Immediate notification'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Description */}
      <AnimatePresence>
        {selectedOptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="border-2 border-[#FFD700] rounded-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-yellow-800">
                  {isFrench ? '📝 Description' : '📝 Description'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Label className="text-sm text-gray-600 mb-2">{messages.descriptionRequired}</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={isFrench ? 'Décrivez le problème en détail...' : 'Describe the problem in detail...'}
                  className="min-h-[100px] mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {description.length}/10 {isFrench ? 'caractères minimum' : 'characters minimum'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo */}
      <AnimatePresence>
        {selectedOptions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className={`border-2 rounded-xl ${photoIsRequired ? 'border-red-500' : 'border-blue-500'}`}>
              <CardHeader className="pb-3">
                <CardTitle className={`text-lg ${photoIsRequired ? 'text-red-700' : 'text-blue-700'}`}>
                  <Camera className="w-5 h-5 inline mr-2" />
                  {isFrench ? 'Photo' : 'Photo'}
                  {photoIsRequired && <span className="ml-2 text-sm">({isFrench ? 'OBLIGATOIRE' : 'REQUIRED'})</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  {photoIsRequired ? messages.photoObligatoire : messages.photoFacultative}
                </p>
                
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">{isFrench ? 'Cliquer pour ajouter' : 'Click to add'}</span>
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                  </label>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Horaires et règles */}
      <Card className="border-2 border-gray-300 rounded-xl bg-gray-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-gray-700">
            {isFrench ? '📋 Informations importantes' : '📋 Important information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-heading text-gray-800 mb-1">{rules.horaires_technique.title}</p>
            <ul className="space-y-1 text-gray-600">
              {rules.horaires_technique.items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-heading text-gray-800 mb-1">{rules.horaires_menage.title}</p>
            <ul className="space-y-1 text-gray-600">
              {rules.horaires_menage.items.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="font-heading text-red-800 mb-1">{rules.astreintes.title}</p>
            <p className="text-red-700 text-xs mb-2">{rules.astreintes.subtitle}</p>
            <ul className="space-y-1 text-red-700">
              {rules.astreintes.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-heading text-gray-800">{rules.delais.title}</p>
            <p className="text-gray-600">{rules.delais.text}</p>
          </div>
        </CardContent>
      </Card>

      {/* Bouton soumettre */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full h-14 bg-[#00AEEF] hover:bg-[#0077A8] text-white rounded-xl font-heading text-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isFrench ? 'Envoyer la demande' : 'Submit request'}
      </Button>
    </div>
  );
}