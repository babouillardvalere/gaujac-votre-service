# ✅ TESTS DE VALIDATION - ClientSuiviWorkItems.jsx

**Date**: 2026-01-20  
**Page testée**: `pages/ClientSuiviWorkItems.jsx`  
**Composant timeline**: `components/suivi/TimelineSuiviEvent.jsx`

---

## 🎯 TEST 1 — Inventaire arrivée incomplet

### Scénario
Un client arrive et signale des objets manquants/cassés lors de l'inventaire d'arrivée.
Le système génère automatiquement 2 WorkItems distincts (TECHNIQUE + MENAGE).

### Procédure

**Étape 1 - Créer un inventaire incomplet**:
1. Accéder au parcours client arrivée
2. Remplir identité client + logement (ex: M03)
3. Sur la page inventaire, signaler:
   - Objets ménage: 2 assiettes cassées, 1 draps tâché
   - Objets technique: 1 robinet qui fuit
4. Valider l'inventaire

**Résultat attendu étape 1**:
- ✅ 1 WorkItem MENAGE créé (assiettes + draps)
- ✅ 1 WorkItem TECHNIQUE créé (robinet)
- ✅ Chaque WorkItem a 1 SuiviEvent avec action=CREATION

**Étape 2 - Ouvrir ClientSuiviWorkItems.jsx**:
1. Naviguer vers `ClientSuiviWorkItems`
2. Saisir le numéro de logement: M03
3. Cliquer sur Rechercher

**Résultat attendu étape 2**:
- ✅ 2 WorkItems affichés
- ✅ Badge "Ménage" + icône 🧹 sur le premier
- ✅ Badge "Technique" + icône 🔧 sur le second
- ✅ Statut "À faire" sur les deux

**Étape 3 - Vérifier les timelines distinctes**:
1. Chaque WorkItem affiche sa propre section "Historique"
2. Timeline 1 (Ménage): 1 événement "Demande créée"
3. Timeline 2 (Technique): 1 événement "Demande créée"

**Résultat attendu étape 3**:
- ✅ Chronologies indépendantes (pas de mélange)
- ✅ Événement CREATE visible pour chacun
- ✅ Message descriptif présent (assiettes, draps, robinet)
- ✅ Service correct affiché (MENAGE / TECHNIQUE)
- ✅ Date/heure affichée

### Critères de succès
- [ ] 2 WorkItems visibles
- [ ] Chronologies distinctes et indépendantes
- [ ] CREATE visible pour chacun
- [ ] Aucune duplication
- [ ] Descriptions opérationnelles correctes

---

## 🎯 TEST 2 — Action service (EN_COURS → TERMINEE)

### Scénario
Le service technique prend en charge l'intervention, la traite, puis la termine.
Le client doit voir en temps réel l'évolution de sa demande.

### Procédure

**Étape 1 - Prise en charge**:
1. En tant que collaborateur, accéder à `pages/Technique.jsx`
2. Prendre en charge le WorkItem TECHNIQUE (robinet qui fuit)
3. Saisir nom du collaborateur: "Marc Dupont"
4. Valider

**Résultat attendu étape 1**:
- ✅ WorkItem passe statut EN_COURS
- ✅ 1 nouveau SuiviEvent créé avec action=PRISE_EN_CHARGE
- ✅ Collaborateur="Marc Dupont" enregistré

**Étape 2 - Vérifier côté client (sans refresh manuel)**:
1. Ouvrir `ClientSuiviWorkItems` (ou laisser ouvert)
2. Attendre 5 secondes (refetch automatique)

**Résultat attendu étape 2**:
- ✅ Badge passe de "À faire" à "En cours"
- ✅ Timeline affiche 2 événements:
  1. **Prise en charge** (en haut, plus récent)
  2. Demande créée (en bas, plus ancien)
- ✅ Nom "Marc Dupont" visible sur l'événement "Prise en charge"
- ✅ Icône verte sur événement de prise en charge
- ✅ Ordre chronologique strict respecté (DESC par timestamp)

**Étape 3 - Terminer l'intervention**:
1. En tant que collaborateur, terminer le WorkItem
2. Ajouter durée: 25 minutes
3. Ajouter commentaire: "Robinet remplacé"
4. Valider

**Résultat attendu étape 3**:
- ✅ WorkItem passe statut TERMINEE
- ✅ 1 nouveau SuiviEvent créé avec action=TERMINEE
- ✅ Metadata durée_minutes=25 enregistrée

**Étape 4 - Vérifier côté client**:
1. Attendre 5 secondes
2. Observer la timeline

**Résultat attendu étape 4**:
- ✅ Badge passe à "Terminée" (vert)
- ✅ Timeline affiche 3 événements dans l'ordre:
  1. **Terminée** (en haut, le plus récent)
  2. Prise en charge (milieu)
  3. Demande créée (en bas, le plus ancien)
- ✅ Durée "25 min" affichée dans metadata de l'événement TERMINEE
- ✅ Aucune duplication d'événements
- ✅ Ordre strict: timestamp DESC

### Critères de succès
- [ ] 2 nouveaux SuiviEvent visibles (PRISE_EN_CHARGE + TERMINEE)
- [ ] Ordre strict respecté (plus récent en haut)
- [ ] Acteur visible ("Marc Dupont")
- [ ] Metadata affichée (durée)
- [ ] Auto-refresh fonctionne (5s)
- [ ] Badges statut synchronisés

---

