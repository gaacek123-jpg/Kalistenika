# Kalistenika 🏋️

Osobista apka wellness skupiona na treningu kalistenicznym: sesje A/B (pon/śr/pt),
drabinki progresji, timery, dziennik jedzenia i nastroju oraz przypomnienia
z eskalacją aż do „budzika". Natywna apka Expo (React Native), dane trzymane
lokalnie na telefonie.

## Co jest w środku (MVP)

- **Ekran sesji** — rotacja A/B liczona od ostatniej *wykonanej* sesji, rozgrzewka,
  odhaczanie serii, wpisywanie powtórzeń, timery przerw i izometryki, Wake Lock
  (ekran nie gaśnie), zakończenie z nastrojem/energią/bólem stawów.
- **Progresja** — każde ćwiczenie ma drabinkę; apka proponuje awans po osiągnięciu
  górnej granicy powtórzeń we wszystkich seriach.
- **Statystyki** — liczba sesji, seria, wykres objętości, rekordy osobiste, historia.
- **Dziennik** — nastrój, **kalendarz jedzenia** (wpisy freetext ze znacznikiem godziny,
  jak spotkania w Outlooku; edycja/usuwanie, podgląd poprzednich dni), waga,
  licznik greasing-the-groove, osobny widget sobotniego spaceru (niski próg, zero kary).
- **Przypomnienia** — tylko pon/śr/pt, eskalacja w ciągu dnia (15:30 → 17:00 → …),
  ostatnie idzie kanałem alarmowym (MAX + dźwięk). Codzienne przypomnienie o dzienniku.
  Teksty pasywno-agresywne w `src/data/reminders.ts` — dopisuj własne.
- **Bezpieczeństwo** — pyta o ból łokcia/barku; przy dwóch zgłoszeniach z rzędu
  proponuje obniżenie objętości podciągania. Sugestia deloadu co 6–8 tyg.
- **Dane** — eksport/import JSON (Ustawienia), żeby nic nie zginęło.

## Uruchomienie — szybki podgląd (Expo Go)

```bash
cd Kalistenika
npx expo start
```

Zeskanuj QR aplikacją **Expo Go** (Android). Uwaga: w Expo Go lokalne powiadomienia
działają, ale kanał alarmowy i pełna niezawodność „budzika" wymagają samodzielnego
builda (niżej).

## Docelowo — instalowalny APK (bez Android Studio, build w chmurze EAS)

1. Załóż darmowe konto na https://expo.dev (samodzielnie).
2. Zainstaluj CLI i zaloguj się:
   ```bash
   npm install -g eas-cli
   eas login
   ```
3. Zbuduj APK (chmura Expo, ~10–15 min):
   ```bash
   cd Kalistenika
   eas build -p android --profile preview
   ```
4. Po buildzie dostaniesz link do pliku **.apk** — pobierz go na telefon i zainstaluj
   (trzeba zezwolić na instalację z nieznanych źródeł).

Alternatywnie build developerski z hot-reloadem: `eas build -p android --profile development`,
potem `npx expo start --dev-client`.

## Żeby „budzik" był niezawodny na Androidzie

- Przy pierwszym starcie zaakceptuj zgodę na powiadomienia.
- W ustawieniach systemu **wyłącz optymalizację baterii** dla tej apki
  (inaczej system może opóźniać powiadomienia).

## Struktura

```
src/
  types.ts            model danych
  theme.ts            kolory / typografia (styl „karta warsztatowa")
  data/plan.ts        seed: ćwiczenia, drabinki, rozgrzewka, sesje A/B
  data/reminders.ts   teksty przypomnień (dopisuj własne)
  store/              persystencja (AsyncStorage) + stan aplikacji
  logic/              daty, rotacja A/B, progresja, rekordy, deload, statystyki
  notifications/      planowanie powiadomień lokalnych + kanały Android
  components/         UI, timer, piktogramy SVG
  screens/            Sesja, Historia, Dziennik, Ustawienia, Ćwiczenie
```

## Znane ograniczenia / do rozważenia w v2

- Prawdziwy „budzik" bypassujący tryb cichy wymagałby natywnego AlarmManagera
  (obecnie: kanał MAX + dźwięk + wibracja — mocne, ale nie omija DND).
- Eksport sesji do Markdown/Obsidiana (spójny z resztą systemu) — nieujęte w MVP.
- Linki wideo do techniki: pole `videoUrl` istnieje w modelu, można je uzupełnić.
