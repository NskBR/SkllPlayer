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
- [x] Tema **Cyberpunk 2077** (gradientes vermelho/preto, cores neon cyan/vermelho)
- [x] Tema **Glass Acrylic** (transparência com efeito acrylic do Windows)
- [x] Tema **Glass Mica** (transparência com efeito mica do Windows 11)
- [x] Documentação de como criar temas customizados (`themes/README.md`)
- [x] Suporte a customização de cores, fontes, layout, componentes e efeitos
- [x] **Suporte a gradientes** - Background e sidebar com gradientes configuráveis
- [x] **Interface modular** - Layout configurável via tema ou in-app
- [x] **Overrides de usuário** - Personalizações sobre qualquer tema
- [x] **Categorização de temas** - Separação entre "Oficiais" e "Comunidade"
- [x] **Botão de atualizar temas** - Recarrega lista sem reiniciar o app
- [x] **Efeitos de janela** - Suporte a Mica, Acrylic, Tabbed (Windows 10/11)
- [x] **Gerador de paleta automático** - Escolhe 1 cor base e gera todas as outras

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

### Sistema de Temas Avançado
- [x] **Categorização de temas** - Temas separados em "Oficiais" e "Comunidade" na UI
- [x] **Botão de atualizar** - Recarrega temas da pasta sem reiniciar o app
- [x] **Efeitos de janela (Windows)** - Suporte a Mica, Acrylic, Tabbed via `windowEffect`
- [x] **Tema Glass Acrylic** - Cores semi-transparentes com blur do que está atrás
- [x] **Tema Glass Mica** - Cores semi-transparentes com blur do wallpaper

### Gerador de Paleta Automático
- [x] **Modo Automático** - Escolhe 1 cor base e o app gera toda a paleta
- [x] **Conversão HSL** - Gera variações ajustando luminosidade/saturação
- [x] **Detecção claro/escuro** - Ajusta cores de texto automaticamente
- [x] **Cor de destaque separada** - Accent color independente da cor base
- [x] **Preview em tempo real** - Mostra paleta gerada antes de aplicar

### Scripts de Inicialização
- [x] **start.bat melhorado** - Tenta rodar sem mostrar CMD
- [x] **start-dev.bat** - Modo desenvolvimento com CMD visível e DevTools
- [x] **DevTools condicional** - Só abre quando `SKLLPLAYER_DEV=1`
- [x] **SkllPlayer.lnk** - Atalho para abrir minimizado
- [x] **start.ps1** - Script PowerShell alternativo

### Splash Screen
- [x] **Logo simplificada** - Removido container, símbolo ₪ direto
- [x] **Efeito glow** - Animação de text-shadow pulsante
- [x] **Centralização** - Ajustes de margin para alinhar símbolo rotacionado

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
│   ├── cyberpunk-2077.theme.json
│   ├── glass-acrylic.theme.json
│   ├── glass-mica.theme.json
│   └── README.md
│
├── start.bat              # Inicia o app (tenta ocultar CMD)
├── start-dev.bat          # Inicia com DevTools e CMD visível
├── start.ps1              # Script PowerShell alternativo
├── SkllPlayer.lnk         # Atalho para iniciar minimizado
│
└── package.json
```

---

## Como Rodar

### Modo Normal (sem CMD)
```
Duplo clique em: SkllPlayer.lnk
```

### Modo Desenvolvimento (com DevTools)
```
Duplo clique em: start-dev.bat
```

### Via Terminal
```bash
cd SkllPlayer
npm install
npm run dev:renderer   # Terminal 1 - Inicia Vite
npm run build:main && npx electron .   # Terminal 2 - Inicia Electron
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

### Interface Modular (useTheme.tsx)
- **Layout overrides**: Usuário pode sobrescrever posições (sidebar, player, titlebar)
- **Color overrides**: Usuário pode sobrescrever cores do tema
- Overrides são persistidos separadamente em `settings.layoutOverrides` e `settings.colorOverrides`
- Temas definem valores padrão, overrides têm prioridade
- Função `applyThemeToCSS()` mescla tema com overrides

---

## Criador

**SkellBR**

Inspirado no BlackPlayer para Android.
