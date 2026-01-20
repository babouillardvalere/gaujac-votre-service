# 🧪 TESTS DE NON-RÉGRESSION OBLIGATOIRES

**Version**: 1.0  
**Date**: 2026-01-20  
**Objectif**: Garantir la stabilité après chaque modification majeure

---

## 🎯 QUAND EXÉCUTER CES TESTS

**OBLIGATOIRE avant tout merge/déploiement si modification de**:
- `components/workItemFactory.js`
- `components/qa/ValidationRulesV2.js`
- `pages/ClientControleInventaire.jsx`
- `pages/Signalement.jsx`
- `pages/Technique.jsx` ou `pages/Menage.jsx`
- Tout workflow Direction (DirectionInterventions → DirectionRecapIntervention)

**Durée estimée**: 5-10 minutes par test (manuel)

---

## 📋 TEST #1: INVENTAIRE ARRIVÉE → SERVICE

### Objectif
Vérifier que le flux complet inventaire fonctionne sans interventions fantômes ni invisibles.

### Procédure
1. **Créer une arrivée avec inventaire incomplet**:
   - Nom: `TEST_REGRESSION`
   - Prénom: `Audit`
   - Hébergement: `TEST_INV01`
   - Catégorie: `MH Premium 2ch`
   - Dates: `2026-01-20` → `2026-01-27`
   - Anomalies:
     - 🛏 Lit double défectueux (TECHNIQUE)
     - 🍽 Vaisselle manquante x3 (MENAGE)

2. **Valider la création**:
   ```javascript
   // Console développeur
   const ficheArrivee = await base44.entities.FicheArrivee.filter({ numero_logement: "TEST_INV01" });
   console.assert(ficheArrivee.length === 1, "1 FicheArrivee attendue");
   
   const workItemsTech = await base44.entities.WorkItem.filter({ hebergement: "TEST_INV01", service: "TECHNIQUE" });
   console.assert(workItemsTech.length === 1, "1 WorkItem TECHNIQUE attendu");
   console.assert(workItemsTech[0].description_operationnelle, "description_operationnelle OBLIGATOIRE");
   
   const workItemsMenage = await base44.entities.WorkItem.filter({ hebergement: "TEST_INV01", service: "MENAGE" });
   console.assert(workItemsMenage.length === 1, "1 WorkItem MENAGE attendu");
   console.assert(workItemsMenage[0].description_operationnelle, "description_operationnelle OBLIGATOIRE");
   
   const suiviInventaire = await base44.entities.SuiviInventaire.filter({ logement: "TEST_INV01" });
   console.assert(suiviInventaire.length === 1, "1 SuiviInventaire attendu");
   console.assert(suiviInventaire[0].items_menage.length === 1, "Items ménage présents");
   console.assert(suiviInventaire[0].items_technique.length === 1, "Items technique présents");
   ```

3. **Vérifier côté services**:
   - Aller sur `pages/Technique`
   - Vérifier que le WorkItem TEST_INV01 est visible
   - Vérifier que la description est lisible (pas "undefined")
   - Même chose sur `pages/Menage`

### Critères de réussite (TOUS obligatoires)
- ✅ 0 intervention fantôme (toutes ont description_operationnelle)
- ✅ 0 intervention invisible (affichées en Technique ET Ménage)
- ✅ SuiviInventaire créé avec timeline initiale
- ✅ Pas d'erreur QA bloquante

### Résultat attendu
```
✅ PASS - Inventaire → WorkItems → Services → Suivi client OK
```

---

## 📋 TEST #2: SIGNALEMENT SÉJOUR → CLÔTURE → SUIVI CLIENT

### Objectif
Vérifier la cohérence des statuts de bout en bout (création → clôture).

### Procédure
1. **Créer un signalement séjour**:
   - Page: `Signalement.jsx`
   - Client: `SEJOUR_TEST`
   - Hébergement: `TEST_SEJ01`
   - Problème: ⚡ Électricité (URGENT)
   - Autorisation: NON (plage 09h00 → 11h00)
   - Description: "Panne électricité totale"

2. **Valider la création**:
   ```javascript
   const workItems = await base44.entities.WorkItem.filter({ hebergement: "TEST_SEJ01" });
   console.assert(workItems.length === 1, "1 WorkItem attendu");
   console.assert(workItems[0].description_operationnelle, "description_operationnelle OBLIGATOIRE");
   console.assert(workItems[0].priorite === "URGENTE", "Priorité URGENTE");
   console.assert(workItems[0].autorisation_acces === "non", "Autorisation NON");
   console.assert(workItems[0].plages_horaires.length === 1, "Plage horaire présente");
   ```

3. **Simuler prise en charge (page Technique)**:
   ```javascript
   await base44.entities.WorkItem.update(workItems[0].id, {
     statut: "EN_COURS",
     collaborateur: "Agent TEST",
     date_prise_en_charge: new Date().toISOString()
   });
   
   // Vérifier: pas d'erreur QA, statut mis à jour
   const updated = await base44.entities.WorkItem.filter({ hebergement: "TEST_SEJ01" });
   console.assert(updated[0].statut === "EN_COURS", "Statut EN_COURS");
   console.assert(updated[0].collaborateur === "Agent TEST", "Collaborateur assigné");
   ```

