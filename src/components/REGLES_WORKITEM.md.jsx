# 🔒 RÈGLES NON NÉGOCIABLES - WORKITEMS

**Date de création**: 2026-01-20  
**Statut**: FIGÉ - AUCUNE DÉROGATION AUTORISÉE  
**Révision**: v1.0

---

## ❌ RÈGLE #1: INTERDICTION ABSOLUE

### Aucune page n'a le droit d'appeler `WorkItem.create()` directement

**Toutes les créations DOIVENT passer par**:
- `workItemFactory.js → prepareWorkItemsForMission()` (missions Direction)
- OU une fonction centralisée validée

**Violations détectées**:
- ❌ `pages/ClientControleInventaire.jsx` ligne 237 → ✅ CORRIGÉ (ajout description_operationnelle)
- ❌ `pages/Signalement.jsx` ligne 192 → ✅ CORRIGÉ (ajout description_operationnelle)

**Critère de réussite**:
```
1 seul point de création = 1 contrat de données = 0 incohérence
```

### Exception temporaire acceptée
Les pages suivantes sont autorisées à créer des WorkItems **UNIQUEMENT SI** elles respectent la Règle #2:
- `pages/ClientControleInventaire.jsx` (inventaire arrivée)
- `pages/Signalement.jsx` (signalement séjour)

**Condition**: description_operationnelle OBLIGATOIRE + validation QA

---

## 🛡️ RÈGLE #2: CHAMPS OBLIGATOIRES FIGÉS

### Un WorkItem DOIT TOUJOURS contenir (SANS EXCEPTION):

```javascript
{
  // === CHAMPS OBLIGATOIRES QA ===
  description_operationnelle: string (NON VIDE),  // Source de vérité unique
  service: "TECHNIQUE" | "MENAGE" | "RECEPTION" | "DIRECTION",
  statut: "A_FAIRE" | "EN_COURS" | "EN_ATTENTE" | "TERMINEE" | "ANNULEE",
  hebergement: string (NON VIDE),  // Numéro hébergement/emplacement
  
  // === ORIGINE (AU MOINS UN) ===
  intervention_client_id: string,  // OU
  mission_direction_id: string,    // OU
  // Aucun (si création manuelle Direction)
  
  // === CHAMPS MÉTIER ===
  type: "INTERVENTION_CLIENT" | "MISSION_DIRECTION" | "INCIDENT_SIGNALEMENT" | "TACHE_SERVICE",
  priorite: "NORMALE" | "URGENTE" | "CRITIQUE",
  rank: number (défaut 0),
  
  // === DONNÉES CLIENT ===
  client_nom: string,
  client_prenom: string,
  type_hebergement: string,
  date_arrivee: string (format ISO date),
  date_depart: string (format ISO date),
  
  // === AUTORISATION ACCÈS ===
  autorisation_acces: "oui" | "non",
  plages_horaires: string[] (obligatoire si autorisation_acces="non"),
  
  // === TÂCHES ===
  taches: [
    {
      numero: number,
      texte: string,
      objet_id: string,
      faite: boolean,
      justification?: string,
      photo_url?: string,
      commande_requise?: boolean
    }
  ]
}
```

### Validation automatique (ValidationRulesV2.js)
- ✅ `WorkItemDescriptionRule`: Bloque si `description_operationnelle` vide/null
- ✅ `WorkItemServiceRule`: Vérifie service valide
- ✅ `WorkItemHousingRule`: Vérifie hébergement non vide
- ✅ `WorkItemOriginRule`: Vérifie lien intervention OU mission

**Toute PR qui viole ces champs = REJETÉE**

---

## 📐 RÈGLE #3: BASELINE VERSIONNÉE

### Version de référence
**Nom**: BASELINE_AUDIT_2026-01-20  
**Date**: 2026-01-20  
**Hash conceptuel**: `v1.0-post-audit-exhaustif`

