// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------
//
///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVAÇÕES:
//
// ---------------------------------------------------------------------------------------
//
// 091120 - Erro abaixo ecorrigido
//
// 091120 - Vide caso de teste abaixo: linha undefiend.
//
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

    var cadeia = "";
    var tipo = "";
    var variaveis = undefined;
    var erroTipo = false;

    // Variaveis usadas na checagem de argumentos de procedimentos
    var procedimentoAtual;
    var argumentoAtual;
    var numeroEncontrado;

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
    this.setLinha = function(l) { linha = l; }

    // Retorna a lista de erros encontrados durante a análise.
    this.errors = function() { return error_list; }


// TODO: Leo, onde é usado isto?

    // Métodos que indicam qual variável está sendo processado pelo analisador
    this.setCadeia = function(cadeia) { this.cadeia = cadeia; }
    this.getCadeia = function() { return this.cadeia; }

    // Métodos que indicam qual procedimento está sendo processado pelo analisador
    this.setProcedimento = function(procedimento) { procedimentoAtual = procedimento; }
    this.getProcedimento = function() { return procedimentoAtual; }


   // TODO: Estas seriam as transicoes?
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

    this.iniciarProcedimento = function() {
        switch (estado) {
            case 0:
            case 1:
            case 5:
                estado = 2;
                break;
        }
    }

    this.iniciarParametros = function() {
        switch (estado) {
            case 2:
                estado = 3;
                break;
        }
        variaveis = new Array();
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
        }
        if (erroTipo) {
            error("Parametros com tipos diferentes.");
        }
    }

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
    }

    this.terminarChamada = function() {
        switch (estado) {
            case 8:
                estado = 5;
                break;
            case 10:
                estado = 6;
        }
        if (procedimentoAtual && numeroEncontrado != procedimentoAtual.getAssinatura().length) {
            error("Numero de argumentos na chamada do procedimento '" +  procedimentoAtual.getCadeia() +
                "' incorreto - esperados " + procedimentoAtual.getAssinatura().length + " argumentos mas encontrados " +
                numeroEncontrado + ".");
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
    //   Retorna o símbolo inserido em caso de sucesso ou null em caso de falha
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
                    v.setEscopo("global");
                }
                if (estado == 3) {
                    v.setCategoria("parametro");
                    v.setProcedimento(procedimentoAtual.getCadeia());
                }
                if (estado == 4) {
                    v.setEscopo("local");
                    v.setProcedimento(procedimentoAtual.getCadeia());
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
                            error("Erro na declaracao da variavel '" + v2.getCadeia() + "' - ja declarada.");
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

    // Verifica se um símbolo está atualmente na tabela de símbolos.
    //   Retorna o símbolo, se encontrado, ou null, caso não encontrado.
    this.verificar = function(variavel) {

        trace("> analisadorSemantico.verificar()");

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

                // Primeiro, verificamos se o símbolo está declarado dentro do escopo local
                v.setProcedimento(procedimentoAtual.getCadeia());
                w = tabelaSimbolos.verificar(v);
                if (!w) {
                    // Caso não esteja, verificamos se ele está no escopo global
                    v.setEscopo("global");
                    v.setProcedimento(undefined);
                    w = tabelaSimbolos.verificar(v);
                    if (!w) {
                        // Caso não esteja, temos um erro de símbolo não declarado
                        if (v.getCategoria() == "procedimento") {
                            error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                            ignorar = true;
                        }
                        else {
                            error("Variavel '" + v.getCadeia() + "' nao declarada.");
                        }
                        return null;
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

                    // Esta checagem impede que construções como p1(p1); sejam válidas
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoAtual && w.getTipo() != procedimentoAtual.getAssinatura()[argumentoAtual++]) {
                        if (procedimentoAtual.getAssinatura()[argumentoAtual - 1] != undefined) {
                            error("Parametro '" + w.getCadeia() + "' incorreto. Esperado valor " + procedimentoAtual.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
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
                if (!w) {
                    // Caso não esteja, temos um erro de símbolo não declarado
                    if (v.getCategoria() == "procedimento") {
                        error("Procedimento '" + v.getCadeia() + "' nao declarado.");
                        ignorar = true;
                    }
                    else {
                        error("Variavel '" + v.getCadeia() + "' nao declarada.");
                    }
                    return null;
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

                    // Esta checagem impede que construções como "p1(p1);" sejam válidas
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }

                    if (procedimentoAtual && w.getTipo() != procedimentoAtual.getAssinatura()[argumentoAtual++]) {
                        if (procedimentoAtual.getAssinatura()[argumentoAtual - 1] != undefined) {
                            error("Parametro '" + w.getCadeia() + "' incorreto. Esperado valor " + procedimentoAtual.getAssinatura()[argumentoAtual - 1] + " mas encontrado valor " + w.getTipo() + ".");
                        }
                    }

                }

                return w;
                break;

        }

    }

    // TODO: o que isto faz?
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
        var v = new Simbolo(variavel);
        tabelaSimbolos.remover(v);
    }

    // Imprime a tabela de símbolos (for debugging pourposes)
    this.imprimir = function() {
        alert(tabelaSimbolos);
    }

    this.toString = function() {
        return tabelaSimbolos;
    }

}

