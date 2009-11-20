// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------
//
///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVAÇÕES:
//
// ---------------------------------------------------------------------------------------
// 091119 - O erro reportado abaixo já foi solucionado. Acredito que, de erros na análise
//          semântica, pegamos todos
//
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

        Descrição de cada estado:
        0 - Início (declaração do nome do programa)
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

    // Analisador semântico implementado como uma máquina de estados para facilitar o processamento
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

    // Linha atual da análise sintática
    var linha;

    // Variavel booleana que sinaliza ao analisador se ele deve ou não relatar certos erros
    //   (como na situação em que um procedimento não foi declarado, e cada parâmetro seria
    //   considerado um erro)
    var ignorar = false;


    /////////////////////////////////////////////
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



    // Insere um simbolo na tabela de símbolos
    // Retorna o símbolo inserido em caso de sucesso ou null em caso de falha
    this.inserir = function(simbolo) {

        trace("> analisadorSemantico.inserir()");

        var v = new Simbolo(simbolo);

        switch (estado) {
            // Declaração do nome do programa ou declaração de nome de procedimento
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

            // Declaração de variáveis globais, parâmetros ou variáveis locais
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

                // Se estamos em uma chamada de função, incrementamos o número de argumentos encontrados,
                //   sejam eles válidos ou não
                if (estado == 8) {
                    numeroEncontrado++;
                }

                v.setProcedimento(this.procedimento.getCadeia());
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
                    // Verifica se todas as variaveis utilizadas na leitura ou na escrita têm o mesmo tipo
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

                // Se estamos em uma chamada de função, incrementamos o número de argumentos encontrados,
                //   sejam eles válidos ou não
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
                    // Verifica se todas as variaveis utilizadas na leitura ou na escrita têm o mesmo tipo
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

