// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------
//
///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVA��ES:
//
// ---------------------------------------------------------------------------------------
//
// 091120 - Erro abaixo ecorrigido
//
// 091120 - Vide caso de teste abaixo: linha undefiend.
//
// 091119 - O erro reportado abaixo j� foi solucionado. Acredito que, de erros na an�lise
//          sem�ntica, pegamos todos
//
// 091106 - Erro que ainda n�o � capturado: Chamada de procedimento que tem par�metros mas
//          nenhum par�metro ou um n�mero menor � passado
//

// Classe Analisador Sem�ntico
//   Esta classe � respons�vel por executar a etapa de an�lise sem�ntica,
//   analisando a corretude na utiliza��o de vari�veis e reportando os
//   erros encontrados atrav�s da lista de erros em error()
//
//   Implementa��o do analisador sem�ntico como m�quina de estados:
//
//     Esta implementa��o consiste de 11 estados, cada um correspondendo a uma
//      das partes do programa fonte. As transi��es entre cada estado s�o feitas
//      atrav�s de chamadas dos m�todos desta classe, como "iniciarDeclaracao",
//      "iniciarProcedimento", etc.
//
//     Descri��o de cada estado:
//      0 - In�cio (declara��o do nome do programa)
//      1 - Declara��o de vari�veis globais
//      2 - Declara��o de procedimentos
//      3 - Declara��o de par�metros de procedimentos
//      4 - Declara��o de vari�veis locais � procedimentos
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
    // Vari�veis privadas
    // ************************************************************************

    // Lista de erros encontrados
    var error_list = new Array();

    // Tabela de s�mbolos
    var tabelaSimbolos = new TabelaSimbolos();

    // O analisador sem�ntico � implementado como uma m�quina de estados
    //   para facilitar o processamento. Estado indicado pela variavel abaixo.
    var estado = 0;

    var tipo = "";
    var variaveis = undefined;
    var erroTipo = false;

    // Variaveis usadas na checagem de argumentos de procedimentos
    var simboloAtual;
    var procedimentoAtual;
    var procedimentoChamado;
    var argumentoAtual;
    var numeroEncontrado;

    // Linha atual da an�lise sint�tica (para gerar erros na linha correta)
    var linha = 0;

    // Variavel booleana que sinaliza ao analisador se ele deve ou n�o relatar certos erros
    //   (como na situa��o em que um procedimento n�o foi declarado, e cada par�metro seria
    //   considerado um erro)
    var ignorar = false;




    // ************************************************************************
    // M�todos Privados
    // ************************************************************************

    // Empilha um erro no vetor de erros
    function error(mensagem) {
        if (!ignorar) {
            var error = new Error(mensagem, linha, "semantico");
            error_list.push(error);
        }
    }



    // ************************************************************************
    // M�todos p�blicos
    // ************************************************************************


    // Atribui a linha atual da an�lise sint�tica
    this.setLinha = function(l) { linha = l; }

    // Retorna a lista de erros encontrados durante a an�lise.
    this.errors = function() { return error_list; }



    // M�todos que indicam qual s�mbolo est� sendo processado pelo analisador
    this.setSimbolo = function(simbolo) { simboloAtual = simbolo; }
    this.getSimbolo = function() { return simboloAtual; }

    // M�todos que indicam qual procedimento est� sendo processado pelo analisador
    this.setProcedimento = function(procedimento) { procedimentoChamado = procedimento; }
    this.getProcedimento = function() { return procedimentoChamado; }

    this.getProcedimentoAtual = function() { return procedimentoAtual; }


   
    // Transi��es da m�quina de estados
    // ------------------------------------------------------------------------

    // Transi��o dc_v da m�quina de estados
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

    // Transi��o dc_p da m�quina de estados
    this.iniciarProcedimento = function() {
        switch (estado) {
            case 0:
            case 1:
            case 5:
                estado = 2;
                break;
        }
    }

    // Transi��o dc_param da m�quina de estados
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

    // Transi��o le/escreve da m�quina de estados
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

    // Transi��o terminar_le/escreve da m�quina de estados
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

    // Transi��o iniciar_chamada da m�quina de estados
    this.iniciarChamada = function() {
        switch (estado) {
            case 5:
                estado = 8;
                break;
            case 6:
                estado = 10;
        }
        argumentoAtual = 0;
        numeroEncontrado = 0;

        // Se o identificador que iniciou a chamada n�o existe, ignoramos os pr�ximos erros
        if (!simboloAtual) {
            ignorar = true;
        }
    }

    // Transi��o terminar_chamada da m�quina de estados
    this.terminarChamada = function() {
        switch (estado) {
            case 8:
                estado = 5;
                break;
            case 10:
                estado = 6;
        }
        if (procedimentoChamado && numeroEncontrado != procedimentoChamado.getAssinatura().length) {
            error("Numero de argumentos na chamada do procedimento '" +  procedimentoChamado.getCadeia() +
                "' incorreto - esperados " + procedimentoChamado.getAssinatura().length + " argumentos " +
                "mas encontrados " + numeroEncontrado + ".");
        }
    }

    // Transi��o iniciar_corpo da m�quina de estados
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


    // M�todos de acesso a tabela de s�mbolos
    // ------------------------------------------------------------------------


    // Insere um simbolo na tabela de s�mbolos
    //   Retorna o s�mbolo inserido em caso de sucesso ou null em caso de falha
    this.inserir = function(simbolo) {

        trace("> analisadorSemantico.inserir()");

        var v = new Simbolo(simbolo);

        switch (estado) {
            // Declara��o do nome do programa ou declara��o de nome de procedimento
            case 0:
            case 2:
                if (estado == 2) {
                    simboloAtual = v;
                }
                v.setEscopo("global");
                if (!tabelaSimbolos.inserir(v)) {
                    error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
                    return null;
                }
                return v;
                break;

            // Declara��o de vari�veis globais, par�metros ou vari�veis locais
            case 1:
            case 3:
            case 4:
                if (estado == 1) {
                    v.setEscopo("global");
                }
                if (estado == 3) {
                    v.setCategoria("parametro");
                    v.setProcedimento(simboloAtual.getCadeia());
                }
                if (estado == 4) {
                    v.setEscopo("local");
                    v.setProcedimento(simboloAtual.getCadeia());
                }

                // Se estamos na fase de declara��o de vari�veis ou declara��o de par�metros,
                //   e veio um s�mbolo que tem somente a cadeia definida, ent�o guardamos
                //   esse s�mbolo em uma lista tempor�ria
                if (v.getCadeia() != undefined) {
                    variaveis.push(v);
                }
                // Quando encontramos um tipo, inserimos todas as vari�veis que foram
                //   guardadas anteriormente, com o tipo que encontramos agora
                else if (v.getTipo() != undefined) {
                    for (var c in variaveis) {
                        var v2 = new Simbolo();
                        v2.setCadeia(variaveis[c].getCadeia());
                        v2.setProcedimento(variaveis[c].getProcedimento());
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

    // Verifica se um s�mbolo est� atualmente na tabela de s�mbolos.
    //   Retorna o s�mbolo, se encontrado, ou null, caso n�o encontrado.
    this.verificar = function(variavel) {

        trace("> analisadorSemantico.verificar()");

        var v = new Simbolo(variavel);

        switch (estado) {

            // Verifica��es de vari�veis feitas dentro de procedimentos
            case 5:
            case 7:
            case 8:

                // Se estamos em uma chamada de fun��o, incrementamos o n�mero de argumentos encontrados,
                //   sejam eles v�lidos ou n�o
                if (estado == 8) {
                    numeroEncontrado++;
                }

                // Primeiro, verificamos se o s�mbolo est� declarado dentro do escopo local
                v.setProcedimento(simboloAtual.getCadeia());
                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    // Caso n�o esteja, verificamos se ele est� no escopo global
                    v.setEscopo("global");
                    v.setProcedimento(undefined);
                    w = tabelaSimbolos.verificar(v);
                    if (!w) {
                        // Caso n�o esteja, temos um erro de s�mbolo n�o declarado

                        error("Simbolo '" + v.getCadeia() + "' nao declarado.");

/*
                        if (v.getCategoria() == "procedimento") {
                            error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                            ignorar = true;
                        }
                        else {
                            error("Variavel '" + v.getCadeia() + "' nao declarada.");
                        }
*/
                        return null;
                    }
                }

                if (estado == 7) {
                    // Verifica se todas as variaveis utilizadas na leitura ou na escrita t�m o mesmo tipo
                    if (tipo == "") {
                        tipo = w.getTipo();
                    }
                    else {
                        if (tipo != w.getTipo()) {
                            erroTipo = true;
                        }
                    }
                }
                else if (estado == 8) {
                    // Verifica se os parametros passados correspondem aos par�metros formais

                    // Esta checagem impede que constru��es como p1(p1); sejam v�lidas
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

            // Verifica��es de vari�veis feitas dentro do corpo principal do programa
            case 6:
            case 9:
            case 10:

                // Se estamos em uma chamada de fun��o, incrementamos o n�mero de argumentos encontrados,
                //   sejam eles v�lidos ou n�o
                if (estado == 10) {
                    numeroEncontrado++;
                }

                // Verificamos se o s�mbolo est� declarado no escopo global
                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    // Caso n�o esteja, temos um erro de s�mbolo n�o declarado

                    error("Simbolo '" + v.getCadeia() + "' nao declarado.");

/*
                    if (v.getCategoria() == "procedimento") {
                        error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                        ignorar = true;
                    }
                    else {
                        error("Variavel '" + v.getCadeia() + "' nao declarada.");
                    }
*/
                    return null;
                }

                if (estado == 9) {
                    // Verifica se todas as variaveis utilizadas na leitura ou na escrita t�m o mesmo tipo
                    if (tipo == "") {
                        tipo = w.getTipo();
                    }
                    else {
                        if (tipo != w.getTipo()) {
                            erroTipo = true;
                        }
                    }
                }
                else if (estado == 10) {
                    // Verifica se os parametros passados correspondem aos par�metros formais

                    // Esta checagem impede que constru��es como "p1(p1);" sejam v�lidas
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



    // Este m�todo � chamado dentro da regra <variaveis> do analisador sint�tico.
    // Ele existe pois, dependendo da fase da an�lise sem�ntica em que estamos (declara��es ou
    //   verifica��es), a a��o a ser tomada para o tratamento das vari�veis � diferente.
    this.variavel = function(variavel) {
        switch (estado) {
            // Declara��o de vari�veis (inser��o na tabela de s�mbolos)
            case 1:
            case 3:
            case 4:
                return this.inserir(variavel);
                break;
            // Verifica��o de vari�veis (verifica��o na tabela de s�mbolos)
            case 5:
            case 6:
            case 7:
            case 9:
                return this.verificar(variavel);
                break;
        }

    }

    // Remove um s�mbolo da tabela de s�bolos
    this.remover = function(variavel) {
        var v = new Simbolo(variavel);
        tabelaSimbolos.remover(v);
    }

    // Imprime a tabela de s�mbolos (for debugging pourposes)
    this.imprimir = function() {
        alert(tabelaSimbolos);
    }

    this.toString = function() {
        return tabelaSimbolos;
    }

}

