# Sistema de Laboratório Geotécnico

Sistema completo de gerenciamento de laboratório geotécnico com calculadoras especializadas seguindo normas ABNT atualizadas, autenticação híbrida Firebase-PostgreSQL e sistema robusto de testes automatizados.

## Características Principais

- **📊 Calculadoras Técnicas**: Densidade In-Situ (NBR 9813:2021), Densidade Real (NBR 17212:2025), Densidade Máx/Mín (NBR 12004:2021/NBR 12051:2021)
- **🔐 Autenticação Híbrida**: Firebase para login + PostgreSQL para roles e permissões
- **👥 Camadas Hierárquicas**: 5 níveis de acesso (VIEWER → TECHNICIAN → MANAGER → ADMIN → DEVELOPER)
- **📄 Geração de PDFs**: Relatórios profissionais conforme padrões técnicos
- **🛡️ Sistema de Segurança**: Rate limiting, validação Zod, proteção contra SQL injection
- **🔄 Testes Automatizados**: Suíte completa para prevenir regressões
- **📱 Interface Responsiva**: Design mobile-first com componentes acessíveis
- **📋 Conformidade LGPD**: Sistema completo de proteção de dados pessoais

## Tecnologias

### Frontend
- React 18 + TypeScript
- Tailwind CSS + Shadcn/UI
- Wouter (roteamento)
- React Query (estado servidor)
- React PDF (relatórios)

### Backend
- Express.js + TypeScript
- Drizzle ORM + PostgreSQL
- Firebase Admin
- Rate limiting + CORS

### Infraestrutura
- Vite (build tool)
- Neon Database (PostgreSQL)
- Firebase Authentication
- Sistema de testes Jest

## Início Rápido

### 1. Configuração Inicial

```bash
# Clonar repositório
git clone <repo-url>
cd laboratorio-geotecnico

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

### 2. Configurar Firebase

1. Crie projeto no [Firebase Console](https://console.firebase.google.com)
2. Habilite Authentication > Email/Password
3. Copie credenciais para `.env`:

```bash
VITE_FIREBASE_API_KEY=sua_api_key
VITE_FIREBASE_PROJECT_ID=seu_project_id
VITE_FIREBASE_APP_ID=seu_app_id
```

### 3. Configurar PostgreSQL

```bash
# Opção 1: Neon Database (Recomendado)
# 1. Acesse https://neon.tech
# 2. Crie conta e projeto
# 3. Copie connection string para .env

# Opção 2: PostgreSQL Local
DATABASE_URL=postgresql://user:password@localhost:5432/database
```

### 4. Executar Aplicação

```bash
# Aplicar schema do banco
npm run db:push

# Executar em desenvolvimento
npm run dev

# Acessar aplicação
# http://localhost:5000
```

### 5. Verificar Instalação

```bash
# Executar testes automatizados
node scripts/test-suite-completa.js

# Verificar health do sistema
curl http://localhost:5000/api/health

# Verificar regressões
node check-regressions.js
```

## Estrutura do Projeto

```
laboratorio-geotecnico/
├── client/src/                 # Frontend React
│   ├── components/
│   │   ├── ui/                # Componentes base Shadcn
│   │   ├── laboratory/        # Calculadoras de ensaios
│   │   └── layout/           # Layout e navegação
│   ├── hooks/                # React hooks customizados
│   ├── lib/                  # Utilitários e configurações
│   └── pages/               # Páginas da aplicação
├── server/                   # Backend Express
│   ├── routes/              # Rotas da API
│   ├── middleware/          # Middlewares customizados
│   └── auth-firebase-hybrid.ts  # Sistema de autenticação
├── shared/                  # Código compartilhado
│   └── schema.ts           # Schemas Drizzle do banco
├── scripts/                # Scripts de teste e automação
│   ├── test-*.js          # Suíte de testes automatizados
│   └── audit-*.js         # Scripts de auditoria
└── docs/                   # Documentação técnica
    ├── DEVELOPER_GUIDE.md     # Guia completo do desenvolvedor
    ├── API_REFERENCE.md       # Referência da API
    └── SETUP_CONFIGURATION.md # Guia de configuração