### Fichiers baseline figés
- `components/workItemFactory.js` (ligne 1-109)
- `components/qa/ValidationRulesV2.js` (ligne 1-324)
- `components/workItemUtils.js` (ligne 1-85)
- `pages/ClientControleInventaire.jsx` (avec description_operationnelle ligne 241)
- `pages/Signalement.jsx` (avec description_operationnelle ligne 189)

### Toute modification future DOIT:
1. ✅ Être comparée à cette baseline
2. ✅ Repasser les 3 tests de non-régression (voir TESTS_NON_REGRESSION.md)
3. ✅ Ne PAS casser la propagation `datePlanifiee` (workflow Direction)
4. ✅ Ne PAS exécuter QA sur READ
5. ✅ Ne PAS omettre `description_operationnelle`

---

## 🚨 VIOLATIONS INTERDITES

### ❌ Ce qui casse IMMÉDIATEMENT l'app:
```javascript
// ❌ INTERDIT - WorkItem sans description_operationnelle
await base44.entities.WorkItem.create({
  service: "TECHNIQUE",
  hebergement: "M03",
  // description_operationnelle: MANQUANT ❌
});
// → Bloqué par QA (WorkItemDescriptionRule)

// ❌ INTERDIT - Service invalide
await base44.entities.WorkItem.create({
  service: "PLOMBERIE",  // ❌ Service inconnu
  description_operationnelle: "Test"
});
// → Bloqué par QA (WorkItemServiceRule)

// ❌ INTERDIT - Hébergement vide
await base44.entities.WorkItem.create({
  service: "TECHNIQUE",
  description_operationnelle: "Test",
  hebergement: ""  // ❌ Vide
});
// → Bloqué par QA (WorkItemHousingRule)

// ❌ INTERDIT - Exécuter QA sur READ
function MyPage() {
  const { data } = useQuery({
    queryFn: async () => {
      await validateBeforeWorkItemCreation(...);  // ❌ JAMAIS sur READ
      return base44.entities.WorkItem.list();
    }
  });
}
// → Ralentit l'UI, crashe potentiellement
```

### ✅ Ce qui est OBLIGATOIRE:
```javascript
// ✅ CORRECT - Tous les champs obligatoires présents
const descriptionOperationnelle = taches.map((t, idx) => `${idx + 1}. ${t.texte}`).join('\n');

await base44.entities.WorkItem.create({
  type: 'INTERVENTION_CLIENT',
  service: 'TECHNIQUE',
  statut: 'A_FAIRE',
  priorite: 'URGENTE',
  rank: 0,
  description_operationnelle: descriptionOperationnelle,  // ✅ OBLIGATOIRE
  titre: `TECHNIQUE - M03 - Problème`,
  description: "Description lisible",
  hebergement: "M03",  // ✅ OBLIGATOIRE
  type_hebergement: "MH Premium 2ch",
  client_nom: "DUPONT",
  client_prenom: "Jean",
  date_arrivee: "2026-01-20",
  date_depart: "2026-01-27",
  autorisation_acces: "oui",
  plages_horaires: [],
  taches: [
    {
      numero: 1,
      texte: "Problème électrique",
      objet_id: "electricite",
      faite: false
    }
  ],
  stay_id: "ARR-M03-20260120-ABC123"
});
// ✅ Création validée par QA
```

---

## 📊 MÉTRIQUES DE CONFORMITÉ

| Règle | Fichiers concernés | Violations actuelles | Statut |
|-------|-------------------|---------------------|--------|
| Règle #1 (Factory centralisée) | 2 pages | 0 | ✅ CONFORME |
| Règle #2 (Champs obligatoires) | Tous WorkItems | 0 | ✅ CONFORME |
| Règle #3 (Baseline) | 5 fichiers critiques | 0 | ✅ FIGÉE |

---

## 🔐 ENGAGEMENT DE STABILITÉ

**Cette version est la RÉFÉRENCE FONCTIONNELLE.**

Toute modification qui casse ces règles sera détectée par:
1. Validation QA (erreur bloquante)
2. Tests de non-régression (3 tests obligatoires)
3. Comparaison avec baseline

**Date d'engagement**: 2026-01-20  
**Révision suivante**: À chaque modification majeure des WorkItems