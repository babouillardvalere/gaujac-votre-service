# 📋 CORRECTIONS BUREAU - HISTORIQUE & INTERVENTIONS

**Date** : 13 janvier 2026  
**Fichiers corrigés** : `components/bureau/BureauHistorique.jsx`, `pages/Bureau.jsx`  
**Priorité** : 🔴 CRITIQUE  
**Statut** : ✅ Corrections appliquées

---

## 🎯 OBJECTIF CORRECTION

Garantir que l'historique Bureau affiche **TOUS les WorkItems** (interventions arrivée + missions) et pas seulement les `Incident` (signalements séjour).

**Règle métier** :
- 🎯 Onglet "Interventions" = WorkItems ACTIFS (A_FAIRE, EN_COURS, EN_ATTENTE)
- 📋 Onglet "Historique" = WorkItems + HistoriqueEvent + Incident (TOUS)

---

## 🔴 PROBLÈME INITIAL

### BureauHistorique.jsx (AVANT)

**Code L34-38** :
```javascript
const { data: incidents = [], isLoading } = useQuery({
  queryKey: ['all-incidents'],
  queryFn: () => base44.entities.Incident.filter({}, '-created_date', 1000),
  staleTime: 60000
});
```

**Impact** :
- ❌ Lit UNIQUEMENT `Incident` (signalements directs clients pendant séjour)
- ❌ Ne voit PAS les WorkItems (interventions arrivée : lits, vaisselle, etc.)
- ❌ Historique incomplet et trompeur

**Exemple concret** :
```
Base de données contient :
- 10 Incident (signalements séjour)
- 50 WorkItems (arrivées validées : 20 TECHNIQUE, 20 MENAGE, 10 RECEPTION)

Affichage BureauHistorique AVANT :
- Historique : 10 lignes (seulement Incident)
- Manquant : 50 WorkItems ❌
```

---

### Bureau.jsx - Onglet Interventions (AVANT)

**Code L160-175** :
```javascript
const { data: interventionsClients = [], isLoading: loadingInterventions } = useQuery({
  queryKey: ['bureau-interventions-clients'],
  queryFn: async () => {
    const data = await base44.entities.InterventionClient.filter({}, '-created_date', 250);
    return data;
  }
});
```

**Impact** :
- ✅ Lit `InterventionClient` (correct pour interventions direction)
- ❌ MAIS ne lit PAS les `WorkItem` (créés lors arrivées)
- ❌ Compteur "🎯 Interventions" faux

**Exemple** :
```
Base de données :
- 5 InterventionClient (missions direction)
- 30 WorkItems (arrivées : 10 A_FAIRE, 15 EN_COURS, 5 TERMINEE)

Affichage onglet Interventions AVANT :
- Compteur : (5)  ← Devrait être (35) si inclut WorkItems actifs
- Liste : 5 lignes ← Devrait être 35 lignes
```

---

## ✅ CORRECTIONS APPLIQUÉES

### 1️⃣ BureauHistorique.jsx : Ajout récupération WorkItems

**AVANT (L34-43)** :
```javascript
const { data: incidents = [], isLoading } = useQuery({
  queryKey: ['all-incidents'],
  queryFn: () => base44.entities.Incident.filter({}, '-created_date', 1000),
  staleTime: 60000
});

const { data: avis = [] } = useQuery({
  queryKey: ['all-avis'],
  queryFn: () => base44.entities.Avis.filter({}, '-created_date', 500)
});
```

**APRÈS** :
```javascript
const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
  queryKey: ['all-incidents'],
  queryFn: async () => {
    console.log('🔍 FETCH Incidents pour historique');
    const result = await base44.entities.Incident.filter({}, '-created_date', 1000);
    console.log('✅ Incidents récupérés:', result.length);
    return result;
  },
  staleTime: 60000
});

const { data: workItems = [], isLoading: loadingWorkItems } = useQuery({
  queryKey: ['all-workitems-bureau'],
  queryFn: async () => {
    console.log('🔍 FETCH WorkItems pour historique');
    const result = await base44.entities.WorkItem.filter({}, '-created_date', 1000);
    console.log('✅ WorkItems récupérés:', result.length);
    return result;
  },
  staleTime: 60000
});

const { data: avis = [] } = useQuery({
  queryKey: ['all-avis'],
  queryFn: () => base44.entities.Avis.filter({}, '-created_date', 500)
});

const isLoading = loadingIncidents || loadingWorkItems;
```

**✅ Changements** :
- Ajout query `workItems`
- Logs de debug
- isLoading combiné

---

