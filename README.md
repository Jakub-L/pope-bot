# Papieżbot

## Instalacja

1. Sklonuj repozytorium:
   ```bash
   git clone https://github.com/Jakub-L/pope-bot.git
   cd pope-bot
   ```

2. Zainstaluj:
   ```bash
   npm install
   ```

3. Utwórz plik `.env` na podstawie `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Uzupełnij zmienne środowiskowe w `.env`

5. Wgraj komendy slash na swój serwer:
   ```bash
   npm run deploy-commands
   ```

## Uruchamianie bota

### Tryb developerski
```bash
npm run dev
```

### Produkcja
```bash
npm run build
npm start
```

## Komendy

| Komenda | Opis |
|---------|-------------|
| `/ping` | Sprawdź, czy bot działa i zobacz czas działania |
| `/get` | Spróbuj złapać Papieża (działa tylko o 21:37 czasu warszawskiego) |
| `/papaj` | Alias dla `/get` |
| `/wyniki` | Wyświetl ranking getów |

## Skrypty

| Skrypt | Opis |
|--------|-------------|
| `npm run dev` | Uruchom bota w trybie developerskim z hot reload |
| `npm run build` | Zbuduj wersję produkcyjną |
| `npm start` | Uruchom build produkcyjny |
| `npm run deploy-commands` | Zarejestruj komendy slash w Discordzie |
| `npm run get-images-from-discord` | Import obrazów z historii Discorda |
| `npm run lint` | Sprawdź przez ESLint |
| `npm run format` | Sprawdź formatowanie kodu przy użyciu Prettier |
| `npm run format:fix` | Napraw problemy z formatowaniem |

## Zmienne środowiskowe

Zobacz `.env.example`, aby poznać wszystkie wymagane i opcjonalne zmienne środowiskowe.

### Wymagane
- `DISCORD_TOKEN` - token bota na Discordzie
- `DISCORD_APPLICATION_ID` - ID aplikacji Discord
- `DISCORD_DEPLOY_COMMANDS_GUILD_ID` - ID serwera, na który wdrażasz komendy
- `CLOUDFLARE_API_TOKEN` - token API Cloudflare
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare
- `CLOUDFLARE_DB_ID` - ID bazy D1

### Opcjonalne
- `DISCORD_POPEGET_CHANNEL_ID` - kanał, na którym działają get
- `DISCORD_WELCOME_CHANNEL_ID` - kanał do ogłoszeń o restartach bota
- `DISCORD_EXCLUDED_USER_IDS` - użytkownicy którym wolno repostować
- `DISCORD_EXCLUDED_GUILD_IDS` - serwery do ignorowania
- `IGNORE_LOGGING` - ustaw na "true", aby wyłączyć logowanie do pliku

## Licencja

Licencja MIT - szczegóły w pliku [LICENSE](LICENSE).

