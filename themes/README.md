# Criando Temas para o SkllPlayer

## Estrutura do Arquivo de Tema

Os temas são arquivos JSON com a extensão `.theme.json`. Para criar um tema personalizado:

1. Copie um tema existente (ex: `default-dark.theme.json`)
2. Renomeie para `custom-seu-tema.theme.json`
3. Edite as cores, fontes e layout conforme desejado

## Propriedades do Tema

### Informações Básicas

```json
{
  "name": "Nome do Tema",
  "author": "Seu Nome",
  "version": "1.0.0",
  "type": "dark" // ou "light"
}
```

### Cores

```json
"colors": {
  "background": {
    "primary": "#0a0a0f",     // Fundo principal
    "secondary": "#12121a",   // Fundo secundário (cards, etc)
    "tertiary": "#1a1a25"     // Fundo terciário (hover, etc)
  },
  "text": {
    "primary": "#ffffff",     // Texto principal
    "secondary": "#a0a0b0",   // Texto secundário
    "muted": "#606070"        // Texto desabilitado/hint
  },
  "accent": {
    "primary": "#8b5cf6",     // Cor de destaque principal
    "hover": "#7c3aed",       // Hover do destaque
    "active": "#6d28d9"       // Click/active do destaque
  },
  "player": {
    "progress": "#8b5cf6",           // Barra de progresso
    "progressBackground": "#2a2a35", // Fundo da barra de progresso
    "controls": "#ffffff"            // Ícones do player
  },
  "sidebar": {
    "background": "#08080c",   // Fundo da sidebar
    "itemHover": "#15151f",    // Hover dos itens
    "itemActive": "#8b5cf6"    // Item ativo
  }
}
```

### Fontes

```json
"fonts": {
  "primary": "Inter, system-ui, sans-serif",
  "secondary": "JetBrains Mono, monospace",
  "sizes": {
    "small": "12px",
    "normal": "14px",
    "medium": "16px",
    "large": "20px",
    "title": "28px"
  }
}
```

### Layout

```json
"layout": {
  "sidebar": {
    "position": "left",        // "left", "right", ou "top"
    "width": "240px",          // Largura da sidebar
    "collapsedWidth": "70px"   // Largura quando minimizada
  },
  "player": {
    "position": "bottom",      // "bottom" ou "top"
    "height": "90px"           // Altura do player
  },
  "header": {
    "visible": true,           // Mostrar header
    "height": "40px"           // Altura do header
  }
}
```

### Componentes

```json
"components": {
  "borderRadius": "8px",       // Arredondamento padrão
  "trackItem": {
    "height": "60px",          // Altura do item de música
    "thumbnailSize": "48px",   // Tamanho da thumbnail
    "showDuration": true,      // Mostrar duração
    "showArtist": true         // Mostrar artista
  },
  "buttons": {
    "borderRadius": "8px",     // Arredondamento dos botões
    "style": "filled"          // "filled", "outlined", "ghost"
  },
  "scrollbar": {
    "width": "8px",
    "thumbColor": "#3a3a45",
    "trackColor": "transparent"
  }
}
```

### Efeitos

```json
"effects": {
  "blur": true,                // Efeito blur no background
  "animations": true,          // Habilitar animações
  "transitionSpeed": "200ms",  // Velocidade das transições
  "hoverScale": 1.02           // Escala no hover (1 = sem escala)
}
```

## Exemplos de Temas

### Tema Neon Cyberpunk

```json
{
  "name": "Neon Cyberpunk",
  "author": "Community",
  "version": "1.0.0",
  "type": "dark",
  "colors": {
    "background": {
      "primary": "#0d0d1a",
      "secondary": "#1a1a2e",
      "tertiary": "#2a2a4a"
    },
    "accent": {
      "primary": "#00ffff",
      "hover": "#00cccc",
      "active": "#009999"
    }
  }
}
```

### Tema Ocean Blue

```json
{
  "name": "Ocean Blue",
  "author": "Community",
  "version": "1.0.0",
  "type": "dark",
  "colors": {
    "background": {
      "primary": "#0a1628",
      "secondary": "#0f2238",
      "tertiary": "#1a3a5c"
    },
    "accent": {
      "primary": "#3b82f6",
      "hover": "#2563eb",
      "active": "#1d4ed8"
    }
  }
}
```

## Dicas

1. **Contraste**: Certifique-se de que o texto tem bom contraste com o fundo
2. **Consistência**: Mantenha as cores de accent consistentes em todo o tema
3. **Teste**: Teste seu tema em todas as telas do app
4. **Backup**: Faça backup do seu tema antes de modificar

## Contribuindo

Se você criou um tema legal, compartilhe com a comunidade!