### 2️⃣ BureauHistorique.jsx : Conversion WorkItems → format Incident

**Ajouté après récupération (nouvelle section)** :
```javascript
// Convertir WorkItems en format compatible Incident pour affichage
const convertedWorkItems = workItems.map(wi => ({
  id: wi.id,
  created_date: wi.created_date,
  hebergement_numero: wi.hebergement,
  client_nom: wi.client_nom,
  client_prenom: wi.client_prenom,
  date_arrivee: wi.date_arrivee,
  date_depart: wi.date_depart,
  categorie_probleme: wi.type === 'INTERVENTION_CLIENT' ? 'inventaire_arrivee' : 
                      wi.type === 'MISSION_DIRECTION' ? 'mission_direction' : 'autre',
  sous_categorie: wi.service?.toLowerCase() || 'divers',
  statut: wi.statut === 'A_FAIRE' ? 'nouveau' :
          wi.statut === 'EN_COURS' ? 'en_cours' :
          wi.statut === 'EN_ATTENTE' ? 'en_attente' :
          wi.statut === 'TERMINEE' ? 'termine' : 'nouveau',
  probleme_urgent: wi.priorite === 'URGENTE',
  duree_minutes: wi.duree_minutes,
  pris_par: wi.collaborateur,
  isWorkItem: true,
  workItemData: wi
}));

// Fusionner Incidents + WorkItems convertis
const allInterventions = [...incidents, ...convertedWorkItems];
console.log('📊 Historique total:', {
  incidents: incidents.length,
  workItems: workItems.length,
  total: allInterventions.length
});
```

**Mapping statuts** :
| WorkItem.statut | Incident.statut (affiché) |
|-----------------|---------------------------|
| A_FAIRE | nouveau |
| EN_COURS | en_cours |
| EN_ATTENTE | en_attente |
| TERMINEE | termine |

---

### 3️⃣ BureauHistorique.jsx : Utiliser allInterventions dans filtres

**AVANT** :
```javascript
const filteredIncidents = incidents.filter(incident => {
```

**APRÈS** :
```javascript
const filteredIncidents = allInterventions.filter(incident => {
```

---

### 4️⃣ BureauHistorique.jsx : Affichage différencié WorkItems

**Colonne "Type" (L207-213)** :

**AVANT** :
```javascript
<Badge variant="outline" className="text-xs">
  {t(incident.sous_categorie)}
</Badge>
```

**APRÈS** :
```javascript
<Badge variant="outline" className="text-xs">
  {incident.isWorkItem ? (
    incident.workItemData?.type === 'INTERVENTION_CLIENT' ? 'Arrivée' : 
    incident.workItemData?.service || 'Divers'
  ) : (
    t(incident.sous_categorie)
  )}
</Badge>
```

**Résultat visuel** :
- Incident signalement → Badge "Plomberie", "Ménage", etc.
- WorkItem arrivée → Badge "Arrivée" ou "TECHNIQUE", "MENAGE"

---

### 5️⃣ BureauHistorique.jsx : Détail WorkItem dans dialog

**Section Description (L286-290)** :

**AVANT** :
```javascript
<div>
  <h4 className="font-medium mb-2">Description du problème</h4>
  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.description_probleme}</p>
</div>
```

**APRÈS** :
```javascript
{selectedIncident.isWorkItem && selectedIncident.workItemData ? (
  <div>
    <h4 className="font-medium mb-2">Description</h4>
    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.workItemData.description || '-'}</p>
    {selectedIncident.workItemData.taches?.length > 0 && (
      <div className="mt-3 space-y-2">
        <h5 className="text-sm font-medium text-slate-500">Tâches :</h5>
        {selectedIncident.workItemData.taches.map((t, idx) => (
          <div key={idx} className="bg-slate-50 p-2 rounded text-sm">
            <span className="font-medium">#{t.numero}</span> {t.texte}
            {t.faite && <span className="ml-2 text-green-600">✓ Faite</span>}
          </div>
        ))}
      </div>
    )}
  </div>
) : (
  <div>
    <h4 className="font-medium mb-2">Description du problème</h4>
    <p className="text-slate-600 bg-slate-50 p-3 rounded-lg">{selectedIncident.description_probleme}</p>
  </div>
)}
```

**Résultat** :
- Si WorkItem : affiche description + liste tâches avec statut
- Si Incident : affiche description classique

---

### 6️⃣ Bureau.jsx : Ajout récupération WorkItems

