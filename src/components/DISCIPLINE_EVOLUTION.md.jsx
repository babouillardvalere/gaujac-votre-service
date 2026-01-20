# 📐 DISCIPLINE D'ÉVOLUTION - CHECKLIST OBLIGATOIRE

**Version**: 1.0  
**Date**: 2026-01-20  
**Objectif**: Éviter les régressions silencieuses

---

## ⚠️ AVANT TOUTE NOUVELLE FONCTIONNALITÉ

### ✅ CHECKLIST DE VÉRIFICATION (TOUS OBLIGATOIRES)

#### 1. Impact sur WorkItem
- [ ] La fonctionnalité crée/modifie des WorkItems ?
- [ ] Si OUI: respecte-t-elle les champs obligatoires (REGLES_WORKITEM.md) ?
- [ ] Si OUI: passe-t-elle par workItemFactory OU respecte description_operationnelle ?

#### 2. Impact sur description_operationnelle
- [ ] La fonctionnalité génère une description opérationnelle ?
- [ ] Si OUI: la description est-elle NON VIDE et lisible par les services ?
- [ ] Si OUI: suit-elle le format `buildDescriptionOperationnelle()` ?

#### 3. Impact sur filtres services
- [ ] La fonctionnalité modifie l'affichage Technique ou Ménage ?
- [ ] Si OUI: respecte-t-elle le filtre `statut !== 'ANNULEE'` ?
- [ ] Si OUI: gère-t-elle les WorkItems SANS intervention_client_id (missions Direction) ?

#### 4. Impact sur Bureau
- [ ] La fonctionnalité impacte le suivi Bureau ?
- [ ] Si OUI: les notifications sont-elles créées ?
- [ ] Si OUI: les HistoriqueEvent sont-ils enregistrés ?

#### 5. Impact sur QA
- [ ] La fonctionnalité exécute-t-elle validateBeforeWorkItemCreation() ?
- [ ] Si OUI: uniquement sur CREATE/UPDATE/TRANSITION ?
- [ ] Si OUI: JAMAIS sur READ (useQuery, list, filter) ?

---

## 🔍 GRILLE D'ANALYSE RAPIDE

| Question | Si OUI → Action obligatoire |
|----------|----------------------------|
| Crée des WorkItems ? | Vérifier champs obligatoires + description_operationnelle |
| Modifie workflow Direction ? | Vérifier propagation datePlanifiee |
| Modifie affichage Services ? | Vérifier filtre anti-orphelins |
| Modifie suivi client ? | Vérifier synchronisation SuiviInventaire |
| Ajoute validation métier ? | Vérifier que QA ne s'exécute PAS sur READ |

---

## 🛠️ PROCESS DE MODIFICATION

### Étape 1: Analyse d'impact
```markdown
## Modification: [Titre de la fonctionnalité]

### Impact WorkItem
- Crée des WorkItems: OUI/NON
- Modifie des WorkItems: OUI/NON
- Champs modifiés: [liste]

### Impact QA
- Exécute QA: OUI/NON
- Contexte: CREATE/UPDATE/READ

### Impact Flux
- Direction: OUI/NON
- Inventaire: OUI/NON
- Signalement: OUI/NON
- Services: OUI/NON
- Suivi client: OUI/NON

### Risque de régression
- Faible / Moyen / Élevé
```

### Étape 2: Tests pré-modification
- Exécuter les 3 tests de non-régression (TESTS_NON_REGRESSION.md)
- Documenter les résultats: TOUS ✅ PASS

### Étape 3: Modification
- Appliquer les changements
- Respecter REGLES_WORKITEM.md

### Étape 4: Tests post-modification
- Réexécuter les 3 tests de non-régression
- Si UN SEUL échoue → Rollback ou correction

### Étape 5: Validation finale
- Comparer avec BASELINE_VALIDATION.md
- Documenter les changements
- Mettre à jour le changelog

---

## 🚨 SIGNAUX D'ALERTE RÉGRESSION

### 🔴 CRITIQUE - Arrêter immédiatement
- Erreur QA sur READ (pages Technique/Ménage)
- WorkItem créé sans description_operationnelle
- Intervention invisible côté services
- Crash lors de création inventaire

### 🟠 AVERTISSEMENT - Vérifier
- Nouvelle propriété WorkItem non documentée
- Modification du filtre anti-orphelins
- Changement dans workItemFactory sans tests
- Modification ValidationRulesV2 sans validation

### 🟢 MINEUR - OK mais documenter
- Ajout champ optionnel WorkItem
- Amélioration UI sans impact données
- Optimisation requêtes

---

## 📊 EXEMPLES DE MODIFICATIONS VALIDES

### ✅ MODIFICATION SÛRE (respecte les règles)
```javascript
// Ajout d'un champ optionnel
await base44.entities.WorkItem.create({
  // ... tous les champs obligatoires ...
  description_operationnelle: descriptionOperationnelle,  // ✅
  service: "TECHNIQUE",  // ✅
  hebergement: "M03",  // ✅
  
  // Nouveau champ optionnel OK
  photo_avant_url: photoUrl,  // ✅ Optionnel, pas de régression
});
```

### ❌ MODIFICATION DANGEREUSE (casse les règles)
```javascript
// Suppression validation description_operationnelle
// ❌ INTERDIT - Casse la Règle #2
await base44.entities.WorkItem.create({
  service: "TECHNIQUE",
  hebergement: "M03",
  // description_operationnelle: MANQUANT ❌
});
```

---

## 🔐 CONTRAT D'ÉQUIPE

**Toute personne modifiant le code s'engage à**:
1. Lire REGLES_WORKITEM.md avant toute modification
2. Exécuter les 3 tests de non-régression si impact WorkItem
3. Ne JAMAIS bypasser la validation QA
4. Documenter les changements dans BASELINE_VALIDATION.md

**En cas de doute**: comparer avec la baseline du 2026-01-20.

---

## 📝 CHANGELOG ÉVOLUTIF

### 2026-01-20 - v1.0 (baseline)
- ✅ Règles WorkItem figées
- ✅ 3 tests de non-régression définis
- ✅ Baseline fonctionnelle validée
- 🔒 Application certifiée stable

### Format pour futures évolutions
```
### [DATE] - v[VERSION]
- ✅ Fonctionnalité ajoutée: [description]
- ✅ Tests exécutés: [3/3 PASS]
- ✅ Impact WorkItem: [aucun/mineur/majeur]
- ✅ Régression détectée: [aucune/corrigée]
```

---

## 🎯 RÉSUMÉ EN 3 POINTS

1. **Avant modification**: Checklist + analyse d'impact
2. **Pendant modification**: Respecter REGLES_WORKITEM.md
3. **Après modification**: 3 tests de non-régression OBLIGATOIRES

**Aucune exception tolérée.**