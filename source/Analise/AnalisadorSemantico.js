// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------




///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVAÇÕES:
//
// ---------------------------------------------------------------------------------------
// 091106 - Erro que ainda não é capturado: Chamada de procedimento que tem parâmetros mas
//          nenhum parâmetro ou um número menor é passado
//


// Classe Analisador Semântico
//   Esta classe é responsável por executar a etapa de análise semântica,
//   analisando a corretude na utilização de variáveis e reportando os
//   erros encontrados através da lista de erros em error()
//
/*

    Implementação do analisador semântico como máquina de estados:

        Esta implementação consiste de 11 estados, cada um correspondendo a uma
        das partes do programa fonte. As transições entre cada estado são feitas
        através de chamadas dos métodos desta classe, como "iniciarDeclaracao",
        "iniciarProcedimento", etc.

        0 - Início
        1 - Declaração de variáveis globais
        2 - Declaração de procedimentos
        3 - Declaração de parâmetros de procedimentos
        4 - Declaração de variáveis locais à procedimentos
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

    // Tabelas de símbolos
    var tabelaSimbolos = new Symbols();

    // Analisador semântico implementado como uma máquina de estados para
    //  facilitar o processamento
    var estado = 0;

    var procedimento = "";
    var cadeia = "";
    var tipo = "";
    var variaveis = undefined;
    var assinatura = undefined;
    var erroTipo = false;
    var procedimentoAtual;

    var linha = 0;              // Linha atual da análise sintática

    // Variavel booleana que sinaliza ao analisador se ele deve ou não relatar certos erros
    //   (como na situação em que um procedimento não foi declarado, e cada parâmetro seria
    //   considerado um erro)
    var ignorar = false;


    ///////////////////////////////////////////
    // Métodos públicos

    // Atribui a linha atual da análise sintática
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

    // Retorna o vetor de erros semânticos encontrados
    this.errors = function() {
        return erros;
    }


    // Métodos que indicam qual variável está sendo processado pelo analisador
    this.setCadeia = function(cadeia) { this.cadeia = cadeia; }
    this.getCadeia = function() { return this.cadeia; }

    // Métodos que indicam qual procedimento está sendo processado pelo analisador
    this.setProcedimento = function(procedimento) { this.procedimento = procedimento; }
    this.getProcedimento = function() { return this.procedimento; }


    this.iniciarDeclaracao = function() {
        ignorar = false;
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
    }

    this.iniciarCorpo = function() {
        ignorar = false;
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
    }



    // Insere um simbolo na tabela de símbolos
    this.inserir = function(simbolo) {

        trace("> analisadorSemantico.inserir()");

        var v = new Simbolo(simbolo);

        //alert(v);

        switch (estado) {
            case 0:
            case 2:
                if (estado == 2) { 
                    procedimentoAtual = v;
                }
                if (!tabelaSimbolos.inserir(v)) {
                    this.error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
                    return false;
                }
                return true;
                break;

            case 1:
            case 3:
            case 4:
                if (estado == 1) {
                    v.setEscopo("global");
                }
                if (estado == 3) {
                    v.setCategoria("parametro");
                    v.setProcedimento(this.procedimento);
                }
                if (estado == 4) {
                    v.setEscopo("local");
                    v.setProcedimento(this.procedimento);
                }

                if (v.getCadeia() != undefined) {
                    //alert("pushing - " + v);
                    variaveis.push(v);
                }
                else if (v.getTipo() != undefined) {
                    for (var c in variaveis) {
                        var v2 = new Simbolo();
                        v2.setCadeia(variaveis[c].getCadeia());
                        v2.setEscopo(variaveis[c].getEscopo());
                        v2.setProcedimento(variaveis[c].getProcedimento());
                        if (tabelaSimbolos.verificar(v2)) {
                            this.error("Erro na declaracao da variavel '" + v2.getCadeia() + "' - ja declarada.");
                        }
                        else {
                            v2.setTipo(v.getTipo());
                            v2.setCategoria(variaveis[c].getCategoria());
                            tabelaSimbolos.inserir(v2);
                            if (estado == 3) {
                                procedimentoAtual.getAssinatura().push(v.getTipo());
                            }
                        }
                    }
                }
                return true; // exceto em caso de erro
                break;

        }

    }

    this.verificar = function(variavel) {

        trace("> analisadorSemantico.verificar()");

        var v = new Simbolo(variavel);

        switch (estado) {
/*            case 0:
            case 1:
            case 2:
                if (tabelaSimbolos.verificar(v)) {
                    return false;
                }
                break;*/
            case 3:
            case 4:
                v.setProcedimento(this.procedimento);
                if (tabelaSimbolos.verificar(v)) {
                    return false;
                }
                break;
            case 5:
            case 7:
            case 8:
                v.setProcedimento(this.procedimento);
                //alert("verificando - " + v);
                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    v.setEscopo("global");
                    v.setProcedimento(undefined);
                    // Primeiro, verificamos se o símbolo está definido 
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
                    // Verifica se todas as variaveis que chegam têm o mesmo tipo
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
                    // Verifica se os parametros passados correspondem aos parâmetros formais
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }
                    var temp = new Simbolo({"tipo":w.getTipo(), "procedimento":this.procedimento});

                    if (!tabelaSimbolos.verificar(temp)) {
                        this.error("Parametro " + w.getCadeia() + " incorreto.");
                    }
                }

                return w;
                break;
            case 6:
            case 9:
            case 10:
                //v.setEscopo("global");
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
                    // Verifica se todas as variaveis que chegam têm o mesmo tipo
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
                    // Verifica se os parametros passados correspondem aos parâmetros formais
////////////////////////////////////////////////////////////////////////////////////////////
// se não tivesse isto, construções como p1(p1); seriam válidas
// checar se nos estados 7 e 9 isso também não acontece!!!
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }
////////////////////////////////////////////////////////////////////////////////////////////
                    var temp = new Simbolo({"tipo":w.getTipo(), "procedimento":this.procedimento});

                    //alert(temp);
                    //alert(tabelaSimbolos.verificar(temp));

                    if (!tabelaSimbolos.verificar(temp)) {
                        this.error("Parametro " + w.getCadeia() + " incorreto.");
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