```

## Camadas Hierárquicas

### Níveis de Acesso

1. **VIEWER**: Visualizar relatórios básicos
2. **TECHNICIAN**: VIEWER + criar/editar próprios ensaios
3. **MANAGER**: TECHNICIAN + gerenciar ensaios da equipe
4. **ADMIN**: MANAGER + gerenciar usuários e sistema
5. **DEVELOPER**: ADMIN + acesso completo + debug

### Exemplo de Uso

```javascript
// Verificar permissões no frontend
const { hasRole, hasAnyRole } = useAuth();

// Verificar role específico
if (hasRole('MANAGER')) {
  // Usuário é MANAGER ou superior
}

// Verificar múltiplos roles
if (hasAnyRole(['ADMIN', 'DEVELOPER'])) {
  // Acesso administrativo
}
```

## APIs Principais

### Autenticação

```http
POST /api/auth/sync-user          # Sincronizar Firebase com PostgreSQL
POST /api/auth/set-role           # Definir role (ADMIN+)
```

### Ensaios

```http
GET    /api/tests/densidade-in-situ/temp       # Listar ensaios
POST   /api/tests/densidade-in-situ/temp       # Criar ensaio
DELETE /api/tests/densidade-in-situ/temp/:id   # Excluir ensaio

GET    /api/tests/densidade-real/temp          # Densidade real
POST   /api/tests/densidade-real/temp
DELETE /api/tests/densidade-real/temp/:id

GET    /api/tests/densidade-max-min/temp       # Densidade máx/mín
POST   /api/tests/densidade-max-min/temp
DELETE /api/tests/densidade-max-min/temp/:id
```

### Monitoramento

```http
GET /api/health     # Health check
GET /api/metrics    # Métricas do sistema
```

## Testes Automatizados

### Suíte Completa

```bash
# Executar todos os testes
node scripts/test-suite-completa.js

# Testes individuais
node scripts/test-ensaios-salvamento.js      # Salvamento
node scripts/test-pdf-generation.js          # Geração PDFs
node scripts/test-hierarquia-roles.js        # Camadas hierárquicas
node scripts/test-permissoes-especificas.js  # Permissões por role
```

### Verificação de Regressões

```bash
# Verificar se componentes críticos estão funcionando
node check-regressions.js

# Analisar padrões do projeto antes de implementar
node analyze-project-standards.js

# Verificar duplicidades
node scripts/check-duplicates.js ComponentName
```

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Servidor desenvolvimento
npm run build           # Build produção
npm run start          # Servidor produção
npm test               # Testes Jest

# Banco de dados
npm run db:push        # Aplicar schema
npm run db:generate    # Gerar migrações
npm run db:studio      # Interface visual (se configurado)

# Scripts customizados
npm run analyze        # Análise do projeto
npm run audit          # Auditoria de segurança
npm run validate       # Validação completa
```

## Documentação Técnica

- **[📖 Guia do Desenvolvedor](docs/DEVELOPER_GUIDE.md)**: Documentação completa para desenvolvedores
- **[🔌 Referência da API](docs/API_REFERENCE.md)**: Documentação detalhada de todos os endpoints
- **[⚙️ Configuração e Setup](docs/SETUP_CONFIGURATION.md)**: Guia de instalação e configuração
- **[🏗️ Arquitetura](replit.md)**: Visão geral da arquitetura e changelog

## Segurança

- **Autenticação**: Firebase ID tokens com verificação server-side
- **Autorização**: Sistema de roles hierárquico com controle granular
- **Rate Limiting**: 100 req/15min (produção), 500 req/15min (desenvolvimento)
- **Validação**: Schemas Zod para todos os endpoints
- **CORS**: Configurado para domínios específicos
- **Logs**: Sistema estruturado com IP tracking

## Conformidade LGPD

### Acesso Público aos Termos

- **Página de Login**: Links diretos para "Termos de Uso" e "Política de Privacidade"
- **Rota Pública**: `/termos-uso` acessível sem autenticação
- **Interface Completa**: Visualização profissional com scroll areas organizadas

### Endpoints LGPD (100% Funcionais)

