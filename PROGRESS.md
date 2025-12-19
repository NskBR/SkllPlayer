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

## O Que NÃO Está Funcionando / Pendente

### PRÓXIMA SESSÃO - PRIORIDADE

#### Bug: Metadados não baixando em outros PCs
- [ ] Investigar por que artista e thumbnail não estão sendo extraídos
- [ ] Testar extração de metadados do yt-dlp
- [ ] Verificar se música-metadata está funcionando corretamente

#### Bug: Tempo de escuta não contabilizando
- [ ] Corrigir contador de tempo ouvindo na aba Início (Home)
- [ ] Verificar chamada de `addListeningTime()` no playerStore
- [ ] Garantir que estatísticas estão sendo salvas corretamente

#### Reorganizar Sidebar (Categorias)
- [ ] Criar categoria "Gerenciamento" contendo:
  - Playlists
  - Equalizador
  - Download
  - Estatísticas
  - Configurações
- [ ] Manter na raiz apenas: Home, Faixas, Favoritas

#### UI: Estilizar Ícones do App
- [ ] Melhorar visual dos ícones da sidebar
- [ ] Padronizar tamanhos e cores
- [ ] Adicionar efeitos hover mais elaborados

#### Bug: Sliders Descentralizados
- [ ] Corrigir posição das bolinhas dos sliders no Equalizador
- [ ] Corrigir sliders em outras páginas (Faixas, etc)
- [ ] Alinhar thumb do slider com o cursor do mouse

#### UI: Indicador de Download
- [ ] Adicionar ícone de loading (bolinha girando) na faixa sendo baixada
- [ ] Mostrar progresso visual no item da lista de resultados

#### Adicionar Logo do App
- [ ] Logo disponível na pasta `public/`
- [ ] Adicionar logo na titlebar
- [ ] Adicionar logo na sidebar (quando expandida)
- [ ] Usar como ícone do executável

#### Auto-Save em Todo o App
- [ ] Remover botões de "Salvar" de todas as páginas
- [ ] Implementar salvamento automático ao alterar qualquer configuração
- [ ] Aplicar para: Equalizador, Configurações, e qualquer outra página com save

#### Primeiro Uso do App
- [ ] Detectar primeira execução do app
- [ ] Exibir modal/wizard pedindo para definir pasta de músicas
- [ ] Pasta de download = mesma pasta de músicas (unificar)

#### Nova Interface do Downloader
- [ ] Dividir página em 2 colunas:
  - Esquerda: Busca e resultados
  - Direita: Gerenciador de downloads (sempre visível)
- [ ] No gerenciador mostrar:
  - "Baixando em: [pasta]"
  - Tempo de download decorrido
  - Progresso de cada download
- [ ] Histórico de músicas baixadas (salvar lista persistente)
- [ ] Manter downloads visíveis enquanto faz novas buscas

---

### Efeitos de Áudio Avançados
- [ ] Crossfade entre músicas
- [ ] Gapless playback
- [ ] Normalização de volume
- [ ] Virtualizador (em desenvolvimento)

### Splash Screen
- [ ] Splash screen temporariamente desativada
- [ ] Corrigir lógica de transição

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
│   │   └── splash.ts        # Splash screen (desativada)
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

1. **Reativar Splash Screen**
   - Corrigir lógica de transição

2. **Efeitos de áudio avançados**
   - Crossfade entre músicas
   - Gapless playback
   - Normalização de volume

---

## Problemas Conhecidos

| Problema | Severidade | Status |
|----------|------------|--------|
| Splash screen abrindo infinitamente | Média | Desativada temporariamente |
| Erros de cache do Windows no console | Baixa | Ignorável |

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
