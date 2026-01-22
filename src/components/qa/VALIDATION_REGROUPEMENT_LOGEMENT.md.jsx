# 🎯 Validation du Regroupement par Logement

## Critères de Validation Stricts

### 1️⃣ UI Technique - Affichage Unifié

**Règle**: Un logement (ex: T06) = 1 seule carte contenant Technique + Ménage

**Test**:
```
Ouvrir: pages/Technique.jsx
Chercher: "logementGroups = groupByLogement(convertedWorkItems)"
Vérifier: Les cartes affichent TOUS les WorkItems (Technique + Ménage) du même logement
```

**Résultat attendu**:
- ✅ 1 carte par logement/séjour
- ✅ Contient 🔧 anomalies + 🧹 anomalies
- ✅ Pas de carte "Autres / Aucune description"
- ✅ Affiche le nombre total d'interventions

**Bugs potentiels**:
- [ ] Plusieurs cartes pour 1 logement
- [ ] Descriptions manquantes
- [ ] Services mélangés incorrectement

---

### 2️⃣ Bouton Prendre en Charge - Unicité de l'Événement

**Règle**: 1 clic = 1 seul événement dans l'historique, pas de doublons

**Test**:
```
1. Cliquer "Prendre en charge" sur une intervention
2. Vérifier dans Bureau → Historique
3. Compter les événements pour cette intervention
```

**Résultat attendu**:
- ✅ 1 événement PRISE_EN_CHARGE
- ✅ Collaborateur renseigné (pas undefined)
- ✅ Status débute à EN_COURS
- ✅ Aucun doublon

**Bugs potentiels** (à chercher):
```javascript
// ❌ MAUVAIS: Plusieurs create() dans le même handler
await base44.entities.InterventionLog.create(...);      // ← doublon
await base44.entities.HistoriqueEvent.create(...);      // ← doublon
await pushClientEvent(...);                             // ← doublon
await base44.entities.SuiviEvent.create(...);           // ← correct

// ✅ BON: 1 seul create() centralisé
const event = createCleanEvent(...);
await base44.entities.SuiviEvent.create(event);         // ← unique
```

---

### 3️⃣ Transition d'État - Respect des Règles Strictes

**Règle**: Les transitions doivent être validées par `canTransition()`

**Test**:
```
1. État: EN_COURS
2. Marquer une anomalie "Non faite"
3. Entrer une justification
4. Cliquer "Terminer"
```

**Résultat attendu**:
- ✅ Si une tâche n'est pas faite et sans justification → BLOQUE
- ✅ Si toutes tâches sont justifiées → AUTORISE
- ✅ Message d'erreur clair si blocage

**Bugs potentiels**:
- [ ] `canTransition()` non appelé
- [ ] Validation manquante sur `areAllTasksResolved()`
- [ ] Pas de vérification des justifications

---

### 4️⃣ Bureau → Historique - Événements Distincts

**Règle**: Pour 1 action = 4 événements DISTINCTS (pas de doublons, pas d'undefined)

**Test**:
```
Bureau → Historique
Chercher la même intervention
Compter les événements liés
```

**Pour "Prise en charge" d'une intervention avec Technique + Ménage**:
```
Attendu: 4 événements distincts
1. Event RECEPTION: "Intervention prise en charge"
2. Event TECHNIQUE: "Prise en charge côté Technique" (si service=TECHNIQUE)
3. Event MENAGE: "Prise en charge côté Ménage" (si service=MENAGE)
4. Event HISTORIQUE: "Prise en charge" (trace générale)

Vérifications:
- ✅ Tous les champs sont renseignés (pas undefined)
- ✅ collaborateur !== undefined
- ✅ workitem_id !== undefined
- ✅ timestamp existe
- ✅ message !== ""
- ❌ Pas d'événement dupliqué (même timestamp/service/action)
```

**Exemple de doublon à éviter**:
```javascript
// ❌ MAUVAIS: 2 créations du même événement
await base44.entities.SuiviEvent.create({...}); // Événement 1
await base44.entities.HistoriqueEvent.create({...}); // Événement 2 (doublon si même données)

// ✅ BON: 1 seul événement SuiviEvent qui fusionne tout
const event = createCleanEvent(...);
await base44.entities.SuiviEvent.create(event); // Unique
```

---

## Plan de Validation (Manuel)

### Phase 1: Vérifier l'UI
- [ ] Ouvrir Technique.jsx
- [ ] Créer une intervention Technique + une Ménage sur le même logement
- [ ] Vérifier: 1 seule carte affichée
- [ ] Vérifier: 🔧 Technique + 🧹 Ménage visibles

### Phase 2: Tester Prise en Charge
- [ ] Cliquer "Prendre en charge"
- [ ] Aller Bureau → Historique
- [ ] Compter les événements
- [ ] Si >1 → BUG à corriger

### Phase 3: Tester Transition EN_COURS → TERMINÉ
- [ ] Marquer une tâche "Non faite" sans justification
- [ ] Cliquer "Terminer"
- [ ] Si pas d'erreur → bug dans `areAllTasksResolved()`
- [ ] Si bloqqué correctement → ✅

### Phase 4: Vérifier Historique Bureau
- [ ] Pour 1 action: compter les événements
- [ ] Chercher les undefined dans les logs console
- [ ] Chercher les doublons (même action/timestamp/service)

---

## Corrections à Appliquer

### Si UI échouée (Critère 1)
→ Vérifier `groupByLogement()` ne fusionne pas les services
→ Ajouter `convertedMenageItems` à la fusion

### Si Prise en Charge échouée (Critère 2)
→ Remplacer les 4+ `create()` par 1 seul `createCleanEvent()` + `SuiviEvent.create()`
→ Supprimer les appels redondants

### Si Transition échouée (Critère 3)
→ Ajouter validation `canTransition()` avant mutation
→ Appeler `areAllTasksResolved()` obligatoirement

### Si Historique échoué (Critère 4)
→ Vérifier tous les champs du `createCleanEvent()`
→ Ajouter une condition pour **chaque service** (Technique, Ménage, Bureau)
→ Supprimer les créations dupliquées