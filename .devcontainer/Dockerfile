# Use a imagem base do devcontainer com Node.js
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Instalar dependências do sistema necessárias para better-sqlite3
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3 \
    make \
    g++ \
    && apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Configurar npm para usar um diretório acessível ao usuário node
RUN mkdir -p /usr/local/share/npm-global && \
    chown -R node:node /usr/local/share/npm-global

# Configurar o usuário antes de instalar pnpm
USER node

# Configurar npm prefix para o usuário node
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$NPM_CONFIG_PREFIX/bin:$PATH

# Instalar pnpm globalmente como usuário node
RUN npm install -g pnpm

# Definir o diretório de trabalho
WORKDIR /workspace

