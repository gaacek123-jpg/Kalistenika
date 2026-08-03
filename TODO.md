# Kalistenika — do zrobienia / uwagi do zmiany

Lista żywa. Uwagi Kacpra + pomysły. Znaczniki: ⏳ czeka na build · 🔜 później · ✅ zrobione.

## ⏳ W repo — wejdzie przy najbliższym buildzie EAS
- [x] **Cue wizualny odświeżania** w Dzienniku (⟳ → chwilowe „✓ odświeżono").
- [x] **Budzik: dźwięk + wibracje** — własny `alarm.wav`, nowy kanał `alarm-fullscreen-v2`, `loopSound`,
      pattern wibracji. ⚠️ **DO WERYFIKACJI na urządzeniu** (native config, nie da się przetestować bez buildu).
- [x] **Zdjęcia w Dzienniku dnia** — przycisk „📷 Zdjęcie" robi foto z apki (expo-image-picker), zapis do
      `photos/`, nazwa pliku w wpisie, miniatura + podgląd na pełnym ekranie. ⚠️ DO WERYFIKACJI (aparat).

## 🔜 Pomysły na później
- **Referencja „powtarzalne produkty kupne"** — mała baza (jak baza suplementów) na kanapki z Żabki,
  batony, chipsy proteinowe: skład/gramatura RAZ, potem log zostaje niskoprogowy (nazwa = znane wartości).
- **Awans na „tryb wyników"** — po ~2–3 tyg. regularności apka proponuje przełączenie z trybu nawyku
  z powrotem na progresję/rekordy.
- Opcjonalny **łagodniejszy ton przypomnień** na czas budowania nawyku (na razie: Drążek zostaje).
- Eksport dziennika do **Markdown/Obsidian** (z pierwotnego speca).
- Ewentualne pole **snu-cykliczności** / dłuższe trendy pod obserwację ChAD.

## ✅ Zrobione (w kolejnych buildach)
- Własna ikona (drążek), sen od–do + drzemki, kopiowanie wpisów dnia, tryb nawyku (sukces = obecność),
  pełny budzik (Notifee, full-screen), odświeżanie dnia/godziny, nawigator dnia (edycja wstecz),
  emocje wielokrotny wybór + Apatia, eksport CSV nastroju.
