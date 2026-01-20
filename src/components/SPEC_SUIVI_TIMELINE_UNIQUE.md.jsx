# 📐 SPÉCIFICATION - TIMELINE UNIQUE CHRONOLOGIQUE

**Date**: 2026-01-20  
**Statut**: Validé (non implémenté)  
**Objectif**: Remplacer les timelines fragmentées par une source de vérité unique

---

## 🎯 PROBLÈME ACTUEL (DÉMONTRÉ)

### Timelines fragmentées
```
SuiviInventaire.timeline_menage[]
SuiviInventaire.timeline_technique[]
WorkItem.metadata.timeline[]
UI reconstruit parfois l'ordre
```

**Conséquences**:
- ❌ Ordre chronologique incohérent entre services
- ❌ Difficulté à répondre: "Qu'est-ce qui s'est passé en dernier?"
- ❌ Duplication de logique (append timeline à 3 endroits différents)

---

## ✅ MODÈLE CIBLE

### Entité unique: `SuiviEvent`

```json
{
  "name": "SuiviEvent",
  "type": "object",
  "properties": {
    "workitem_id": {
      "type": "string",
      "description": "ID du WorkItem concerné (OBLIGATOIRE)"
    },
    "origine": {
      "type": "string",
      "enum": ["INVENTAIRE_ARRIVEE", "INVENTAIRE_DEPART", "SEJOUR", "MISSION_DIRECTION"],
      "description": "Contexte d'origine de l'intervention"
    },
    "reference_id": {
      "type": "string",
      "description": "stay_id, fiche_arrivee_id, ou mission_direction_id"
    },
    "service": {
      "type": "string",
      "enum": ["MENAGE", "TECHNIQUE", "RECEPTION", "DIRECTION", "SYSTEM"],
      "description": "Service ayant déclenché l'action"
    },
    "action": {
      "type": "string",
      "enum": [
        "CREATION",
        "PRISE_EN_CHARGE",
        "ARRIVEE_SUR_SITE",
        "EN_COURS",
        "MISE_EN_ATTENTE",
        "REPRISE",
        "TERMINEE",
        "ANNULEE"
      ],
      "description": "Type d'action effectuée"
    },
    "message": {
      "type": "string",
      "description": "Message lisible pour l'utilisateur (généré automatiquement)"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "Horodatage précis (ISO 8601)"
    },
    "collaborateur": {
      "type": "string",
      "description": "Nom du collaborateur (si action humaine)"
    },
    "metadata": {
      "type": "object",
      "description": "Données contextuelles (raison attente, durée, etc.)"
    }
  },
  "required": ["workitem_id", "service", "action", "message", "timestamp"]
}
```

---

## 🔄 RÈGLES MÉTIER (AUTOMATISATION)

### Règle #1 - À la création d'un WorkItem
**Trigger**: `onCreate(WorkItem)`  
**Action**: Créer automatiquement 1 `SuiviEvent`

```javascript
// Exemple événement créé automatiquement
{
  workitem_id: "wi_123abc",
  origine: "INVENTAIRE_ARRIVEE",
  reference_id: "ARR-M03-20260120-XYZ",
  service: "SYSTEM",
  action: "CREATION",
  message: "Intervention créée - MENAGE - Vaisselle manquante",
  timestamp: "2026-01-20T10:02:35.123Z",
  collaborateur: null,
  metadata: {
    hebergement: "M03",
    priorite: "NORMALE"
  }
}
```

### Règle #2 - Prise en charge
**Trigger**: `onUpdate(WorkItem)` où `statut` passe de `A_FAIRE` → `EN_COURS`  
**Action**: Créer 1 `SuiviEvent`

```javascript
{
  workitem_id: "wi_123abc",
  service: "MENAGE",
  action: "PRISE_EN_CHARGE",
  message: "MENAGE a pris en charge l'intervention",
  timestamp: "2026-01-20T10:15:22.456Z",
  collaborateur: "Sophie Martin",
  metadata: {
    duree_attente_minutes: 13
  }
}
```

