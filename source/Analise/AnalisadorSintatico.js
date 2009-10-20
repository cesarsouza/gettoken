// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Analisador Sintático (Parser)
//  Esta classe é responsável por conduzir a etapa de análise sintática,
//  identificando regras gramaticais respeitadas pelos tokens adquiridos
//  pelo Analisador Léxico. Eventuais erros identificados durante a
//  análise poderão ser resgatados através da lista de erros em error().
//
function AnalisadorSintatico(input) {


    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    // Analisador Léxico a ser utilizado por este Analisador Sintático (parser)
    var analisadorLexico = new AnalisadorLexico(input);

    // Lista de erros encontrados durante a análise
    var error_list = new Array();

    // Estado do parser, para ignorar erros espúrios durante o modo pânico
    var emPanico  = false;
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

        // Verifica se houve erros durante a analise
        //  sintática e retorna o estado de sucesso
        return (error_list.length == 0)
    }

    // Retorna a lista de erros encontrados
    this.errors = function() {
        return error_list;
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
            switch (token.id()) {

                case TokenId.Identifier:
                    simbolo = "@ident";
                    cadeia  = token.cadeia();
                    break;

                case TokenId.Real:
                    simbolo = "@numero_real";
                    cadeia  = token.cadeia();
                    break;

                case TokenId.Integer:
                    simbolo = "@numero_int";
                    cadeia  = token.cadeia();
                    break;

                case TokenId.Keyword:
                    simbolo = token.cadeia();
                    cadeia  = token.cadeia();
                    break;

                case TokenId.Error:
                    simbolo = "@erro";
                    cadeia  = token.cadeia();
                    // Colocamos este erro léxico na lista de erros
                    error("Caractere '" + token.cadeia() + "' nao reconhecido");
                    break;
            }
        }
        else {
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
    function error(mensagem) {
        if (!ignorando) //&& !emPanico)
        {
           var error = new Error(mensagem, analisadorLexico.line());
           error_list.push(error);
        }
    }


    // Varre a entrada ate que um símbolo de sincronização seja encontrado
    function varre(sincronizadores) {

        trace("> varre() - simbolo ofensivo = " + cadeia);

        // Varre a entrada até encontrar um membro do conjunto de
        //   sincronização e enquanto não acabarem os tokens
        while (!(simbolo in sincronizadores) && token != null) {
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
    //
    function programa() {

        trace("> funcao programa()");

        if (simbolo != "programa") {
            error("Esperado 'programa' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["programa"], Primeiros["dc_v"], Primeiros["dc_p"], "inicio", "@ident", ";"));
            //emPanico = true;
        }
        if (simbolo == "programa") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != "@ident") {
            error("Esperado identificador mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Primeiros["dc_p"], "inicio", ";", "@ident"));
            //emPanico = true;
        }
        if (simbolo == "@ident") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != ";") {
            error("Esperado ';' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Primeiros["dc_p"], "inicio", ";"));
            emPanico = true;
        }
        if (simbolo == ";") {
            obterSimbolo();
            emPanico = false;
        }

        // Chama as regras "dc_p" e "dc_v"
        dc_v(Seguidores["programa"]);
        dc_p(Seguidores["programa"]);

        if (simbolo != "inicio") {
            error("Esperado 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["comandos"], "inicio"));
            //emPanico = true;
        }
        if (simbolo == "inicio") {
            obterSimbolo();
            emPanico = false;
        }

        // Chama a regra "comandos"
        comandos(Seguidores["programa"]);

        if (simbolo != "fim") {
            error("Esperado 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["programa"], "fim"));
            //emPanico = true;
        }
        if (simbolo == "fim") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != ".") {
            error("Esperado '.' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["programa"], "."));
            //emPanico = true;
        }
        if (simbolo == ".") {
            obterSimbolo();
            emPanico = false;
        }

        // Reconhece todo o resto a partir daqui como erro
        while (simbolo != "$") {
            error("Simbolo '" + cadeia + "' encontrado apos final de programa.");
            obterSimbolo();
        }
    }


    // Procedimento para regra "dc_v" e "tipo_var"
    //   04. <dc_v>          ::= var <variaveis> : <tipo_var> ; <dc_v> | @vazio
    //   05. <tipo_var>      ::= real | inteiro
    //
    function dc_v(seguidores) {

        if (!(simbolo in Primeiros["dc_v"]) && !(simbolo in Seguidores["dc_v"])) {
            error("Esperado 'var', 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_v"], Seguidores["dc_v"], seguidores));
            emPanico = true;
        }

        while (simbolo == "var") {
            obterSimbolo();
            emPanico = false;
            
            // Chama a regra "variáveis"
            variaveis(join(Seguidores["dc_v"], seguidores));

            if (simbolo != ":") {
                error("Esperado ':' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["dc_v"], ":", "real", "inteiro", ";", seguidores));
                emPanico = true;
            }
            if (simbolo == ":") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != "real" && simbolo != "inteiro") {
                error("Esperado tipo de variavel (real ou inteiro) mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["dc_v"], "real", "inteiro", ";", seguidores));
                emPanico = true;
            }
            if (simbolo == "real" || simbolo == "inteiro") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["dc_v"], ":", "real", "inteiro", ";", seguidores));
                emPanico = true;
            }
            if (simbolo == ";") {
                obterSimbolo();
                emPanico = false;
            }

            if (!(simbolo in Primeiros["dc_v"]) && !(simbolo in Seguidores["dc_v"])) {
                error("Esperado 'var', 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["dc_v"], Seguidores["dc_v"], seguidores));
                emPanico = true;
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
            emPanico = true;
        }
        if (simbolo == "@ident") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != "," && !(simbolo in Seguidores["variaveis"])) {
            if (arguments.callee.caller == lista_par) 
                error("Esperado ',' ou ':' mas encontrado '" + cadeia + "'");
            else
                error("Esperado ',' ou ')' mas encontrado '" + cadeia + "'"); 
            varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
            emPanico = true;
        }

        // Trata o caso de variáveis multiplas declaradas sem separador (,)
        if (simbolo in Primeiros["variaveis"]) {
            variaveis(seguidores);
        }

        while (simbolo == ",") {
            obterSimbolo();
            emPanico = false;

            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
                emPanico = true;
            }
            if (simbolo == "@ident") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != "," && !(simbolo in Seguidores["variaveis"])) {
                error("Esperado ',', ':' ou ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["variaveis"], seguidores, ",", "@ident"));
                emPanico = true;
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

        if (!(simbolo in Primeiros["dc_p"]) && !(simbolo in Seguidores["dc_p"])) {
            error("Esperado 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["dc_p"], Seguidores["dc_p"], seguidores));
            //emPanico = true;
        }

        while (simbolo == "procedimento") {
            obterSimbolo();
            emPanico = false;

            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join("(", ";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                //emPanico = true;
            }
            if (simbolo == "@ident") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != "(" && simbolo != ";") {
                error("Esperado '(' ou ';' mas encontrado '" + cadeia + "'");
                varre(join("(", ";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                //emPanico = true;
            }

            if (simbolo == "(") {
                obterSimbolo();
                emPanico = false;

                // Chama a regra "lista_par"
                lista_par(join(seguidores, Seguidores["dc_p"], Primeiros["corpo_p"]));

                if (simbolo != ")") {
                    error("Esperado ')' mas encontrado '" + cadeia + "'");
                    varre(join(")", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                    //emPanico = true;
                }

                if (simbolo == ")") {
                    obterSimbolo();
                    emPanico = false;
                }

                if (simbolo != ";") {
                    error("Esperado ';' mas encontrado '" + cadeia + "'");
                    varre(join(";", Seguidores["dc_p"], Primeiros["corpo_p"], seguidores));
                    //emPanico = true;
                }
            }

            if (simbolo == ";") {
                obterSimbolo();
                emPanico = false;
            }

            // Chama a regra "corpo_p"
            corpo_p(join(seguidores, Seguidores["dc_p"]));

            if (!(simbolo in Primeiros["dc_p"]) && !(simbolo in Seguidores["dc_p"])) {
                error("Esperado 'procedimento' ou 'inicio' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["dc_p"], Seguidores["dc_p"], seguidores));
                //emPanico = true;
            }
        }
    }


    // Procedimento para regra "lista_par" e "mais_par"
    //   10. <lista_par>     ::= <variaveis> : <tipo_var> <mais_par>
    //   11. <mais_par>      ::= ; <lista_par> | ?
    //
    function lista_par(seguidores) {

        // Chama a regra "variaveis"
        variaveis(join(seguidores, Seguidores["lista_par"]));

        if (simbolo != ":") {
            error("Esperado ':' mas encontrado '" + cadeia + "'");
            varre(join(";", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
            emPanico = true;
        }
        if (simbolo == ":") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != "real" && simbolo != "inteiro") {
            error("Esperado 'inteiro' ou 'real' mas encontrado '" + cadeia + "'");
            varre(join("real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
            emPanico = true;
        }
        if (simbolo == "real" || simbolo == "inteiro") {
            obterSimbolo();
            emPanico = false;
        }

        if (simbolo != ";" && !(simbolo in Seguidores["lista_par"])) {
            error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
            varre(join(";", "var", Primeiros["lista_par"], Seguidores["lista_par"], seguidores));
            emPanico = true;
        }

        if (simbolo in Primeiros["lista_par"]) {
            lista_par(seguidores);
        }

        while (simbolo == ";") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "variáveis" 
            variaveis(join(seguidores, Seguidores["lista_par"], "var"));

            if (simbolo != ":") {
                error("Esperado ':' mas encontrado '" + cadeia + "'");
                varre(join(";", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
                emPanico = true;
            }
            if (simbolo == ":") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != "real" && simbolo != "inteiro") {
                error("Esperado 'inteiro' ou 'real' mas encontrado '" + cadeia + "'");
                varre(join("real", "inteiro", Primeiros["lista_par"], Seguidores["lista_par"], Seguidores["dc_p"], seguidores));
                emPanico = true;
            }
            if (simbolo == "real" || simbolo == "inteiro") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != ";" && !(simbolo in Seguidores["lista_par"])) {
                error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                varre(join(";", Primeiros["lista_par"], Seguidores["lista_par"], seguidores));
                emPanico = true;
            }

            if (simbolo in Primeiros["lista_par"]) {
                lista_par(seguidores);
            }

        }
    }



    // Procedimento para regra "corpo_p" e "dc_loc"
    //   12. <corpo_p>       ::= <dc_loc> inicio <comandos> fim ;
    //   13. <dc_loc>        ::= <dc_v>
    //
    function corpo_p(seguidores) {
    
        // Chama a regra "dc_v"
        dc_v(join(seguidores, Seguidores["corpo_p"], Primeiros["cmd"]));

        if (simbolo != "inicio") {
            //error("Esperado 'inicio' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores, Primeiros["cmd"]));
            emPanico = true;
        }
        if (simbolo == "inicio") {
            obterSimbolo();
            emPanico = false;
        }

        // Antes de entrarmos no laço while, temos de verificar se o
        //  simbolo nao está nos primeiros de cmd e se o simbolo é
        //  diferente de fim, o que neste caso seria um erro sintatico.
        if (!(simbolo in Primeiros["cmd"]) && simbolo != "fim")
        {
            // Varre até os primeiros de cmd ou primeiros de fim.
            error("Esperado comando ou 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Primeiros["cmd"], "fim", seguidores));
            //emPanico = true;
        }
        
        // Enquanto o simbolo estiver em primeiros de cmd
        while (simbolo in Primeiros["cmd"]) {
        
            // Chama a regra "cmd"
            cmd(Seguidores["corpo_p"]);

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join("fim", Seguidores["dc_p"], ";", seguidores));
                //emPanico = true;
            }
            if (simbolo == ";") {
                obterSimbolo();
                emPanico = false;
            }

            if (!(simbolo in Primeiros["cmd"]) && simbolo != "fim") {
                // Varre ate os primeiros de cmd U fim.
                error("Esperado comando ou 'fim' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["corpo_p"], Primeiros["cmd"], "fim", seguidores));
                //emPanico = true;
            }
        }
        
        // Espera receber o token "fim"
        if (simbolo != "fim") {
            error("Esperado 'fim' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores));
            //emPanico = true;
        }
        if (simbolo == "fim") {
            obterSimbolo();
            emPanico = false;
        }
            
        // Espera "ponto-e-virgula"
        if (simbolo != ";") {
            error("Esperado ';' mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["corpo_p"], Seguidores["dc_p"], seguidores));
            //emPanico = true;
        }
        if (simbolo == ";") {
            obterSimbolo();
            emPanico = false;
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

        if (simbolo != "(" && !(simbolo in Seguidores["lista_arg"])) {
            error("Esperado '(' ou seguidores de lista_arg mas encontrado '" + cadeia + "'");
            varre(join("(", "@ident", ";", ")", Seguidores["lista_arg"], seguidores));
            emPanico = true;
        }

        if (!(simbolo in Seguidores["lista_arg"])) {

            if (simbolo == "(") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != "@ident") {
                error("Esperado identificador mas encontrado '" + cadeia + "'");
                varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                //emPanico = true;
            }
            if (simbolo == "@ident") {
                obterSimbolo();
                emPanico = false;
            }

            if (simbolo != ";" && simbolo != ")") {
                error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                //emPanico = true;
            }

            while (simbolo == ";") {
                obterSimbolo();
                emPanico = false;

                if (simbolo != "@ident") {
                    error("Esperado identificador mas encontrado '" + cadeia + "'");
                    varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                    //emPanico = true;
                }
                if (simbolo == "@ident") {
                    obterSimbolo();
                    emPanico = false;
                }

                if (simbolo != ";" && simbolo != ")") {
                    error("Esperado ';' ou ')' mas encontrado '" + cadeia + "'");
                    varre(join("@ident", ";", ")", Seguidores["lista_arg"], seguidores));
                    //emPanico = true;
                }
            }

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(")", Seguidores["lista_arg"], seguidores));
                emPanico = true;
            }
            if (simbolo == ")") {
                obterSimbolo();
                emPanico = false;
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
            //emPanico = true;
        }

        while (simbolo in Primeiros["comandos"]) {

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["comandos"]));

            if (simbolo != ";") {
                error("Esperado ';' mas encontrado '" + cadeia + "'");
                varre(join(";", Primeiros["cmd"], Seguidores["comandos"], seguidores));
                emPanico = true;
            }
            if (simbolo == ";") {
                obterSimbolo();
                emPanico = false;
            }

            if (!(simbolo in Primeiros["comandos"]) && !(simbolo in Seguidores["comandos"])) {
                error("Esperado comando, ';', 'fim' ou 'senao', mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["comandos"], Seguidores["comandos"], seguidores));
                emPanico = true;
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

        if (!(simbolo in {"le":0, "escreve":0, "enquanto":0, "se":0, "@ident":0,"inicio":0})) {
            error("Esperado comando ou bloco de comandos mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["cmd"], seguidores));
            emPanico = true;
        }

        if (simbolo == "le") {
            obterSimbolo();
            emPanico = false;

            if (simbolo != "(") {
                error("Esperado '(' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], "(", seguidores, "@ident"));
                emPanico = true;
            }
            if (simbolo == "(") {
                obterSimbolo();
                emPanico = false;
            }

            // Chama a regra "variáveis"
            variaveis(join(seguidores, Seguidores["cmd"], ";"));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], ")", seguidores));
                emPanico = true;
            }

            if (simbolo == ")") {
                obterSimbolo();
                emPanico = false;
            }
        }
        else if (simbolo == "escreve") {
            obterSimbolo();
            emPanico = false;

            if (simbolo != "(") {
                error("Esperado '(' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], "(", seguidores));
                emPanico = true;
            }
            if (simbolo == "(") {
                obterSimbolo();
                emPanico = false;
            }

            // Chama a regra "variáveis"
            variaveis(join(seguidores, Seguidores["cmd"]));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], ")", seguidores));
                emPanico = true;
            }
            if (simbolo == ")") {
                obterSimbolo();
                emPanico = false;
            }

        }
        else if (simbolo == "enquanto") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "condição" 
            condicao(join(seguidores, Seguidores["cmd"]));

            if (simbolo != "faca") {
                error("Esperado 'faca' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], Primeiros["cmd"], seguidores));
                emPanico = true;
            }
            if (simbolo == "faca") {
                obterSimbolo();
                emPanico = false;
            }

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "se") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "condição" 
            condicao(join(seguidores, Seguidores["cmd"], Primeiros["cmd"]));

            if (simbolo != "entao") {
                error("Esperado 'entao' mas encontrado '" + cadeia + "'");
                varre(join(Primeiros["cmd"], seguidores));
                emPanico = true;
            }
            if (simbolo == "entao") {
                obterSimbolo();
                emPanico = false;
            }

            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cmd"]));

            // Chama a regra "cont_se"
            cont_se(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "@ident") {

            obterSimbolo();
            emPanico = false;

            // Chama a regra "cont_ident" 
            cont_ident(join(seguidores, Seguidores["cmd"]));
        }
        else if (simbolo == "inicio") {

            obterSimbolo();

            while (simbolo in Primeiros["cmd"]) {

                // Chama a regra "cmd"
                cmd(join(seguidores, Seguidores["cmd"]));

                if (simbolo != ";") {
                    error("Esperado ';' mas encontrado '" + cadeia + "'");
                    varre(join(";", Primeiros["cmd"], "fim", seguidores));
                    emPanico = true;
                }
                if (simbolo == ";") {
                    obterSimbolo();
                    emPanico = false;
                }
            } 

            if (simbolo != "fim") {
                error("Esperado 'fim' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["cmd"], seguidores));
                emPanico = true;
            }
            if (simbolo == "fim") {
                obterSimbolo();
                emPanico = false;
            }
        }
    }


    // Procedimento para a regra "cont_se"
    //  '18. <cont_se>       ::= fim | senao <cmd>
    //
    function cont_se(seguidores) {

        if (simbolo != "fim" && simbolo != "senao") {
            error("Esperado 'fim' ou 'senao', mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["cont_se"], "fim", "senao", seguidores));
            emPanico = true;
        }

        if (simbolo == "fim") {
            obterSimbolo();
            emPanico = false;
        }
        else if (simbolo == "senao") {
            obterSimbolo();
            emPanico = false;
            
            // Chama a regra "cmd"
            cmd(join(seguidores, Seguidores["cont_se"]));
        }
        
        // TODO: Não ta faltando um fim na gramática aqui?

        trace("< funcao cont_se()");
    }



    // Procedimento para a regra "cont_ident"
    //  "18. <cont_ident>    ::= := <expressao> | <lista_arg>
    //
    function cont_ident(seguidores) {

        if (simbolo != ":=" && !(simbolo in Primeiros["lista_arg"])) {
            error("Esperado ':=' ou '(', mas encontrado '" + cadeia + "'");
            varre(join(":=", Primeiros["lista_arg"], Seguidores["cont_ident"], seguidores));
            emPanico = true;
        }

        if (simbolo == ":=") {
            obterSimbolo();
            emPanico = false;
            
            // Chama a regra "expressão"
            expressao(join(seguidores, Seguidores["cont_ident"]));
        }
        else if (simbolo in Primeiros["lista_arg"]) {
            emPanico = false;
            
            // Chama a regra "lista_arg" 
            lista_arg(join(seguidores, Seguidores["cont_ident"]));
        }
    }



    // Procedimento para a regra "condicao" e "relacao"
    //   19. <condicao>      ::= <expressao> <relacao> <expressao>
    //   20. <relacao>       ::= = | <> | >= | <= | > | <
    //
    function condicao(seguidores) {

        // Chama a regra "expressao"
        expressao(join(seguidores, Seguidores["condicao"]));

        if (!(simbolo in {"=":0,"<>":0,">=":0,"<=":0,">":0,"<":0})) {
            error("Esperado '=', '<>', '>=', '<=', '>' ou '<', mas encontrado '" + cadeia + "'");
            varre(join(Seguidores["condicao"], {"=":0,"<>":0,">=":0,"<=":0,">":0,"<":0}, seguidores));
            emPanico = true;
        }
        if (simbolo in {"=":0,"<>":0,">=":0,"<=":0,">":0,"<":0}) {
            obterSimbolo();
            emPanico = false;
        }

        // Chama a regra "expressão" 
        expressao(join(seguidores, Seguidores["condicao"]));
    }



    // Procedimento para as regras "expressao" e "op_un"
    //   21. <expressao>     ::= <termo> <outros_termos>
    //   22. <op_un>         ::= + | - | ?
    //
    function expressao(seguidores) {

        // Chama a regra "termo"
        termo(join(Seguidores["expressao"], seguidores));

        // Se simbolo não for um sinal nem estiver em seguidores
        //  de expressao, este é um erro. Algo como (a _+ b).
        if (simbolo != "+" && simbolo != "-" && !(simbolo in Seguidores["expressao"])) {
            error("Expressão inválida");
            varre(join("+", "-", Seguidores["expressao"], seguidores));
            emPanico = true;
            if (simbolo in Primeiros["expressao"]) {
                expressao(seguidores);
            }
        }

        // Enquanto houver "+" ou "-"
        while (simbolo == "+" || simbolo == "-") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "termo"
            termo(join(Seguidores["expressao"], seguidores));

            if (simbolo != "+" && simbolo != "-" && !(simbolo in Seguidores["expressao"])) {
                error("Expressão inválida");
                varre(join("+", "-", Seguidores["expressao"], seguidores));
                emPanico = true;

                if (simbolo in Primeiros["expressao"]) {
                    expressao(seguidores);
                }
            }
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

        if (simbolo != "+" && simbolo != "-" && !(simbolo in Primeiros["fator"])) {
            error("Esperado '+', '-', identificador, numero inteiro, numero real ou '(', mas encontrado '" + cadeia + "'");
            varre(join(Primeiros["termo"], Primeiros["fator"], seguidores));
            emPanico = true;
        }
        if (simbolo == "+" || simbolo == "-") {
            obterSimbolo();
            emPanico = false;
        }

        // Chama a regra "fator"
        fator(join(seguidores, Seguidores["termo"]));

        if (simbolo != "*" && simbolo != "/" && !(simbolo in Seguidores["termo"])) {
            error("Esperado operador matematico, operador relacional, 'faca', 'entao', 'fim', 'senao' ou ')', mas encontrado '" + cadeia + "'");
            varre(join("*", "/", Seguidores["termo"], seguidores));
            emPanico = true;

            if (simbolo in Primeiros["termo"]) {
                termo(seguidores);
            }
        }

        while (simbolo == "*" || simbolo == "/") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "fator"
            fator(join(seguidores, Seguidores["termo"]));

            if (simbolo != "*" && simbolo != "/" && !(simbolo in Seguidores["termo"])) {
                error("Esperado operador matematico, operador relacional, 'faca', 'entao', 'fim', 'senao' ou ')', mas encontrado '" + cadeia + "'");
                varre(join("*", "/", Seguidores["termo"], seguidores));
                emPanico = true;
                if (simbolo in Primeiros["termo"]) {
                    termo(join(seguidores));
                }
            }
        }
    }



    // Procedimento para a regra "fator"
    //   28. <fator>         ::= ident | numero_int | numero_real | ( <expressao> )
    //
    function fator(seguidores) {

        if (!(simbolo in {"@ident":0, "@numero_int":0, "@numero_real":0, "(":0})) {
            error("Esperado '(', identificador, numero inteiro ou numero real, mas encontrado '" + cadeia + "'");
            varre(join("@ident", "@numero_int", "@numero_real", "(", ";", seguidores));
            emPanico = true;
        }

        if (simbolo == "@ident") {
            obterSimbolo();
            emPanico = false;
        }
        else if (simbolo == "@numero_int") {
            obterSimbolo();
            emPanico = false;
        }
        else if (simbolo == "@numero_real") {
            obterSimbolo();
            emPanico = false;
        }
        else if (simbolo == "(") {
            obterSimbolo();
            emPanico = false;

            // Chama a regra "expressão"
            expressao(join(seguidores, Seguidores["fator"]));

            if (simbolo != ")") {
                error("Esperado ')' mas encontrado '" + cadeia + "'");
                varre(join(Seguidores["fator"], ")", seguidores));  // provavelmente seguidores de termos e etc tb
                emPanico = true;
            }
            if (simbolo == ")") {
                obterSimbolo();
                emPanico = false;
            }
        }
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