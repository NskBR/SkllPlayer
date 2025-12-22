# SkllPlayer - Progresso do Desenvolvimento

## Status Atual: Em Desenvolvimento (v0.3.0)

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
- [x] **Logo Symbol** - Imagem symbol.png na sidebar e loading
- [x] **Novo ícone do app** - Símbolo "S" com gradiente azul (symbol.png)
- [x] **Bordas arredondadas** - 16px em modo janela, quadrado em maximizado/glass
- [x] **Animação de troca de tema** - Loading screen profissional com fade in/out

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
- [x] **Salvar customizações no tema** - Botão para persistir alterações no JSON
- [x] **Tema Glass Light** - Acrylic com background transparente e áreas opacas

### Páginas Criadas
- [x] **Home** - Tela inicial com estatísticas, favoritas e atalhos rápidos
- [x] **Faixas** - Lista de todas as músicas com busca e ordenação
- [x] **Favoritas** - Página dedicada para músicas favoritas
- [x] **Playlists** - Gerenciamento de playlists (criar, renomear, deletar)
- [x] **Playlist Detail** - Visualização e edição de playlist específica
- [x] **Equalizador** - Controles de EQ com presets e efeitos (interface pronta)
- [x] **Download** - Interface preparada para baixar músicas (UI pronta)
- [x] **Estatísticas** - Tempo de escuta, top 5, músicas nunca tocadas
- [x] **Configurações** - Pasta de músicas, tema, reset de dados, organizado em categorias

### Biblioteca de Músicas
- [x] Seleção de pasta de músicas
- [x] Escaneamento recursivo de arquivos de áudio
- [x] Suporte a formatos: MP3, FLAC, WAV, OGG, M4A, AAC, OPUS
- [x] Extração de metadados (título, artista, álbum, duração)
- [x] Extração de thumbnails/capas dos álbuns
- [x] Armazenamento persistente das músicas (electron-store)
- [x] Preservação de play counts ao re-escanear
- [x] **Análise de pasta antes de escanear** - Avisa sobre pastas muito grandes

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
- [x] **Thumbnails nas músicas baixadas** - Conversão para JPG via --convert-thumbnails
- [x] **Histórico unificado** - Downloads ativos e histórico na mesma visualização

### Discord Rich Presence
- [x] **Integração com discord-rpc** - Mostra status no Discord
- [x] **Configurável** - Toggle para ativar/desativar nas configurações
- [x] **Modo Desenvolvimento** - Mostra "Em Desenvolvimento" como status

### System Tray
- [x] **Ícone na bandeja** - Minimiza para tray ao invés de fechar
- [x] **Menu de contexto** - Abrir, Play/Pause, Próxima, Anterior, Sair
- [x] **Duplo-clique** - Restaura a janela
- [x] **Dialog de comportamento** - Pergunta se quer minimizar ou fechar ao clicar no X
- [x] **Lembrar escolha** - Opção para não perguntar novamente
- [x] **Configuração** - Alterável nas configurações do app

### Configurações Reorganizadas
- [x] **Menu lateral** - Sidebar com categorias estilo Discord
- [x] **Categorias implementadas:**
  - Biblioteca (pasta de músicas, re-escanear)
  - Aparência (tema, paleta automática)
  - Layout (posição dos elementos - em desenvolvimento)
  - Áudio (equalizador)
  - Comportamento (close behavior, Discord RPC)
  - Dados (limpar cache, reset estatísticas)
  - Sobre (versão, créditos, links)

### Splash Screen
- [x] **Logo centralizada** - Usa imagem do símbolo (symbol.png)
- [x] **Animação de loading** - Barras de áudio animadas
- [x] **Tempo mínimo** - 1.5s para UX suave
- [x] **Fallback** - Fecha após 5s se algo travar
- [x] **Versão atualizada** - Mostra v0.2

### Build & Distribuição
- [x] **electron-builder configurado** - Build para Windows
- [x] **Ícone personalizado** - symbol.png convertido para .ico
- [x] **Versão portable** - SkllPlayer-Portable-0.2.0.exe
- [x] **Versão unpacked** - Pasta win-unpacked com executável
- [x] **Script de ícone** - scripts/apply-icon.js para aplicar ícone pós-build

---

## Concluído Recentemente

### Sessão 21/12/2024 (Parte 2)
- [x] **Animação de troca de tema** - Tela de loading profissional com fade in/out
  - Logo Symbol centralizada com borda gradiente animada
  - Dots pulsando e barra de progresso deslizante
  - Partículas flutuantes no fundo
  - Fade in suave com scale ao aparecer
  - Fade out suave com scale ao sair
- [x] **Logo Symbol na Sidebar** - Substituído símbolo texto torto (₪) pela imagem symbol.png
- [x] **Salvar tema no JSON** - Botão para persistir customizações diretamente no arquivo do tema
- [x] **Notificação "Salvo!"** - Feedback inline ao salvar tema (substituiu alert)
- [x] **Sliders leem do tema salvo** - Transparência e escuridão mostram valores corretos após salvar
- [x] **Bordas arredondadas** - 16px de border-radius quando em modo janela
- [x] **Bordas quadradas para Glass** - Desabilita bordas arredondadas em temas com efeito acrylic/mica
- [x] **Tema Glass Light melhorado** - Background transparente, áreas de conteúdo opacas