```bash
# Verificar termos de uso
curl http://localhost:5000/api/lgpd/terms

# Verificar política de privacidade
curl http://localhost:5000/api/lgpd/privacy-policy

# Registrar consentimento (requer autenticação)
curl -X POST http://localhost:5000/api/lgpd/consent \
  -H "Authorization: Bearer <firebase-token>" \
  -H "Content-Type: application/json" \
  -d '{"terms": true, "dataProcessing": true}'

# Exportar dados do usuário
curl http://localhost:5000/api/lgpd/my-data \
  -H "Authorization: Bearer <firebase-token>"

# Solicitar exclusão de dados
curl -X POST http://localhost:5000/api/lgpd/request-deletion \
  -H "Authorization: Bearer <firebase-token>"
```

### Funcionalidades Implementadas

- **Consentimentos**: Sistema de switches interativos para diferentes tipos de tratamento
- **Exportação de Dados**: Download completo em formato JSON
- **Solicitação de Exclusão**: Processo controlado com prazo de 30 dias
- **Histórico**: Registro temporal de todas as ações de consentimento
- **Transparência**: Especificação clara de dados coletados e finalidades

### Campos LGPD no Banco

```sql
-- Campos adicionados à tabela users
terms_accepted BOOLEAN DEFAULT false,
terms_accepted_at TIMESTAMP,
privacy_policy_accepted BOOLEAN DEFAULT false,
privacy_policy_accepted_at TIMESTAMP,
data_processing_consent BOOLEAN DEFAULT false,
data_processing_consent_at TIMESTAMP,
marketing_consent BOOLEAN DEFAULT false,
marketing_consent_at TIMESTAMP,
data_retention_consent BOOLEAN DEFAULT false,
data_retention_consent_at TIMESTAMP,
data_export_requested BOOLEAN DEFAULT false,
data_export_requested_at TIMESTAMP,
data_delete_requested BOOLEAN DEFAULT false,
data_delete_requested_at TIMESTAMP,
data_delete_executed_at TIMESTAMP
```

### Testes LGPD

```bash
# Executar teste completo da implementação LGPD
node scripts/test-lgpd-complete.js

# Resultado esperado: 5/5 endpoints aprovados (100%)
```

## Performance

- **Frontend**: React Query para cache inteligente
- **Backend**: Connection pooling PostgreSQL
- **Build**: Vite para bundle otimizado
- **Monitoramento**: Métricas em tempo real via /api/metrics

## Contribuição

### Antes de Implementar

1. Verificar padrões: `node analyze-project-standards.js`
2. Verificar duplicidades: `node scripts/check-duplicates.js`
3. Executar testes: `node check-regressions.js`

### Fluxo de Desenvolvimento

1. Criar branch: `git checkout -b feature/nova-funcionalidade`
2. Implementar funcionalidade
3. Executar testes: `npm test && node scripts/test-suite-completa.js`
4. Verificar qualidade: `npm run validate`
5. Commit e push: `git commit -m "feat: nova funcionalidade"`
6. Criar pull request

### Padrões de Código

- **TypeScript**: Tipagem rigorosa obrigatória
- **ESLint**: Regras de qualidade e segurança
- **Prettier**: Formatação automática
- **Testes**: Cobertura obrigatória para novas funcionalidades

## Deploy

### Replit (Desenvolvimento)

```bash
# Configure secrets no Replit
# Push para branch main ativa deploy automático
git push origin main
```

### Firebase Hosting (Produção)

```bash
# Build e deploy
npm run build
firebase deploy
```

## Suporte

- **Issues**: Usar GitHub Issues para bugs e feature requests
- **Documentação**: Consultar `/docs` para informações técnicas
- **Testes**: Executar suíte de testes para diagnosticar problemas
- **Logs**: Verificar console do servidor para debugging

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Sistema de Laboratório Geotécnico** - Desenvolvido com foco em precisão técnica, segurança e escalabilidade para atender às necessidades de laboratórios geotécnicos profissionais.#   L a b o r a t o r i o E v C S  
 #   L a b o r a t o r i o E v C S  
 #   L a b o r a t o r i o E v C S  
 