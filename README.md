# MoraJunto

MoraJunto é um aplicativo web para organizar a vida de quem divide moradia. A ideia nasceu de um problema bem comum em repúblicas e apartamentos compartilhados: quem pagou o quê, de quem é a vez de lavar o banheiro e o que ainda falta comprar no mercado. Em vez de planilhas e grupos de mensagens, tudo fica em um só lugar, com uma interface leve e pensada para funcionar tanto no computador quanto no celular.

Este projeto é o front-end do aplicativo. Ele foi desenhado no Figma Make e depois evoluído e publicado por mim como parte do meu portfólio.

**Demonstração:** https://rafs2411.github.io/morajunto/

## O que dá para fazer

Ao entrar, o usuário cai em um painel que resume a situação da casa: quanto foi gasto no mês, quem está devendo ou tem a receber, quais tarefas estão pendentes e o que ainda falta na lista de compras. A partir dali, a navegação leva às demais áreas.

Na área de moradias é possível cadastrar e alternar entre mais de uma casa ou apartamento, e cada moradia tem seus próprios moradores, despesas, tarefas e compras. Os moradores ganham uma cor e um avatar com as iniciais, o que ajuda a identificar rapidamente quem é quem em todas as telas.

As despesas podem ser categorizadas, associadas a quem pagou e divididas entre os moradores escolhidos. Na hora de cadastrar, o app já mostra quanto fica para cada pessoa, e o balanço geral indica quem tem a receber e quem tem a pagar.

As tarefas domésticas são atribuídas a um morador, com horário, dias da semana e opção de repetição semanal. Elas aparecem também em um calendário mensal, e é possível marcá-las como feitas. Já a lista de compras separa o que está pendente do que já foi comprado, com quantidade e edição de cada item.

## Tecnologias

O projeto usa React 19 com TypeScript, Vite como ferramenta de build e Tailwind CSS v4 para a base de estilos e o tema. A tipografia combina Fraunces nos títulos e Plus Jakarta Sans no restante do texto, ambas carregadas do Google Fonts.

## Como rodar na sua máquina

É preciso ter o Node.js 22 ou mais recente instalado. Depois, basta clonar o repositório e iniciar o servidor de desenvolvimento:

```bash
git clone https://github.com/rafs2411/morajunto.git
cd morajunto
npm install
npm run dev
```

O terminal vai mostrar o endereço local, normalmente `http://localhost:5173`. Para gerar a versão de produção, use:

```bash
npm run build
```

## Estrutura

```
morajunto/
├── .github/workflows/deploy.yml
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

Toda a interface e a lógica das telas estão concentradas em `src/App.tsx`, e o tema de cores, fontes e sombras fica em `src/index.css`. O deploy no GitHub Pages é feito automaticamente por um workflow do GitHub Actions a cada push na branch `main`.

## Estado atual e próximos passos

Vale ser transparente sobre o que este projeto ainda é: um protótipo de front-end. O login é apenas ilustrativo e os dados são de exemplo, mantidos em memória, então tudo o que for cadastrado some ao recarregar a página.

Os próximos passos naturais são persistir os dados, primeiro com o `localStorage` e depois com uma API própria e um banco de dados, além de implementar autenticação de verdade, dividir o código em componentes menores e adicionar testes.

## Autor

Feito por Rafa, estudante de Análise e Desenvolvimento de Sistemas e desenvolvedor fullstack em Brasília. Sinta-se à vontade para abrir uma issue ou entrar em contato.