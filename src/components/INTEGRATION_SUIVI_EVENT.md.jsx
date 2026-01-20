# 🔧 GUIDE D'INTÉGRATION - SuiviEvent

**Date**: 2026-01-20  
**Objectif**: Remplacer progressivement les anciennes timelines par SuiviEvent

---

## ✅ FICHIERS IMPLÉMENTÉS

### 1. Entité SuiviEvent
**Fichier**: `entities/SuiviEvent.json`  
**Statut**: ✅ Créée  
**Champs obligatoires**: `workitem_id`, `service`, `action`, `message`, `timestamp`

### 2. Logger centralisé
**Fichier**: `components/suiviEventLogger.js`  
**Exports**:
- `logSuiviEvent()` - Créer un événement (NE PAS APPELER DEPUIS UI)
- `onWorkItemCreated()` - Hook auto après création
- `onWorkItemStatusChanged()` - Hook auto après changement statut
- `getWorkItemTimeline()` - Récupérer timeline d'un WorkItem
- `getReferenceTimeline()` - Récupérer timeline d'un séjour/arrivée

### 3. Wrapper UPDATE
**Fichier**: `components/workItemUpdater.js`  
**Exports**:
- `updateWorkItem()` - Update générique avec hook auto
- `takeChargeWorkItem()` - Prise en charge
- `completeWorkItem()` - Terminer
- `pauseWorkItem()` - Mettre en attente
- `resumeWorkItem()` - Reprendre

---

## 🔄 MIGRATION PROGRESSIVE

### Phase 1 - Nouvelles créations (ACTUEL)
✅ Toutes les nouvelles créations via `createWorkItem()` logguent automatiquement

### Phase 2 - Migrer les UPDATEs (À FAIRE)
Remplacer dans les pages:
```javascript
// ❌ AVANT
await base44.entities.WorkItem.update(id, { statut: 'TERMINEE' });

// ✅ APRÈS
import { completeWorkItem } from '@/components/workItemUpdater';
await completeWorkItem(id, { duree_minutes: 30 });
```

**Pages à migrer**:
- `pages/Technique.jsx` - Terminer intervention
- `pages/Menage.jsx` - Terminer intervention
- `components/MettreEnAttenteDialog.jsx` - Mise en attente
- `components/missions/WorkItemsServiceView.jsx` - Missions Direction
- Toute page appelant `WorkItem.update()` avec changement statut

### Phase 3 - Migrer l'affichage (À FAIRE)
Remplacer les anciennes timelines par `SuiviEvent`:

```javascript
// ❌ ANCIEN (fragmenté)
const suiviInventaire = await base44.entities.SuiviInventaire.get(id);
const timelineMenage = suiviInventaire.timeline_menage || [];
const timelineTechnique = suiviInventaire.timeline_technique || [];

// ✅ NOUVEAU (unique)
import { getReferenceTimeline } from '@/components/suiviEventLogger';
const timeline = await getReferenceTimeline(stay_id);
// Déjà triée par timestamp DESC
```

**Pages à migrer**:
- `pages/ClientSuiviDetail.jsx` - Affichage suivi client
- `components/suivi/SuiviTimeline.jsx` - Composant timeline
- `pages/Bureau.jsx` - Historique interventions

### Phase 4 - Migration données historiques (À FAIRE)
Script de migration pour reconstituer les SuiviEvent depuis:
- `SuiviInventaire.timeline_menage`
- `SuiviInventaire.timeline_technique`
- `WorkItem.metadata.timeline` (si existe)

### Phase 5 - Nettoyage (APRÈS VALIDATION)
Supprimer les champs devenus obsolètes:
- `SuiviInventaire.timeline_menage`
- `SuiviInventaire.timeline_technique`

---

## 📋 CHECKLIST MIGRATION PAGE

Avant de migrer une page, vérifier:

- [ ] La page crée-t-elle des WorkItems ?
  - Si OUI: utilise-t-elle `createWorkItem()` ? (déjà OK)
  
- [ ] La page met-elle à jour le statut de WorkItems ?
  - Si OUI: remplacer par `updateWorkItem()` ou helpers

- [ ] La page affiche-t-elle une timeline ?
  - Si OUI: remplacer par `getReferenceTimeline()` ou `getWorkItemTimeline()`

- [ ] Tests manuels après migration:
  - [ ] Créer une intervention → Vérifier SuiviEvent créé
  - [ ] Prendre en charge → Vérifier événement PRISE_EN_CHARGE
  - [ ] Terminer → Vérifier événement TERMINEE
  - [ ] Afficher timeline → Ordre chronologique correct

---

## 🧪 TESTS À EFFECTUER

