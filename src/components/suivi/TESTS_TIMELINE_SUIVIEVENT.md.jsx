# 🧪 TESTS TIMELINE SuiviEvent - Page Suivi Client

**Date**: 2026-01-20  
**Écran modifié**: `pages/ClientSuiviDetail.jsx`  
**Composant créé**: `components/suivi/TimelineSuiviEvent.jsx`

---

## ✅ FICHIERS TOUCHÉS

| Fichier | Type | Action |
|---------|------|--------|
| `components/suivi/TimelineSuiviEvent.jsx` | Nouveau | Composant d'affichage timeline |
| `pages/ClientSuiviDetail.jsx` | Modifié | Import + remplacement SuiviTimeline par TimelineSuiviEvent |

**Aucun autre fichier modifié.**

---

## 📋 TESTS OBLIGATOIRES

### Test 1: Création intervention → 1 événement visible

**Procédure**:
1. Accéder au parcours client (signalement ou arrivée)
2. Créer une nouvelle intervention (ménage ou technique)
3. Noter l'ID de l'intervention créée
4. Accéder à la page de suivi client
5. Vérifier la timeline

**Résultat attendu**:
- ✅ 1 événement visible avec action "Demande créée"
- ✅ Date/heure affichée
- ✅ Service correct (MENAGE ou TECHNIQUE)
- ✅ Message descriptif présent

**Critère de réussite**: Event CREATION visible immédiatement

---

### Test 2: Passage EN_COURS → nouvel événement visible

**Procédure**:
1. Sur l'intervention du Test 1
2. En tant que collaborateur, prendre en charge l'intervention
3. Rafraîchir la page de suivi client (ou attendre 5s)
4. Vérifier la timeline

**Résultat attendu**:
- ✅ 2 événements visibles
- ✅ Premier événement (haut): "Prise en charge"
- ✅ Nom du collaborateur affiché
- ✅ Ordre chronologique respecté (plus récent en haut)

**Critère de réussite**: Nouvel événement visible en position 1

---

### Test 3: Clôture → événement visible en haut

**Procédure**:
1. Terminer l'intervention depuis l'interface collaborateur
2. Ajouter durée, commentaire, photos
3. Valider la clôture
4. Rafraîchir le suivi client

**Résultat attendu**:
- ✅ 3 événements visibles
- ✅ Premier événement: "Terminée" avec icône verte
- ✅ Durée affichée dans metadata (si renseignée)
- ✅ Ordre chronologique strict

**Critère de réussite**: Event TERMINEE en position 1

---

### Test 4: Aucune duplication

**Procédure**:
1. Sur une intervention existante avec plusieurs transitions
2. Ouvrir la page de suivi client
3. Compter les événements affichés
4. Vérifier dans la base de données:
   ```javascript
   const events = await base44.entities.SuiviEvent.filter({ 
     workitem_id: 'ID_INTERVENTION' 
   });
   console.log('Events count:', events.length);
   ```

**Résultat attendu**:
- ✅ Nombre d'événements UI = nombre d'événements BDD
- ✅ Aucun doublon visible
- ✅ Chaque transition = 1 seul événement

**Critère de réussite**: Pas de duplication

---

### Test 5: Ordre strict respecté

**Procédure**:
1. Sur une intervention avec 5+ événements
2. Afficher la timeline
3. Vérifier manuellement l'ordre des timestamps
4. Le premier événement (haut) doit être le plus récent
5. Le dernier événement (bas) doit être le plus ancien (CREATION)

**Résultat attendu**:
- ✅ Ordre décroissant par timestamp
- ✅ Événement CREATION toujours en dernière position
- ✅ Événement TERMINEE (si existe) toujours en première position

**Critère de réussite**: Ordre chronologique DESC strict

---

## 🔍 TESTS COMPLÉMENTAIRES

### Test 6: Mise en attente

**Procédure**:
1. Mettre une intervention en attente (via MettreEnAttenteDialog)
2. Renseigner raison + motif + délai
3. Vérifier timeline

**Résultat attendu**:
- ✅ Événement "Mise en attente" visible
- ✅ Métadonnées affichées (raison, délai)
- ✅ Icône pause orange

