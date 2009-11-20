// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------



// Classe Analisador Sintático (Parser)
//  Esta classe é responsável por conduzir a etapa de análise sintática,
//  identificando regras gramaticais respeitadas pelos tokens adquiridos
//  pelo Analisador Léxico. Eventuais erros identificados durante a
//  análise poderão ser resgatados através da lista de erros em error().
//
//  Opcionalmente, pode ser passado um Analisador Semantico para que o
//    analisador sintatico o guie para efetuar a analise semântica;
//  Ou também pode ser passado um Gerador de Código Alvo para que o
//    analisador sintático o guie para efetuar a geração de código.
//
function AnalisadorSintatico(input, analisadorSemantico, geradorCodigo) {
//                            /            |                  \
//                        necessario     opcional            opcional


    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    // Analisador Léxico a ser utilizado por este Analisador Sintático (parser)
    var analisadorLexico = new AnalisadorLexico(input);

    // Analisador Semântico que pode ser guiado pelo parser
    var analisadorSemantico = analisadorSemantico;

    // Gerador de código que pode estar acoplaco ao parser
    var gerador = geradorCodigo;


    // Lista de erros sintáticos encontrados durante a análise
    var error_list = new Array();

    // Estado do parser, para ignorar erros espúrios como quando um comentário não é fechado
    var ignorando = false;

    // Variáveis para armazenar informações sobre o token atual
    var token;     // token atual propriamente dito reconhecido pelo analisador léxico
    var simbolo;   // simbolo (categoria) atual (para simplificar os procedimentos)
    var cadeia;    // cadeia do token atual (para simplificar os procedimentos)



    // ************************************************************************
    // Métodos públicos
    // ************************************************************************

    // Método principal para iniciar a análise sintática
    //   Retorna true caso a análise tenha terminado sem
    //   nenhum erro, e false caso contrário.
    this.parse = function() {

        // Obtém o primeiro símbolo da entrada
        obterSimbolo();

        // Inicia a análise a partir da regra inicial
        programa();

        if (DEBUG) {
            if (analisadorSemantico) {
                analisadorSemantico.imprimir();
            }
        }

        // Verifica se houve erros durante a analise e retorna o estado de sucesso
        if (!analisadorSemantico) {
            return (error_list.length == 0);
        }
        else {
            return (error_list.length == 0 && analisadorSemantico.errors().length == 0);
        }

    }

    // Retorna a lista de erros encontrados durante a análise.
    //   caso a análise sintática esteja guiando outros analisadores, como o
    //   analisador semântico, ou geradores como o gerador de código C, seus
    //   erros serão concatenados nesta mesma lista e ordenados por linha.
    this.errors = function() {
        // Se estamos efetuando análise semântica juntamente com a sintática,
        // concatenamos à lista de erros sintáticos os erros semânticos encontrados
        if (analisadorSemantico) {

            // Concatena as duas listas
            var list = error_list.concat(analisadorSemantico.errors());

            // Ordena a lista por linha em que cada erro ocorre, para
            //  preservar a ordem dos erros. Para isto, é utilizada a
            //  a seguinte função de ordenação:
            list.sort(function(a,b) { return a.line() - b.line(); });

            // Retorna a lista de erros sintáticos e a lista
            //  de erros semênticos mescladas e ordanadas.
            return list;
        }
        else {
           // Retorna apenas a lista de erros sintáticos
           return error_list;
        }
    }




    // ************************************************************************
    // Métodos Privados
    // ************************************************************************

    // Obtem o próximo token to analisador léxico e o armazena nas variáveis
    //  privadas token, cadeia e símbolo, em que token corresponde ao obejto
    //  token propriamente dito, símbolo corresponde à sua categoria e cadeia
    //  corresponde à cadeia do token.
    function obterSimbolo() {

        // Obtem o próximo token
        token = analisadorLexico.getToken();

        // Armazena as informações do token para simplificar os procedimentos
        if (token != null) {

            // Se o parser está guiando a análise semântica,
            if (analisadorSemantico) {
                // também passamos a linha do token atual para o analisador semântico
                analisadorSemantico.setLinha(analisadorLexico.line());
            }

            // Verificamos a categoria do token lido
            //  para registrar os nomes de símbolo corretos.
            switch (token.id()) {

                // Identificador (como nome de variável, de programa, procedimento)
                case TokenId.Identifier:
                    simbolo = "@ident";
                    cadeia  = token.cadeia();
                    break;

                // Número real (como 1,1 , 2,5 6,63 , 0,0001 - separados por vírgulas)
                case TokenId.Real:
                    simbolo = "@numero_real";
                    cadeia  = token.cadeia();
                    break;

                // Número inteiro (como 1, 2, 3, 6, 100)
                case TokenId.Integer:
                    simbolo = "@numero_int";
                    cadeia  = token.cadeia();
                    break;

                // Palavra reservada (como "enquanto", "programa")
                case TokenId.Keyword:
                    simbolo = token.cadeia();
                    cadeia  = token.cadeia();
                    break;

                // Erro léxico simples (cadeia não reconhecida)
                case TokenId.Error:
                    simbolo = "@erro";
                    cadeia  = token.cadeia();

                    // Colocamos este erro léxico na lista de erros
                    error("Caractere '" + token.cadeia() + "' nao reconhecido");

                    // Após listarmos a ocorrência do erro, ignoramos a cadeia não
                    //  reconhecida, solicitando o próximo token na entrada
                    obterSimbolo();

                    break;
            }
        }
        else { // Este else trata o caso do token for nulo (null).

            // Se o token for nulo, isso significa que ou a entrada acabou, ou ocorreu um
            //  erro não tokenizável, no caso, fim de comentário não encontrado.

            if (analisadorLexico.error() != null) {
                // Erro de analise lexica não tokenizável (como comentário nao finalizado)
                //   o processamento deve ser terminado pois este tipo de erro é crítico.

                // Colocamos o erro léxico na lista de erros
                error_list.push(analisadorLexico.error());

                token   = null;
                simbolo = "@erro";
                cadeia  = '';

                // Ignora os erros encontrados depois do erro de comentário
                ignorando = true;
            }
            else {
                // Não há erro, portanto a analise léxica terminou.
                token   = null;
                simbolo = '$';
                cadeia  = '';
            }
        }
    }


    // Empilha um erro na lista de erros
    //  Ao chamar este método passando-se uma mensagem string do erro
    //  encontrado, uma estrutura de erro, contendo a linha atual e a
    //  natureza do erro (lexico, sintatico, semantico), é empilhada
    //  na lista de erros encontrada na análise.
    function error(mensagem) {
        if (!ignorando) {
            var error = new Error(mensagem, analisadorLexico.line(), "sintatico");
            error_list.push(error);
        }
    }


    // Varre a entrada ate que um símbolo de sincronização seja encontrado
    //   Este método é utilizado pelo modo pânico para garantir a sincronização
    //   da entrada num ponto em que a análise sintática possa ser continuada.
    function varre(sincronizadores) {
        // Varre a entrada até encontrar um membro do conjunto de
        //   sincronização e enquanto não acabarem os tokens
        while (!(simbolo in sincronizadores) && token != null) {
            obterSimbolo();
        }
    }





    // Procedimentos para regras gramaticais
    // *************************************

    // Procedimento para as regras "programa", "corpo" e "dc"
    //   01. <programa>      ::= programa ident ; <corpo> .
    //   02. <corpo>         ::= <dc> inicio <comandos> fim
    //   03. <dc>            ::= <dc_v> <dc_p>
    //
    function programa() {

        if (simbolo != "programa") {
            error("Esperado 'programa' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["programa"], Primeiros["dc_v"], Primeiros["dc_p"], "inicio", "@ident", ";"));
        }
        if (simbolo == "programa") {
            obterSimbolo();
        }

        if (simbolo != "@ident") {
            error("Esperado identificador mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Primeiros["dc_p"], "inicio", ";", "@ident"));
        }
        if (simbolo == "@ident") {

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.inserir({"cadeia":cadeia, "categoria":"programa"});
                if (gerador) {
                    gerador.genStart(cadeia);
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO

            obterSimbolo();
        }

        if (simbolo != ";") {
            error("Esperado ';' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Primeiros["dc_p"], "inicio", ";"));
        }
        if (simbolo == ";") {
            obterSimbolo();
        }

        // Chama as regras "dc_p" e "dc_v"
        dc_v(join(Seguidores["programa"], "inicio", Primeiros["comandos"]));
        dc_p(join(Seguidores["programa"], "inicio", Primeiros["comandos"]));


        // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
        if (analisadorSemantico) {
            // Sinaliza ao analisador semântico que o corpo do programa está começando
            analisadorSemantico.iniciarCorpo();
            if (gerador) {
                gerador.iniciarMain();
            }
        } // FIM DO CORTE PARA ANALISADOR SEMANTICO


        if (simbolo != "inicio") {
            error("Esperado 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["comandos"], "inicio"));
        }
        if (simbolo == "inicio") {
            obterSimbolo();
        }

        // Chama a regra "comandos"
        comandos(Seguidores["programa"]);

        if (simbolo != "fim") {
            error("Esperado 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["programa"], "fim"));
        }
        if (simbolo == "fim") {
            obterSimbolo();
        }

        if (simbolo != ".") {
            error("Esperado '.' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["programa"], "."));
        }
        if (simbolo == ".") {
            obterSimbolo();
        }

        // Reconhece todo o resto a partir daqui como erro
        while (simbolo != "$") {
            error("Simbolo '" + cadeia + "' encontrado apos final de programa.");
            obterSimbolo();
        }

        // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
        if (gerador) {
            gerador.finalizarMain();
        }
        // FIM DO CORTE PARA GERADOR DE CÓDIGO
    }



    // Procedimento para regra "dc_v" e "tipo_var"
    //   04. <dc_v>          ::= var <variaveis> : <tipo_var> ; <dc_v> | @vazio
    //   05. <tipo_var>      ::= real | inteiro
    //
    function dc_v(seguidores) {

        if (!(simbolo in Primeiros["dc_v"]) && !(simbolo in Seguidores["dc_v"]) && !(simbolo in seguidores)) {
            error("Esperado 'var', 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Seguidores["dc_v"], seguidores));
        }

        while (simbolo == "var") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            // sinaliza ao analisador que um bloco de declaração de variáveis está se iniciando
            if (analisadorSemantico) {
                analisadorSemantico.iniciarDeclaracao();
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO


            // Chama a regra "variáveis"
            variaveis(join(Seguidores["dc_v"], seguidores, ":", "real", "inteiro"));


            if (simbolo != ":") {
                error("Esperado ':' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["dc_v"], ":", "real", "inteiro", ";", seguidores));
            }
            if (simbolo == ":") {
                obterSimbolo();
            }

            if (simbolo != "real" && simbolo != "inteiro") {
                error("Esperado tipo de variavel (real ou inteiro) mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["dc_v"], "real", "inteiro", ";", seguidores));

            }
            if (simbolo == "real" || simbolo == "inteiro") {

                // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                if (analisadorSemantico) {
                    analisadorSemantico.inserir({"tipo":simbolo});
                    if (gerador) {
                        gerador.genDeclaracao(simbolo);
                    }
                } // FIM DO CORTE PARA ANALISADOR SEMANTICO

                obterSimbolo();
            }

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["dc_v"], Seguidores["dc_v"], ";", seguidores));
            }
            if (simbolo == ";") {
                obterSimbolo();
            }

            if (!(simbolo in Primeiros["dc_v"]) && !(simbolo in Seguidores["dc_v"]) && !(simbolo in seguidores)) {
                error("Esperado 'var', 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["dc_v"], Seguidores["dc_v"], seguidores));
            }

        }
    }



    // Procedimento para regra "variaveis"
    //   06. <variaveis>     ::= ident <mais_var>
    //
    // Situação:
    //   var a b, c, d : inteiro;
    //
    function variaveis(seguidores) {

        // Verifica se o simbolo pertence à categoria de "identificadores"
        if (simbolo != "@ident") {
            error("Esperado identificador mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
        }
        if (simbolo == "@ident") {

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                var temp = analisadorSemantico.variavel({"cadeia":cadeia});

                if (gerador) {
                    if (temp instanceof Simbolo) {
                        gerador.guardaVariavel(cadeia, temp.getTipo());
                    }
                    else {
                        gerador.guardaVariavel(cadeia);
                    }
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO



            obterSimbolo();
        }

        if (simbolo != "," && !(simbolo in Seguidores["variaveis"])) {

            if (simbolo in Primeiros["variaveis"]) {
                error("Esperado ',' mas encontrado '" + cadeia + "'");
            }

            varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
        }

        // Trata o caso de variáveis multiplas declaradas sem separador (,)
        if (simbolo in Primeiros["variaveis"]) {
            variaveis(seguidores);
        }

        while (simbolo == ",") {
            obterSimbolo();

            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
            }
            if (simbolo == "@ident") {

                // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                if (analisadorSemantico) {
                    var temp = analisadorSemantico.variavel({"cadeia":cadeia});

                    if (gerador) {
                        if (temp instanceof Simbolo) {
                            gerador.guardaVariavel(cadeia, temp.getTipo());
                        }
                        else {
                            gerador.guardaVariavel(cadeia, null);
                        }
                    }
                } // FIM DO CORTE PARA ANALISADOR SEMANTICO

                obterSimbolo();
            }

            if (simbolo != "," && !(simbolo in Seguidores["variaveis"])) {
                //error("Esperado ',', ':' ou ')' mas encontrado '" + cadeia + "'");
                if (simbolo in Primeiros["variaveis"]) {
                    error("Esperado ',' mas encontrado '" + cadeia + "'");
                }
                varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
            }

            // Trata o caso de múltiplas variáveis separadas sem vírgulas
            if (simbolo in Primeiros["variaveis"]) {
                variaveis(seguidores);
            }
        }
    }



    // Procedimento para regra "dc_p" e "parametros"
    //   08. <dc_p>          ::= procedimento ident <parametros> ; <corpo_p> <dc_p> | @vazio
    //   09. <parametros>    ::= ( <lista_par> ) | @vazio
    //
    function dc_p(seguidores) {

        if (!(simbolo in Primeiros["dc_p"]) && !(simbolo in Seguidores["dc_p"]) && !(simbolo in seguidores)) {
            error("Esperado 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_p"], Seguidores["dc_p"], seguidores));
        }

        while (simbolo == "procedimento") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.iniciarProcedimento();
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO


            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join("(", ";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
            }
            if (simbolo == "@ident") {

                // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                if (analisadorSemantico) {
                    var temp = analisadorSemantico.inserir({"cadeia":cadeia, "categoria":"procedimento"});
                    analisadorSemantico.setProcedimento(temp);
                    if (gerador) {
                        gerador.genProcedimento(cadeia);
                    }
                } // FIM DO CORTE PARA ANALISADOR SEMANTICO

                obterSimbolo();
            }

            if (simbolo != "(" && simbolo != ";") {
                error("Esperado '(' ou ';' mas encontrado '" + cadeia + "'");
                varre(join("(", ";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
            }

            if (simbolo == "(") {
                obterSimbolo();

                // Chama a regra "lista_par"
                lista_par(join(seguidores, Seguidores["dc_p"], Primeiros["corpo_p"], Primeiros["cmd"]));

                if (simbolo != ")") {
                    //error("Esperado ')' mas encontrado '" + cadeia + "'");
                    varre(join(")", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                }

                if (simbolo == ")") {
                    obterSimbolo();
                }

                if (simbolo != ";") {
                    error("Esperado ';' mas encontrado '" + cadeia + "'");
                    varre(join(";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                }
            }

            if (simbolo == ";") {
                obterSimbolo();
            }

            // Chama a regra "corpo_p"
            corpo_p(join(seguidores, Seguidores["dc_p"]));

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                // Removemos as variáveis locais do procedimento
                analisadorSemantico.remover({"escopo":"local", "procedimento":analisadorSemantico.getProcedimento().getCadeia()});
                if (gerador) {
                    gerador.finalizarProcedimento();
                }
            }
// Fim do corte para o analisador semantico e gerador de código

            if (!(simbolo in Primeiros["dc_p"]) && !(simbolo in Seguidores["dc_p"]) && !(simbolo in seguidores)) {
                error("Esperado 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["dc_p"], Seguidores["dc_p"], seguidores));
            }
        }

    }



    // Procedimento para regra "lista_par" e "mais_par"
    //   10. <lista_par>     ::= <variaveis> : <tipo_var> <mais_par>
    //   11. <mais_par>      ::= ; <lista_par> | ?
    //
    function lista_par(seguidores) {

        // sinaliza ao analisador que um bloco de declaração de parametros está se iniciando
        if (analisadorSemantico) {
            analisadorSemantico.iniciarParametros();
        }

        // Chama a regra "variaveis"
        variaveis(join(seguidores, Seguidores["lista_par"], ":", "real", "inteiro"));

        if (simbolo != ":") {
            error("Esperado ':' mas encontrado '" + cadeia + "'");
            varre(join(";", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores, "inteiro", "real"));
        }
        if (simbolo == ":") {
            obterSimbolo();
        }

        if (simbolo != "real" && simbolo != "inteiro") {
            error("Esperado 'inteiro' ou 'real' mas encontrado '" + cadeia + "'");
            varre(join("real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores, "inteiro", "real"));
        }
        if (simbolo == "real" || simbolo == "inteiro") {

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.inserir({"tipo":simbolo});
                if (gerador) {
                    gerador.genParametros(simbolo);
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO

            obterSimbolo();
        }

        if (simbolo != ";" && !(simbolo in Seguidores["lista_par"])) {
            error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
            varre(join(";", "var", "real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], seguidores));
        }

        if (simbolo in Primeiros["lista_par"]) {
            lista_par(seguidores);
        }

        while (simbolo == ";") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                // sinaliza ao analisador que um bloco de declaração de
                // parametros está se iniciando
                analisadorSemantico.iniciarParametros();
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO

            // Chama a regra "variáveis"
            variaveis(join(seguidores, Seguidores["lista_par"], "var"));

            if (simbolo != ":") {
                error("Esperado ':' mas encontrado '" + cadeia + "'");
                varre(join(";", ":", "real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
            }
            if (simbolo == ":") {
                obterSimbolo();
            }

            if (simbolo != "real" && simbolo != "inteiro") {
                error("Esperado 'inteiro' ou 'real' mas encontrado '" + cadeia + "'");
                varre(join("real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
            }
            if (simbolo == "real" || simbolo == "inteiro") {

                // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                if (analisadorSemantico) {
                    analisadorSemantico.inserir({"tipo":simbolo});
                    if (gerador) {
                        gerador.genParametros(simbolo);
                    }
                } // FIM DO CORTE PARA ANALISADOR SEMANTICO

                obterSimbolo();
            }

            if (simbolo != ";" && !(simbolo in Seguidores["lista_par"])) {
                error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                varre(join(";", Primeiros["lista_par"], Seguidores["lista_par"], seguidores));
            }

            if (simbolo in Primeiros["lista_par"]) {
                lista_par(seguidores);
            }
        }

        // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
        if (gerador) {
            gerador.finalizaParametros();
        }
        // FIM DO CORTE PARA GERADOR DE CÓDIGO

    }



    // Procedimento para regra "corpo_p" e "dc_loc"
    //   12. <corpo_p>       ::= <dc_loc> inicio <comandos> fim ;
    //   13. <dc_loc>        ::= <dc_v>
    //
    function corpo_p(seguidores) {

        // Chama a regra "dc_v"
        dc_v(join(seguidores, Seguidores["corpo_p"], Primeiros["corpo_p"], Primeiros["cmd"]));


        // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
        if (analisadorSemantico) {
            // Sinaliza ao analisador semântico que o corpo
            //  do procedimento está começando
            analisadorSemantico.iniciarCorpo();
        } // FIM DO CORTE PARA ANALISADOR SEMANTICO


        if (simbolo != "inicio") {
            error("Esperado 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores, Primeiros["cmd"]));
        }
        if (simbolo == "inicio") {
            obterSimbolo();
        }

        // Antes de entrarmos no laço while, temos de verificar se o
        //   simbolo nao está nos primeiros de cmd e se o simbolo é
        //   diferente de fim, o que neste caso seria um erro sintatico.
        if (!(simbolo in Primeiros["cmd"]) && simbolo != "fim")
        {
            // Varre até os primeiros de cmd ou primeiros de fim.
            error("Esperado comando ou 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Primeiros["cmd"], "fim", seguidores));
        }

        // Enquanto o simbolo estiver em primeiros de cmd
        while (simbolo in Primeiros["cmd"]) {

            // Chama a regra "cmd"
            cmd(join(Seguidores["corpo_p"], seguidores));

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join("fim", Seguidores["dc_p"], ";", Primeiros["cmd"], seguidores));
            }
            if (simbolo == ";") {
                obterSimbolo();
            }

            if (!(simbolo in Primeiros["cmd"]) && simbolo != "fim") {
                error("Esperado comando ou 'fim' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["corpo_p"], Primeiros["cmd"], "fim", seguidores));
            }
        }

        // Espera receber o token "fim"
        if (simbolo != "fim") {
            error("Esperado 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores));

        }
        if (simbolo == "fim") {
            obterSimbolo();
        }

        // Espera "ponto-e-virgula"
        if (simbolo != ";") {
            error("Esperado ';' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores));
        }
        if (simbolo == ";") {
            obterSimbolo();
        }
    }



    // Procedimento para regra "lista_arg", "argumentos" e "mais_ident"
    //   14. <lista_arg>     ::= ( <argumentos> ) | @vazio
    //   15. <argumentos>    ::= ident <mais_ident>
    //   16. <mais_ident>    ::= ; <argumentos> | @vazio
    //
    // Situações:
    //   ( a; b; c ) -> ok
    //   ( a; b  c ) -> esperado ; mas econtrado identificador
    //
    function lista_arg(seguidores) {

        if (simbolo != "(" && !(simbolo in Seguidores["lista_arg"]) && !(simbolo in seguidores)) {
            error("Esperado '(' ou seguidores de lista_arg mas encontrado '" + cadeia + "'");
            varre(join("(", "@ident", ";", ")", Seguidores["lista_arg"], seguidores));
        }

        if (!(simbolo in Seguidores["lista_arg"])) {

            if (simbolo == "(") {
                obterSimbolo();
            }

            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
            }
            if (simbolo == "@ident") {

                // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                if (analisadorSemantico) {
                    analisadorSemantico.verificar({"cadeia":cadeia});
                    if (gerador) {
                        gerador.incluirArgumento(cadeia);
                    }
                } // FIM DO CORTE PARA ANALISADOR SEMANTICO

                obterSimbolo();
            }

            if (simbolo != ";" && simbolo != ")") {
                error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
            }

/////////////////////////////////////////////////////////////////////////////////////////////////
// gambiarra?
            while (simbolo == ";" || simbolo == "@ident") {

                if (simbolo == ";")
                    obterSimbolo();

                if (simbolo != "@ident") {
                    error("Esperado identificador mas encontrado '" + cadeia + "'");
                    varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                }
                if (simbolo == "@ident") {

                    // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
                    if (analisadorSemantico) {
                        analisadorSemantico.verificar({"cadeia":cadeia});
                        if (gerador) {
                            gerador.incluirArgumento(cadeia);
                        }
                    }// FIM DO CORTE PARA ANALISADOR SEMANTICO

                    obterSimbolo();
                }

                if (simbolo != ";" && simbolo != ")") {
                    error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                    varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                }

            }

            if (simbolo == ")") {
                obterSimbolo();
            }
        }
    }


    // Procedimento para regra "comandos"
    //   17. <comandos>      ::= <cmd> ; <comandos> | @vazio
    //
    function comandos(seguidores) {

        if (!(simbolo in Primeiros["comandos"]) && !(simbolo in Seguidores["comandos"])) {
            error("Esperado comando, ';', 'fim' ou 'senao', mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["comandos"], Seguidores["comandos"], seguidores));
        }

        while (simbolo in Primeiros["comandos"]) {

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["comandos"]));

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join(";", Primeiros["cmd"], Seguidores["comandos"], seguidores));
            }
            if (simbolo == ";") {
                obterSimbolo();
            }

            if (!(simbolo in Primeiros["comandos"]) && !(simbolo in Seguidores["comandos"])) {
                error("Esperado comando, ';', 'fim' ou 'senao', mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["comandos"], Seguidores["comandos"], seguidores));
            }
        }
    }


    // Procedimento para regra "cmd"
    //   18. <cmd>           ::= le ( <variaveis> ) |
    //                           escreve ( <variaveis> ) |
    //                           enquanto <condicao> faca <cmd> |
    //                           se <condicao> entao <cmd> <cont_se> |
    //                           ident <cont_ident>
    //                           inicio <comandos> fim
    //
    function cmd(seguidores) {

        if (!(simbolo in Primeiros["cmd"])) {
            error("Esperado comando ou bloco de comandos mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["cmd"], seguidores));
        }

        if (simbolo == "le") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.iniciarLeEscreve();
                if (gerador) {
                    gerador.iniciarLe();
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO

            if (simbolo != "(") {
                error("Esperado '(' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], "(", seguidores, "@ident"));
            }
            if (simbolo == "(") {
                obterSimbolo();
            }

            // Chama a regra "variáveis"
            variaveis(join(seguidores, Primeiros["cmd"], Seguidores["cmd"]));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], ")", seguidores));
            }
            if (simbolo == ")") {
                obterSimbolo();
            }

            if (analisadorSemantico) {
                analisadorSemantico.terminarLeEscreve();
                if (gerador) {
                    gerador.finalizarLe();
                }
            }

        }
        else if (simbolo == "escreve") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.iniciarLeEscreve();
                if (gerador) {
                    gerador.iniciarEscreve();
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO

            if (simbolo != "(") {
                error("Esperado '(' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], "(", seguidores));
            }
            if (simbolo == "(") {
                obterSimbolo();
            }

            // Chama a regra "variáveis"
            variaveis(join(seguidores, Primeiros["cmd"], Seguidores["cmd"]));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], ")", seguidores));
            }
            if (simbolo == ")") {
                obterSimbolo();
            }

            // CORTE TRANSVERSAL PARA ANALISADOR SEMANTICO
            if (analisadorSemantico) {
                analisadorSemantico.terminarLeEscreve();
                if (gerador) {
                    gerador.finalizarEscreve();
                }
            } // FIM DO CORTE PARA ANALISADOR SEMANTICO


        }
        else if (simbolo == "enquanto") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.iniciarEnquanto();
            }
            // FIM DO CORTE TRANSVERSAL PARA GERADO DE CÓDIGO

            // Chama a regra "condição"
            condicao(join(seguidores, Primeiros["cmd"], Seguidores["cmd"]));

            if (simbolo != "faca") {
                error("Esperado 'faca' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], Primeiros["cmd"], seguidores));
            }
            if (simbolo == "faca") {
                obterSimbolo();
            }

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "se") {
            obterSimbolo();


            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.iniciarSe();
            }
            // FIM DO CORTE TRANSVERSAL PARA GERADO DE CÓDIGO


            // Chama a regra "condição"
            condicao(join(seguidores, Primeiros["cmd"], Seguidores["cmd"]));

            if (simbolo != "entao") {
                error("Esperado 'entao' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["cmd"], seguidores));
            }
            if (simbolo == "entao") {
                obterSimbolo();
            }

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cmd"]));

            // Chama a regra "cont_se"
            cont_se(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "@ident") {

            // CORTE TRANSVERSAL PARA ANALISADOR SEMÂNTICO
            if (analisadorSemantico) {
                analisadorSemantico.setCadeia(cadeia);
                if (gerador) {
                    gerador.genIdentificador(cadeia);
                }
            } // FIM DO CORTE PARA ANALISADOR SEMÂNTICO

            obterSimbolo();

            // Chama a regra "cont_ident"
            cont_ident(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "inicio") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.iniciarBloco();
            }
            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO

            while (simbolo in Primeiros["cmd"]) {

                // Chama a regra "cmd"
                cmd(join(seguidores, Seguidores["cmd"]));

                if (simbolo != ";") {
                    error("Esperado ';' mas encontrado '" + cadeia + "'");
                    varre(join(";", Primeiros["cmd"], "fim", seguidores));
                }
                if (simbolo == ";") {
                    obterSimbolo();
                }
            }

            if (simbolo != "fim") {
                error("Esperado 'fim' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], seguidores));
            }
            if (simbolo == "fim") {
                obterSimbolo();
            }

            // CORTE TRANSVERSAL PARA ANALISADOR SEMÂNTICO
            if (gerador) {
                gerador.finalizarBloco();
            }
            // FIM DO CORTE PARA ANALISADOR SEMÂNTICO

        }
    }


    // Procedimento para a regra "cont_se"
    //  '18. <cont_se>       ::= fim | senao <cmd>
    //
    function cont_se(seguidores) {

        if (simbolo != "fim" && simbolo != "senao") {
            error("Esperado 'fim' ou 'senao', mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["cont_se"], "fim", "senao", seguidores));
        }

        if (simbolo == "fim") {
            obterSimbolo();
        }
        else if (simbolo == "senao") {
            obterSimbolo();

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.iniciarSenao();
            }
            // FIM DO CORTE PARA GERADOR DE CÓDIGO

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cont_se"]));
        }

        // TODO: Não ta faltando um fim na gramática aqui?
    }



    // Procedimento para a regra "cont_ident"
    //  "18. <cont_ident>    ::= := <expressao> | <lista_arg>
    //
    function cont_ident(seguidores) {

        var v;

        if (simbolo != ":=" && !(simbolo in Primeiros["lista_arg"])) {
            error("Esperado ':=' ou '(', mas encontrado '" + cadeia + "'");
            varre(join(":=", Primeiros["lista_arg"], Seguidores["cont_ident"], seguidores));
        }

        if (simbolo == ":=") {
            obterSimbolo();

            if (analisadorSemantico) {
                v = analisadorSemantico.verificar({"cadeia":analisadorSemantico.getCadeia()});
                if (gerador) {
                    gerador.iniciarAtribuicao();
                }
            }

            // Chama a regra "expressão"
            tipo = expressao(join(seguidores, Seguidores["cont_ident"]));

    // TODO: Verificar estas instrucoes
            if (v instanceof Simbolo && v.getTipo() == "inteiro" && tipo == "real") {
                error("Atribuicao de valor real a variavel inteira '" + v.getCadeia() + "'.");
            }


            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.finalizarAtribuicao();
            }
            // FIM DO CORTE PARA GERADOR DE CÓDIGO

        }
        else if (simbolo in Primeiros["lista_arg"]) {

            if (analisadorSemantico) {
                var simboloProcedimento = analisadorSemantico.verificar({"cadeia":analisadorSemantico.getCadeia(), "categoria":"procedimento"});
                analisadorSemantico.setProcedimento(simboloProcedimento);
                analisadorSemantico.iniciarChamada();

                // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
                if (gerador) {
                    gerador.iniciarChamada();
                }
                // FIM DO CORTE PARA GERADOR DE CÓDIGO
            }

            // Chama a regra "lista_arg"
            lista_arg(join(seguidores, Seguidores["cont_ident"]));

            // CORTE TRANSVERSAL PARA ANÁLISE SEMÂNTICA
            if (analisadorSemantico) {
                analisadorSemantico.terminarChamada();
                if (gerador) {
                    gerador.finalizarChamada();
                }
            } // FIM DO CORTE PARA ANÁLISE SEMÂNTICA

        }
    }



    // Procedimento para a regra "condicao" e "relacao"
    //   19. <condicao>      ::= <expressao> <relacao> <expressao>
    //   20. <relacao>       ::= = | <> | >= | <= | > | <
    //
    function condicao(seguidores) {

        // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
        if (gerador) {
            gerador.iniciarCondicao();
        }
        // FIM DO CORTE PARA GERADOR DE CÓDIGO

        // Chama a regra "expressao"
        expressao(join(seguidores, Seguidores["condicao"], "=","<>",">=","<=",">","<"));

        if (!(simbolo in {"=":0,"<>":0,">=":0,"<=":0,">":0,"<":0})) {
            error("Esperado '=', '<>', '>=', '<=', '>' ou '<', mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["condicao"], "=", "<>", ">=", "<=", ">", "<", seguidores));
        }
        if (simbolo in {"=":0,"<>":0,">=":0,"<=":0,">":0,"<":0}) {

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.expressao(simbolo);
            }
            // FIM DO CORTE PARA GERADOR DE CÓDIGO

            obterSimbolo();
        }

        // Chama a regra "expressão"
        expressao(join(seguidores, Seguidores["condicao"]));

        // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
        if (gerador) {
            gerador.finalizarCondicao();
        }
        // FIM DO CORTE PARA GERADOR DE CÓDIGO

    }



    // Procedimento para as regras "expressao" e "op_un"
    //   21. <expressao>     ::= <termo> <outros_termos>
    //   22. <op_un>         ::= + | - | ?
    //
    function expressao(seguidores) {

        var retorno;

// TODO: Elucidar melhor tipo_termo1 e derivados

        // Chama a regra "termo"
        tipo_termo1 = termo(join(Seguidores["expressao"], seguidores, "+", "-", "@ident"));

        // Se simbolo não for um sinal nem estiver em seguidores
        //  de expressao, este é um erro. Algo como (a _+ b).
        if (simbolo != "+" && simbolo != "-" && !(simbolo in Seguidores["expressao"])) {
            error("Expressao invalida: '" + cadeia + "'");
            varre(join("+", "-", Seguidores["expressao"], seguidores));

            if (simbolo in Primeiros["expressao"]) {
                expressao(seguidores);
            }
        }

        retorno = tipo_termo1;

        // Enquanto houver "+" ou "-"
        while (simbolo == "+" || simbolo == "-") {

            if (gerador) {
                gerador.expressao(cadeia);
            }

            obterSimbolo();

            // Chama a regra "termo"
            tipo_termo2 = termo(join(Seguidores["expressao"], seguidores, "+", "-", "@ident"));

            if (tipo_termo1 == "real" || tipo_termo2 == "real") {
                retorno = "real";
            }
            else {
                retorno = "inteiro";
            }

            if (simbolo != "+" && simbolo != "-" && !(simbolo in Seguidores["expressao"])) {

                if (simbolo in Primeiros["expressao"]) {
                    error("Expressao invalida, encontrado '" + cadeia + "'");
                }

                varre(join("+", "-", Seguidores["expressao"], seguidores));

                if (simbolo in Primeiros["expressao"]) {
                    expressao(seguidores);
                }
            }
        }


//TODO: retorna o tipo da expressao?
// nao pra pra tentar colocar isso na logica do analisador semantico tb?
        if (analisadorSemantico) {
            return retorno;
        }

    }


    // Procedimento para as regras "termo", "outros_termos" e outras
    //   23. <outros_termos> ::= <op_ad> <termo> <outros_termos> | @vazio
    //   24. <op_ad>         ::= + | -
    //   25. <termo>         ::= <op_un> <fator> <mais_fatores>
    //   26. <mais_fatores>  ::= <op_mul> <fator> <mais_fatores> | @vazio
    //   27. <op_mul>        ::= * | /
    //
    function termo(seguidores) {

        var retorno;

        if (simbolo != "+" && simbolo != "-" && !(simbolo in Primeiros["fator"])) {
            error("Esperado '+', '-', identificador, numero inteiro, numero real ou '(', mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["termo"], Primeiros["fator"], seguidores));
        }
        if (simbolo == "+" || simbolo == "-") {

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.expressao(cadeia);
            }
            // FIM DO CORTE PARA GERADOR DE CÓDIGO

            obterSimbolo();
        }

        // Chama a regra "fator"
        tipo_fator1 = fator(join(seguidores, Seguidores["termo"]));

        // Se temos um erro sintático como 12 3 - 1, não temos como saver que operação iria
        //   ser realizada, e portanto não conseguimos determinar se seria um erro semântico
        //   ou não
        if (simbolo != "*" && simbolo != "/" && !(simbolo in Seguidores["termo"])) {

            error("Esperado operador matematico, operador relacional, 'faca', 'entao', 'fim', 'senao' ou ')', mas encontrado '" + cadeia + "'");
            //error("Esperado operador matematico mas encontrado '" + cadeia + "'");

            varre(join("*", "/", Seguidores["termo"], seguidores));

            if (simbolo in Primeiros["termo"]) {
                termo(seguidores);
            }
        }

        // Caso não tenha a parte da operação
        retorno = tipo_fator1;

        while (simbolo == "*" || simbolo == "/") {

            // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
            if (gerador) {
                gerador.expressao(cadeia);
            }
            // FIM DO CORTE PARA GERADOR DE CÓDIGO

            operacao = simbolo;

            obterSimbolo();

            // Chama a regra "fator"
            tipo_fator2 = fator(join(seguidores, Seguidores["termo"]));

            if (operacao == "*") {
                if (tipo_fator1 == "real" || tipo_fator2 == "real") {
                    retorno = "real";
                }
                else {
                    retorno = "inteiro";
                }
            }
            else {
                retorno = "real";
            }

            if (simbolo != "*" && simbolo != "/" && !(simbolo in Seguidores["termo"])) {
                error("Esperado operador matematico, operador relacional, 'faca', 'entao', 'fim', 'senao' ou ')', mas encontrado '" + cadeia + "'");

                // TODO: verificar este erro comentado
                //error("Esperado operador matematico mas encontrado '" + cadeia + "'");

                varre(join("*", "/", Seguidores["termo"], seguidores));

                if (simbolo in Primeiros["termo"]) {
                    termo(seguidores);
                }
            }
        }

        if (analisadorSemantico) {
            return retorno;
        }

    }



    // Procedimento para a regra "fator"
    //   28. <fator>         ::= ident | numero_int | numero_real | ( <expressao> )
    //
    function fator(seguidores) {

        var v;
        var retorno;

        if (!(simbolo in Primeiros["fator"])) {
            error("Esperado '(', identificador, numero inteiro ou numero real, mas encontrado '" + cadeia + "'");
            varre(join("@ident", "@numero_int", "@numero_real", "(", ";", seguidores));
        }

        // CORTE TRANSVERSAL PARA GERADOR DE CÓDIGO
        if (gerador) {
            gerador.expressao(cadeia);
        }
        // FIM DO CORTE PARA GERADOR DE CÓDIGO

        if (simbolo == "@ident") {
            if (analisadorSemantico) {
                v = analisadorSemantico.verificar({"cadeia":cadeia});
            }

            obterSimbolo();

            if (v instanceof Simbolo) {
                retorno = v.getTipo();
            }

        }
        else if (simbolo == "@numero_int") {
            obterSimbolo();
            retorno = "inteiro";
        }
        else if (simbolo == "@numero_real") {
            obterSimbolo();
            retorno = "real";
        }
        else if (simbolo == "(") {
            obterSimbolo();

            // Chama a regra "expressão"
            tipo = expressao(join(seguidores, Seguidores["fator"]));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["fator"], ")", seguidores));  // provavelmente seguidores de termos e etc tb
            }
            if (simbolo == ")") {
                if (gerador) {
                    gerador.expressao(cadeia);
                }
                obterSimbolo();
            }

            retorno = tipo;

        }

        if (analisadorSemantico) {
            return retorno;
        }

    }






    //  Funções auxiliares
    //  **************************

    // Combina as chaves de arrays associativos e demais strings passadas
    //  como parâmetros em um só. A quantidade de parâmetros é indeterminada.
    function join() {

        var list = new Object();
        var argumento;

        for (var i = 0; i < join.arguments.length; i++) {
            if (typeof join.arguments[i] == "object") {
                for (chave in join.arguments[i]) {
                    list[chave] = 0;
                }
            }
            else if (typeof join.arguments[i] == "string") {
                list[join.arguments[i]] = 0;
            }
        }

        return list;
    }

    // Funcao de debug para imprimir uma lista em tela
    function print_list(objeto) {
        var texto = '';
        for (o in objeto) {
            texto += o + "\n";
        }
        alert(texto);
    }





    //  Conjuntos da Linguagem ALG
    //  **************************

    // Conjunto de primeiros
    var Primeiros = {
        "programa"      : { "programa":0 },
        "corpo"         : { "var":0, "procedimento":0, "inicio":0 },
        "dc"            : { "var":0, "procedimento":0, "@vazio":0 },
        "dc_v"          : { "var":0, "@vazio":0 },
        "tipo_var"      : { "real":0, "inteiro":0 },
        "variaveis"     : { "@ident":0 },
        "mais_var"      : { ",":0, "@vazio":0 },
        "dc_p"          : { "procedimento":0, "@vazio":0 },
        "parametros"    : { "(":0, "@vazio":0 },
        "lista_par"     : { "@ident":0 },
        "mais_par"      : { ";":0, "@vazio":0 },
        "corpo_p"       : { "var":0, "procedimento":0, "inicio":0 },
        "dc_loc"        : { "var":0, "@vazio":0 },
        "lista_arg"     : { "(":0, "@vazio":0 },
        "argumentos"    : { "@ident":0 },
        "mais_ident"    : { ";":0, "@vazio":0 },
        "comandos"      : { "le":0, "escreve":0, "enquanto":0, "se":0, "@ident":0, "inicio":0, "@vazio":0 },
        "cmd"           : { "le":0, "escreve":0, "enquanto":0, "se":0, "@ident":0, "inicio":0  },
        "cont_se"       : { "fim":0, "senao":0 },
        "cont_ident"    : { ":=":0, "(":0, "@vazio":0 },
        "condicao"      : { "+":0, "-":0, "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 },
        "relacao"       : { "=":0, "<>":0 , ">=":0 , "<=":0 , ">":0 , "<":0 },
        "expressao"     : { "+":0, "-":0, "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 },
        "op_un"         : { "+":0, "-":0 , "@vazio":0 },
        "outros_termos" : { "+":0, "-":0 , "@vazio":0 },
        "op_ad"         : { "+":0, "-":0 },
        "termo"         : { "+":0, "-":0, "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 },
        "mais_fatores"  : { "*":0, "/":0 , "@vazio":0 },
        "op_mul"        : { "*":0, "/":0 },
        "fator"         : { "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 }
    };

    // Conjunto de seguidores
    var Seguidores = {
        "programa"      : { "$":0 },
        "corpo"         : { ".":0 },
        "dc"            : { "inicio":0 },
        "dc_v"          : { "procedimento":0, "inicio":0 },
        "tipo_var"      : { ";":0, ")":0 },
        "variaveis"     : { ":":0, ")":0 },
        "mais_var"      : { ":":0, ")":0 },
        "dc_p"          : { "inicio":0 },
        "parametros"    : { ";":0 },
        "lista_par"     : { ")":0 },
        "mais_par"      : { ")":0 },
        "corpo_p"       : { "procedimento":0, "inicio":0 },
        "dc_loc"        : { "inicio":0 },
        "lista_arg"     : { ";":0, "fim":0, "senao":0 },
        "argumentos"    : { ")":0 },
        "mais_ident"    : { ")":0 },
        "comandos"      : { "fim":0 },
        "cmd"           : { ";":0, "fim":0, "senao":0 },
        "cont_se"       : { ";":0, "fim":0, "senao":0 },
        "cont_ident"    : { ";":0, "fim":0, "senao":0 },
        "condicao"      : { "faca":0, "entao":0 },
        "relacao"       : { "+":0, "-":0, "@ident":0, "@numero_int":0, "@numero_real":0, "(":0  },
        "expressao"     : { "faca":0, "entao":0, "=":0, "<>":0, ">=":0, "<=":0, ">":0, "<":0, ";":0, "fim":0, "senao":0, ")":0 },
        "op_un"         : { "@ident":0, "@numero_int":0, "@numero_real":0, "(":0 },
        "outros_termos" : { "faca":0, "entao":0, "=":0, "<>":0, ">=":0, "<=":0, ">":0, "<":0, ";":0, "fim":0, "senao":0, ")":0 },
        "op_ad"         : { "+":0, "-":0, "@ident":0, "@numero_int":0, "@numero_real":0, "(":0 },
        "termo"         : { "faca":0, "entao":0, "=":0, "<>":0, ">=":0, "<=":0, ">":0, "<":0, ";":0, "fim":0, "senao":0, "+":0, "-":0, ")":0 },
        "mais_fatores"  : { "faca":0, "entao":0, "=":0, "<>":0, ">=":0, "<=":0, ">":0, "<":0, ";":0, "fim":0, "senao":0, "+":0, "-":0, ")":0 },
        "op_mul"        : { "@ident":0, "@numero_int":0, "@numero_real":0, "(":0 },
        "fator"         : { "faca":0, "entao":0, "=":0, "<>":0, ">=":0, "<=":0, ">":0, "<":0, ";":0, "fim":0, "senao":0, "+":0, "-":0, "*":0, "/":0, ")":0 }
    };







    // Especificação da Linguagem ALG como uma Gramática LL(1)
    // *******************************************************

    //
    //   01. <programa>      ::= programa ident ; <corpo> .
    //   02. <corpo>         ::= <dc> inicio <comandos> fim
    //   03. <dc>            ::= <dc_v> <dc_p>
    //   04. <dc_v>          ::= var <variaveis> : <tipo_var> ; <dc_v> | @vazio
    //   05. <tipo_var>      ::= real | inteiro
    //   06. <variaveis>     ::= ident <mais_var>
    //   07. <mais_var>      ::= , <variaveis> | @vazio
    //   08. <dc_p>          ::= procedimento ident <parametros> ; <corpo_p> <dc_p> | @vazio
    //   09. <parametros>    ::= ( <lista_par> ) | @vazio
    //   10. <lista_par>     ::= <variaveis> : <tipo_var> <mais_par>
    //   11. <mais_par>      ::= ; <lista_par> | ?
    //   12. <corpo_p>       ::= <dc_loc> inicio <comandos> fim ;
    //   13. <dc_loc>        ::= <dc_v>
    //   14. <lista_arg>     ::= ( <argumentos> ) | @vazio
    //   15. <argumentos>    ::= ident <mais_ident>
    //   16. <mais_ident>    ::= ; <argumentos> | @vazio
    //   17. <comandos>      ::= <cmd> ; <comandos> | @vazio
    //   18. <cmd>           ::= le ( <variaveis> ) |
    //                           escreve ( <variaveis> ) |
    //                           enquanto <condicao> faca <cmd> |
    //                           se <condicao> entao <cmd> <cont_se> |
    //                           ident <cont_ident>
    //                           inicio <comandos> fim
    //  '18. <cont_se>       ::= fim | senao <cmd>
    //  "18. <cont_ident>    ::= := <expressao> | <lista_arg>
    //   19. <condicao>      ::= <expressao> <relacao> <expressao>
    //   20. <relacao>       ::= = | <> | >= | <= | > | <
    //   21. <expressao>     ::= <termo> <outros_termos>
    //   22. <op_un>         ::= + | - | ?
    //   23. <outros_termos> ::= <op_ad> <termo> <outros_termos> | @vazio
    //   24. <op_ad>         ::= + | -
    //   25. <termo>         ::= <op_un> <fator> <mais_fatores>
    //   26. <mais_fatores>  ::= <op_mul> <fator> <mais_fatores> | @vazio
    //   27. <op_mul>        ::= * | /
    //   28. <fator>         ::= ident | numero_int | numero_real | ( <expressao> )
    //


}