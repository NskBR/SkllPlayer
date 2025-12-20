# SkllPlayer - Progresso do Desenvolvimento

## Status Atual: Em Desenvolvimento (v0.1 Build Test)

---

## O Que Foi Feito

### Estrutura do Projeto
- [x] Estrutura de pastas organizada para código aberto
- [x] Configuração do Electron + React + TypeScript
- [x] Configuração do Vite para desenvolvimento
- [x] Configuração do Tailwind CSS
- [x] Sistema de build configurado

### Interface (UI)
- [x] **Titlebar customizada** - Botões minimizar, maximizar, fechar integrados ao design
- [x] **Sidebar** com navegação entre páginas
- [x] **Sidebar recolhível** (botão para expandir/recolher)
- [x] **Layout responsivo** com suporte a diferentes posições (configurável via tema)
- [x] **Animações suaves** com Framer Motion

### Sistema de Temas
- [x] Engine de temas que lê arquivos JSON
- [x] Tema **Default Dark** (padrão)
- [x] Tema **Default Light**
- [x] Tema **Midnight Purple** (exemplo de tema da comunidade)
- [x] Documentação de como criar temas customizados (`themes/README.md`)
- [x] Suporte a customização de cores, fontes, layout, componentes e efeitos

### Páginas Criadas
- [x] **Home** - Tela inicial com estatísticas, favoritas e atalhos rápidos
- [x] **Faixas** - Lista de todas as músicas com busca e ordenação
- [x] **Favoritas** - Página dedicada para músicas favoritas
- [x] **Playlists** - Gerenciamento de playlists (criar, renomear, deletar)
- [x] **Playlist Detail** - Visualização e edição de playlist específica
- [x] **Equalizador** - Controles de EQ com presets e efeitos (interface pronta)
- [x] **Download** - Interface preparada para baixar músicas (UI pronta)
- [x] **Estatísticas** - Tempo de escuta, top 5, músicas nunca tocadas
- [x] **Configurações** - Pasta de músicas, tema, reset de dados

### Biblioteca de Músicas
- [x] Seleção de pasta de músicas
- [x] Escaneamento recursivo de arquivos de áudio
- [x] Suporte a formatos: MP3, FLAC, WAV, OGG, M4A, AAC, OPUS
- [x] Extração de metadados (título, artista, álbum, duração)
- [x] Extração de thumbnails/capas dos álbuns
- [x] Armazenamento persistente das músicas (electron-store)
- [x] Preservação de play counts ao re-escanear

### Player de Música
- [x] **Reprodução de áudio funciona** - Protocolo media:// customizado
- [x] **Controles funcionais** - Play, pause, next, previous, stop
- [x] **Barra de progresso** - Click e drag para seek
- [x] **Controle de volume** - Click, drag e scroll do mouse
- [x] **Tooltip de volume** - Mostra porcentagem ao ajustar
- [x] **Mute/Unmute** - Botão de silenciar
- [x] **Repeat modes** - Off, All, One
- [x] **Shuffle** - Modo aleatório
- [x] **Favoritar música** - Coração no player e nas listas
- [x] **Fila de reprodução** - Painel lateral com lista de músicas
- [x] **Persistência de estado** - Salva e restaura última música e progresso

### Playlists
- [x] Criar playlist
- [x] Renomear playlist
- [x] Deletar playlist
- [x] Adicionar músicas à playlist
- [x] Remover músicas da playlist
- [x] Visualizar músicas da playlist

### Menu de Contexto (3 pontinhos)
- [x] Reproduzir
- [x] Adicionar/remover dos favoritos
- [x] Adicionar à playlist
- [x] Remover da playlist (quando aplicável)
- [x] Renomear música
- [x] Ver informações da música

### Modal de Informações da Música
- [x] Título, artista, álbum
- [x] Duração
- [x] Tamanho do arquivo
- [x] Contagem de reproduções
- [x] Data de adição
- [x] Última reprodução
- [x] Caminho do arquivo

### Estatísticas
- [x] Contagem de músicas totais
- [x] Contagem de músicas tocadas vs nunca tocadas
- [x] Tempo total de escuta
- [x] Top 5 músicas mais tocadas
- [x] Reset de estatísticas

### Atalhos de Teclado (Media Keys)
- [x] Play/Pause
- [x] Next track
- [x] Previous track
- [x] Stop
- [x] Volume up/down
- [x] Mute

