# SPET Mobile — Guia de Setup e Teste no iPhone

## O que funciona onde

| Funcionalidade | Expo Go | Dev Build |
|---|---|---|
| Login (JWT) | ✅ | ✅ |
| Venue Selection | ✅ | ✅ |
| Guest Search | ✅ | ✅ |
| Entry Decision | ✅ | ✅ |
| New Guest | ✅ | ✅ |
| Pulse / Tabs | ✅ | ✅ |
| Add Item | ✅ | ✅ |
| Close Tab | ✅ | ✅ |
| WebSocket (real-time) | ✅ | ✅ |
| **NFC Scan** | ❌ CRASH | ✅ |
| **NFC Register** | ❌ CRASH | ✅ |

**Resumo:** Tudo funciona no Expo Go **EXCETO NFC**. Para NFC real no iPhone, precisa de **Development Build**.

---

## FASE 1 — Testar sem NFC (Expo Go) — 5 minutos

Isso permite validar login, busca, entry, tabs — tudo menos NFC.

### 1. Baixar o projeto

No Emergent, clique em **"Save to Github"** no chat. Depois:

```bash
git clone <seu-repo> spet-project
cd spet-project/mobile
```

**OU** se preferir baixar só a pasta mobile:
- No Emergent, use a opção de download do código
- Extraia e navegue até a pasta `mobile/`

### 2. Instalar dependências

```bash
cd mobile
npm install
# ou
yarn install
```

### 3. Rodar com Expo Go

```bash
npx expo start
```

Um QR code aparece no terminal.

### 4. Conectar o iPhone

- Abra a **câmera** do iPhone
- Aponte para o QR code
- Toque na notificação "Abrir no Expo Go"
- O app carrega no Expo Go

### 5. Testar

- **Login:** garcia.rapha2@gmail.com / 12345
- **Venue:** seleciona automaticamente (só tem 1)
- **Entry:** toque "Search Guest" → busque "Carlos" ou "Sofia"
- **Decision:** Allow / Deny
- **Tabs:** aba "Tabs" no bottom bar
- **⚠️ NFC:** NÃO toque em "Scan NFC" no Expo Go — vai crashar porque o módulo nativo não existe

---

## FASE 2 — Testar NFC Real (Development Build) — 30-45 minutos

### Pré-requisitos

Você precisa de:
- [x] iPhone 17 Pro Max (NFC ✅)
- [x] Tags NFC físicas
- [ ] Mac com Xcode instalado (versão 15+)
- [ ] Conta Apple Developer ($99/ano) **OU** conta Expo gratuita
- [ ] Node.js 18+ no Mac

### Opção A: EAS Build na nuvem (mais fácil, não precisa de Mac)

```bash
# 1. Instalar EAS CLI
npm install -g eas-cli

# 2. Login no Expo
eas login
# (crie conta em expo.dev se não tiver)

# 3. Navegar até o projeto
cd mobile

# 4. Configurar o projeto
eas build:configure

# 5. Fazer o build de desenvolvimento para iOS
eas build --profile development --platform ios
```

**O que acontece:**
- O Expo compila o app na nuvem (~15-20 min)
- Gera um arquivo .ipa
- Você recebe um link para instalar no iPhone
- **Nota:** Para instalar apps .ipa no iPhone, precisa de:
  - Conta Apple Developer ($99/ano), **OU**
  - Registrar o iPhone como device de teste via `eas device:create`

```bash
# Registrar seu iPhone como device de teste
eas device:create
# Abre uma URL → abra no Safari do iPhone → instala perfil
# Depois refaça o build:
eas build --profile development --platform ios
```

### Opção B: Build local com Xcode (mais controle)

```bash
# 1. Gerar projeto nativo iOS
cd mobile
npx expo prebuild --platform ios

# 2. Abrir no Xcode
open ios/spetmobile.xcworkspace

# 3. No Xcode:
#    - Selecione seu Team (Apple Developer account)
#    - Selecione seu iPhone conectado via USB
#    - Em Signing & Capabilities:
#      - Adicione "Near Field Communication Tag Reading"
#      - Verifique que o bundle ID é com.spetapp.mobile
#    - Clique Run (▶️)
```

**Nota sobre NFC no Xcode:**
O capability "Near Field Communication Tag Reading" precisa estar ativo. O `app.json` já configura o `NFCReaderUsageDescription`, mas no Xcode você precisa adicionar o capability manualmente:
1. Selecione o target → Signing & Capabilities
2. Clique "+ Capability"
3. Busque "Near Field Communication Tag Reading"
4. Adicione

### 4. Após instalar o Dev Build no iPhone

```bash
# No seu computador, inicie o dev server
cd mobile
npx expo start --dev-client
```

- Abra o app SPET no iPhone (não o Expo Go — é um app separado)
- Ele conecta ao dev server automaticamente
- Agora NFC funciona!

### 5. Testar NFC

1. Login → garcia.rapha2@gmail.com / 12345
2. Entry → toque **"Scan NFC"**
3. O sistema iOS mostra o sheet "Ready to Scan"
4. Encoste a tag NFC na parte de trás do iPhone (perto da câmera)
5. O UID é lido → enviado para `POST /api/nfc/scan`

**Se a tag já está registrada:** mostra o guest → tela de Entry Decision
**Se a tag NÃO está registrada:** mostra erro "Tag not registered" com opção de buscar manualmente

### 6. Registrar uma tag NFC nova

1. Entry → **"New Guest"** → preencha nome
2. Após criar → escolha **"Bind NFC"**
3. Encoste a tag no iPhone
4. Tag registrada! Agora pode usar "Scan NFC" para esse guest

---

## Troubleshooting

### "NFC Not Available" no Expo Go
**Normal.** NFC só funciona em Development Build. Use "Search Guest" como fallback.

### Build falha com "provisioning profile"
```bash
eas device:create    # registre o iPhone
eas build --profile development --platform ios  # refaça
```

### "Network request failed" ao fazer login
O iPhone precisa acessar o backend. Verifique:
- Que está conectado à internet
- Que `https://ceo-data-migration.preview.emergentagent.com` está acessível
- Tente abrir a URL no Safari do iPhone

### Tag NFC lida mas "not registered"
A tag precisa ser registrada primeiro via o fluxo "New Guest → Bind NFC" no app. Cada tag é única por venue.

### App não conecta ao dev server
- iPhone e computador devem estar na **mesma rede WiFi**
- Tente `npx expo start --dev-client --tunnel` (usa túnel em vez de LAN)

---

## Dados de Teste

| | |
|---|---|
| **Email** | garcia.rapha2@gmail.com |
| **Senha** | 12345 |
| **Venue** | Demo Club (auto-selecionado) |
| **Tag NFC registrada** | 04:A3:2B:1C:D4:E5:F6 → Carlos NFC Test |

---

## Checklist de Validação

Depois de testar, confirme:

- [ ] Login funciona
- [ ] Venue selecionado automaticamente
- [ ] "Search Guest" encontra resultados
- [ ] Entry Decision (Allow) funciona
- [ ] "New Guest" cria guest no banco
- [ ] Aba "Tabs" mostra tabs abertas
- [ ] NFC scan lê tag real (dev build only)
- [ ] Tag registrada identifica guest correto
- [ ] Tag não registrada mostra erro
- [ ] WebSocket recebe eventos (indicador "Live" verde)
