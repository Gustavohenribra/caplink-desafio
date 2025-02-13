## Projeto sendo criado em Next 15, TypeScript, SQLite, WebSockets, completamente responsivo.

### Visão Geral

Estamos utilizando um servidor customizado (server.ts) para facilitar a integração do websocket em um unico server

### Para instalar as dependencias rode:
```bash
npm install
```

### Para iniciar o banco rode o script:
```bash
npm run db:migrate
```
### E para rodar local use:
```bash
npm run dev
```
### Para buildar rode:
```bash
npm run build && npm start
```
### Para rodar via Docker rode:
```bash
docker compose up --build
```
### Estrutura do banco:

Table Patients:
```bash
CREATE TABLE IF NOT EXISTS Patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
);
```
Não será usado nenhum tipo de ORM uma vez que não enxergo vantagens nesse caso, poderiamos usar o Prisma para gerenciar esse banco SQLite.

### Server.ts

Inicializa o Next.js e prepara a aplicação.
Cria um servidor HTTP que delega o tratamento das requisições para o Next.js.
Anexa o servidor Socket.IO para lidar com eventos de tempo real.
Inicia o servidor na porta 3000.

### SocketServer.ts

Função calculateECGBaseline para calcular a linha de base do ECG.
Ao conectar um cliente, cria um estado para monitorar os dados enviados.
Ao receber dados do ECG, calcula a variação e verifica se os critérios para um alerta são atendidos.
Emite eventos de alerta para o cliente conforme o estado do ECG (início ou fim da irregularidade).

### Testes

Execução dos Testes:
```bash
npm run test
```
Cria um servidor de teste e conecta um cliente Socket.IO.
Simula o envio de dados do ECG e verifica se os eventos de alerta e dados são emitidos conforme esperado.
Testa a limpeza do estado do cliente após desconexão.

### Dashboard

Conecta-se ao servidor via Socket.IO para receber dados do ECG e alertas em tempo real.
Exibe gráficos em tempo real e de tendência utilizando Chart.js.
Calcula e exibe estatísticas históricas (média e variância) dos dados do ECG.
Permite a seleção de pacientes e exibe o histórico de alertas recebidos.

### PatientCards

Estabelece uma conexão com o servidor via Socket.IO para enviar e receber dados do ECG.
Renderiza um gráfico em tempo real com os dados do ECG e exibe alertas relacionados.
Fornece uma interface para confirmação de exclusão do paciente.

### PatientModal

Exibe um formulário com campos para nome e idade.
Ao submeter, a função handleSubmit envia uma requisição POST para /api/patients com os dados inseridos.
Em caso de sucesso, os campos são resetados, o modal é fechado e a função onPatientAdded é chamada.
Se ocorrer algum erro, uma mensagem é exibida no console e um alerta notifica o usuário.

### API/Patients

#### 1. POST

Cria um novo paciente na tabela Patients.

Recebe os dados do paciente (nome e idade) no corpo da requisição (JSON).

Validações:

Se o name ou o age não forem fornecidos, a API retorna um erro com status 400 e uma mensagem informando que ambos os campos são obrigatórios.

#### 2. GET

Recupera todos os registros da tabela Patients.

#### 3. DELETE

Exclui um paciente da tabela Patients com base no id fornecido na query string.

Validações:

Se o parâmetro id não for fornecido, a API retorna um erro com status 400 e uma mensagem informando que o ID é obrigatório.