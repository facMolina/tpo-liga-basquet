# Diagramas de la documentación técnica

Esta carpeta contiene los diagramas que se referencian desde `documentacion-tecnica.md`. Cada diagrama está versionado en dos formatos:

- **`.mmd`** — fuente en sintaxis [Mermaid](https://mermaid.js.org/). Es el archivo editable.
- **`.png`** — render que se embebe en el documento técnico. Se regenera a partir del `.mmd` correspondiente.

| Archivo | Diagrama |
|---------|----------|
| `01-arquitectura-capas` | Capas del backend (cliente → routes → middleware → controllers → models → MySQL) |
| `02-der` | Diagrama Entidad-Relación en notación Chen |
| `03-modelo-relacional` | Modelo relacional con tipos SQL y claves PK/FK |
| `04-secuencia-cargar-resultado` | Flujo de la transacción de carga de resultado |

## Cómo regenerar los PNG

Requiere [`@mermaid-js/mermaid-cli`](https://github.com/mermaid-js/mermaid-cli) (proporciona el binario `mmdc`).

```bash
npm install -g @mermaid-js/mermaid-cli

# Regenerar uno
mmdc -i 02-der.mmd -o 02-der.png -t default -b white --width 1400

# Regenerar todos (bash)
for f in *.mmd; do
  mmdc -i "$f" -o "${f%.mmd}.png" -t default -b white --width 1400
done
```

Después de regenerar, commitear ambos archivos (`.mmd` y `.png`) juntos.