4. **Simuler clôture**:
   ```javascript
   await base44.entities.WorkItem.update(workItems[0].id, {
     statut: "TERMINEE",
     date_terminee: new Date().toISOString(),
     duree_minutes: 45
   });
   
   // Vérifier: statut final cohérent
   const final = await base44.entities.WorkItem.filter({ hebergement: "TEST_SEJ01" });
   console.assert(final[0].statut === "TERMINEE", "Statut TERMINEE");
   console.assert(final[0].duree_minutes === 45, "Durée enregistrée");
   ```

5. **Vérifier suivi client (si SuiviInventaire existe)**:
   - Aller sur `pages/SuiviIntervention.jsx`
   - Rechercher TEST_SEJ01
   - Vérifier statut affiché = "TERMINEE"

### Critères de réussite (TOUS obligatoires)
- ✅ Création WorkItem avec description_operationnelle
- ✅ Transition A_FAIRE → EN_COURS sans erreur QA
- ✅ Transition EN_COURS → TERMINEE sans erreur QA
- ✅ Statut cohérent partout (WorkItem / page Technique / suivi client)
- ✅ Autorisation accès respectée (plages_horaires affichées)

### Résultat attendu
```
✅ PASS - Signalement → Prise en charge → Clôture → Cohérence totale
```

---

## 📋 TEST #3: MISSION DIRECTION MULTI-ZONES → BUREAU + SERVICES

### Objectif
Vérifier que les missions Direction génèrent correctement les WorkItems et sont visibles partout.

### Procédure
1. **Créer une mission Direction**:
   - Page: `DirectionInterventions.jsx`
   - Type: INTERVENTION
   - Date planifiée: `2026-01-25`
   - Hébergement: MH Premium 2ch
   - Numéros: `TEST_DIR01`, `TEST_DIR02` (2 zones)
   - Tâches:
     - Vérifier état général
     - Contrôle électricité
   - Service assigné: TECHNIQUE

2. **Valider la génération**:
   ```javascript
   // Récap doit afficher 2 interventions (1 par zone)
   // Cliquer "Confirmer"
   
   // Vérifier création WorkItems
   const workItemsDir = await base44.entities.WorkItem.filter({ type: "MISSION_DIRECTION" });
   const testDirItems = workItemsDir.filter(w => 
     w.hebergement === "TEST_DIR01" || w.hebergement === "TEST_DIR02"
   );
   
   console.assert(testDirItems.length === 2, "2 WorkItems attendus (1 par zone)");
   testDirItems.forEach(wi => {
     console.assert(wi.description_operationnelle, "description_operationnelle présente");
     console.assert(wi.service === "TECHNIQUE", "Service TECHNIQUE");
     console.assert(wi.statut === "A_FAIRE", "Statut initial A_FAIRE");
   });
   ```

3. **Vérifier visibilité Bureau**:
   - Aller sur `pages/Bureau.jsx`
   - Onglet "Missions"
   - Vérifier présence de TEST_DIR01 et TEST_DIR02

4. **Vérifier visibilité Services**:
   - Aller sur `pages/Technique.jsx`
   - Vérifier présence des 2 WorkItems
   - Vérifier description lisible (pas "undefined")

### Critères de réussite (TOUS obligatoires)
- ✅ 1 zone = 1 WorkItem (2 zones = 2 WorkItems)
- ✅ Tous les WorkItems ont description_operationnelle
- ✅ Propagation datePlanifiee correcte
- ✅ Visible Bureau ET Services
- ✅ Pas de blocage QA sur affichage (READ)

### Résultat attendu
```
✅ PASS - Direction multi-zones → Bureau OK → Services OK
```

---

## 🔒 PROTOCOLE DE VALIDATION

### Avant chaque modification majeure:
1. Créer une branche de test
2. Appliquer la modification
3. Exécuter les 3 tests ci-dessus
4. Documenter les résultats

### Si UN SEUL test échoue:
- ❌ Ne PAS merger
- Analyser la régression
- Corriger
- Réexécuter tous les tests

### Si TOUS les tests passent:
- ✅ Merge autorisé
- Mettre à jour BASELINE_VALIDATION.md
- Incrémenter version

---

## 📊 HISTORIQUE DES TESTS

| Date | Version | Test #1 | Test #2 | Test #3 | Résultat global |
|------|---------|---------|---------|---------|----------------|
| 2026-01-20 | v1.0 (baseline) | ✅ PASS | ✅ PASS | ✅ PASS | ✅ VALIDÉ |

---

## 🚨 ALERTE RÉGRESSION

**Si une modification casse un test**:
1. Comparer le code modifié avec BASELINE_VALIDATION.md
2. Vérifier les champs obligatoires (REGLES_WORKITEM.md)
3. Vérifier les logs QA (ne doit jamais bloquer sur READ)
4. Restaurer la baseline si nécessaire

**Aucune tolérance**: les 3 tests DOIVENT passer à 100%.