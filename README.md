# Gabiarra do Trigo

O projeto Gabiarra-do-trigo seria o resultado do desafio para construir uma aplicação capaz de administrar as coletas realizadas na padaria fictícia "gabiarra do trigo". Com isso, criou-se esse serviço que se tornou capaz de criar, encaminhar, aceitar ou rejeitar coletas da padaria e a divisão das atividades que podem ser executadas pelo "Fornecedor" ou "Transportador". Nesse projeto, objetivou-se utilizar as melhores práticas de CAP com a autenticação xsuaa para controle do acesso à aplicação.

Segue o Layout adotado de forma padrão ao gerar um projeto CAP no ambiente BAS:

Arquivo ou Pasta | Objetivo
---------|----------
`app/` | Conteúdo para o frontend
`db/` | Conteúdos de dados e declaração das entidades
`srv/` | Handlers customizados e a implementação do serviço
`package.json` | Metadata e configuração
`readme.md` | Este guia para introdução da aplicação :)

## Funcionalidades do Sistema

#### Criar Coletas 
- Ação destinada apenas para os Fornecedores executarem com a restrição declarada corretamente.

#### Visualizar Coletas 

- Processo realizado tanto pelos Fornecedores quanto pelas Transportadoras, porém a restrição de que a Coleta só pode ser visualizada pelo Fornecedor que a criou ou, como Transportadora, a Coleta que já foi encaminhada para você.

#### Encaminhar Coletas 

- Função executada pelos Fornecedores que direcionam a Coleta para a Transportadora informada, alterando o Status do Acompanhamento e o Transportador responsável.

#### Aceitar/Rejeitar Coletas 

- Funcionalidade exercida pelos Transportadores que podem escolher se decidem se "Aceitam" ou "Rejeitam" a Coleta direcionada.

#### Coletar Coletas 

- Funcionalidade final para finalizar uma Coleta, assim tem-se a restrição que esse processo pode acontecer apenas no caso do Status da Coleta estar "Aceita" e ser o Transportador que aceitou.



## Recursos opcionais adicionados à aplicação 

- #### Requisição da BrasilAPI para validação de CNPJ
- #### App Router
- #### Internacionalização das mensagens de retorno a partir da utilização da i18n
