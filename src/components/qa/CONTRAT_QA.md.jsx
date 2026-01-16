# CONTRAT QA - Camping Paradis

**Version:** 1.0  
**Date:** 16 janvier 2026  
**Statut:** ACTIF

---

## RÈGLE 1 — EXÉCUTION DES TESTS

### Quand les tests s'exécutent

✅ **Tests négatifs (validations bloquantes) s'exécutent uniquement lors de:**
- Création d'un objet (Intervention, WorkItem, Mission)
- Mutation d'un objet (changement statut, mise à jour)
- Scan QA volontaire (bouton "Lancer les tests")

❌ **Tests négatifs NE s'exécutent JAMAIS sur:**
- Simple affichage de données
- Navigation entre pages
- Chargement initial de l'application

### Performance garantie

- **Temps de chargement page:** < 300ms (hors réseau)
- **Temps de navigation:** < 100ms
- **Tests volontaires uniquement:** Max 5 secondes

---

## RÈGLE 2 — PORTÉE DES VALIDATIONS

### Hors Mode QA (production normale)

**Seuls les CRITICAL bloquent:**
- ❌ Intervention sans tâches
- ❌ WorkItem sans origine (orphelin)
- ❌ Mission sans zones
- ❌ Données incohérentes bloquant l'exploitation

**Aucun log MEDIUM/HIGH/INFO en production normale**

### En Mode QA (scan volontaire)

**Tous les tests s'exécutent:**
- Tests fonctionnels positifs
- Tests négatifs (validations)
- Contrôles d'intégrité
- Vérifications de cohérence

---

## RÈGLE 3 — GRAVITÉ DES ERREURS

### Classification obligatoire

| Gravité | Critère | Impact | Blocage déploiement |
|---------|---------|--------|---------------------|
| **CRITICAL** | Empêche l'exploitation | Application inutilisable | ✅ OUI |
| **HIGH** | Impact opérationnel fort | Fonctionnalité majeure cassée | ⚠️ Recommandé |
| **MEDIUM** | Avertissement à surveiller | Dégradation expérience | ❌ Non |
| **LOW** | Informatif | Aucun impact réel | ❌ Non |
| **INFO** | Action réussie | Positif | ❌ Non |

### Exemples CRITICAL

1. **Intervention sans tâches**
   - Technicien ne sait pas quoi faire
   - Bloque exploitation terrain

2. **WorkItem orphelin**
   - Pas d'origine (Client/Direction)
   - Impossible de tracer responsabilité

3. **Mission sans zones**
   - Pas de périmètre d'action
   - Intervention impossible

4. **Description manquante**
   - Contexte insuffisant
   - Risque d'erreur terrain

---

## RÈGLE 4 — DÉPLOIEMENT

### Règle absolue

```
SI (erreurs CRITICAL ≥ 1) ALORS
  ❌ DÉPLOIEMENT INTERDIT
SINON
  ✅ DÉPLOIEMENT AUTORISÉ
FIN
```

### Vérification pré-déploiement

Avant tout déploiement:
1. Accéder à `/QASante`
2. Vérifier le badge "CRITICAL"
3. Si CRITICAL = 0 → OK
4. Si CRITICAL > 0 → BLOQUER

### Message visuel

- **0 CRITICAL:** ✅ Application exploitable - Déploiement autorisé
- **≥1 CRITICAL:** 🚨 DÉPLOIEMENT INTERDIT - X erreur(s) CRITICAL détectée(s)

---

## RÈGLE 5 — VALIDATIONS OBLIGATOIRES

### Intervention Client

**Champs obligatoires:**
- `taches` (array non vide, min 1)
- `type_hebergement`
- `numero_hebergement`
- `client_nom`
- `client_prenom`
- `service` (TECHNIQUE | MENAGE | RECEPTION)

**Validation CRITICAL:**
```javascript
if (!interventionData.taches || interventionData.taches.length === 0) {
  return ERREUR_BLOQUANTE;
}
```

### WorkItem

**Champs obligatoires:**
- Origine: `intervention_client_id` OU `mission_direction_id` OU `incident_id`
- `service`
- `titre` ou `description`
- `hebergement`

**Validation CRITICAL:**
```javascript
const hasOrigin = workItemData.intervention_client_id || 
                  workItemData.mission_direction_id || 
                  workItemData.incident_id;

if (!hasOrigin) {
  return ERREUR_BLOQUANTE;
}
```

### Mission Direction