### Règle #3 - Mise en attente
**Trigger**: `onUpdate(WorkItem)` où `statut` passe vers `EN_ATTENTE`  
**Action**: Créer 1 `SuiviEvent`

```javascript
{
  workitem_id: "wi_123abc",
  service: "MENAGE",
  action: "MISE_EN_ATTENTE",
  message: "MENAGE a mis l'intervention en attente - Attente matériel",
  timestamp: "2026-01-20T10:45:10.789Z",
  collaborateur: "Sophie Martin",
  metadata: {
    raison_attente: "attente_materiel",
    motif: "Besoin de nouvelles assiettes",
    delai_estime: "1 jour"
  }
}
```

### Règle #4 - Reprise
**Trigger**: `onUpdate(WorkItem)` où `statut` passe de `EN_ATTENTE` → `EN_COURS`  
**Action**: Créer 1 `SuiviEvent`

```javascript
{
  workitem_id: "wi_123abc",
  service: "MENAGE",
  action: "REPRISE",
  message: "MENAGE a repris l'intervention",
  timestamp: "2026-01-21T09:30:05.123Z",
  collaborateur: "Sophie Martin",
  metadata: {
    duree_attente_totale_minutes: 1365
  }
}
```

### Règle #5 - Terminée
**Trigger**: `onUpdate(WorkItem)` où `statut` passe vers `TERMINEE`  
**Action**: Créer 1 `SuiviEvent`

```javascript
{
  workitem_id: "wi_123abc",
  service: "MENAGE",
  action: "TERMINEE",
  message: "MENAGE a terminé l'intervention",
  timestamp: "2026-01-21T09:52:33.456Z",
  collaborateur: "Sophie Martin",
  metadata: {
    duree_intervention_minutes: 22,
    duree_totale_minutes: 1387
  }
}
```

---

## 📊 AFFICHAGE CHRONOLOGIQUE UNIQUE

### Règle d'affichage (OBLIGATOIRE)
```javascript
// UNE SEULE MÉTHODE DE TRI
events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
```

**Résultat visuel (exemple inventaire arrivée)**:
```
[2026-01-21 09:52] MENAGE a terminé l'intervention
[2026-01-21 09:30] MENAGE a repris l'intervention
[2026-01-20 10:45] MENAGE a mis en attente - Attente matériel
[2026-01-20 10:15] MENAGE a pris en charge
[2026-01-20 10:02] Intervention créée - MENAGE
```

**Pas de séparation par service** → Chronologie pure

---

## 🔧 IMPLÉMENTATION TECHNIQUE (HOOKS)