## 🎯 TEST 3 — Séjour client (Signalement → Traitement)

### Scénario
Un client en séjour signale un problème.
Vérifier que le client voit exactement la même réalité que le service.

### Procédure

**Étape 1 - Signalement client**:
1. Accéder au parcours signalement client
2. Saisir identité + logement: P12
3. Signaler problème TECHNIQUE: "Climatisation ne fonctionne pas"
4. Marquer comme urgent
5. Valider

**Résultat attendu étape 1**:
- ✅ 1 WorkItem TECHNIQUE créé
- ✅ Statut=A_FAIRE
- ✅ Priorité=URGENTE
- ✅ 1 SuiviEvent action=CREATION

**Étape 2 - Côté service (Technique)**:
1. Ouvrir `pages/Technique.jsx`
2. Vérifier que le WorkItem apparaît
3. Badge "🔴 Urgent" visible
4. Description: "Climatisation ne fonctionne pas"

**Résultat attendu étape 2**:
- ✅ WorkItem visible dans la liste Technique
- ✅ Priorité URGENTE affichée en rouge
- ✅ Description exacte

**Étape 3 - Côté client (ClientSuiviWorkItems)**:
1. Saisir logement: P12
2. Rechercher

**Résultat attendu étape 3**:
- ✅ 1 WorkItem visible
- ✅ Badge "🔴 Urgent" visible
- ✅ Description: "Climatisation ne fonctionne pas"
- ✅ Timeline: 1 événement "Demande créée"
- ✅ **État identique côté service et côté client**

**Étape 4 - Traitement par le service**:
1. Technique prend en charge (Sophie Martin)
2. Passe EN_COURS
3. Met en attente (raison: "Attente pièce climatisation", délai: "2 jours")
4. Reprend le lendemain
5. Termine (durée: 45 min)

**Résultat attendu étape 4 - Vue service**:
- ✅ Statut=TERMINEE
- ✅ 5 événements dans timeline interne:
  1. TERMINEE
  2. REPRISE
  3. MISE_EN_ATTENTE
  4. PRISE_EN_CHARGE
  5. CREATION

**Étape 5 - Vérifier côté client**:
1. Rafraîchir ClientSuiviWorkItems
2. Observer timeline

**Résultat attendu étape 5 - Vue client**:
- ✅ Badge "Terminée" (vert)
- ✅ **Exactement 5 événements** dans le même ordre:
  1. Terminée (avec durée 45 min)
  2. Reprise
  3. Mise en attente (avec raison + délai)
  4. Prise en charge (avec "Sophie Martin")
  5. Demande créée
- ✅ **Aucune divergence d'état**
- ✅ Metadata complètes affichées (raison attente, délai, durée)

### Critères de succès
- [ ] Client voit la même réalité que le service
- [ ] Aucune divergence d'état (statut, priorité, description)
- [ ] Timeline client = Timeline service (même ordre, mêmes événements)
- [ ] Metadata visibles et cohérentes
- [ ] Pas d'événements manquants
- [ ] Pas d'événements en double
- [ ] Synchronisation temps réel (5s max)

---

## 📊 RAPPORT DE VALIDATION FINALE

**À compléter après exécution des 3 tests**:

| Test | Statut | Commentaires |
|------|--------|--------------|
| **Test 1** - Inventaire arrivée | ⏸️ | |
| → 2 WorkItems visibles | ⏸️ | |
| → Chronologies distinctes | ⏸️ | |
| → CREATE visible | ⏸️ | |
| **Test 2** - Actions service | ⏸️ | |
| → PRISE_EN_CHARGE visible | ⏸️ | |
| → TERMINEE visible | ⏸️ | |
| → Ordre strict respecté | ⏸️ | |
| → Acteur visible | ⏸️ | |
| **Test 3** - Séjour client | ⏸️ | |
| → Même réalité service/client | ⏸️ | |
| → Aucune divergence | ⏸️ | |
| → Timeline complète | ⏸️ | |

**Statuts**: ⏸️ Non testé | ✅ Réussi | ❌ Échoué | ⚠️ Partiel

---

## 🚨 PROBLÈMES CONNUS À VÉRIFIER

### Performance
- [ ] Temps de chargement < 2s pour 10 WorkItems
- [ ] Pas de lag lors du refetch auto (5s)
- [ ] Filtrage par logement efficace

### Edge cases
- [ ] Logement avec 0 WorkItem (message "Aucune demande")
- [ ] WorkItem sans SuiviEvent (fallback "Aucun événement")
- [ ] Logement non trouvé (message clair)
- [ ] Recherche avec casse différente (M03 vs m03)

### UX
- [ ] Loading spinner visible pendant recherche
- [ ] Messages d'erreur clairs
- [ ] Traduction FR/EN fonctionnelle
- [ ] Responsive mobile

---

## ✅ CRITÈRES DE VALIDATION GLOBALE

Pour valider la mise en production de `ClientSuiviWorkItems.jsx`:

- [ ] Les 3 tests passent à 100%
- [ ] Aucune régression sur `ClientSuiviDetail.jsx` (anciennes Intervention)
- [ ] Performance acceptable (< 2s)
- [ ] Auto-refresh fonctionne
- [ ] Timeline synchronisée service/client
- [ ] Pas de duplication d'événements
- [ ] Ordre chronologique strict
- [ ] Metadata affichées correctement

**Décision finale**: ⏸️ En attente tests

**Date validation**: _____________

**Validé par**: _____________