**Champs obligatoires:**
- `zones` (array non vide, min 1)
- `type_mission`
- `titre`
- `statut`

**Validation CRITICAL:**
```javascript
if (!missionData.zones || missionData.zones.length === 0) {
  return ERREUR_BLOQUANTE;
}
```

---

## RÈGLE 6 — TESTS NÉGATIFS

### Objectif

Vérifier que les actions **interdites** sont **bloquées**.

### Tests obligatoires

1. ✅ Créer intervention SANS tâches → doit ÉCHOUER
2. ✅ Créer WorkItem SANS origine → doit ÉCHOUER
3. ✅ Créer mission SANS zones → doit ÉCHOUER
4. ⚠️ Transition statut invalide → doit AVERTIR

### Critère de succès

Un test négatif réussit si:
- L'action interdite est refusée
- Un message clair est affiché
- Aucune donnée corrompue n'est créée

---

## RÈGLE 7 — LISIBILITÉ TERRAIN

### Critère < 5 secondes

Un technicien doit comprendre l'action à mener en < 5 secondes.

**Informations visibles obligatoires:**
- 📍 Zone / Numéro hébergement
- 🏷️ Catégorie
- 📋 Description problème
- ✅ Liste tâches
- 🏷️ Origine (Client / Direction)

### Validation visuelle

```
Intervention visible = 
  ✅ Description présente
  ✅ Tâches listées
  ✅ Zone identifiable
  ✅ Origine claire
```

---

## RÈGLE 8 — LOGS

### Structure log obligatoire

```json
{
  "id": "unique-id",
  "timestamp": "ISO-8601",
  "severity": "CRITICAL | HIGH | MEDIUM | LOW | INFO",
  "type": "error | warning | api | data | success",
  "category": "intervention | navigation | auth | data_integrity | smoke_test",
  "message": "Description courte",
  "details": {
    "entity": "InterventionClient",
    "issue": "Description technique",
    "data": {...}
  },
  "user": "Nom utilisateur",
  "url": "/page/actuelle"
}
```

### Catégorisation

- **runtime:** Erreur JavaScript
- **api_error:** Échec requête API
- **data_integrity:** Donnée invalide/orpheline
- **smoke_test:** Résultat test automatisé
- **user_action:** Action utilisateur (succès)

---

## RÈGLE 9 — SMOKE TESTS

### Catalogue minimum

**Bureau:**
- ✅ Créer intervention client avec tâches
- ✅ WorkItems générés automatiquement
- ✅ Suppression en cascade

**Technique:**
- ✅ Tâches visibles dans WorkItem
- ✅ Description présente
- ✅ Prise en charge change statut
- ✅ Mise en attente fonctionne

**Direction:**
- ✅ Création mission opérationnelle
- ✅ Zones définies
- ✅ Badge origine "Direction"

**Data:**
- ✅ Aucune intervention sans tâches
- ✅ Aucun WorkItem orphelin

**Notifications:**
- ✅ Création notification
- ✅ Badge cohérent

### Fréquence d'exécution

- **Automatique:** JAMAIS (uniquement volontaire)
- **Volontaire:** Via bouton "Lancer les tests"
- **Recommandé:** Après chaque mise à jour majeure

---

## RÈGLE 10 — CRITÈRES D'ACCEPTATION

### Test "journée réelle"

Sur base de test:

1. **Créer:**
   - 1 intervention client hébergement
   - 1 intervention client emplacement
   - 1 intervention Direction

2. **Faire traiter par:**
   - Technique
   - Ménage

3. **Forcer:**
   - Une mise en attente
   - Un report
   - Une résolution

4. **Vérifier:**
   - QA = 0 erreur CRITICAL
   - Logs lisibles
   - Aucun écran ambigu

### Succès mesurable

- 🎯 **0 question terrain** (compréhension immédiate)
- 🎯 **0 correction manuelle** (workflow fluide)
- 🎯 **0 donnée orpheline** (intégrité garantie)

---

## ENGAGEMENT QUALITÉ

**Ce contrat garantit:**
1. ✅ Performance UI préservée (< 300ms)
2. ✅ Validations bloquantes actives (CRITICAL)
3. ✅ Tests négatifs exhaustifs
4. ✅ Logs classifiés et exploitables
5. ✅ Déploiement contrôlé (règle CRITICAL)

**Date de mise en application:** 16 janvier 2026  
**Responsable:** Direction Technique  
**Révision:** Mensuelle ou après incident majeur

---

*Document généré automatiquement par le système QA*