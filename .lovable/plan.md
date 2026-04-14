
# Sistema de Gestão de Equipamentos

## Visão Geral
Painel administrativo corporativo com sidebar para gerenciar equipamentos de TI, com autenticação e banco de dados Supabase.

## Autenticação
- Login/cadastro com email e senha
- Perfil do usuário com nome, email, cargo, setor e foto
- Página de recuperação de senha

## Estrutura de Navegação (Sidebar)
- **Dashboard** — visão geral com contadores por tipo de equipamento e últimas movimentações
- **Notebooks** — listagem e gestão de notebooks
- **Monitores** — listagem e gestão de monitores
- **Roteadores** — listagem e gestão de roteadores
- **Câmeras** — listagem e gestão de câmeras
- **Impressoras** — listagem e gestão de impressoras
- **Movimentações** — histórico completo de transferências
- **Perfil** — dados do usuário logado

## Funcionalidades por Categoria
Cada tipo de equipamento terá:
- **Listagem** com busca, filtros (status, localização) e paginação
- **Cadastro/Edição** — marca, modelo, nº de série, patrimônio, status (ativo/manutenção/desativado), localização (setor/sala/filial), responsável atribuído, observações
- **Exclusão** com confirmação
- **Detalhes** com histórico de movimentações daquele equipamento

## Controle de Localização e Atribuição
- Campos de localização: setor, sala, filial
- Vincular equipamento a um responsável (selecionando entre usuários cadastrados)

## Histórico de Movimentações
- Registro automático ao transferir equipamento entre pessoas ou locais
- Campos: equipamento, de (pessoa/local anterior), para (pessoa/local novo), data, observação
- Visualização em timeline no detalhe do equipamento e em página dedicada

## Banco de Dados (Supabase)
Tabelas: `profiles`, `equipment`, `equipment_movements`, com RLS para que apenas usuários autenticados acessem os dados.

## Design
- Tema corporativo com sidebar colapsável (estilo dashboard)
- Ícones distintos para cada tipo de equipamento
- Cards de resumo no dashboard
- Tabelas responsivas com ações rápidas
