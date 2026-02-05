# Por que o GitHub está desatualizado e como atualizar

## Diagnóstico

- **Local (sua máquina):** commit `79c701e` — *"chore: sync repo - reveal 3D, BioGauge, season purge claim, Node 22, combat overlays, image URLs"* (43 arquivos).
- **GitHub (remote):** commit `69c3424` — último push que funcionou (fix build roundParticleTexture).

Ou seja: o repositório local está **1 commit à frente** do GitHub. Esse commit nunca foi enviado porque **todo acesso ao GitHub (fetch/push) falha por rede**:

```
Failed to connect to github.com port 443 via 127.0.0.1
```

O Git está tentando usar **127.0.0.1** como proxy. Isso costuma vir de:

1. **Proxy do Windows** (Configurações → Rede e Internet → Proxy)
2. **VPN ou ferramenta** que redireciona tráfego para localhost
3. **Variáveis de ambiente** `HTTP_PROXY` / `HTTPS_PROXY` (em algum terminal ou perfil)

Enquanto isso continuar, o Cursor (e qualquer comando Git nesse ambiente) não consegue falar com o GitHub.

---

## Como subir a versão mais moderna no GitHub

### Opção 1: Push no seu terminal (fora do Cursor)

1. Abra **PowerShell** ou **Prompt de Comando** (Win+R → `cmd` ou `powershell`).
2. Navegue até a pasta do projeto:
   ```bash
   cd "D:\Projeto Loot"
   ```
3. Envie o branch atual para o remote:
   ```bash
   git push Remote main
   ```

Se a sua rede não usar proxy, aí o push costuma funcionar.

### Opção 2: Ajustar o proxy no Windows

1. **Configurações** → **Rede e Internet** → **Proxy**.
2. Se “Usar servidor proxy” estiver ligado e apontar para algo em `127.0.0.1`, desligue para testar **ou** configure o proxy correto.
3. Tente de novo no Cursor ou no terminal:
   ```bash
   cd "D:\Projeto Loot"
   git push Remote main
   ```

### Opção 3: Forçar o Git a não usar proxy só neste repositório

Na pasta do projeto:

```bash
cd "D:\Projeto Loot"
git config http.proxy ""
git config https.proxy ""
git push Remote main
```

Isso limpa proxy só para este repo. Se ainda usar 127.0.0.1, o proxy provavelmente está vindo do sistema (Windows) ou de variáveis de ambiente.

---

## Depois do push

Quando o `git push Remote main` concluir com sucesso:

- O GitHub ficará com o mesmo estado do seu `main` local (commit `79c701e`).
- O Vercel fará o deploy dessa versão (Node 22, fusão nova, BioGauge, etc.).

O nome do remote é **Remote** (não `origin`). Para conferir:

```bash
git remote -v
```

Deve aparecer: `Remote  https://github.com/pmarcura/LootBox.git (fetch/push)`.