### Equalizador
- [x] **Equalizador funcional** - Web Audio API conectado ao Howler.js
- [x] 5 bandas de frequência (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz)
- [x] Reforço de graves (Bass Boost)
- [x] Reverberação
- [x] Balanço de som (Stereo Panner)
- [x] Amplificador de volume
- [x] Presets (Flat, Rock, Pop, Jazz, Classical, Bass Boost, Vocal, Electronic)
- [x] Botão liga/desliga do equalizador
- [x] Aplicação em tempo real

### Download de Músicas (yt-dlp)
- [x] **Integração com yt-dlp** - Download automático do binário
- [x] Busca no YouTube
- [x] Download com progresso em tempo real
- [x] Seleção de formato (MP3 320/192/128, FLAC, M4A, OGG)
- [x] Extração de metadados automática
- [x] Adição automática à biblioteca
- [x] Indicador de status do yt-dlp e ffmpeg
- [x] Instalação automática do yt-dlp
- [x] **Instalação automática do ffmpeg** - Baixa e extrai automaticamente (~90MB)
- [x] **Thumbnails dos resultados** - CSP atualizada para permitir imagens do YouTube
- [x] **Botão de preview** - Abre o vídeo no YouTube antes de baixar
- [x] **Barra de busca corrigida** - Ícone movido para o botão à direita

---

## Concluído Recentemente (Sessão Atual)

### Bugs Corrigidos
- [x] **Bug: Metadados não baixando** - Agora usa metadados do YouTube como fallback
- [x] **Bug: Tempo de escuta não contabilizando** - Corrigido tracking com debounce a cada 10s
- [x] **Bug: Sliders descentralizados** - Corrigido posicionamento com transform translate
- [x] **Bug: Favoritos recarregando tudo** - Agora atualiza apenas a faixa específica

### Melhorias de UI
- [x] **Sidebar reorganizada** - Categorias "Biblioteca" e "Gerenciamento"
- [x] **Ícones coloridos** - Cada ícone com cor única + efeito glow no hover
- [x] **Logo do app** - Adicionada na sidebar (quando expandida)
- [x] **Titlebar simplificada** - Nome centralizado, sem logo redundante
- [x] **Indicador de download** - Loading spinner na thumbnail durante download

### Novas Funcionalidades
- [x] **Auto-save** - Equalizador e Configurações salvam automaticamente
- [x] **Wizard de primeiro uso** - Modal pedindo pasta de músicas na primeira execução
- [x] **Nova interface do Downloader** - 2 colunas com gerenciador sempre visível
- [x] **Histórico de downloads** - Lista persistente das músicas baixadas
- [x] **Virtualização da lista** - TrackList otimizada com @tanstack/react-virtual

### Otimizações de Performance
- [x] **FPS melhorado** - Throttle nas atualizações de currentTime (60fps → 4fps)
- [x] **Memoização** - TrackListItem com memo() e comparação customizada
- [x] **Animações GPU** - playing-bar usa transform ao invés de opacity

### Splash Screen
- [x] **Splash screen reativada** - Corrigida lógica de transição
- [x] **Logo embarcada** - Converte para base64 para exibição
- [x] **Transição suave** - Mínimo 1.5s de exibição + fallback 5s

### Crossfade (Não Funcional)
- [ ] **Crossfade entre músicas** - Implementado mas não funcionando corretamente
- [x] **Configuração opcional** - Toggle on/off em Configurações
- [x] **Duração configurável** - Slider de 1s a 10s (padrão: 3s)

### Gapless Playback
- [x] **Pré-carregamento** - Próxima faixa é carregada enquanto a atual toca
- [x] **Transição instantânea** - Usa faixa pré-carregada quando disponível
- [x] **Limpeza de recursos** - Libera memória ao trocar de faixa

### Normalização de Volume
- [x] **Compressor dinâmico** - Usa DynamicsCompressorNode para nivelar volume
- [x] **Toggle on/off** - Configurável em Configurações
- [x] **Persistência** - Salva preferência do usuário

---

## O Que Falta Fazer

### Efeitos de Áudio Avançados
- [ ] Crossfade entre músicas (não funcional)
- [x] ~~Gapless playback~~
- [x] ~~Normalização de volume~~

### Build & Distribuição
- [ ] Configurar electron-builder
- [ ] Usar logo como ícone do executável (.ico)
- [ ] Gerar instalador Windows

---

## Arquivos Principais

