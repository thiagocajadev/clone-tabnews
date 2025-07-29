# 🔐 Trabalhando com Senhas

> Pra virar adulto em TI, é preciso implementar autenticação em um sistema - Filipe Deschamps

Bom, são tantas abordagens ao longo dos anos para armazenar e recuperar senhas. Vale a pena repassar algumas práticas até o que temos de mais recente atualmente.

Qualquer solução de segurança tem suas falhas, é inevitável. O que devemos fazer é não baixar a guarda e aplicar as melhores práticas sempre que possível.

Pense em questões de fraudes internas, onde alguém com acesso privilegiado a senhas possa vendar essas informações a um hacker. Proteja-se!

## Texto puro

Armazenar senha em texto puro no banco de dados é muito prático. Consultar a senha do usuário e enviar pra ele por email caso ele esqueça é uma maravilha, haha (risos de desespero).

Temos que pensar sempre de forma defensiva em programação e a segurança precisa ser reforçada. Um sistema seguro, passa credibilidade e gera confiança para uso.

Em caso de invasão, o atacante terá acesso imediato às credenciais de todos os usuários. Além disso, até mesmo administradores do sistema ou banco de dados com más intenções podem explorar essas informações para outros fins.

| Usuário       | Senha       |
| ------------- | ----------- |
| thiagocajadev | senha123456 |

## Senha encriptada

Subindo um pouco de nível, temos a encriptação da senha, onde a informação é embaralhada e depois desembaralhada para recuperar a mesma.

Se a senha enviada pelo usuário for igual a senha descriptografada, permite o acesso.

