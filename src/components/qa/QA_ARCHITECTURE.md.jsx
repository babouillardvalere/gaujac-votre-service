# Architecture QA - Règles de non-invasion

## Principe fondamental

```
❌ Le QA ne DOMINE jamais le métier
✅ Le QA AIDE le métier, sinon il est désactivé
```

## Contextes d'exécution

### A. READ (lecture) - QA INTERDIT
- Pages services (Technique, Ménage)
- Listes d'interventions
- Dashboards
- Suivi client
- **Règle : Aucun QA, aucun throw, aucun blocage**

### B. FORM (intention) - QA informatif
- Formulaires de création
- Wizards multi-étapes
- Sélection de zones
- **Règle : Messages utilisateur, pas de throw global**

### C. CREATE/UPDATE (action métier) - QA bloquant autorisé
- Création WorkItem
- Clôture intervention
- Mise en attente
- **Règle : Validation stricte, retour objet {ok, message}**

## Architecture du code

### ✅ BON : Retour d'objet
```javascript
const qaResult = validateBeforeWorkItemCreation(data, { 
  context: 'CREATE',
  strict: true 
});

if (!qaResult.ok) {
  toast.error(qaResult.message);
  return; // Contrôleur décide
}
```

### ❌ MAUVAIS : Exception
```javascript
try {
  validateBeforeWorkItemCreation(data);
} catch (error) {
  // QA impose sa décision
}
```

## Flags de contrôle

### Master switch
```javascript
import { disableQA, enableQA } from './QAConfig';

// Urgence production
disableQA();

// Retour normal
enableQA();
```

### Garde contextuelle
```javascript
import { shouldRunQA } from './QAConfig';

if (shouldRunQA('CREATE')) {
  // Exécuter validation
}
```

## Niveaux de sévérité

### CRITICAL
- Description opérationnelle manquante
- Bloque création si `strict: true`
- Message utilisateur clair

### ERROR
- Service manquant
- Zone manquante
- Bloque si `strict: true`

### WARNING
- Incohérences mineures
- N'empêche jamais la soumission
- Log console uniquement

## Tests de non-régression

### Test 1 - Lecture ne doit JAMAIS crash
```
Ouvrir Technique
Ouvrir Ménage
Ouvrir Suivi client
→ ✅ Aucune erreur console
→ ✅ Aucun toast QA
→ ✅ Données affichées
```

### Test 2 - Création invalide bloque proprement
```
Créer WorkItem sans description
→ ❌ Blocage avec message clair
→ ✅ Utilisateur reste sur le formulaire
→ ✅ Aucun throw, aucun crash
```

### Test 3 - QA désactivé fonctionne
```
disableQA()
Créer WorkItem invalide
→ ✅ Création réussie
→ ✅ Warning console
→ ✅ Application fluide
```

## Décision métier > QA

Si le QA empêche :
1. Direction de créer des missions
2. Services de recevoir les WorkItems
3. Clients de voir le suivi

**Alors le QA est désactivé, pas le métier.**

## Engagement qualité

Le QA est un outil, pas un dogme :
- S'il aide → on le garde
- S'il nuit → on le corrige
- S'il bloque → on le désactive
- Priorité absolue : application fluide et métier fonctionnel