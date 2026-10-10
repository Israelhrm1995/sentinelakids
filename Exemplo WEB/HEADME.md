Visão Geral das Coleções
Teremos 4 coleções principais na raiz do Firestore:

usuarios: Controle de acesso (Diretores, Porteiros).

escolas: Cadastro das instituições.

responsaveis: Cadastro central dos pais/tutores.

alunos: Onde o QR Code aponta (contém a cópia dos dados dos pais).

Detalhamento dos Documentos (JSON)
Abaixo, a estrutura exata dos campos em Português.

1. Coleção: usuarios
Gerencia quem tem senha para entrar no sistema.

{
  "uid": "XyZ123...", 
  "email": "diretor@escola.com.br",
  "nome_completo": "Carlos Diretor",
  "tipo_perfil": "ADM_ESCOLA", 
  "id_escola": "escola_001", 
  "data_criacao": "Timestamp" 
}

2. Coleção: escolas
Dados da Instituição.

{
  "id_documento": "escola_001", 
  "nome_instituicao": "Escola Pequeno Príncipe",

  "ativo": true,
  "endereco_completo": "Rua das Flores, 123, Uberlândia - MG",
  "url_logo": "https://firebasestorage.../logo.png"
}
3. Coleção: responsaveis
Cadastro mestre dos pais. Usado para manter os dados atualizados e consistentes.

{
  "id_documento": "resp_999",
  "cpf": "123.456.789-00",
  "rg": "MG-12.345.678",
  "url_foto": "https://firebasestorage.../maria.jpg",
  "ids_alunos_vinculados": ["aluno_abc", "aluno_xyz"] 
}

4. Coleção: alunos (Otimizada para Leitura)
Esta é a coleção mais importante. Quando o App ler o QRCode, ele buscará APENAS este documento.


{
  "id_documento": "aluno_abc",
  "id_escola": "escola_001",
  "nome_completo": "Joãozinho Silva",
  "data_nascimento": "2015-05-20",
  "url_foto": "https://firebasestorage.../joaozinho.jpg",
  "hash_qrcode": "7f8a9d1c-2b3e...", 
  "responsaveis_autorizados": [
      "id_responsavel": "resp_999",
      "nome": "Maria Silva",
      "grau_parentesco": "Mãe",
      "url_foto": "https://firebasestorage.../maria.jpg"
    {
      "id_responsavel": "resp_888",
      "nome": "José Silva",
      "grau_parentesco": "Pai",
      "url_foto": "https://firebasestorage.../jose.jpg"
  ]
}


classDiagram
class Usuarios {
    string email
    string tipo_perfil
    string id_escola FK
}
class Escolas {
    string id_documento PK
    string nome_instituicao
    boolean ativo
}
class Responsaveis {
    string id_documento PK
    string nome_completo
    string cpf
    string url_foto
    string[] ids_alunos_vinculados FK
}
class Alunos {
    string id_documento PK
    string id_escola FK
    string hash_qrcode UK
    Object[] responsaveis_autorizados
}
Escolas "1" -- "N" Usuarios : tem
Escolas "1" -- "N" Alunos : matricula
Responsaveis "1" -- "N" Alunos : pode_buscar (Referência Lógica)
note for Alunos "O campo responsaveis_autorizados contém\numa cópia leve (Nome + Foto)\ndos dados da coleção Responsaveis."

Estrutura de Pastas para Imagens (Storage)
Recomendo manter os nomes das pastas em inglês ou português, mas sem acentos e espaços. Sugestão em Português (seguro para URL):

/escolas/{id_escola}/alunos/{id_aluno}.jpg

/escolas/{id_escola}/responsaveis/{id_responsavel}.jpg

---

# Roadmap de Implementação e Padrões

## Próximas Etapas Sugeridas

1. **Gestão por Permissão**
  - **SUPER ADM**: cadastra escolas e usuários do tipo ADM de escola, vinculando cada usuário ADM à respectiva escola.
  - **ADM de escola**: cadastra, edita e lista alunos e responsáveis (pais/tutores) da sua escola, podendo adicionar fotos (opcional).
  - Cada CRUD pode ter um hook customizado para Firestore (ex: `useAlunos`, `useEscolas`).


2. **Geração e Impressão de QR Code**
  - O ADM de escola pode gerar e imprimir o QR Code de cada aluno (campo `hash_qrcode`).
  - O QR Code será colado na mochila do aluno e lido por outro app mobile PWA, que exibirá os dados do aluno e responsáveis (com ou sem fotos).


3. **Gestão de Dados**
  - Foco em cadastro, edição e manutenção dos dados de alunos, responsáveis e escolas.
  - Não haverá tela de retirada/autorização neste sistema.

4. **Upload de Imagens**
  - Usar Firebase Storage seguindo o padrão de pastas sugerido.
  - Salvar URL da imagem no documento correspondente no Firestore.
  - Exemplo de upload: usar `getStorage`, `ref`, `uploadBytes` e `getDownloadURL` do Firebase.

5. **Validações e UX**
  - Adicionar feedbacks visuais, loading e tratamento de erros.
  - Garantir que apenas perfis autorizados vejam/editem cada recurso.

## Padrões Recomendados

- **Componentização**: Reutilize componentes de formulário e tabelas.
- **Hooks customizados**: Centralize lógica de acesso ao Firestore em hooks.
- **Nomes de campos e pastas**: Use nomes sem acentos/espacos para compatibilidade.
- **Controle de acesso**: Sempre valide o perfil do usuário antes de exibir ações sensíveis.

## Observação Importante

> **A leitura e validação do QR Code será feita em outro aplicativo PWA mobile. Este sistema web é focado apenas na gestão dos dados e na geração/impressão dos QR Codes para os alunos.**

## Tecnologias já em uso

- React + TypeScript (SPA)
- Vite (build/dev)
- Material UI (UI)
- Firebase (Auth, Firestore, Storage)
- ESLint (lint)

---
Este roadmap serve como guia prático para evoluir o projeto até o objetivo final descrito no início deste documento.