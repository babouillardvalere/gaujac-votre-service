# Migration description_operationnelle - WorkItem

**Version:** ui-normalisation-v1  
**Date:** 2026-01-20  
**Statut:** ✅ APPLIQUÉ

---

## ✅ Action 1 — Correction appliquée

### Changements réalisés

**Services Technique et Ménage :**
- Fonction centrale `getDescriptionOperationnelle(item)` ajoutée
- Fallback automatique : `description_operationnelle` → `description_probleme` → `description`
- Tous les accès directs à `incident.description` remplacés
- Bouton "Prendre en charge" débloqué dès qu'une description normalisée existe

**Script de réparation :**
- `handleRepairWorkItems()` ajouté à AdminLoadTest
- Corrige tous les WorkItems sans `description_operationnelle`
- Copie depuis `description` ou `description_probleme`

### Critère de succès
✅ Aucune régression sur affichage / prise en charge

---

## ⚠️ Action 2 — Dépréciation progressive (RECOMMANDÉ)

### Champs legacy marqués comme dépréciés

**WorkItem.description** → DÉPRÉCIÉ
- Utiliser `description_operationnelle` pour toute nouvelle création
- Le champ reste présent pour compatibilité legacy uniquement

**Incident.description_probleme** → DÉPRÉCIÉ  
- Utiliser `description_operationnelle` lors de la conversion en WorkItem
- Le champ reste présent dans l'entité Incident pour historique

### Règle stricte pour nouvelles créations
🚨 **Tout nouveau WorkItem DOIT avoir `description_operationnelle` renseigné**

Voir : `components/workItemCreator.jsx` — validation stricte appliquée

---

## 🧪 Action 3 — Tests de non-régression

### Scénarios critiques à rejouer après toute modification

#### Test 1 : Inventaire arrivée → Service
1. Client complète inventaire arrivée avec signalement
2. Service (Technique/Ménage) reçoit WorkItem
3. **Vérification :** Description visible dans la carte
4. **Vérification :** Bouton "Prendre en charge" actif

**Critère :** 0 carte sans description, bouton toujours actif si description existe

---

#### Test 2 : Signalement séjour → Clôture
1. Client signale incident pendant séjour
2. Service prend en charge
3. Service clôture l'intervention
4. **Vérification :** Suivi client affiche description complète

**Critère :** Suivi client affiche toujours la description, même anciennes données

---

#### Test 3 : Mission Direction → Validation
1. Direction crée mission avec tâches
2. Service traite mission (statut "Fait" / "Pas fait")
3. **Vérification :** Description opérationnelle présente dans WorkItem
4. **Vérification :** Validation possible même si tâche "Pas fait" avec justification

**Critère :** 0 "Intervention invalide" si description présente

---

## 📊 Critère global de succès

✅ **0 carte affichée sans description**  
✅ **0 bouton "Prendre en charge" bloqué à tort**  
✅ **0 erreur "Intervention invalide" avec description**

---

## 🔧 Maintenance future

### Si erreur "Intervention invalide" détectée :

1. Exécuter script de réparation : `AdminLoadTest → Réparer WorkItems`
2. Vérifier que `workItemCreator` force bien `description_operationnelle`
3. Vérifier que les services utilisent `getDescriptionOperationnelle()`

### Si anciens WorkItems sans description :

```javascript
// Dans AdminLoadTest
await handleRepairWorkItems();
```

---

## 📝 Fichiers modifiés

- ✅ `pages/Technique.jsx` — fonction `getDescriptionOperationnelle()` ajoutée
- ✅ `pages/Menage.jsx` — fonction `getDescriptionOperationnelle()` ajoutée
- ✅ `pages/AdminLoadTest.jsx` — script réparation WorkItems
- ✅ `components/workItemCreator.jsx` — validation stricte (déjà présente)

---

**Fin de migration — Version stable**