Usando uma [ferramenta online](https://www.devglan.com/online-tools/text-encryption-decryption) para encriptar a senha com uma chave mestra, temos

| Usuário       | Senha texto puro | Senha encriptada         | Chave Secreta |
| ------------- | ---------------- | ------------------------ | ------------- |
| thiagocajadev | senha123456      | e4dQm8NU1Nk20Aig7YVZzA== | CHAVESECRETA  |

> Só quem possui a chave secreta pode decriptar as senhas, sendo ideal deixar a chave fora do banco de dados, evitando problemas em caso de vazamento de dados.

Mas esse é o grande problema da encriptação: os caracteres reais das senhas estão salvos dentro dos caracteres exibidos.

E se quem tem a chave secreta vaza ela? Ai lascou também. 🧨

Curiosidade sobre os sinônimos **criptografar** e **encriptar**:

| Termo técnico/formal               | Aceitação no Brasil          | Observações                                                                                  |
| ---------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------- |
| **Criptografar / Descriptografar** | ✅ Alta — padrão atual       | Forma preferida em documentação técnica, cursos, blogs e empresas como Google e Microsoft.   |
| **Cifrar / Decifrar**              | ✅ Alta — tradicional        | Termos clássicos, ainda usados como sinônimos em contextos mais amplos de segurança.         |
| **Criptografar / Decriptar**       | ✅ Média/Alta — tradução     | Correto e presente em textos técnicos traduzidos, mas menos intuitivo para falantes nativos. |
| Encriptar / Desencriptar           | ⚠️ Baixa — informal/antiga   | Uso informal herdado do inglês. Aparece, mas perde espaço em conteúdos profissionais.        |
| Criptar / Descriptar               | ❌ Muito baixa / não técnico | Termos inventados por analogia. Não reconhecidos nem usados em material técnico sério.       |

## Hash

O Hash é como uma "impressão digital" dos dados. Ele é uma função que transforma qualquer dado em uma sequência fixa de caracteres. Embora o hash sozinho não garanta autenticidade, ele é usado em conjunto com criptografia (assinatura digital) para verificar se os dados são legítimos e vieram de quem afirmam ter vindo.

```bash
# exemplo de hash ao consultar um commit com git log
# essa assinatura autentica que os dados ali não foram alterados
# caso haja alteração, o hash muda também
6756eea59074e763a5e8315374289292ad46eb2b
```

O Hash é uma função unidirecional (One-WayFunction) que transforma qualquer dado em uma sequência fixa de caracteres. E não da pra recuperar a informação original, apenas é possível comparar se a informação de identificador é a mesma procurada.

### Funcionamento

Vamos simular uma combinação de dígitos fornecidos como senha pelo usuário: **1**, **2** e **3**. Eu poderia criar um algoritmo que somasse esses números e guardasse apenas o total como hash: 6.

| Usuário       | Hash de senha | Senha original |
| ------------- | ------------- | -------------- |
| thiagocajadev | 6             | 123            |

Agora eu não tenho quais os dígitos foram informados pelo usuário, apenas a combinação para comparar. Se essa combinação for igual ao hash, então eu tenho uma autenticação válida.

Claro, esse exemplo é o mais simplificado possível e mais frágil. Outras combinações podem colidir e gerar o mesmo hash, sendo extremamente problemático.

É muito complexa a criação de um algoritmo robusto e seguro, por isso o ideal é usar uma biblioteca testada, que possui diversas validações e verificações para geração do hash.

Algoritmos populares no passado que, que possuíam possibilidade de colisões e foram quebrados conforme a computação evolui: **MD5**, **SHA1**, **SHA256**.

## Adicionando um pouco de sal e pimenta 🧂🌶️

Visando acrescentar algo exclusivo para combater as [Rainbow Tables](https://pt.wikipedia.org/wiki/Tabela_arco-%C3%ADris) que possuem hashes pré processados para ataques.

O **hash** transforma uma senha em um valor fixo. Porém, se duas pessoas tiverem a mesma senha, o hash será igual — o que representa um risco.

O **salt** é um valor aleatório gerado e adicionado à senha antes de aplicar o hash. Isso garante que mesmo senhas iguais gerem hashes diferentes.

Exemplo:

**Senha**: "123456"
**Salt**: "a1b2c3"
**Senha** + **Salt**: "123456a1b2c3"
**Hash final**: "f91a2d...etc"

Esse hash é armazenado junto com o salt.

Vantagens:

- Garante que hashes iguais não revelem senhas iguais
- Protege contra ataques com rainbow tables
- Aumenta a segurança do armazenamento de senhas

Muito legal, mas ainda sim há vulnerabilidades. **Hash + Salt não impede ataques de força bruta**, só dificulta outros tipos (como dicionário e rainbow table). Um atacante ainda pode tentar **todas as combinações possíveis** até achar a senha original.

Principais riscos:

- **Senhas fracas** (ex: "123456", "admin") são facilmente quebradas, mesmo com salt.
- O salt **não protege contra força bruta direta**, só garante que o atacante precisa atacar **cada hash individualmente**.
- Em alguns casos, se o algoritmo de hash for rápido (como MD5 ou SHA-1), o atacante consegue testar milhões de senhas por segundo.

Para melhorar essa questão, matemáticos e engenheiros de software criaram novos algoritmos que reduzem a velocidade de geração do hash.

### Bcrypt e a segurança do algoritmo lento

[Link](https://bcrypt-generator.com/) maneiro pra testes. Aqui algumas dicas:

1. **Use algoritmos lentos** e próprios para senha, como: bcrypt, scrypt e argon2.
2. **Force senhas fortes** (longas, com letras, números e símbolos).
3. **Aumente o custo computacional** (fator de trabalho do algoritmo).

```bash
# exemplo do hash usado com bcrypt
$2a$12$r60ENkm/BRjB0/rQ7K.lAuZJTtiPBa2u0GMME1H.UjfI2QRI/XMuy
```

Explicando cada trecho do hash gerado:

| Parte                      | Valor                             | Descrição                                  | Caracteres |
| -------------------------- | --------------------------------- | ------------------------------------------ | ---------- |
| **Prefixo do algoritmo**   | `$2a$`                            | Versão do algoritmo Bcrypt                 | 4          |
| **Fator de custo**         | `12`                              | 2 elevado à 12 (4096 rodadas de hash)      | 2          |
| **Separador interno**      | `$`                               | Delimitador entre custo e salt             | 1          |
| **Salt (base64)**          | `r60ENkm/BRjB0/rQ7K.lAu`          | Valor aleatório único usado para esse hash | 22         |
| **Hash da senha (base64)** | `ZJTtiPBa2u0GMME1H.UjfI2QRI/XMuy` | Resultado do hash final da senha + salt    | 31         |
| **Total**                  |                                   |                                            | **60**     |

O salt e o hash final são codificados em **base64 modificada** (usa `.` e `/`).

Observação: o formato **sempre tem 60 caracteres** no total. Quanto maior o fator de custo, mais seguro (e mais lento) o processamento.

Exatamente. Pra colidir (ou seja, encontrar uma entrada que gere o mesmo hash Bcrypt), você teria que:

Reproduzir toda a estrutura:

- Mesma versão ($2a$)
- Mesmo custo (12) → 2¹² = 4.096 rodadas por tentativa
- Mesmo salt (22 caracteres base64)
- Gerar uma senha diferente que, ao ser misturada com esse salt e rodada pelo algoritmo, gere exatamente os mesmos 31 caracteres finais

Por que é muito custoso?

- Salt é obrigatório e único, então você não pode pré-calcular nada.
- Cada tentativa leva tempo (por design). Com cost = 12, cada hash já consome milissegundos.
- Bcrypt é feito para desestimular força bruta: quanto maior o custo, mais lento fica.

Não existe atalho matemático conhecido para inverter Bcrypt. É tentativa e erro mesmo. Pra colidir um hash Bcrypt você precisa simular 100% do processo, incluindo rodar as milhares de iterações por tentativa. É propositalmente lento e resistente.

Mesmo assim, se a senha for fraca, como "123456", e o atacante tiver acesso ao hash e ao salt, ele ainda pode fazer ataques de força bruta ou dicionário.

#### Pepper: a parte da pimenta

O pepper adiciona uma camada extra que o atacante não tem acesso, tornando esses ataques inviáveis.

O pepper é um valor secreto fixo (diferente do salt, que é único e armazenado junto com o hash). Ele é mantido fora do banco de dados, geralmente em uma variável de ambiente ou serviço de configuração seguro.

```bash
# exemplo de segredo pepper aleatório, salvo em variável de ambiente ou outro local seguro
Qz8f#Lr9w7!@Yx2Vm5*ZtB^kHdP3$gNc
```

Um exemplo legal de `pepper` no dia a dia é quando usamos um gerenciador de senhas como **Bitwarden**, adicionando no inicio e fim letras ou números adicionais únicos.

```bash
# Senha gerada pelo Bitwarden, porém com "pepper" manual:
# adicionei "a123" no início e "z321" no final da senha salva.
# Essa camada extra não está armazenada no Bitwarden, aumentando a segurança.
a123PqYAk%qLbbadZCm6cCQSY$rtg$5xIx*!8kgp^JOG4o@FT#GdDlIvIOg8XOX@68S^z321
```
