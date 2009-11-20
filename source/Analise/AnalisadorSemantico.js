// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------
//
///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVA��ES:
//
// ---------------------------------------------------------------------------------------
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
/*

    Implementa��o do analisador sem�ntico como m�quina de estados:

        Esta implementa��o consiste de 11 estados, cada um correspondendo a uma
        das partes do programa fonte. As transi��es entre cada estado s�o feitas
        atrav�s de chamadas dos m�todos desta classe, como "iniciarDeclaracao",
        "iniciarProcedimento", etc.

        Descri��o de cada estado:
        0 - In�cio (declara��o do nome do programa)
        1 - Declara��o de vari�veis globais
        2 - Declara��o de procedimentos
        3 - Declara��o de par�metros de procedimentos
        4 - Declara��o de vari�veis locais � procedimentos
        5 - Corpo do procedimento
        6 - Corpo do programa
        7 - Comando le/escreve dentro de procedimento
        8 - Chamada de procedimento dentro de procedimento
        9 - Comando le/escreve
        10 - Chamada de procedimento

*/

function AnalisadorSemantico() {

    // Lista de erros encontrados
    var erros = new Array();

    // Tabelas de s�mbolos
    var tabelaSimbolos = new Symbols();

    // Analisador sem�ntico implementado como uma m�quina de estados para facilitar o processamento
    var estado = 0;

    var procedimento = "";
    var cadeia = "";
    var tipo = "";
    var variaveis = undefined;
    var assinatura = undefined;
    var erroTipo = false;

    // Variaveis usadas na checagem de arumentos de procedimentos
    var procedimentoAtual;
    var argumentoAtual;
    var numeroEncontrado;

    // Linha atual da an�lise sint�tica
    var linha;

    // Variavel booleana que sinaliza ao analisador se ele deve ou n�o relatar certos erros
    //   (como na situa��o em que um procedimento n�o foi declarado, e cada par�metro seria
    //   considerado um erro)
    var ignorar = false;


    /////////////////////////////////////////////
    // M�todos p�blicos

    // Atribui a linha atual da an�lise sint�tica
    this.setLinha = function(linha) {
        this.linha = linha;
    }

    // Empilha um erro no vetor de erros
    this.error = function(mensagem) {
        if (!ignorar) {
            var error = new Error(mensagem, this.linha, "semantico");
            erros.push(error);
        }
    }

    // Retorna o vetor de erros sem�nticos encontrados
    this.errors = function() {
        return erros;
    }

    // M�todos que indicam qual vari�vel est� sendo processado pelo analisador
    this.setCadeia = function(cadeia) { this.cadeia = cadeia; }
    this.getCadeia = function() { return this.cadeia; }

    // M�todos que indicam qual procedimento est� sendo processado pelo analisador
    this.setProcedimento = function(procedimento) { this.procedimento = procedimento; }
    this.getProcedimento = function() { return this.procedimento; }

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
            default:
                break;
        }
        ignorar = false;
        variaveis = new Array();
    }

    this.iniciarProcedimento = function() {
        switch (estado) {
            case 0:
            case 1:
            case 5:
                estado = 2;
                break;
            default:
                break;
        }
    }

    this.iniciarParametros = function() {
        switch (estado) {
            case 2:
                estado = 3;
                break;
            default:
                break;
        }
        variaveis = new Array();
        //assinatura = new Array();
        if (procedimentoAtual.getAssinatura() == undefined) {
            procedimentoAtual.setAssinatura(new Array());
        }
    }

    this.iniciarLeEscreve = function() {
        switch (estado) {
            case 5:
                estado = 7;
                break;
            case 6:
                estado = 9;
            default:
                break;
        }
        tipo = "";
        erroTipo = false;
    }

    this.terminarLeEscreve = function() {
        switch (estado) {
            case 7:
                estado = 5;
                break;
            case 9:
                estado = 6;
            default:
                break;
        }
        if (erroTipo) {
            this.error("Parametros com tipos diferentes.");
        }
    }

    this.iniciarChamada = function() {
        switch (estado) {
            case 5:
                estado = 8;
                break;
            case 6:
                estado = 10;
            default:
                break;
        }
        argumentoAtual = 0;
        numeroEncontrado = 0;
    }

    this.terminarChamada = function() {
        switch (estado) {
            case 8:
                estado = 5;
                break;
            case 10:
                estado = 6;
            default:
                break;
        }
        if (procedimentoAtual && numeroEncontrado != procedimentoAtual.getAssinatura().length) {
            this.error("Numero de argumentos incorreto.");
        }
    }

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



    // Insere um simbolo na tabela de s�mbolos
    // Retorna o s�mbolo inserido em caso de sucesso ou null em caso de falha
    this.inserir = function(simbolo) {

        trace("> analisadorSemantico.inserir()");

        var v = new Simbolo(simbolo);

        switch (estado) {
            // Declara��o do nome do programa ou declara��o de nome de procedimento
            case 0:
            case 2:
                if (estado == 2) {
                    procedimentoAtual = v;
                }
                if (!tabelaSimbolos.inserir(v)) {
                    this.error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
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
                    v.setProcedimento(this.procedimento.getCadeia());
                }
                if (estado == 4) {
                    v.setEscopo("local");
                    v.setProcedimento(this.procedimento.getCadeia());
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
                            this.error("Erro na declaracao da variavel '" + v2.getCadeia() + "' - ja declarada.");
                            return null;
                        }
                        else {
                            v2.setEscopo(variaveis[c].getEscopo());
                            v2.setTipo(v.getTipo());
                            v2.setCategoria(variaveis[c].getCategoria());
                            tabelaSimbolos.inserir(v2);
                            if (estado == 3 && procedimentoAtual) {
                                procedimentoAtual.getAssinatura().push(v.getTipo());
                            }
                        }
                    }
                }
                return v;
                break;

        }

    }

    this.verificar = function(variavel) {

        trace("> analisadorSemantico.verificar()");

        var v = new Simbolo(variavel);

        switch (estado) {
            case 5:
            case 7:
            case 8:

                // Se estamos em uma chamada de fun��o, incrementamos o n�mero de argumentos encontrados,
                //   sejam eles v�lidos ou n�o
                if (estado == 8) {
                    numeroEncontrado++;
                }

                v.setProcedimento(this.procedimento.getCadeia());
                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    v.setEscopo("global");
                    v.setProcedimento(undefined);
                    // Primeiro, verificamos se o s�mbolo est� definido
                    w = tabelaSimbolos.verificar(v);
                    if (!w) {
                        if (v.getCategoria() == "procedimento") {
                            this.error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                            ignorar = true;
                        }
                        else {
                            this.error("Variavel '" + v.getCadeia() + "' nao declarada.");
                        }
                        return false;
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
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoAtual && w.getTipo() != procedimentoAtual.getAssinatura()[argumentoAtual++]) {
                        this.error("Parametro " + w.getCadeia() + " incorreto. Esperado valor " + procedimentoAtual.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
                    }
                    numeroEncontrado++;

                }

                return w;
                break;
            case 6:
            case 9:
            case 10:

                // Se estamos em uma chamada de fun��o, incrementamos o n�mero de argumentos encontrados,
                //   sejam eles v�lidos ou n�o
                if (estado == 10) {
                    numeroEncontrado++;
                }

                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    if (v.getCategoria() == "procedimento") {
                        this.error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                        ignorar = true;
                    }
                    else {
                        this.error("Variavel '" + v.getCadeia() + "' nao declarada.");
                    }
                    return false;
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

////////////////////////////////////////////////////////////////////////////////////////////
// se n�o tivesse isto, constru��es como p1(p1); seriam v�lidas
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoAtual && w.getTipo() != procedimentoAtual.getAssinatura()[argumentoAtual++]) {
                        this.error("Parametro " + w.getCadeia() + " incorreto. Esperado valor " + procedimentoAtual.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
                    }

                }

                return w;
                break;

        }

    }

    this.variavel = function(variavel) {

        switch (estado) {
            case 1:
            case 3:
            case 4:
                return this.inserir(variavel);
                break;
            case 5:
            case 6:
            case 7:
            case 9:
                return this.verificar(variavel);
                break;
            default:
                break;
        }

    }

    this.remover = function(variavel) {
        var v = new Simbolo(variavel);
        tabelaSimbolos.remover(v);
    }

    this.imprimir = function() {
        alert(tabelaSimbolos);
    }

    this.toString = function() {
        return tabelaSimbolos;
    }

}

