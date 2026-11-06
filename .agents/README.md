# Frontend-Hilfen für den Hackathon

Die vier Skills unter `skills/` sind unveränderte Kopien aus
[affaan-m/ECC](https://github.com/affaan-m/ECC/tree/b38be6a7f6350964d59328b52f0624e1d1d552d1),
Stand `b38be6a7f6350964d59328b52f0624e1d1d552d1` vom 30.10.2026.
Sie gelten projektlokal; globale Skills und Einstellungen werden nicht verändert.

| Aufgabe | Aufruf im Repo-Chat |
|---|---|
| Stil, Layout, Typografie und Hierarchie | `$frontend-design-direction` |
| Farben, Schriften, Abstände und Komponenten vereinheitlichen | `$design-system` |
| React-/Next.js-Komponenten und Zustände umsetzen | `$frontend-patterns` |
| Tastatur, Fokus, Labels und Dialoge prüfen | `$frontend-a11y` |

## Direkt verwenden

```text
Nutze $frontend-design-direction für die aktuelle UI. Behalte den vorhandenen
Produktkontext bei und verbessere Hierarchie und Lesbarkeit. Backend unverändert.
```

```text
Nutze $design-system und $frontend-patterns für diese beauftragte UI-Änderung.
Verwende unsere vorhandenen Komponenten, Tokens und Datenadapter.
```

```text
Nutze $frontend-a11y. Prüfe den aktuellen Dialog mit Tastatur und Fokusrückkehr.
Erst Befunde melden, noch keine Dateien ändern.
```

## Agenten

Zwei kleine lokale Codex-Rollen binden die Skills ein:
[frontend-builder](../.codex/agents/frontend-builder.toml) für beauftragte UI-Arbeit
und [frontend-reviewer](../.codex/agents/frontend-reviewer.toml) für lesende Prüfung.
Beispiel: „Lass frontend-builder diese UI-Aufgabe umsetzen und anschließend
frontend-reviewer den Ablauf prüfen.“ Die Rollen sind lokale Adapter, keine
unveränderten ECC-Agentendateien. Modelle und Berechtigungen bleiben geerbt.

Die Dateien werden im Chat mit diesem Repository als Arbeitsverzeichnis erkannt.
Falls die Auswahl noch fehlt, eine neue Nachricht beziehungsweise einen neuen
Repo-Chat starten. Andere Git-Worktrees sehen neu angelegte Dateien nicht automatisch;
dort diese Ordner über Git übernehmen oder den gewünschten Skill ausdrücklich per
Dateipfad nennen.

Projektregeln und der konkrete Auftrag gehen vor. ECC-Codebeispiele vor Übernahme
gegen den vorhandenen Stack prüfen; ein Review ist kein automatischer Umbauauftrag.
Das mitgelieferte `frontend-design-direction/scripts/check-evidence.js` gehört zum
Original-Skill. Es prüft Nachweisdateien, nicht die tatsächliche Qualität einer UI.

ECC steht unter MIT; jeder Skill enthält die vollständige `LICENSE.txt` mit
Copyright © 2026 Affaan Mustafa. Verwendete Fremdvorlagen im Hackathon korrekt angeben.