### Sessão 21/12/2024 (Parte 1)
- [x] **Novo ícone do app** - Símbolo "S" com gradiente azul
- [x] **Splash screen atualizado** - Usa symbol.png e mostra v0.2
- [x] **Versão 0.2.0** - Atualizado em package.json e sidebar
- [x] **Build configurado** - electron-builder + rcedit para ícones
- [x] **Discord RPC simplificado** - Removido WebSocket/Vencord, usando discord-rpc padrão
- [x] **Download thumbnails** - Corrigido com --convert-thumbnails jpg
- [x] **Histórico de downloads unificado** - Tudo na mesma aba "Ativos"
- [x] **Análise de pasta** - Avisa antes de escanear pastas grandes
- [x] **Bug do tray corrigido** - App não reabre mais sozinho

### Sessão 20/12/2024
- [x] **Discord Rich Presence** - Integração completa com Discord
- [x] **System Tray** - Minimizar para bandeja com menu
- [x] **Close Behavior Dialog** - Pergunta ao fechar pela primeira vez
- [x] **Settings Reorganizado** - Menu lateral com categorias
- [x] **Splash com Logo** - Imagem ao invés de símbolo texto
- [x] **Backup GitHub** - Código enviado para repositório

### Sessão Anterior
- [x] **Categorização de temas** - Temas separados em "Oficiais" e "Comunidade"
- [x] **Efeitos de janela (Windows)** - Suporte a Mica, Acrylic, Tabbed
- [x] **Tema Glass Acrylic** - Cores semi-transparentes com blur
- [x] **Tema Glass Mica** - Cores semi-transparentes com blur do wallpaper
- [x] **Gerador de Paleta Automático** - Gera cores a partir de 1 cor base
- [x] **Tema Cyberpunk 2077** - Neon vermelho e cyan

---

## O Que Falta Fazer

### Efeitos de Áudio Avançados
- [ ] Crossfade entre músicas
- [ ] Gapless playback
- [ ] Normalização de volume

### Layout Customizável
- [ ] Layouts pré-definidos (Padrão, Compacto, Expandido, Minimalista)
- [ ] Posição do Player (embaixo, em cima, flutuante)
- [ ] Posição da Sidebar (esquerda, direita, oculta, auto-hide)
- [ ] Visualização da Biblioteca (grid, lista, colunas)
- [ ] Sidebar redimensionável
- [ ] Mini Player (janela flutuante pequena)
- [ ] "Now Playing" View (tela com artwork grande)

### Discord Rich Presence (Melhorias Futuras)
- [ ] Mostrar música atual (quando app não estiver em desenvolvimento)
- [ ] Barra de progresso (limitação do Discord - só Spotify tem)
- [ ] Tipo "Ouvindo" ao invés de "Jogando" (limitação do Discord RPC)

---

## Arquivos Principais

```
SkllPlayer/
├── src/
│   ├── main/
│   │   ├── main.ts              # Entrada do Electron
│   │   ├── preload.ts           # Bridge IPC
│   │   ├── ipc.ts               # Handlers (músicas, playlists, temas)
│   │   ├── splash.ts            # Splash screen com logo
│   │   ├── discord-rpc.ts       # Discord Rich Presence
│   │   ├── downloader.ts        # yt-dlp + ffmpeg integration
│   │   └── types/
│   │       └── discord-rpc.d.ts # Tipos do discord-rpc
│   │
│   └── renderer/
│       ├── components/
│       │   ├── Layout.tsx
│       │   ├── Titlebar.tsx
│       │   ├── Sidebar.tsx
│       │   ├── Player.tsx
│       │   ├── Logo.tsx
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
│       │   ├── playerStore.ts
│       │   └── equalizerStore.ts
│       ├── hooks/
│       │   └── useTheme.tsx
│       └── types/
│           └── electron.d.ts
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
├── assets/
│   └── icons/
│       ├── icon.png             # Ícone do app (symbol)
│       └── icon.ico             # Ícone para Windows
│
├── Public/
│   ├── Icon/
│   │   ├── Icone.png            # Logo completa
│   │   └── symbol.png           # Símbolo "S"
│   └── Screenshot/
│       ├── Faixas.png
│       ├── equalizer.png
│       └── options.png
│
├── scripts/
│   └── apply-icon.js            # Aplica ícone pós-build
│
├── release/                     # Builds gerados
│   ├── win-unpacked/
│   │   └── SkllPlayer.exe
│   └── SkllPlayer-Portable-0.2.0.exe
│
├── start.bat              # Inicia o app
├── start-dev.bat          # Inicia com DevTools
└── package.json
```

---

## Como Rodar

### Modo Normal
```bash
# Duplo clique em:
start.bat
```

### Modo Desenvolvimento (com DevTools)
```bash
# Duplo clique em:
start-dev.bat
```

### Via Terminal
```bash
cd SkllPlayer
npm install
npm run dev:renderer   # Terminal 1 - Inicia Vite
npm run build:main && npx electron .   # Terminal 2 - Inicia Electron
```

### Build para Distribuição
```bash
npm run package:portable   # Gera versão portable + unpacked
```

---

## Problemas Conhecidos

| Problema | Severidade | Status |
|----------|------------|--------|
| CMD aparece ao iniciar (dev mode) | Baixa | Esperado em dev |
| Discord RPC mostra "Jogando" | Baixa | Limitação do Discord |
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
- **Web Audio API** - Equalizador
- **music-metadata** 7.x - Extração de metadados
- **electron-store** 8.x - Armazenamento local
- **discord-rpc** - Rich Presence
- **yt-dlp** - Download do YouTube
- **Lucide React** - Ícones
- **@tanstack/react-virtual** - Virtualização de listas

---

## Criador

**SkellBR** ([@NskBR](https://github.com/NskBR))

*Inspirado no BlackPlayer para Android*
