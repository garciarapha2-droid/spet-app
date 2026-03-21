# SPET Design System — Spacing & Visual Standards

## Regra de Espaçamento — Padrão Global

| Contexto | Valor | Tailwind |
|---|---|---|
| Seção → próximo bloco | 24px | `mb-6` |
| Card → Card | 16px | `space-y-4` / `gap-4` |
| Padding interno do card | 20px | `p-5` |
| Header → métricas no card | 16px | `mt-4` |
| Itens de lista internos | 8px | `space-y-2` |
| Colunas lado a lado | 24px | `gap-6` |
| Padding geral da página | 24px | `p-6` |

> **Regra de ouro**: Nunca usar menos que 16px entre cards e nunca menos que 24px entre seções. O visual premium depende de **breathing room consistente**.

---

## Detalhamento

### Entre Seções (filtros → cards, título → conteúdo)
```
margin-bottom: 24px (mb-6)
```

### Entre Cards (card → card)
```
gap: 16px (space-y-4 ou gap-4)
```

### Padding Interno dos Cards
```
padding: 20px (p-5)
```

### Entre Header do Card e Conteúdo/Métricas
```
margin-top: 16px (mt-4)
```

### Entre Itens dentro de uma Lista (rows internos)
```
gap: 8px (space-y-2)
```

### Entre Colunas em Grid (side by side)
```
gap: 24px (gap-6)
```

### Padding da Área de Conteúdo Principal
```
padding: 24px (p-6)
```

---

## Tokens CSS (index.css)

### Light Mode
- `--background`: 220 26% 97%
- `--foreground`: 222 47% 11%
- `--card`: 0 0% 100%
- `--primary`: 258 75% 58%
- `--muted`: 220 20% 95%
- `--border`: 220 20% 88%
- `--success`: 160 84% 39%
- `--warning`: 38 92% 50%
- `--danger`: 0 84% 60%
- `--sidebar-background`: 0 0% 100% (light in light mode)

### Dark Mode
- `--background`: 222 47% 2%
- `--foreground`: 0 0% 100%
- `--card`: 220 30% 6%
- `--primary`: 258 75% 58%
- `--muted`: 222 20% 11%
- `--border`: 226 20% 14%
- `--sidebar-background`: 222 30% 5% (dark in dark mode)

---

## Tipografia

| Elemento | Classe |
|---|---|
| Label de métrica | `text-[10px] uppercase tracking-wider text-muted-foreground` |
| Valor de métrica | `text-sm font-bold text-foreground tabular-nums` |
| Título do card | `text-sm font-semibold text-foreground` |
| Subtítulo/endereço | `text-xs text-muted-foreground` |
| Badge | `text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase` |
| Section label (sidebar) | `text-[10px] uppercase tracking-widest font-semibold text-muted-foreground` |

---

## Componentes Padrão

### Card
```
rounded-xl border bg-[hsl(var(--card))] p-5 hover:shadow-sm cursor-pointer transition-all
```

### Toggle Button (Active)
```
bg-foreground text-background shadow-sm px-4 py-1.5 text-xs font-semibold rounded-md
```

### Toggle Button (Inactive)
```
text-muted-foreground hover:text-foreground px-4 py-1.5 text-xs font-semibold rounded-md
```

### Badge (status)
```
text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase
```
- ACTIVE: `bg-[hsl(var(--success)_/_0.1)] text-[hsl(var(--success))]`
- ATTENTION: `bg-[hsl(var(--warning)_/_0.1)] text-[hsl(var(--warning))]`
- UNDERPERFORMING: `bg-[hsl(var(--danger)_/_0.1)] text-[hsl(var(--danger))]`
- STRONG: same as ACTIVE
- STABLE: `bg-blue-500/10 text-blue-500`
- WEAK: same as UNDERPERFORMING

### Icon Container
```
h-10 w-10 rounded-lg flex items-center justify-center shrink-0
```
Icon size: `h-5 w-5`

---

## Animação Padrão
```js
const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};
```
Delay between items: `0.04 * index`