### Hook centralisé unique
```javascript
// components/suiviEventLogger.js

/**
 * Crée automatiquement un événement de suivi
 * NE PAS APPELER DEPUIS L'UI - Uniquement depuis hooks WorkItem
 */
async function logSuiviEvent(workItemId, service, action, collaborateur = null, metadata = {}) {
  const workItem = await base44.entities.WorkItem.get(workItemId);
  
  const message = generateMessage(workItem, service, action, metadata);
  
  await base44.entities.SuiviEvent.create({
    workitem_id: workItemId,
    origine: detectOrigine(workItem),
    reference_id: workItem.stay_id || workItem.fiche_arrivee_id || workItem.mission_direction_id,
    service,
    action,
    message,
    timestamp: new Date().toISOString(),
    collaborateur,
    metadata
  });
}

/**
 * Génère le message lisible automatiquement
 */
function generateMessage(workItem, service, action, metadata) {
  switch(action) {
    case 'CREATION':
      return `Intervention créée - ${workItem.service} - ${workItem.description_operationnelle.split('\n')[0]}`;
    case 'PRISE_EN_CHARGE':
      return `${service} a pris en charge l'intervention`;
    case 'MISE_EN_ATTENTE':
      return `${service} a mis en attente - ${metadata.raison_attente || 'Raison non spécifiée'}`;
    case 'REPRISE':
      return `${service} a repris l'intervention`;
    case 'TERMINEE':
      return `${service} a terminé l'intervention`;
    default:
      return `${service} - ${action}`;
  }
}
```

### Hook sur CREATE WorkItem
```javascript
// Appelé automatiquement après createWorkItem()
afterCreate(WorkItem) {
  await logSuiviEvent(
    workItem.id,
    'SYSTEM',
    'CREATION',
    null,
    { hebergement: workItem.hebergement }
  );
}
```

### Hook sur UPDATE WorkItem
```javascript
// Appelé automatiquement après update statut
afterUpdate(WorkItem, oldData, newData) {
  if (oldData.statut !== newData.statut) {
    const actionMap = {
      'A_FAIRE → EN_COURS': 'PRISE_EN_CHARGE',
      'EN_COURS → EN_ATTENTE': 'MISE_EN_ATTENTE',
      'EN_ATTENTE → EN_COURS': 'REPRISE',
      '* → TERMINEE': 'TERMINEE'
    };
    
    const action = detectAction(oldData.statut, newData.statut, actionMap);
    
    await logSuiviEvent(
      workItem.id,
      newData.service,
      action,
      newData.collaborateur,
      newData.metadata || {}
    );
  }
}
```

---

## 🗑️ MIGRATION (SUPPRESSION ANCIENNES TIMELINES)

### Données à supprimer (après migration)
```
SuiviInventaire.timeline_menage      → Supprimé
SuiviInventaire.timeline_technique   → Supprimé
WorkItem.metadata.timeline           → Supprimé (si existe)
```

### Stratégie de migration
1. **Créer SuiviEvent** pour tous les WorkItems existants (reconstitution historique)
2. **Activer hooks** automatiques
3. **Supprimer anciennes timelines** (données legacy)
4. **Migration UI** → Afficher uniquement `SuiviEvent` triés par `timestamp`

---

## ✅ CRITÈRES DE SUCCÈS

| Critère | Validation |
|---------|------------|
| **Timeline unique** | ✅ Une seule entité `SuiviEvent` |
| **Automatisation totale** | ✅ Aucun append manuel depuis UI |
| **Ordre chronologique** | ✅ Tri unique par `timestamp` DESC |
| **Lisibilité immédiate** | ✅ Messages générés automatiquement |
| **0 duplication logique** | ✅ Un seul hook `logSuiviEvent()` |

---

## 🚨 GARDE-FOUS

### Interdictions strictes
- ❌ **NE PAS** appeler `SuiviEvent.create()` depuis l'UI
- ❌ **NE PAS** créer de timeline parallèle dans une autre entité
- ❌ **NE PAS** reconstruire l'ordre chronologique dans le frontend

### Règle unique
```
✅ SEUL logSuiviEvent() peut créer des SuiviEvent
✅ SEULS les hooks WorkItem appellent logSuiviEvent()
✅ SEUL timestamp détermine l'ordre affiché
```

---

## 🎯 AVANTAGES vs ACTUEL

| Aspect | Actuel (fragmenté) | Nouveau (unique) |
|--------|-------------------|------------------|
| **Chronologie** | ❌ Par service | ✅ Globale |
| **Automatisation** | ⚠️ Partielle | ✅ Totale |
| **Maintenabilité** | ❌ 3 endroits | ✅ 1 seul |
| **Compréhension** | ⚠️ Moyenne | ✅ Immédiate |
| **Risque bug** | ⚠️ Élevé | ✅ Faible |

---

## 📝 STATUT

**Spécification**: ✅ Validée  
**Implémentation**: ⏸️ En attente confirmation  
**Migration données**: ⏸️ Non planifiée  

**Prochaines étapes** (si validation finale):
1. Créer entité `SuiviEvent`
2. Implémenter `suiviEventLogger.js`
3. Ajouter hooks `onCreate` / `onUpdate` WorkItem
4. Migrer données existantes
5. Supprimer anciennes timelines
6. Migrer UI suivi client