**Code L160-175 (AVANT)** :
```javascript
const { data: interventionsClients = [], isLoading: loadingInterventions } = useQuery({
  queryKey: ['bureau-interventions-clients'],
  queryFn: async () => {
    const data = await base44.entities.InterventionClient.filter({}, '-created_date', 250);
    console.log('[BUREAU] InterventionClient récupérées:', data.length);
    console.log('[BUREAU] Détail par statut:', { ... });
    return data;
  }
});
```

**Code (APRÈS)** :
```javascript
const { data: workItemsBureau = [], isLoading: loadingWorkItems } = useQuery({
  queryKey: ['bureau-workitems'],
  queryFn: async () => {
    const data = await base44.entities.WorkItem.filter({}, '-created_date', 250);
    console.log('[BUREAU] WorkItems récupérés:', data.length);
    console.log('[BUREAU] Détail par statut:', {
      A_FAIRE: data.filter(i => i.statut === 'A_FAIRE').length,
      EN_COURS: data.filter(i => i.statut === 'EN_COURS').length,
      EN_ATTENTE: data.filter(i => i.statut === 'EN_ATTENTE').length,
      TERMINEE: data.filter(i => i.statut === 'TERMINEE').length
    });
    return data;
  },
  refetchInterval: 30000,
  staleTime: 20000
});

const { data: interventionsClients = [], isLoading: loadingInterventions } = useQuery({
  queryKey: ['bureau-interventions-clients'],
  queryFn: async () => {
    const data = await base44.entities.InterventionClient.filter({}, '-created_date', 250);
    console.log('[BUREAU] InterventionClient récupérées:', data.length);
    return data;
  },
  refetchInterval: 30000,
  staleTime: 20000
});
```

---

### 7️⃣ Bureau.jsx : Conversion WorkItems → format InterventionClient

**Ajouté (nouvelle section)** :
```javascript
// Convertir WorkItems en format InterventionClient pour affichage
const workItemsAsInterventions = useMemo(() => {
  return workItemsBureau.map(wi => ({
    id: wi.id,
    created_date: wi.created_date,
    type_intervention: wi.type === 'INTERVENTION_CLIENT' ? 'INVENTAIRE_ARRIVEE' : 
                       wi.type === 'MISSION_DIRECTION' ? 'MISSION_DIRECTION' : 'AUTRE',
    type_hebergement: wi.type_hebergement,
    numero_hebergement: wi.hebergement,
    client_nom: wi.client_nom,
    client_prenom: wi.client_prenom,
    date_arrivee: wi.date_arrivee,
    date_depart: wi.date_depart,
    service: wi.service,
    priorite: wi.priorite,
    description: wi.description,
    taches: wi.taches,
    statut: wi.statut,
    pris_en_charge_par: wi.collaborateur,
    date_prise_en_charge: wi.date_prise_en_charge,
    temps_ecoule_minutes: wi.duree_minutes,
    date_terminee: wi.date_terminee,
    isWorkItem: true,
    workItemData: wi
  }));
}, [workItemsBureau]);

// Fusionner InterventionClient + WorkItems
const allInterventionsData = useMemo(() => {
  return [...interventionsClients, ...workItemsAsInterventions];
}, [interventionsClients, workItemsAsInterventions]);

console.log('[BUREAU] Total interventions affichables:', {
  interventionsClients: interventionsClients.length,
  workItems: workItemsBureau.length,
  total: allInterventionsData.length
});
```

---

### 8️⃣ Bureau.jsx : Mise à jour compteurs

**Compteur onglet (L682)** :

**AVANT** :
```javascript
🎯 Interventions ({interventionsClients.filter(i => i.statut !== 'TERMINEE').length})
```

**APRÈS** :
```javascript
🎯 Interventions ({allInterventionsData.filter(i => i.statut !== 'TERMINEE').length})
```

**Message total (L945-947)** :

**AVANT** :
```javascript
{interventionsClients.length} intervention(s) totale(s) •
{filteredInterventionsClients.length} après filtres
```

**APRÈS** :
```javascript
{allInterventionsData.length} intervention(s) totale(s) •
{filteredInterventionsClients.length} après filtres
```

---

### 9️⃣ Bureau.jsx : Mise à jour filtrage

**Filtrage (L351-374)** :

**AVANT** :
```javascript
const filteredInterventionsClients = useMemo(() => {
  const filtered = interventionsClients.filter(i => { ... });
  return filtered;
}, [interventionsClients, activeView, filters]);
```

**APRÈS** :
```javascript
const filteredInterventionsClients = useMemo(() => {
  const filtered = allInterventionsData.filter(i => { ... });
  return filtered;
}, [allInterventionsData, activeView, filters]);
```

