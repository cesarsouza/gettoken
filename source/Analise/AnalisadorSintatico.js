// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Analisador Sintático (Parser)
//  Esta classe é responsável por conduzir a etapa de análise sintática,
//  identificando regras gramaticais respeitadas pelos tokens adquiridos
//  pelo Analisador Léxico.
//
function AnalisadorSintatico(input) {


    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    // Analisador Léxico a ser utilizado por este Analisador Sintático (parser)
    var analisadorLexico = new AnalisadorLexico(input);

    // Lista de erros encontrados durante a análise
    var error_list = new Array();


    // Variáveis para armazenar informações sobre o token atual
    var token;     // token atual propriamente dito reconhecido pelo analisador léxico
    var simbolo;   // simbolo (cadeia do token) atual (para simplificar os procedimentos)
    var categoria; // categoria (do token) atual (para simplificar os procedimentos)





    // ************************************************************************
    // Métodos públicos
    // ************************************************************************

    // Método principal para iniciar a análise sintática
    //   Retorna true caso a análise tenha terminado sem
    //   nenhum erro, e false caso contrário.
    this.parse = function() {
        // Obtem o primeiro simbolo
        obterSimbolo();

        // Inicia a analise a partir da regra inicial
        programa();

        // Verifica se houve erros durante a analise
        //  sintatica e retorna o estado de sucesso
        return (error_list.length == 0)
    }

    // Retorna a lista de erros encontrados
    this.errors = function() {
        return error_list;
    }





    // ************************************************************************
    // Métodos Privados
    // ************************************************************************

    // Obtem o proximo token to analisador léxico e o armazena nas variáveis
    //  privadas token e símbolo, em que token corresponde ao token propriamente
    //  dito e a variável símbolo corresponde à cadeia presente neste token.
    function obterSimbolo() {
    
        // Obtem o próximo token
        token = analisadorLexico.getToken();

        // Verifica se houve um erro de análise (como comentário não-finalizado)
        if (analisadorLexico.error() != null)
            error_list.push(analisadorLexico.error());

        // Armazena as informações do token para simplificar os procedimentos
        if (token != null) {
           simbolo   = token.cadeia();
           categoria = token.id();
        }
        else {
           simbolo   = '';
           categoria = '';
        }
    }


    // Empilha um erro na lista de erros
    function error(mensagem) {
        var error = new Error(mensagem, analisadorLexico.line());
        error_list.push(error);
    }


    // Varre a entrada ate que um simbolo de sincronizacao seja encontrado
    function varre() {

        trace("> varre() - simbolo ofensivo = " + simbolo);

        var sincronizadores = join(varre.arguments);


        // Varre a entrada até encontrar um membro do conjunto de sincronização
        // PS: Sugiro um método melhor para isto, ver procedimento "comando".
        while (!
               ((simbolo in sincronizadores) ||
               (("@ident"       in sincronizadores) && (categoria == TokenId.Identifier)) ||
               (("@numero_real" in sincronizadores) && (categoria == TokenId.Real)) ||
               (("@numero_int"  in sincronizadores) && (categoria == TokenId.Integer)) ||
               (("$"            in sincronizadores) && (token == null)))
            ) {
            obterSimbolo();
        }

        trace("< varre()");
    }





    // Procedimentos para regras gramaticais
    // *************************************

    // Procedimento para as regras "programa", "corpo" e "dc"
    //   01. <programa>      ::= programa ident ; <corpo> .
    //   02. <corpo>         ::= <dc> inicio <comandos> fim
    //   03. <dc>            ::= <dc_v> <dc_p>
    function programa() {

        trace("> funcao programa()");

        if (simbolo == "programa") {
            obterSimbolo();

            // Verificamos se o próximo símbolo é um identificador
            if (categoria == TokenId.Identifier) {
                obterSimbolo();

                if (simbolo == ";") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ';' mas encontrado '" + simbolo + "'");
                    // sera que aqui deveriamos varrer ate o ';'? ja que ele nao foi encontrado. parece mais logico
                    // varrer ate os primeiros de dc_v e dc_p.
                    // se deixar deste jeito, declaracoes de variaveis possivelmente vao ser consumidas
                    //varre(join(Seguidores["programa"], ";"));

                    // pode ser que o programa nao tenha declaracoes de variaveis nem de procedimentos, entao eh
                    // bom colocar o "inicio" aqui
                    //varre(join(Primeiros["dc_v"], Primeiros["dc_p"], "inicio"));
                    varre(Primeiros["dc_v"], Primeiros["dc_p"], "inicio");
                }
            }
            else {
                error("Esperado identificador mas encontrado '" + simbolo + "'");
                varre(Primeiros["dc_v"], Primeiros["dc_p"], "inicio");
            }
        }
        else {
            error("Esperado 'programa' mas encontrado '" + simbolo + "'");
            varre(Primeiros["dc_v"], Primeiros["dc_p"], "inicio");
        }

        // Chama as regras dc_v e dc_p
        dc_v(Seguires["programa"]);
        dc_p(Seguires["programa"]);

        if (simbolo == "inicio") {
            obterSimbolo();
        }
        else {
            // Se não houver início, continuamos a análise como se o próximo bloco fosse "comandos"
            error("Esperado 'inicio' mas encontrado '" + simbolo + "'");
            varre(Primeiros["comandos"]);
        }

        comandos(Seguidores["programa"]);

        if (simbolo == "fim") {
            obterSimbolo();
            
            if (simbolo == ".") {
                obterSimbolo();
            }
            else {
                error("Esperado '.' mas encontrado '" + simbolo + "'");
                varre(Seguidores["programa"]);  // Seguidores de programa inclui apenas o fim de arquivo.
            }
        }
        else {
            error("Esperado 'fim' mas encontrado '" + simbolo + "'");
            varre(Seguidores["programa"]);
        }

        ////////////////
        // Colocar while != null e relatar todos outros tokens encontrados após
        //  o término do programa como erros?

        trace("< funcao programa()");
    }


    // Procedimento para regra "dc_v" e "tipo_var"
    //   04. <dc_v>          ::= var <variaveis> : <tipo_var> ; <dc_v> | ε
    //   05. <tipo_var>      ::= real | inteiro
    function dc_v(seguidores) {

        trace("> funcao dc_v()");

        while (simbolo == "var") {
            obterSimbolo();
            
            // Chama a regra "variaveis"
            variaveis(Seguidores["dc_v"]);

            if (simbolo == ":") {
                obterSimbolo();

                if (simbolo == "real" || simbolo == "inteiro") {
                    obterSimbolo();
                    
                    if (simbolo == ";") {
                        obterSimbolo();
                    }
                    else {
                        error("Esperado ';' mas encontrado '" + simbolo + "'");
                        varre(Primeiros["dc_v"], Seguidores["dc_v"]);
                    }
                }
                else {
                    error("Esperado 'real' ou 'inteiro' mas encontrado '" + simbolo + "'");
                    varre(Primeiros["dc_v"], Seguidores["dc_v"]);
                }
            }
            else {
                error("Esperado ':' mas encontrado '" + simbolo + "'");
                varre(Primeiros["dc_v"], Seguidores["dc_v"]);
            }
        }

        trace("< funcao dc_v()");
    }


    // Procedimento para regra "variaveis"
    //   06. <variaveis>     ::= ident <mais_var>
    function variaveis(seguidores) {
        // O objetivo desta regra é determinar o nome das variáveis. Caso encontremos um nome
        // inválido, avançamos até o seguidor de variáveis, seja ":" ou ")", que serão tratados
        // pela função que chamou este procedimento.

        trace("> funcao variaveis()");

        // Verifica se o simbolo pertence à categoria de "identificadores"
        if (categoria == TokenId.Identifier) {
            obterSimbolo();
            
            if (simbolo == ",") {
                obterSimbolo();
                
                // Chama a regra variáveis (recursão)
                variaveis(Seguidores["variaveis"]);
            }
            // else termina a regra
        }
        else {
            error("Esperado 'identificador' mas encontrado '" + simbolo + "'");
            varre(Seguidores["dc_v"], Seguidores["variaveis"]);
        }

        trace("< funcao variaveis()");
    }


    // Procedimento para regra "dc_p" e "parametros"
    //   08. <dc_p>          ::= procedimento ident <parametros> ; <corpo_p> <dc_p> | ε
    //   09. <parametros>    ::= ( <lista_par> ) | ε
    function dc_p(seguidores) {

        trace("> funcao dc_p()");

        while (simbolo == "procedimento") {
            obterSimbolo();
            
            // Verifica se o símbolo pertence à categoria de identificadores
            if (categoria == TokenId.Identifier) {
                obterSimbolo();

                if (simbolo == "(") {
                    obterSimbolo();
                    
                    // Chama a regra "lista_par"
                    lista_par(Seguires["dc_p"]);

                    if (simbolo == ")") {
                        obterSimbolo();
                    }
                    else {
                        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
                        // Imagine se estivesse faltando um ) aqui.
                        // procedimento p1 ( var a : inteiro ;
                        // inicio
                        //   ...
                        // nao podemos consumir o procedimento todo.
                        ///////////////////////////////////////////////////////////////////////////////////////////////////////////
                        error("Esperado ')' mas encontrado '" + simbolo + "'");
                        varre(";", Seguidores["dc_p"]);
                    }
                }
                
                if (simbolo == ";") {
                    obterSimbolo();
                    
                    // Chama a regra "corpo_p"
                    corpo_p(Seguidores["programa"]);
                }
                else {
                    error("Esperado ';' mas encontrado '" + simbolo + "'");
                    varre(Seguidores["dc_p"]);
                }
            }
            else {
                error("Esperado 'identificador' mas encontrado '" + simbolo + "'");
                varre(Seguidores["dc_p"]);
            }
        }

        trace("< funcao dc_p()");
    }


    // Procedimento para regra "lista_par" e "mais_par"
    //   10. <lista_par>     ::= <variaveis> : <tipo_var> <mais_par>
    //   11. <mais_par>      ::= ; <lista_par> | ?
    function lista_par(seguidores) {

        trace("> funcao lista_par()");

        // Chama a regra "variaveis"
        variaveis(Seguidores["programa"]);

        if (simbolo == ":") {
            obterSimbolo();

            if (simbolo == "real" || simbolo == "inteiro") {
                obterSimbolo();

                if (simbolo == ";") {
                    obterSimbolo();

                    // Chama a regra "lista_par"
                    lista_par(Seguires["programa"]);
                }
            }
            else {
                error("Esperado 'inteiro' ou 'real' mas encontrado '" + simbolo + "'");
                varre(Seguidores["lista_par"], Seguidores["dc_p"]);
            }
        }
        else {
            error("Esperado ':' mas encontrado '" + simbolo + "'");
            varre(Seguidores["lista_par"], Seguidores["dc_p"]);
        }

        trace("< funcao lista_par()");
    }


    // Procedimento para regra "corpo_p" e "dc_loc"
    //   12. <corpo_p>       ::= <dc_loc> inicio <comandos> fim ;
    //   13. <dc_loc>        ::= <dc_v>
    function corpo_p(seguidores) {
    
        trace("> funcao corpo_p()");

        // Chama a regra "dc_v"
        dc_v(Seguidores["corpo_p"]);

        if (simbolo == "inicio") {
            obterSimbolo();

            //////////// comandos ou cmd?
            while (simbolo in Primeiros["cmd"]) {
            
                // Chama a regra "corpo_p" (recursão)
                cmd(Seguidores["corpo_p"]);
                
                if (simbolo == ";") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ';' mas encontrado '" + simbolo + "'");
                    varre("fim", Seguidores["dc_p"]);
                }
            }
            
            if (simbolo == "fim") {
                obterSimbolo();
                
                if (simbolo == ";") {
                    obterSimbolo();
                    varre(Seguidores["corpo_p"], Seguidores["dc_p"]);
                }
                else {
                    error("Esperado ';' mas encontrado '" + simbolo + "'");
                    varre(Seguidores["corpo_p"], Seguidores["dc_p"]);
                }
            }
            else {
                error("Esperado 'fim' mas encontrado '" + simbolo + "'");
                varre(Seguidores["corpo_p"], Seguidores["dc_p"]);
            }
        }
        else {
            error("Esperado 'inicio' mas encontrado '" + simbolo + "'");
            varre(Seguidores["corpo_p"], Seguidores["dc_p"]);
        }

        trace("< funcao corpo_p()");
    }


    // Procedimento para regra "lista_arg", "argumentos" e "mais_ident"
    //   14. <lista_arg>     ::= ( <argumentos> ) | ε
    //   15. <argumentos>    ::= ident <mais_ident>
    //   16. <mais_ident>    ::= ; <argumentos> | ε
    function lista_arg(seguidores) {

        trace("> funcao lista_arg()");

        if (simbolo == "(") {
            obterSimbolo();

            // Verifica se o símbolo pertence à categoria de identificadores
            //  Temos de ter pelo menos um identificador na lista de argumentos.
            if (categoria == TokenId.Identifier) {
                obterSimbolo();

                // Enquanto houver um ";", repetimos a regra para reconhecer
                //   todos identificadores na lista de argumentos
                while (simbolo == ";") {
                    obterSimbolo();

                    // Verifica se o símbolo pertence à categoria de identificadores
                    if (categoria == TokenId.Identifier) {
                        obterSimbolo();
                    }
                    else {
                        error("Esperado identificador mas encontrado '" + simbolo + "'");
                        varre(Seguidores["lista_arg"], ")");
                    }
                }
                
                if (simbolo == ")") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ')' mas encontrado '" + simbolo + "'");
                    varre(Seguidores["lista_arg"]);
                }
            }
            else {
                error("Esperado identificador mas encontrado '" + simbolo + "'");
                varre(Seguidores["lista_arg"]);
            }
        }
        else {
            error("Esperado '(' mas encontrado '" + simbolo + "'");
            varre(Seguidores["lista_arg"]);
        }

        trace("< funcao lista_arg()");
    }


    // Procedimento para regra "comandos"
    //   17. <comandos>      ::= <cmd> ; <comandos> | ε
    function comandos() {

        trace("> funcao comandos()");
        
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // gambiarra - Primeiros(cmd) contem os identificadores, mas eles são uma categoria e não um nome, por isso
        // precisa deste or aqui. Vou pensar em um jeito melhor depois
        //
        // E se símbolo contesse "@ident" quando for um identificador? Resolveria, mas resta
        //  pensar no resto do mecanismo para não estragar o restante das regras! Mas acho que
        //  isto seria o mais ideal. Já que salvamos o token atual, podemos usar token.getCadeia()
        //  para relatar os erros corretamente. Também não precisariamos mais salvar a categoria
        //  do token atual, o que de certa forma duplicava funcionalidade. O que acha?
        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        while (simbolo in Primeiros["cmd"] || categoria == TokenId.Identifier) {
        
            // Chama a regra "cmd"
            cmd(Seguidores["comandos"]);
            
            if (simbolo == ";") {
                obterSimbolo();
                
                // Chama a regra "comandos"
                comandos(Seguidores["comandos"]);
            }
            else {
                error("Esperado ';' mas encontrado '" + simbolo + "'");
                varre(Primeiros["cmd"], Seguidores["comandos"]);
            }
        }
        
        trace("< funcao comandos()");
    }


    // Procedimento para regra "cmd"
    //   18. <cmd>           ::= le ( <variaveis> ) |
    //                           escreve ( <variaveis> ) |
    //                           enquanto <condicao> faca <cmd> |
    //                           se <condicao> entao <cmd> <cont_se> |
    //                           ident <cont_ident>
    //                           inicio <comandos> fim
    function cmd(seguidores) {

        trace("> funcao cmd()");

        if (simbolo == "le") {
            obterSimbolo();
            
            if (simbolo == "(") {
                obterSimbolo();

                // Chama a regra "variáveis"
                variaveis(Seguidores["cmd"]);

                if (simbolo == ")") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ')' mas encontrado '" + simbolo + "'");
                    varre(Seguidores["cmd"]);
                }
            }
            else {
                error("Esperado '(' mas encontrado '" + simbolo + "'");
                varre(Seguidores["cmd"]);
                //////////////////////////////////////////////////////////////////////////////////////////////////////////
                // Imagine a seguinte situacao:
                // le a);
                // o que fazer? desconsidera o comando? eh o que acontece aqui
                //////////////////////////////////////////////////////////////////////////////////////////////////////////
            }
        }
        else if (simbolo == "escreve") {
            obterSimbolo();

            if (simbolo == "(") {
                obterSimbolo();
                
                // Chama regra "variaveis"
                variaveis(Seguidores["cmd"]);

                if (simbolo == ")") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ')' mas encontrado '" + simbolo + "'");
                    varre(Seguidores["cmd"]);
                }
            }
            else {
                error("Esperado '(' mas encontrado '" + simbolo + "'");
                varre(Seguidores["cmd"]);
            }
        }
        else if (simbolo == "enquanto") {
            obterSimbolo();

            // Chama regra "condicao"
            condicao(Seguidores["cmd"]);
            
            if (simbolo == "faca") {
                obterSimbolo();
                
                // Chama regra "cmd" (recursão)
                cmd(Seguidores["cmd"]);
            }
            else {
                error("Esperado 'faca' mas encontrado '" + simbolo + "'");
                varre(Seguidores["cmd"]);
            }
        }
        else if (simbolo == "se") {
            obterSimbolo();

            // Chama regra "condicao"
            condicao(Seguidores["cmd"]);

            if (simbolo == "entao") {
                obterSimbolo();

                // Chama regras "cmd" e "cont_se"
                cmd(Seguidores["cmd"]);
                cont_se(Seguidores["cmd"]);
            }
            else {
                error("Esperado 'entao' mas encontrado '" + simbolo + "'");
                varre(Seguidores["cmd"]);
            }
        }
        else if (categoria == TokenId.Identifier) {
            obterSimbolo();
            cont_ident(Seguidores["cmd"]);
        }
        else if (simbolo == "inicio") {
            obterSimbolo();
            /////////////////////////////////////////////////////////////////////////////////////////////////////////
            // gambiarra - Ver observacao acima
            /////////////////////////////////////////////////////////////////////////////////////////////////////////
            while (simbolo in Primeiros["cmd"] || categoria == TokenId.Identifier) {
                cmd(Seguidores["cmd"]);
                if (simbolo == ";") {
                    obterSimbolo();
                }
                else {
                    error("Esperado ';' mas encontrado '" + simbolo + "'");
                    varre(Primeiros["cmd"], Seguidores["cmd"]);
                }
            }
            if (simbolo == "fim") {
                obterSimbolo();
            }
            else {
                error("Esperado 'fim' mas encontrado '" + simbolo + "'");
                varre(Seguidores["cmd"]);
            }
        }
        else {
            error("Esperado 'le', 'escreve', 'enquanto', 'se', 'inicio' ou identificador, mas encontrado '" + simbolo + "'");
            varre(Seguidores["cmd"]);
        }

        trace("< funcao cmd()");
    }


    // Procedimento para a regra "cont_se"
    //  '18. <cont_se>       ::= fim | senao <cmd>
    function cont_se(seguidores) {
    
        trace("> funcao cont_se()");

        if (simbolo == "fim") {
            obterSimbolo();
        }
        else if (simbolo == "senao") {
            obterSimbolo();
            cmd(Seguidores["cont_se"]);
        }
        else {
            error("Esperado 'fim' ou 'senao', mas encontrado '" + simbolo + "'");
            varre(Seguidores["cont_se"]);
        }

        trace("< funcao cont_se()");
    }


    // Procedimento para a regra "cont_ident"
    //  "18. <cont_ident>    ::= := <expressao> | <lista_arg>
    function cont_ident(seguidores) {
      trace("> funcao cont_ident()");

      if (simbolo == ":=") {
        obterSimbolo();
        expressao(Seguidores["cont_ident"]);
      }
      else if (simbolo in Primeiros["lista_arg"]) {
        lista_arg(Seguidores["cont_ident"]);
      }
      else error("Esperado ':=' ou '(', mas encontrado '" + simbolo + "'");

      if (debug)
        alert("< funcao cont_ident()");
    }



    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Precisamos tomar mais cuidado com as regras abaixo
    //////////////////////////////////////////////////////////////////////////////////////////////////////

    // Procedimento para a regra "condicao" e "relacao"
    //   19. <condicao>      ::= <expressao> <relacao> <expressao>
    //   20. <relacao>       ::= = | <> | >= | <= | > | <
    function condicao(seguidores) {

        trace("> funcao condicao()");

        // Chama a regra "condicao"
        expressao(Seguidores["condicao"]);

        if (simbolo == "=" || simbolo == "<>" || simbolo == ">=" ||
            simbolo == "<=" || simbolo == ">" || simbolo == "<") {
            obterSimbolo();
            expressao(Seguidores["condicao"]);
        }
        else {
            error("Esperado '=', '<>', '>=', '<=', '>' ou '<', mas encontrado '" + simbolo + "'");
            varre(Seguidores["condicao"]);
        }

        trace("< funcao condicao()");
    }


    // Procedimento para as regras "expressao" e "op_un"
    //   21. <expressao>     ::= <termo> <outros_termos>
    //   22. <op_un>         ::= + | - | ? 
    function expressao(seguidores) {
        trace("> funcao expressao()");

        termo(Seguidores["expressao"]);

        while (simbolo == "+" || simbolo == "-") {
            obterSimbolo();
            termo(Seguidores["expressao"]);
        }

        trace("< funcao expressao()");
    }


    // Procedimento para as regras "termo", "outros_termos" e outras
    //   23. <outros_termos> ::= <op_ad> <termo> <outros_termos> | ε
    //   24. <op_ad>         ::= + | -
    //   25. <termo>         ::= <op_un> <fator> <mais_fatores>
    //   26. <mais_fatores>  ::= <op_mul> <fator> <mais_fatores> | ε
    //   27. <op_mul>        ::= * | /
    function termo(seguidores) {
      trace("> funcao termo()");

      if (simbolo == "+" || simbolo == "-") {
        obterSimbolo();
      }
      fator();
      while (simbolo == "*" || simbolo == "/") {
        obterSimbolo();
        fator(Seguidores["termo"]);
      }

      trace("< funcao termo()");
    }


    // Procedimento para a regra "fator" 
    //   28. <fator>         ::= ident | numero_int | numero_real | ( <expressao> )
    function fator(seguidores) {
        trace("> funcao fator()");

        if (categoria == TokenId.Identifier) {
            obterSimbolo();
        }
        else if (categoria == TokenId.Integer) {
            obterSimbolo();
        }
        else if (categoria == TokenId.Real) {
            obterSimbolo();
        }
        else if (simbolo == "(") {
            obterSimbolo();
            expressao(Seguidores["fator"]);
            
            if (simbolo == ")") {
                obterSimbolo();
            }
            else {
                error("Esperado ')' mas encontrado '" + simbolo + "'");
                varre(Seguidores["fator"]);  // provavelmente seguidores de termos e etc tb
            }
        }
        else {
            error("Esperado '(', identificador, numero inteiro ou numero real, mas encontrado '" + simbolo + "'");
            // seguidores de fator e de termo tb e tal
            varre(";");
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Teriamos que procurar um identificador, mas temos que mudar a funcao de varredura para poder buscar
            // identificadores
            // do jeito que esta aqui, a expressao toda eh desconsiderada
            // ex: a := _a + b;
            // ou a := (a_ + b);
            ///////////////////////////////////////////////////////////////////////////////////////////////////////////
        }

        trace("< funcao fator()");
    }





    //  Conjuntos da Linguagem ALG
    //  **************************

    // Conjunto de primeiros
    var Primeiros = {
        "programa"      : { "programa"  :0 },
        "corpo"         : { "var":0 },
        "dc"            : { "var":0 , "ε" : 0 },
        "dc_v"          : { "var":0 , "ε" : 0 },
        "tipo_var"      : { "real":0 , "inteiro" :0 },
        "variaveis"     : { "@ident":0 },
        "mais_var"      : { ",":0, "ε":0 },
        "dc_p"          : { "procedimento":0 , "ε" :0 },
        "parametros"    : { "(":0, "ε":0 },
        "lista_par"     : { "@ident" :0 },
        "mais_par"      : { ";":0 , "ε" :0 },
        "corpo_p"       : { "var":0 },
        "dc_loc"        : { "var":0 , "ε" :0 },
        "lista_arg"     : { "(":0 , "ε" :0 },
        "argumentos"    : { "@ident" :0 },
        "mais_ident"    : { ";":0, "ε" :0 },
        "comandos"      : { "le":0, "escreve":0, "enquanto":0, "se":0, "@ident":0, "inicio":0, "ε":0 },
        "cmd"           : { "le":0, "escreve":0, "enquanto":0, "se":0, "@ident":0, "inicio":0 },
        "cont_se"       : { "fim":0, "senao":0 },
        "cont_ident"    : { ":=":0 , "(":0, "ε":0 },
        "condicao"      : { "+":0 , "-":0 },
        "relacao"       : { "=":0 , "<>":0 , ">=":0 , "<=":0 , ">":0 , "<" :0 },
        "expressao"     : { "+":0 , "-":0 , "ε" :0 },
        "op_un"         : { "+":0 , "-":0 , "ε" :0 },
        "outros_termos" : { "+":0 , "-":0 , "ε" :0 },
        "op_ad"         : { "+":0 , "-":0 },
        "termo"         : { "+":0 , "-":0 },
        "mais_fatores"  : { "*":0 , "/":0 , "ε" :0 },
        "op_mul"        : { "*":0 , "/" :0 },
        "fator"         : { "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 }
    };

    // Conjunto de seguidores
    var Seguidores = {
        "programa"      : { "$":0 },
        "corpo"         : { ".":0 },
        "dc"            : { "inicio":0 },
        "dc_v"          : { "procedimento":0, "inicio":0 },
        "tipo_var"      : { ";":0 },
        "variaveis"     : { ":":0, ")":0 },
        "mais_var"      : { ":":0, ")":0 },
        "dc_p"          : { "inicio":0 },
        "parametros"    : { ";":0 },
        "lista_par"     : { ")":0 },
        "mais_par"      : { ")":0 },
        "corpo_p"       : { "procedimento":0 },
        "dc_loc"        : { "inicio":0 },
        "lista_arg"     : { ";":0, "fim":0, "senao":0 },
        "argumentos"    : { ")":0 },
        "mais_ident"    : { ")":0 },
        "comandos"      : { "fim":0 },
        "cmd"           : { ";":0, "fim":0, "senao":0 },
        "cont_se"       : { ";":0, "fim":0, "senao":0 },
        "cont_ident"    : { ";":0, "fim":0, "senao":0 },
        "condicao"      : { "faca":0, "entao":0 },
        "relacao"       : { "+":0 , "-":0 },
        "expressao"     : { "faca":0, "entao":0, "=":0 , "<>":0 , ">=":0 , "<=":0 , ">":0 , "<" :0, ")":0, ";":0, "fim":0, "senao":0 },
        "op_un"         : { "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 },
        "outros_termos" : { "faca":0, "entao":0, "=":0 , "<>":0 , ">=":0 , "<=":0 , ">":0 , "<" :0, ")":0, ";":0, "fim":0, "senao":0 },
        "op_ad"         : { "+":0 , "-":0 },
        "termo"         : { "+":0 , "-":0 },
        "mais_fatores"  : { "+":0 , "-":0 },
        "op_mul"        : { "@ident":0 , "@numero_int":0 , "@numero_real":0 , "(":0 },
        "fator"         : { "*":0 , "/":0 }
    };





    //  Funções auxiliares
    //  **************************

    // Combina as chaves de arrays associativos e demais strings passadas
    //  como parâmetros em um só. A quantidade de parâmetros é indeterminada.
    function join() {
        var list = new Object();
        var argumento;

        for (var i = 0; i < join.arguments[0].length; i++) {
            argumento = join.arguments[0][i];
            if (typeof argumento == "object") {
                for (chave in argumento) {
                    list[chave] = 0;
                }
            }
            else if (typeof argumento == "string") {
                list[argumento] = 0;
            }
        }

        return list;
    }





    // Especificação da Linguagem ALG como uma Gramática LL(1)
    // *******************************************************

    //
    //   01. <programa>      ::= programa ident ; <corpo> .
    //   02. <corpo>         ::= <dc> inicio <comandos> fim
    //   03. <dc>            ::= <dc_v> <dc_p>
    //   04. <dc_v>          ::= var <variaveis> : <tipo_var> ; <dc_v> | ε
    //   05. <tipo_var>      ::= real | inteiro
    //   06. <variaveis>     ::= ident <mais_var>
    //   07. <mais_var>      ::= , <variaveis> | ε
    //   08. <dc_p>          ::= procedimento ident <parametros> ; <corpo_p> <dc_p> | ε
    //   09. <parametros>    ::= ( <lista_par> ) | ε
    //   10. <lista_par>     ::= <variaveis> : <tipo_var> <mais_par>
    //   11. <mais_par>      ::= ; <lista_par> | ?
    //   12. <corpo_p>       ::= <dc_loc> inicio <comandos> fim ;
    //   13. <dc_loc>        ::= <dc_v>
    //   14. <lista_arg>     ::= ( <argumentos> ) | ε
    //   15. <argumentos>    ::= ident <mais_ident>
    //   16. <mais_ident>    ::= ; <argumentos> | ε
    //   17. <comandos>      ::= <cmd> ; <comandos> | ε
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
    //   23. <outros_termos> ::= <op_ad> <termo> <outros_termos> | ε
    //   24. <op_ad>         ::= + | -
    //   25. <termo>         ::= <op_un> <fator> <mais_fatores>
    //   26. <mais_fatores>  ::= <op_mul> <fator> <mais_fatores> | ε
    //   27. <op_mul>        ::= * | /
    //   28. <fator>         ::= ident | numero_int | numero_real | ( <expressao> )
    //


}