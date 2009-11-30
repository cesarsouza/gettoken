// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------
//


// Classe Analisador Semântico
//   Esta classe é responsável por executar a etapa de análise semântica,
//   analisando a corretude na utilização de variáveis e reportando os
//   erros encontrados através da lista de erros em error()
//
//   Implementação do analisador semântico como máquina de estados:
//
//     Esta implementação consiste de 11 estados, cada um correspondendo a uma
//      das partes do programa fonte. As transições entre cada estado são feitas
//      através de chamadas dos métodos desta classe, como "iniciarDeclaracao",
//      "iniciarProcedimento", etc.
//
//     Descrição de cada estado:
//      0 - Início (declaração do nome do programa)
//      1 - Declaração de variáveis globais
//      2 - Declaração de procedimentos
//      3 - Declaração de parâmetros de procedimentos
//      4 - Declaração de variáveis locais à procedimentos
//      5 - Corpo do procedimento
//      6 - Corpo do programa
//      7 - Comando le/escreve dentro de procedimento
//      8 - Chamada de procedimento dentro de procedimento
//      9 - Comando le/escreve
//     10 - Chamada de procedimento
//
//
function AnalisadorSemantico() {


    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    // Lista de erros encontrados
    var error_list = new Array();

    // Tabela de símbolos
    var tabelaSimbolos = new TabelaSimbolos();

    // O analisador semântico é implementado como uma máquina de estados
    //   para facilitar o processamento. Estado indicado pela variavel abaixo.
    var estado = 0;

    var tipo = "";
    var variaveis = undefined;
    var erroTipo = false;

    // Variaveis usadas na checagem de argumentos de procedimentos
    var simboloAtual;        // seria o simbolo que estamos processando
    var procedimentoAtual;   // procedimento atual seria o escopo atual
    
    var procedimentoChamado; // seria o procedimento que estamos chamando
    var argumentoAtual;      // argumento que estamos processando
    var numeroEncontrado;    // numero de argumentos encontrados na chamada
                             //   do procedimento que estamos analisando

    // Linha atual da análise sintática (para gerar erros na linha correta)
    var linha = 0;

    // Variavel booleana que sinaliza ao analisador se ele deve ou não relatar certos erros
    //   (como na situação em que um procedimento não foi declarado, e cada parâmetro seria
    //   considerado um erro)
    var ignorar = false;




    // ************************************************************************
    // Métodos Privados
    // ************************************************************************

    // Empilha um erro no vetor de erros
    function error(mensagem) {
        if (!ignorar) {
            var error = new Error(mensagem, linha, "semantico");
            error_list.push(error);
        }
    }



    // ************************************************************************
    // Métodos públicos
    // ************************************************************************


    // Atribui a linha atual da análise sintática
    this.setLinha = function(lin) { linha = lin; }

    // Retorna a lista de erros encontrados durante a análise.
    this.errors = function() { return error_list; }



    // Métodos que indicam qual símbolo está sendo processado pelo analisador
    this.setSimbolo = function(simbolo) { simboloAtual = simbolo; }
    this.getSimbolo = function() { return simboloAtual; }

    // TODO: Onde deveria ser setado quem é o procedimento atual? Acho que esta
    //  faltando esta instrucao... Sera q removemos por engano?
    this.setProcedimentoAtual = function(simbolo) { procedimentoAtual = simbolo; }
    this.getProcedimentoAtual = function() { return procedimentoAtual; }


   
    // Transições da máquina de estados
    // ------------------------------------------------------------------------

    // Transição dc_v da máquina de estados
    this.iniciarDeclaracao = function() {
        switch (estado) {
            case 0:
            case 1:
                estado = 1;
                break;
            case 2:
            case 3:
                estado = 4;
                break;
        }
        ignorar = false;
        variaveis = new Array();
    }

    // Transição dc_p da máquina de estados
    this.iniciarProcedimento = function() {
        switch (estado) {
            case 0:
            case 1:
            case 5:
                estado = 2;
                break;
        }
    }

    // Transição dc_param da máquina de estados
    this.iniciarParametros = function() {
        switch (estado) {
            case 2:
                estado = 3;
                break;
        }
        variaveis = new Array();
        if (simboloAtual.getAssinatura() == undefined) {
            simboloAtual.setAssinatura(new Array());
        }
    }

    // Transição le/escreve da máquina de estados
    this.iniciarLeEscreve = function() {
        switch (estado) {
            case 5:
                estado = 7;
                break;
            case 6:
                estado = 9;
        }
        tipo = "";
        erroTipo = false;
    }

    // Transição terminar_le/escreve da máquina de estados
    this.terminarLeEscreve = function() {
        switch (estado) {
            case 7:
                estado = 5;
                break;
            case 9:
                estado = 6;
        }
        if (erroTipo) {
            error("Parametros com tipos diferentes.");
        }
    }

    // Transição iniciar_chamada da máquina de estados
    this.iniciarChamada = function() {
        switch (estado) {
            case 5:
                estado = 8;
                break;
            case 6:
                estado = 10;
        }
        
        // Estamos iniciando uma chamada
        argumentoAtual = 0;
        numeroEncontrado = 0;
        
        // Iremos chamar o simbolo atual
        procedimentoChamado = simboloAtual;

        // Se o identificador que iniciou a chamada não existe
        if (!simboloAtual) {
            // devemos ignorar os próximos erros
            ignorar = true;
        }
    }

    // Transição terminar_chamada da máquina de estados
    this.terminarChamada = function() {
        switch (estado) {
            case 8:
                estado = 5;
                break;
            case 10:
                estado = 6;
        }
        if (procedimentoChamado && procedimentoChamado.getAssinatura() != undefined &&
            numeroEncontrado != procedimentoChamado.getAssinatura().length) {
            error("Numero de argumentos na chamada do procedimento '" +  procedimentoChamado.getCadeia() +
                "' incorreto - esperados " + procedimentoChamado.getAssinatura().length + " argumentos " +
                "mas encontrados " + numeroEncontrado + ".");
        }
    }

    // Transição iniciar_corpo da máquina de estados
    this.iniciarCorpo = function() {
        switch (estado) {
            case 0:
            case 1:
            case 5:
                estado = 6;
                break;
            case 2:
            case 3:
            case 4:
                estado = 5;
                break;
        }
        ignorar = false;
    }


    // Métodos de acesso a tabela de símbolos
    // ------------------------------------------------------------------------


    // Insere um simbolo na tabela de símbolos
    //   Retorna o símbolo inserido em caso de sucesso ou null em caso de falha
    this.inserir = function(simbolo) {

        var v = new Simbolo(simbolo);

        switch (estado) {
            // Declaração do nome do programa ou declaração de nome de procedimento
            case 0:
            case 2:
                if (estado == 2) {
                    simboloAtual = v;
                }
                v.setEscopo(null);
                if (!tabelaSimbolos.inserir(v)) {
                    error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
                    return null;
                }
                return v;
                break;

            // Declaração de variáveis globais, parâmetros ou variáveis locais
            case 1:
            case 3:
            case 4:
                if (estado == 1) {
                    v.setEscopo(null);
                }
                if (estado == 3) {
                    v.setCategoria("parametro");
                    v.setEscopo(simboloAtual.getCadeia());
                }
                if (estado == 4) {
                    v.setEscopo(simboloAtual.getCadeia());
                }

                // Se estamos na fase de declaração de variáveis ou declaração de parâmetros,
                //   e veio um símbolo que tem somente a cadeia definida, então guardamos
                //   esse símbolo em uma lista temporária
                if (v.getCadeia() != undefined) {
                    variaveis.push(v);
                }
                
                // Quando encontramos um tipo, inserimos todas as variáveis que foram
                //   guardadas anteriormente, com o tipo que encontramos agora
                else if (v.getTipo() != undefined) {
                    for (var c in variaveis) {
                        var v2 = new Simbolo();
                        v2.setCadeia(variaveis[c].getCadeia());
                        v2.setEscopo(variaveis[c].getEscopo());
                        
                        if (tabelaSimbolos.verificar(v2)) {
                            error("Erro na declaracao da variavel '" + v2.getCadeia() + "' - ja declarada.");
                            return null;
                        }
                        else {
                            v2.setEscopo(variaveis[c].getEscopo());
                            v2.setTipo(v.getTipo());
                            v2.setCategoria(variaveis[c].getCategoria());
                            tabelaSimbolos.inserir(v2);
                            if (estado == 3 && simboloAtual) {
                                simboloAtual.getAssinatura().push(v.getTipo());
                            }
                        }
                    }
                }
                return v;
                break;

        }
    }

    // Verifica se um símbolo está atualmente na tabela de símbolos.
    //   Retorna o símbolo, se encontrado, ou null, caso não encontrado.
    this.verificar = function(variavel) {

        var v = new Simbolo(variavel);

        switch (estado) {

            // Verificações de variáveis feitas dentro de procedimentos
            case 5:
            case 7:
            case 8:

                // Se estamos em uma chamada de função, incrementamos o número de argumentos encontrados,
                //   sejam eles válidos ou não
                if (estado == 8) {
                    numeroEncontrado++;
                }

                //alert("verificando simbolo " + v + "\n\n" + tabelaSimbolos);

                // Primeiro, verificamos se o símbolo está declarado dentro do escopo local
                if (procedimentoAtual != null)
                {
                   v.setEscopo(procedimentoAtual.getCadeia());
                   w = tabelaSimbolos.verificar(v);
                }
                
                // Caso não esteja, verificamos se ele está no escopo global                
                if (!w) {
                    v.setEscopo(null);
                    w = tabelaSimbolos.verificar(v);
                    
                    // Caso não esteja, temos um erro de símbolo não declarado
                    if (!w) {
                        error("Simbolo '" + v.getCadeia() + "' nao declarado.");
                        return null;
                    }
                }

                // Verifica se todas as variaveis utilizadas na leitura ou na escrita têm o mesmo tipo
                if (estado == 7) {
                    if (tipo == "") {
                        tipo = w.getTipo();
                    }
                    else {
                        if (tipo != w.getTipo()) {
                            erroTipo = true;
                        }
                    }
                }
                // Verifica se os parametros passados correspondem aos parâmetros formais
                else if (estado == 8) {

                    // Esta checagem impede que construções como p1(p1); sejam válidas
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoChamado && w.getTipo() != procedimentoChamado.getAssinatura()[argumentoAtual++]) {
                        if (procedimentoChamado.getAssinatura()[argumentoAtual - 1] != undefined) {
                            error("Parametro '" + w.getCadeia() + "' incorreto. Esperado valor " + procedimentoChamado.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
                        }
                    }
                }

                return w;
                break;

            // Verificações de variáveis feitas dentro do corpo principal do programa
            case 6:
            case 9:
            case 10:

                // Se estamos em uma chamada de função, incrementamos o número de argumentos encontrados,
                //   sejam eles válidos ou não
                if (estado == 10) {
                    numeroEncontrado++;
                }

                // Verificamos se o símbolo está declarado no escopo global
                w = tabelaSimbolos.verificar(v);
                
                // Caso não esteja, temos um erro de símbolo não declarado
                if (!w) {
                    error("Simbolo '" + v.getCadeia() + "' nao declarado.");
                    return null;
                }

                // Verifica se todas as variaveis utilizadas na leitura ou na escrita têm o mesmo tipo
                if (estado == 9) {
                    if (tipo == "") {
                        tipo = w.getTipo();
                    }
                    else {
                        if (tipo != w.getTipo()) {
                            erroTipo = true;
                        }
                    }
                }
                // Verifica se os parametros passados correspondem aos parâmetros formais
                else if (estado == 10) {

                    // Esta checagem impede que construções como "p1(p1);" sejam válidas
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoChamado && w.getTipo() != procedimentoChamado.getAssinatura()[argumentoAtual++]) {
                        if (procedimentoChamado.getAssinatura()[argumentoAtual - 1] != undefined) {
                            error("Parametro '" + w.getCadeia() + "' incorreto. Esperado valor " + procedimentoChamado.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
                        }
                    }

                }

                return w;
                break;
        }
    }


    // Este método verifica se o tipo do símbolo atual comporta uma atribuição
    //  do tipo passado como parâmetro, e adiciona uma mensagem de erro a lista
    //  de erros caso não sejam.
    this.compativel = function(tipo) {
       // alert("analisador semantico, line 329");
       // alert("simbolo atual: " + simboloAtual);
       // alert("tipo comparado: " + tipo);

        if (simboloAtual instanceof Simbolo &&
               simboloAtual.getTipo() == "inteiro" &&
               tipo == "real") {

            error("Atribuicao de valor real a variavel inteira '" + simboloAtual.getCadeia() + "'.");
        }
    }


    // Este método é chamado dentro da regra <variaveis> do analisador sintático.
    // Ele existe pois, dependendo da fase da análise semântica em que estamos (declarações ou
    //   verificações), a ação a ser tomada para o tratamento das variáveis é diferente.
    this.variavel = function(variavel) {
        switch (estado) {
            // Declaração de variáveis (inserção na tabela de símbolos)
            case 1:
            case 3:
            case 4:
                return this.inserir(variavel);
                break;
            // Verificação de variáveis (verificação na tabela de símbolos)
            case 5:
            case 6:
            case 7:
            case 9:
                return this.verificar(variavel);
                break;
        }
    }

    // Remove um símbolo da tabela de síbolos
    this.remover = function(variavel) {
        if (variavel instanceof Simbolo) {
            var v = new Simbolo({"escopo":variavel.getCadeia()});
            tabelaSimbolos.remover(v);
        }
    }

    // Imprime a tabela de símbolos (for debugging pourposes)
    this.imprimir = function() {
        alert(tabelaSimbolos);
    }

    // Converte a tabela de simbolos para uma representacao em string
    this.toString = function() {
        return tabelaSimbolos;
    }

}