---

### 🔟 Bureau.jsx : Mise à jour événements historique

**AVANT** :
```javascript
const interventionsAsEvents = useMemo(() => {
  return interventionsClients.map(inter => ({ ... }));
}, [interventionsClients]);
```

**APRÈS** :
```javascript
const interventionsAsEvents = useMemo(() => {
  return allInterventionsData.map(inter => ({ ... }));
}, [allInterventionsData]);
```

---

## 📊 TABLEAU RÉCAPITULATIF MODIFICATIONS

| Fichier | Ligne(s) | Type correction | Avant | Après |
|---------|----------|----------------|-------|-------|
| **BureauHistorique.jsx** | 34-56 | Ajout query WorkItems | Incident seulement | Incident + WorkItems |
| **BureauHistorique.jsx** | 45-72 | Conversion WorkItems | - | convertedWorkItems map |
| **BureauHistorique.jsx** | 74-82 | Fusion sources | incidents | allInterventions |
| **BureauHistorique.jsx** | 49 | Filtre | incidents.filter | allInterventions.filter |
| **BureauHistorique.jsx** | 207-215 | Affichage type | sous_categorie | Différenciation WorkItem/Incident |
| **BureauHistorique.jsx** | 286-314 | Dialog détail | Description simple | Description + tâches si WorkItem |
| **Bureau.jsx** | 160-175 | Ajout query WorkItems | InterventionClient seulement | + WorkItems |
| **Bureau.jsx** | 177 | isLoading | 2 sources | 3 sources |
| **Bureau.jsx** | 350-406 | Conversion + fusion | - | workItemsAsInterventions + allInterventionsData |
| **Bureau.jsx** | 351-374 | Filtrage | interventionsClients | allInterventionsData |
| **Bureau.jsx** | 377-404 | Événements historique | interventionsClients | allInterventionsData |
| **Bureau.jsx** | 682 | Compteur onglet | interventionsClients.length | allInterventionsData.length |
| **Bureau.jsx** | 945-947 | Compteur total | interventionsClients.length | allInterventionsData.length |
| **Bureau.jsx** | 957-968 | Message vide | interventionsClients.length | allInterventionsData.length |

**Total** : 14 modifications sur 2 fichiers

---

## 🧪 SCÉNARIOS DE TEST POST-CORRECTION

### Test 1 : Arrivée → BureauHistorique

**Setup** :
- Créer arrivée MH Premium 2ch M03
- Déclarer 2 assiettes manquantes (MENAGE) + 1 lit cassé (TECHNIQUE)
- Valider inventaire
- Vérifier création :
  - [ ] 2 InterventionClient créées
  - [ ] 2 WorkItems créés

**Aller dans Bureau → Historique** :

**Logs console attendus** :
```
🔍 FETCH Incidents pour historique
✅ Incidents récupérés: 0
🔍 FETCH WorkItems pour historique
✅ WorkItems récupérés: 2
📊 Historique total: { incidents: 0, workItems: 2, total: 2 }
```

**Affichage BureauHistorique** :
```
┌─────────┬──────────┬────────────┬──────────┬──────┬────────┬──────────┐
│ Date    │ Logement │ Client     │ Type     │ Stat │ Durée  │ Avis     │
├─────────┼──────────┼────────────┼──────────┼──────┼────────┼──────────┤
│ 13/01   │ M03      │ Jean D.    │ Arrivée  │ Nouv │ -      │ -        │  ← WorkItem MENAGE
│ 10:30   │          │            │ MENAGE   │      │        │          │
├─────────┼──────────┼────────────┼──────────┼──────┼────────┼──────────┤
│ 13/01   │ M03      │ Jean D.    │ Arrivée  │ Nouv │ -      │ -        │  ← WorkItem TECHNIQUE
│ 10:30   │          │            │ TECH     │      │        │          │
└─────────┴──────────┴────────────┴──────────┴──────┴────────┴──────────┘
```

**✅ Résultat attendu** : 2 WorkItems visibles dans historique

---

### Test 2 : Clic sur WorkItem dans historique

**Action** : Cliquer sur ligne WorkItem "Arrivée TECHNIQUE"

**Dialog détail attendu** :
```
┌──────────────────────────────────────────────────┐
│ 🔧 Fiche intervention #M03                       │
├──────────────────────────────────────────────────┤
│ 👤 Client                                        │
│ Nom: Jean Dupont                                 │
│ Séjour: 13/01/2026 → 20/01/2026                  │
├──────────────────────────────────────────────────┤
│ Description                                      │
│ 🛏️ Lit double - chambre 1 - Défectueux          │
│                                                  │
│ Tâches :                                         │
│ #1 🛏️ Lit double - chambre 1 - Défectueux 🔴    │
│    [ ] Faite                                     │  ← Si statut A_FAIRE
└──────────────────────────────────────────────────┘
```