### Test 1 - Création WorkItem
```javascript
import { createWorkItem } from '@/components/workItemCreator';

const wi = await createWorkItem({
  type: 'INTERVENTION_CLIENT',
  service: 'MENAGE',
  statut: 'A_FAIRE',
  priorite: 'NORMALE',
  description_operationnelle: 'Test timeline',
  hebergement: 'M03',
  stay_id: 'TEST-123'
});

// Vérifier: 1 SuiviEvent créé avec action = CREATION
const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
console.assert(events.length === 1, 'Event CREATION manquant');
console.assert(events[0].action === 'CREATION', 'Action incorrecte');
```

### Test 2 - Prise en charge
```javascript
import { takeChargeWorkItem } from '@/components/workItemUpdater';

await takeChargeWorkItem(wi.id, 'Sophie Martin');

// Vérifier: 1 nouvel événement PRISE_EN_CHARGE
const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
console.assert(events.length === 2, 'Event PRISE_EN_CHARGE manquant');
console.assert(events[0].action === 'PRISE_EN_CHARGE', 'Action incorrecte');
console.assert(events[0].collaborateur === 'Sophie Martin', 'Collaborateur manquant');
```

### Test 3 - Mise en attente
```javascript
import { pauseWorkItem } from '@/components/workItemUpdater';

await pauseWorkItem(wi.id, {
  raison_attente: 'attente_materiel',
  motif: 'Besoin assiettes',
  delai_estime: '1 jour'
});

// Vérifier: événement MISE_EN_ATTENTE
const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
const lastEvent = events[0];
console.assert(lastEvent.action === 'MISE_EN_ATTENTE', 'Action incorrecte');
console.assert(lastEvent.message.includes('attente_materiel'), 'Raison manquante');
```

### Test 4 - Reprise
```javascript
import { resumeWorkItem } from '@/components/workItemUpdater';

await resumeWorkItem(wi.id);

// Vérifier: événement REPRISE
const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
console.assert(events[0].action === 'REPRISE', 'Action incorrecte');
```

### Test 5 - Terminée
```javascript
import { completeWorkItem } from '@/components/workItemUpdater';

await completeWorkItem(wi.id, { duree_minutes: 25 });

// Vérifier: événement TERMINEE
const events = await base44.entities.SuiviEvent.filter({ workitem_id: wi.id });
console.assert(events[0].action === 'TERMINEE', 'Action incorrecte');
console.assert(events[0].message.includes('25 min'), 'Durée manquante');
```

### Test 6 - Ordre chronologique global
```javascript
import { getReferenceTimeline } from '@/components/suiviEventLogger';

const timeline = await getReferenceTimeline('TEST-123');

// Vérifier: ordre décroissant par timestamp
for (let i = 0; i < timeline.length - 1; i++) {
  const current = new Date(timeline[i].timestamp);
  const next = new Date(timeline[i + 1].timestamp);
  console.assert(current >= next, 'Ordre chronologique incorrect');
}

// Vérifier: 5 événements au total
console.assert(timeline.length === 5, `Attendu 5 événements, reçu ${timeline.length}`);
```

---

## 🚨 GARDE-FOUS

### Interdictions
- ❌ NE JAMAIS appeler `base44.entities.SuiviEvent.create()` depuis l'UI
- ❌ NE JAMAIS appeler `logSuiviEvent()` depuis l'UI
- ❌ NE PAS reconstruire l'ordre chronologique dans le frontend (déjà trié par timestamp)

### Autorisations
- ✅ Utiliser `createWorkItem()` pour créer des WorkItems
- ✅ Utiliser `updateWorkItem()` ou helpers pour mettre à jour
- ✅ Utiliser `getWorkItemTimeline()` ou `getReferenceTimeline()` pour afficher

---

## 📊 STATUT ACTUEL

| Composant | Statut | Hook automatique |
|-----------|--------|------------------|
| **Création WorkItem** | ✅ OK | Hook onCreate intégré |
| **Update statut** | ⚠️ PARTIEL | Hook disponible, migration en cours |
| **Affichage timeline** | ⏸️ À FAIRE | Anciennes timelines encore utilisées |
| **Migration données** | ⏸️ À FAIRE | Script à créer |

---

## 🎯 PROCHAINES ACTIONS

1. **Tester les 6 scénarios ci-dessus** (création, prise en charge, attente, reprise, terminée, ordre)
2. **Migrer pages critiques** vers `workItemUpdater.js`:
   - `pages/Technique.jsx`
   - `pages/Menage.jsx`
   - `components/MettreEnAttenteDialog.jsx`
3. **Migrer affichage** vers `getReferenceTimeline()`
4. **Valider** en conditions réelles
5. **Migrer données** historiques
6. **Supprimer** anciennes timelines