---

### Test 7: Reprise après attente

**Procédure**:
1. Reprendre une intervention en attente
2. Vérifier timeline

**Résultat attendu**:
- ✅ Événement "Reprise" visible
- ✅ Positionné après l'événement "Mise en attente"

---

### Test 8: Fallback aucun événement

**Procédure**:
1. Créer une intervention SANS passer par createWorkItem() (simulation ancienne données)
2. Ouvrir la page de suivi client

**Résultat attendu**:
- ✅ Message "Aucun événement de suivi disponible"
- ✅ Icône horloge grise
- ✅ Pas d'erreur console

---

### Test 9: Refresh automatique

**Procédure**:
1. Ouvrir la page de suivi client sur une intervention EN_COURS
2. Dans un autre onglet, terminer l'intervention (en tant que collaborateur)
3. Attendre 5 secondes sans rafraîchir

**Résultat attendu**:
- ✅ Timeline se met à jour automatiquement
- ✅ Événement TERMINEE apparaît sans reload manuel

**Critère**: RefetchInterval à 5s actif

---

### Test 10: Multi-services

**Procédure**:
1. Créer une intervention avec plusieurs WorkItems (ex: Mission Direction)
2. Chaque WorkItem doit avoir son propre suivi
3. Vérifier que la timeline affiche uniquement les événements du WorkItem concerné

**Résultat attendu**:
- ✅ Pas de pollution entre WorkItems
- ✅ Filtrage strict par `workitem_id`

---

## 🚨 CRITÈRES DE VALIDATION FINALE

### Critères fonctionnels
- [ ] Les 5 tests obligatoires passent
- [ ] Aucune duplication d'événements
- [ ] Ordre chronologique strict respecté
- [ ] Refresh automatique fonctionne
- [ ] Fallback "aucun événement" fonctionne

### Critères techniques
- [ ] Aucune régression sur les autres écrans
- [ ] QA non contourné
- [ ] Anciennes timelines non supprimées
- [ ] Pas d'appel direct à `SuiviEvent.create()` depuis UI

### Critères UX
- [ ] Loading spinner pendant chargement
- [ ] Message d'erreur si échec
- [ ] Traduction FR/EN fonctionnelle
- [ ] Icônes cohérentes par type d'action
- [ ] Métadonnées affichées quand présentes

---

## 📊 RAPPORT DE VALIDATION

**À compléter après tests**:

| Test | Statut | Remarques |
|------|--------|-----------|
| Test 1 - Création | ⏸️ | |
| Test 2 - Prise en charge | ⏸️ | |
| Test 3 - Clôture | ⏸️ | |
| Test 4 - No duplication | ⏸️ | |
| Test 5 - Ordre strict | ⏸️ | |
| Test 6 - Mise en attente | ⏸️ | |
| Test 7 - Reprise | ⏸️ | |
| Test 8 - Fallback | ⏸️ | |
| Test 9 - Auto-refresh | ⏸️ | |
| Test 10 - Multi-services | ⏸️ | |

**Statuts possibles**: ⏸️ Non testé | ✅ Réussi | ❌ Échoué | ⚠️ Partiel

---

## 🔧 ROLLBACK SI NÉCESSAIRE

Si les tests échouent, rollback simple:

```javascript
// Dans pages/ClientSuiviDetail.jsx
// Remplacer:
<TimelineSuiviEvent workItemId={intervention.id} />

// Par:
<SuiviTimeline incident={intervention} />
```

Supprimer le composant `TimelineSuiviEvent.jsx`.

**Durée estimée**: 2 minutes.

---

## ✅ VALIDATION FINALE

**Décision**: ⏸️ En attente tests

**Si tous les tests passent**:
- [ ] Marquer cette timeline comme "production-ready"
- [ ] Documenter dans INTEGRATION_SUIVI_EVENT.md
- [ ] Planifier migration des autres écrans (optionnel)

**Si échec**:
- [ ] Analyser les logs
- [ ] Corriger les hooks si nécessaire
- [ ] Retester