```
SkllPlayer/
├── src/
│   ├── main/
│   │   ├── main.ts          # Entrada do Electron
│   │   ├── preload.ts       # Bridge IPC
│   │   ├── ipc.ts           # Handlers (músicas, playlists, temas)
│   │   ├── downloader.ts    # yt-dlp + ffmpeg integration
│   │   └── splash.ts        # Splash screen com logo
│   │
│   └── renderer/
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Titlebar.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Player.tsx
│       │   ├── TrackList.tsx
│       │   └── TrackContextMenu.tsx
│       ├── pages/
│       │   ├── HomePage.tsx
│       │   ├── TracksPage.tsx
│       │   ├── FavoritesPage.tsx
│       │   ├── PlaylistsPage.tsx
│       │   ├── EqualizerPage.tsx
│       │   ├── DownloaderPage.tsx
│       │   ├── StatsPage.tsx
│       │   └── SettingsPage.tsx
│       ├── stores/
│       │   ├── playerStore.ts      # Estado do player (Zustand)
│       │   └── equalizerStore.ts   # Estado do equalizador (Web Audio API)
│       ├── hooks/
│       │   └── useTheme.tsx     # Engine de temas
│       └── types/
│           └── electron.d.ts    # Tipos da API Electron
│
├── themes/
│   ├── default-dark.theme.json
│   ├── default-light.theme.json
│   ├── midnight-purple.theme.json
│   └── README.md
│
└── package.json
```

---

## Como Rodar

```bash
cd SkllPlayer
npm install
npm run dev:renderer   # Terminal 1 - Inicia Vite
npm run build:main && npx electron .   # Terminal 2 - Inicia Electron
```

Ou em um comando:
```bash
npm run electron:dev
```

---

## Próximos Passos (Prioridade)

1. **Efeitos de áudio avançados**
   - Gapless playback
   - Normalização de volume

2. **Build para distribuição**
   - Configurar electron-builder
   - Gerar instalador e versão portable

---

## Problemas Conhecidos

| Problema | Severidade | Status |
|----------|------------|--------|
| ~~Splash screen abrindo infinitamente~~ | ~~Média~~ | ✅ Corrigido |
| Erros de cache do Windows no console | Baixa | Ignorável |
| ~~Metadados não baixando~~ | ~~Alta~~ | ✅ Corrigido |
| ~~Tempo de escuta não contabiliza~~ | ~~Alta~~ | ✅ Corrigido |
| ~~Sliders descentralizados~~ | ~~Média~~ | ✅ Corrigido |
| ~~FPS baixo na lista de faixas~~ | ~~Alta~~ | ✅ Corrigido |

---

## Tecnologias Usadas

- **Electron** 28.x - Framework desktop
- **React** 18.x - Interface
- **TypeScript** 5.x - Tipagem
- **Vite** 5.x - Build tool
- **Tailwind CSS** 3.x - Estilização
- **Zustand** 4.x - Estado global
- **Framer Motion** 11.x - Animações
- **Howler.js** 2.x - Player de áudio
- **music-metadata** 7.x - Extração de metadados
- **electron-store** 8.x - Armazenamento local
- **Lucide React** - Ícones
- **@tanstack/react-virtual** - Virtualização de listas

---

## Notas Técnicas Importantes

### Equalizador (equalizerStore.ts)
- Usa Web Audio API com MediaElementAudioSourceNode
- **WeakMap** para rastrear elementos de áudio já conectados (evita erro de reconexão)
- Conectado ao Howler.js via `connectMediaElement()`
- Cadeia: Input → EQ Bands → Bass Boost → Reverb → Balance → Amplifier → Output

### Downloader (downloader.ts)
- yt-dlp baixado de: `https://github.com/yt-dlp/yt-dlp/releases/latest/download/`
- ffmpeg baixado de: `https://github.com/yt-dlp/FFmpeg-Builds/releases/download/latest/`
- Binários salvos em: `app.getPath('userData')/bin/` e `/ffmpeg/`
- Extração do ffmpeg via PowerShell (`Expand-Archive`)
- Passa `--ffmpeg-location` para o yt-dlp

### CSP (Content Security Policy)
- Configurada em `src/renderer/index.html`
- Permite imagens de: `i.ytimg.com`, `*.ytimg.com`, `*.ggpht.com`
- Permite mídia de: `self`, `file:`, `media://`

### Player (playerStore.ts)
- Usa Howler.js para reprodução
- Protocolo customizado `media://` para arquivos locais
- Conecta ao equalizador quando disponível

---

## Criador

**SkellBR**

Inspirado no BlackPlayer para Android.
