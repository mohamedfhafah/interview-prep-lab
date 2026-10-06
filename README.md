# interview-prep-lab

Préparation d'entretiens pour la campagne de stage de fin d'études 2027 (cybersécurité).

## Contenu

| Dossier | Contenu |
|---|---|
| `wavestone-marseille/` | Simulation d'entretien complète pour le stage Consultant·e Cybersécurité de Wavestone Marseille : `Simulation_Entretien_Wavestone_Marseille.pdf` (103 questions avec réponses modèles) et sa source `simulation.json`. |
| `wavestone-marseille/Antiseche_Wavestone_Marseille.pdf` | Version courte pour le live : index cliquable en page 1, puis une carte par question (phrase d'ouverture + mots-clés). Source : `cards.json`. |
| `wavestone-marseille/antiseche-recherche.html` | Même contenu avec une barre de recherche instantanée (publiée aussi en page Claude). |
| `tools/build_pdf.mjs` | Génère le PDF à partir du fichier JSON (Chromium via Playwright). |

## Régénérer le PDF

```bash
node tools/build_pdf.mjs wavestone-marseille/simulation.json wavestone-marseille/Simulation_Entretien_Wavestone_Marseille.pdf
```

Antisèche :

```bash
node tools/build_cheatsheet.mjs wavestone-marseille/simulation.json wavestone-marseille/cards.json wavestone-marseille/Antiseche_Wavestone_Marseille.pdf
```

Pour modifier une réponse, éditez `simulation.json` (le texte entre `**` passe en gras), puis relancez la commande.