**✅ Résultat attendu** : Détails WorkItem affichés avec tâches

---

### Test 3 : Bureau → Interventions (compteurs)

**Setup** :
- BDD contient :
  - 5 InterventionClient (missions direction) : 2 A_FAIRE, 2 EN_COURS, 1 TERMINEE
  - 30 WorkItems (arrivées) : 10 A_FAIRE, 15 EN_COURS, 5 TERMINEE

**Aller dans Bureau → Interventions** :

**Logs console attendus** :
```
[BUREAU] WorkItems récupérés: 30
[BUREAU] Détail par statut: { A_FAIRE: 10, EN_COURS: 15, EN_ATTENTE: 0, TERMINEE: 5 }
[BUREAU] InterventionClient récupérées: 5
[BUREAU] Total interventions affichables: { interventionsClients: 5, workItems: 30, total: 35 }
```

**Affichage onglet** :
```
🎯 Interventions (30)  ← AVANT : (4)  |  APRÈS : (30)  [= 35 total - 5 TERMINEE]
```

**Liste** :
- 35 lignes au total
- Dont 30 issues de WorkItems ✅
- Dont 5 issues de InterventionClient ✅

**✅ Résultat attendu** : Compteurs corrects, liste exhaustive

---

## 🎯 VALIDATION LOGIQUE

### Données source

| Entité | Rôle | Créée lors arrivée ? | Créée lors signalement ? | Lue par BureauHistorique ? | Lue par Bureau Interventions ? |
|--------|------|----------------------|--------------------------|----------------------------|-------------------------------|
| **Incident** | Signalement direct client | ❌ Non | ✅ Oui | ✅ Oui (APRÈS) | ❌ Non |
| **InterventionClient** | Conteneur logique | ✅ Oui | ❌ Non | ❌ Non (inutile car WorkItem suffit) | ✅ Oui (APRÈS) |
| **WorkItem** | Unité de travail assignée | ✅ Oui | ⚠️ Peut-être (si créé) | ✅ Oui (APRÈS) | ✅ Oui (APRÈS) |
| **HistoriqueEvent** | Événement métier global | ✅ Oui (validation) | ⚠️ Peut-être | ❌ Non (BureauHistorique ≠ HistoriqueEvent) | ❌ Non |

**⚠️ CLARIFICATION** :
- `BureauHistorique.jsx` ≠ `HistoriqueEvent` (entité)
- `BureauHistorique.jsx` = Interface affichant Incident + WorkItem
- `HistoriqueEvent` = Entité de traçabilité métier (lue par Bureau.jsx L144)

---

### Cohérence inter-interfaces

| Interface | Source données | Interventions arrivée visibles ? | Statut |
|-----------|----------------|----------------------------------|--------|
| **Services TECHNIQUE** | WorkItems (service=TECHNIQUE) | ✅ Oui | ✅ OK (corrigé) |
| **Services MENAGE** | WorkItems (service=MENAGE) | ✅ Oui | ✅ OK (corrigé) |
| **Bureau → Interventions** | InterventionClient + WorkItems | ✅ Oui | ✅ OK (corrigé) |
| **Bureau → Historique (BureauHistorique)** | Incident + WorkItems | ✅ Oui | ✅ OK (corrigé) |
| **Bureau → Historique (HistoriqueEvent)** | HistoriqueEvent | ⚠️ Partiel (seulement événements métier) | 🟡 OK (usage différent) |

---

## ✅ CONCLUSION CORRECTIONS BUREAU

**Statut** : ✅ **Corrections appliquées - Validé logiquement**

**Vérifications effectuées** :
- ✅ BureauHistorique lit WorkItems
- ✅ Bureau Interventions lit WorkItems
- ✅ Compteurs mis à jour
- ✅ Affichage différencié WorkItem/Incident
- ✅ Dialog détail enrichi pour WorkItems

**Tests requis** :
1. ⚠️ Test réel : Arrivée → WorkItems visibles dans Bureau Historique
2. ⚠️ Test réel : Compteurs cohérents
3. ⚠️ Test réel : Détail WorkItem affiche tâches

**Prochaine étape critique** : Corriger suivi CLIENT (cf. ANALYSE_SUIVI_CLIENT.md)