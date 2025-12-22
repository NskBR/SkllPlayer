# SkllPlayer

Um player de música desktop moderno e elegante, inspirado no BlackPlayer para Android.

![Version](https://img.shields.io/badge/Version-0.3.0-blue)
![Electron](https://img.shields.io/badge/Electron-28.x-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## Screenshots

<div align="center">

### Biblioteca de Faixas
![Faixas](Public/Screenshot/Faixas.png)

### Equalizador
![Equalizador](Public/Screenshot/equalizer.png)

### Menu de Contexto
![Options](Public/Screenshot/options.png)

</div>

## Funcionalidades

### Player de Musica
- Reproducao de audio com suporte a MP3, FLAC, WAV, OGG, M4A, AAC, OPUS
- Controles completos: play, pause, next, previous, stop
- Barra de progresso com seek (click e drag)
- Controle de volume com scroll do mouse
- Modos de repeticao: Off, All, One
- Modo shuffle (aleatorio)
- Fila de reproducao com painel lateral
- Persistencia de estado (ultima musica e progresso)

### Biblioteca
- Escaneamento recursivo de pastas
- Extracao automatica de metadados e capas
- Busca e ordenacao por titulo, artista, album, etc.
- Sistema de favoritos
- Estatisticas de reproducao
- Analise de pasta antes de escanear (avisa sobre pastas grandes)

### Playlists
- Criar, renomear e deletar playlists
- Adicionar/remover musicas
- Menu de contexto completo

### Equalizador
- 5 bandas de frequencia (60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz)
- Reforco de graves (Bass Boost)
- Reverberacao
- Balanco de som (Stereo Panner)
- Amplificador de volume
- Presets: Flat, Rock, Pop, Jazz, Classical, Bass Boost, Vocal, Electronic

### Download de Musicas (YouTube)
- Integracao com yt-dlp
- Busca no YouTube com thumbnails
- Download com progresso em tempo real
- Formatos: MP3 (320/192/128), FLAC, M4A, OGG
- Instalacao automatica do yt-dlp e ffmpeg
- Adicao automatica a biblioteca
- Preview do video antes de baixar

### Discord Rich Presence
- Integracao nativa com discord-rpc
- Status: "Em Desenvolvimento" (v0.3)
- Configuravel nas opcoes (ativar/desativar)

### System Tray
- Minimizar para bandeja do sistema
- Menu de contexto com controles rapidos (Play/Pause, Next, Previous)
- Opcao de fechar ou minimizar ao clicar no X
- Lembrar escolha do usuario

### Interface
- Tema escuro e claro
- Sistema de temas customizaveis (JSON)
- Temas com efeitos de transparencia (Acrylic, Mica)
- Salvar customizacoes diretamente no tema
- Gerador de paleta automatico (escolhe 1 cor, gera todas as outras)
- Animacao de transicao ao trocar tema (loading screen profissional)
- Bordas arredondadas em modo janela
- Sidebar recolhivel com auto-expand/collapse
- Logo Symbol do app
- Titlebar customizada
- Animacoes suaves com Framer Motion
- Atalhos de teclado (Media Keys)
- Configuracoes organizadas em categorias

### Splash Screen
- Logo centralizada com animacao
- Tempo minimo de exibicao para UX suave

## Instalacao

### Pre-requisitos
- Node.js 18+
- npm ou yarn

### Desenvolvimento

```bash
# Clonar o repositorio
git clone https://github.com/NskBR/SkllPlayer.git
cd SkllPlayer

# Instalar dependencias
npm install

# Iniciar em modo desenvolvimento
npm run dev:renderer   # Terminal 1 - Inicia Vite
npm run build:main && npx electron .   # Terminal 2 - Inicia Electron

# Ou use o script
start-dev.bat
```

### Build de Producao

```bash
npm run build
npm run package  # Gera o executavel
```

## Tecnologias

- **Electron** 28.x - Framework desktop
- **React** 18.x - Interface
- **TypeScript** 5.x - Tipagem
- **Vite** 5.x - Build tool
- **Tailwind CSS** 3.x - Estilizacao
- **Zustand** 4.x - Estado global
- **Framer Motion** 11.x - Animacoes
- **Howler.js** 2.x - Player de audio
- **Web Audio API** - Equalizador
- **music-metadata** 7.x - Extracao de metadados
- **electron-store** 8.x - Armazenamento local
- **yt-dlp** - Download do YouTube
- **discord-rpc** - Rich Presence

## Temas Disponiveis

| Tema | Tipo | Descricao |
|------|------|-----------|
| Default Dark | Oficial | Tema escuro padrao |
| Default Light | Oficial | Tema claro |
| Midnight Purple | Oficial | Tons de roxo |
| Cyberpunk 2077 | Oficial | Neon vermelho e cyan |
| Glass Acrylic | Oficial | Transparencia com blur (Windows 10/11) |
| Glass Light | Oficial | Transparencia clara com acrylic |

## Estrutura do Projeto

```
SkllPlayer/
├── src/
│   ├── main/
│   │   ├── main.ts            # Entrada do Electron
│   │   ├── preload.ts         # Bridge IPC
│   │   ├── ipc.ts             # Handlers IPC
│   │   ├── splash.ts          # Splash screen
│   │   ├── discord-rpc.ts     # Discord Rich Presence
│   │   └── downloader.ts      # yt-dlp integration
│   │
│   └── renderer/
│       ├── components/        # Componentes React
│       ├── pages/             # Paginas da aplicacao
│       ├── stores/            # Estado (Zustand)
│       ├── hooks/             # Custom hooks
│       └── types/             # TypeScript types
│
├── themes/                    # Temas customizaveis
├── Public/
│   ├── Icon/                  # Icone do app
│   └── Screenshot/            # Screenshots
└── assets/                    # Outros recursos
```

## Atalhos de Teclado

| Tecla | Acao |
|-------|------|
| Media Play/Pause | Play/Pause |
| Media Next | Proxima musica |
| Media Previous | Musica anterior |
| Media Stop | Parar |
| Volume Up/Down | Ajustar volume |
| Volume Mute | Silenciar |
| F12 | Abrir DevTools |
| F5 | Recarregar |

## Criando Temas

Os temas sao arquivos JSON na pasta `themes/`. Veja `themes/README.md` para documentacao completa.

```json
{
  "name": "Meu Tema",
  "author": "Seu Nome",
  "version": "1.0.0",
  "type": "dark",
  "colors": {
    "background": { "primary": "#0a0a0f", ... },
    "text": { "primary": "#ffffff", ... },
    "accent": { "primary": "#8b5cf6", ... }
  }
}
```

## Progresso do Desenvolvimento

Veja [PROGRESS.md](PROGRESS.md) para o status detalhado de todas as funcionalidades.

## Contribuindo

Contribuicoes sao bem-vindas! Sinta-se a vontade para abrir issues e pull requests.

## Licenca

MIT License - veja [LICENSE](LICENSE) para detalhes.

## Autor

**SkellBR** ([@NskBR](https://github.com/NskBR))

---

*Inspirado no BlackPlayer para Android*
