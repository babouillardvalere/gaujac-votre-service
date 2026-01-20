# 🔒 TESTS DE NON-RÉGRESSION OBLIGATOIRES

**Date création**: 2026-01-20  
**Statut**: OBLIGATOIRE AVANT TOUTE MISE EN PRODUCTION

---

## ⚠️ RÈGLE ABSOLUE

**AUCUNE modification** des flux suivants **ne peut être déployée** sans avoir exécuté l'intégralité des tests de cette checklist.

**Sanction en cas de non-respect**: Rollback immédiat en production.

---

## 📋 CHECKLIST OBLIGATOIRE

### ✅ TEST 1 - Inventaire Arrivée / Génération WorkItems

**Flux concerné**: `components/inventaire/InventaireArriveeManager.jsx`

**Déclencheur**: 
- Toute modification du flux inventaire arrivée
- Toute modification de `workItemCreator.js`
- Toute modification de `suiviEventLogger.js`

**Procédure**:
1. Ouvrir `pages/AdminLoadTest`
2. Cliquer sur **"✅ Test Inventaire Arrivée (3 tests intégrés)"**
3. Attendre résultat (5-10 secondes)

**Critères de réussite STRICTS**:
- ✅ Message "Tests réussis - 2 WorkItems créés"
- ✅ 2 WorkItems visibles (TECHNIQUE + MENAGE)
- ✅ Chaque WorkItem a `description_operationnelle` non vide
- ✅ Services corrects affectés
- ✅ SuiviEvent CREATION créés pour les 2
- ✅ Prise en charge possible sans erreur
- ❌ **AUCUN** message "intervention invalide"
- ❌ **AUCUN** "Aucune description"

**En cas d'échec**: 
- **BLOQUER** le déploiement
- Corriger immédiatement
- Rejouer jusqu'à réussite

**Vérification manuelle complémentaire**:
1. Ouvrir `pages/Technique`
2. Vérifier que le WorkItem TEST-M03 apparaît
3. Cliquer "Prendre en charge" → doit passer EN_COURS
4. Ouvrir `pages/ClientSuiviWorkItems`
5. Rechercher logement: `TEST-M03`
6. Vérifier timeline descendante avec événement CREATION

---

### ✅ TEST 2 - Timeline SuiviEvent (5 transitions)

**Flux concerné**: 
- `components/suiviEventLogger.js`
- `components/workItemUpdater.js`

**Déclencheur**:
- Toute modification des hooks de statut WorkItem
- Toute modification de l'entité SuiviEvent

**Procédure**:
1. Ouvrir `pages/AdminLoadTest`
2. Cliquer sur **"🧪 Test Timeline SuiviEvent (5 transitions)"**
3. Attendre résultat

**Critères de réussite**:
- ✅ 5 événements créés dans l'ordre strict:
  1. CREATION
  2. PRISE_EN_CHARGE
  3. MISE_EN_ATTENTE
  4. REPRISE
  5. TERMINEE
- ✅ Ordre chronologique respecté (DESC par timestamp)
- ✅ Metadata présentes (raison attente, délai, durée)
- ✅ Collaborateur visible

**En cas d'échec**: Bloquer le déploiement

---

### ✅ TEST 3 - QA Validation WorkItem

**Flux concerné**: 
- `components/qa/useQAValidation.js`
- `components/workItemCreator.js`

**Déclencheur**:
- Toute modification des règles de validation QA
- Toute modification de la factory WorkItem

**Procédure**:
1. Tenter de créer un WorkItem SANS `description_operationnelle`
2. Vérifier que la création est **BLOQUÉE**

**Critère de réussite**:
- ✅ Erreur levée: "description_operationnelle est OBLIGATOIRE"
- ❌ WorkItem NON créé en base de données

**En cas d'échec**: Bloquer le déploiement

---

## 🚨 PROCÉDURE EN CAS D'ÉCHEC

1. **STOP** - Ne pas déployer
2. **Analyser** les logs du test
3. **Corriger** le problème identifié
4. **Rejouer** tous les tests
5. **Documenter** la correction effectuée

---

## 📊 HISTORIQUE DES TESTS

| Date | Test | Résultat | Déployé | Commentaire |
|------|------|----------|---------|-------------|
| 2026-01-20 | Inventaire Arrivée | ⏸️ | Non | Test créé |
| 2026-01-20 | Timeline SuiviEvent | ⏸️ | Non | Test créé |
| 2026-01-20 | QA Validation | ⏸️ | Non | Test créé |

**Légende**: ✅ Réussi | ❌ Échoué | ⏸️ Non testé

---

## 🔐 RESPONSABILITÉS

**Avant modification du code**:
- Développeur : Identifier les tests concernés

**Après modification**:
- Développeur : Exécuter les tests obligatoires
- Développeur : Documenter les résultats dans ce fichier

**Avant déploiement**:
- Lead Dev / Admin : Vérifier que tous les tests sont ✅
- Si 1 seul test ❌ → **BLOCAGE** déploiement

---

## 📝 NOTES IMPORTANTES

### Pourquoi ces tests sont CRITIQUES

**Test 1 - Inventaire Arrivée**:
- Flux le plus utilisé en haute saison
- 40-50 arrivées/jour = 80-100 WorkItems générés
- Si description_operationnelle vide → blocage total service technique/ménage
- Impact client direct (délai intervention)

**Test 2 - Timeline SuiviEvent**:
- Traçabilité légale des interventions
- Transparence client obligatoire
- Ordre chronologique = preuve d'intervention
- Si événements manquants → perte de confiance client

**Test 3 - QA Validation**:
- Prévient la création de WorkItems invalides
- Évite les bugs en cascade
- Garantit la qualité des données

---

## 🎯 OBJECTIF FINAL

**ZÉRO RÉGRESSION** sur les flux critiques après modification du code.

**Si un test échoue**: c'est que le code n'est **PAS PRÊT** pour la production.

---

**Dernière mise à jour**: 2026-01-20  
**Validé par**: Système QA automatique