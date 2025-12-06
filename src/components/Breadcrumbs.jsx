import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from './translations';
import { ChevronRight, Home } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Breadcrumbs() {
  const location = useLocation();
  const { t, lang } = useTranslation();
  
  // Mapping des routes vers leurs labels
  const routeLabels = {
    'Home': { fr: 'Accueil', en: 'Home' },
    'ClientMenu': { fr: 'Menu Client', en: 'Client Menu' },
    'ClientArrivee': { fr: 'Arrivée', en: 'Arrival' },
    'ClientArriveeIdentite': { fr: 'Identité', en: 'Identity' },
    'ClientArriveeHebergement': { fr: 'Hébergement', en: 'Accommodation' },
    'ClientControleInventaire': { fr: 'Inventaire', en: 'Inventory' },
    'ClientArriveeSuivi': { fr: 'Suivi Arrivée', en: 'Arrival Tracking' },
    'ClientDepart': { fr: 'Départ', en: 'Departure' },
    'ClientDepartIdentite': { fr: 'Identification', en: 'Identification' },
    'ClientDepartPhotos': { fr: 'Photos', en: 'Photos' },
    'ClientDepartInventaire': { fr: 'État des lieux', en: 'Inventory Check' },
    'ClientDepartConfirmation': { fr: 'Confirmation', en: 'Confirmation' },
    'InfosPratiques': { fr: 'Infos Pratiques', en: 'Practical Info' },
    'SuiviIntervention': { fr: 'Suivi Intervention', en: 'Track Request' },
    'MeilleursAvis': { fr: 'Avis', en: 'Reviews' },
    'Collaborateur': { fr: 'Connexion', en: 'Login' },
    'MenuCollaborateur': { fr: 'Menu Staff', en: 'Staff Menu' },
    'Technique': { fr: 'Technique', en: 'Technical' },
    'Menage': { fr: 'Ménage', en: 'Housekeeping' },
    'Reception': { fr: 'Réception', en: 'Reception' },
    'ReceptionArrivees': { fr: 'Arrivées', en: 'Arrivals' },
    'ReceptionDeparts': { fr: 'Départs', en: 'Departures' },
    'ReceptionAssistance': { fr: 'Assistance', en: 'Assistance' },
    'ReceptionAideArrivee': { fr: 'Aide Arrivée', en: 'Arrival Assistance' },
    'ReceptionAideSejour': { fr: 'Aide Séjour', en: 'Stay Assistance' },
    'ReceptionAideDepart': { fr: 'Aide Départ', en: 'Departure Assistance' },
    'Materiel': { fr: 'Matériel', en: 'Equipment' },
    'Statistiques': { fr: 'Statistiques', en: 'Statistics' },
    'Bureau': { fr: 'Bureau', en: 'Office' }
  };

  // Déterminer si on est dans une zone collaborateur
  const isCollaboratorArea = () => {
    const path = location.pathname;
    return path.includes('Collaborateur') || 
           path.includes('Technique') || 
           path.includes('Menage') || 
           path.includes('Reception') || 
           path.includes('Materiel') || 
           path.includes('Bureau') ||
           path.includes('Statistiques');
  };

  // Parser le chemin pour créer les breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  if (pathSegments.length === 0 || pathSegments[0] === 'Home') {
    return null; // Pas de breadcrumbs sur la page d'accueil
  }

  const breadcrumbs = [];
  
  // Supprimer définitivement les breadcrumbs en zone collaborateur
  const isCollaboratorArea = currentPage.includes('Collaborateur') || 
                             currentPage.includes('Technique') || 
                             currentPage.includes('Menage') || 
                             currentPage.includes('Reception') || 
                             currentPage.includes('Materiel') || 
                             currentPage.includes('Bureau') ||
                             currentPage.includes('Notifications') ||
                             currentPage.includes('Attente');
  
  if (isCollaboratorArea) {
    return null;
  }

  // Ajouter un breadcrumb pour le menu collaborateur si nécessaire
  if (isCollaboratorArea() && pathSegments[0] !== 'Collaborateur' && pathSegments[0] !== 'MenuCollaborateur') {
    breadcrumbs.push({
      label: routeLabels['MenuCollaborateur'][lang] || 'Menu Staff',
      path: 'MenuCollaborateur'
    });
  }

  // Ajouter un breadcrumb pour le menu client si nécessaire
  if (pathSegments[0].startsWith('Client') && pathSegments[0] !== 'ClientMenu') {
    breadcrumbs.push({
      label: routeLabels['ClientMenu'][lang] || 'Menu Client',
      path: 'ClientMenu'
    });
  }

  // Ajouter les segments de chemin
  pathSegments.forEach((segment, index) => {
    const label = routeLabels[segment]?.[lang] || segment;
    const isLast = index === pathSegments.length - 1;
    
    if (!isLast || segment !== 'MenuCollaborateur') {
      breadcrumbs.push({
        label,
        path: segment,
        isLast
      });
    }
  });

  return (
    <nav aria-label="Breadcrumb" className="px-6 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <ol className="flex items-center space-x-2 text-sm max-w-lg mx-auto">
        {breadcrumbs.map((crumb, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
            )}
            {crumb.isLast ? (
              <span className="font-heading text-[#0077A8] font-semibold" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                to={createPageUrl(crumb.path)}
                className="font-body text-gray-600 hover:text-[#00AEEF] transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}