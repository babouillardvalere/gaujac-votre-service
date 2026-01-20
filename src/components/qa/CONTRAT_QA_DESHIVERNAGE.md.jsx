# Contrat QA - Mission Déshivernage/Hivernage

## Règle fondamentale CRITICAL

```
❌ Une mission Déshivernage/Hivernage NE CRÉE JAMAIS une seule entité globale
✅ Elle GÉNÈRE AUTOMATIQUEMENT N WorkItems (1 par zone sélectionnée)
```

## Architecture validée

```
Direction
    ↓
Mission Déshivernage (intention)
    ↓
Factory WorkItem (génération automatique)
    ↓
N WorkItems créés (1 par zone)
    ↓
Services (Technique / Ménage)
```

## Validations bloquantes

### Niveau CRITICAL (empêche toute création)

1. **Aucune zone sélectionnée**
   - `numerosHebergement.length === 0`
   - Message: "Aucune zone sélectionnée pour générer les interventions"

2. **Aucune tâche définie**
   - `taches.length === 0`
   - Message: "Ajoutez au moins une tâche pour cette mission"

3. **Mission sans génération de WorkItems**
   - `workItems.length === 0` après factory
   - Message: "Aucune intervention valide à créer"

### Niveau ERROR (empêche la soumission)

- Type mission manquant
- Date planifiée manquante
- Service assigné manquant
- Type hébergement manquant

## Tests obligatoires

### Test 1 - Cas invalide (doit BLOQUER)
```
Mission Déshivernage
Aucune zone sélectionnée
→ ❌ Blocage immédiat
→ Message visible
→ 0 WorkItem créé
```

### Test 2 - Cas valide (doit FONCTIONNER)
```
Mission Déshivernage
3 hébergements sélectionnés
Tâches standards définies
→ ✅ 3 WorkItems créés
→ Visibles dans Technique/Ménage
→ Statut = A_FAIRE
→ description_operationnelle non vide
```

## Traçabilité logs

Les logs OBLIGATOIRES à vérifier :

```javascript
// DirectionCreerIntervention
[DIRECTION-CREER] Payload avant génération: { zones: [...], zones_count: N }

// DirectionRecapIntervention  
[DIRECTION] Zones extraites: [...]

// workItemFactory
[FACTORY] Input payload: { zones_count: N, zones: [...] }
[FACTORY] ✅ N WorkItem(s) générés pour N zone(s)
```

## Règle de cohérence

```
zones_sélectionnées = interventions_générées = workItems_créés
```

**Si cette égalité est fausse → CRITICAL ERROR**

## Dernière validation manuelle

Ouvrir console navigateur :
- Logs `[DIRECTION-CREER]` → zones visibles
- Logs `[FACTORY]` → zones reçues
- Logs `[FACTORY]` → WorkItems générés
- Ouvrir Technique/Ménage → missions visibles

**Si aucune mission visible → payload zones = [] (dette non résolue)**