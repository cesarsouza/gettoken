// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------




///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVA��ES:
//
// ---------------------------------------------------------------------------------------
// 091106 - Erro que ainda n�o � capturado: Chamada de procedimento que tem par�metros mas
//          nenhum par�metro ou um n�mero menor � passado
//


// Classe Analisador Sem�ntico
//   Esta classe � respons�vel por executar a etapa de an�lise sem�ntica,
//   analisando a corretude na utiliza��o de vari�veis e reportando os
//   erros encontrados atrav�s da lista de erros em error()
//
function AnalisadorSemantico() {

    // Lista de erros encontrados
    var erros = new Array();

    // Tabelas de s�mbolos
    var tabelaSimbolos = new Symbols();

    // Analisador sem�ntico implementado como uma m�quina de estados para
    //  facilitar o processamento
    var estado = 0;

    var procedimento = "";
    var posicao = 0;
    var variaveis = undefined;
    var cadeia = "";
    var tipo = "";
    var erroTipo = false;

    // Variavel booleana que sinaliza ao analisador se ele deve ou n�o relatar certos erros
    //   (como na situa��o em que um procedimento n�o foi declarado, e cada par�metro seria
    //   considerado um erro)
    var ignorar = false;


    ///////////////////////////////////////////
    // M�todos p�blicos

    // Empilha um erro no vetor de erros
    this.error = function(mensagem) {
        if (!ignorar) {
            erros.push(mensagem);
        }
    }

    // Retorna o vetor de erros sem�nticos encontrados
    this.errors = function() {
        return erros;
    }


    // M�todos que indicam qual vari�vel ou procedimento est� sendo processado pelo analisador
    this.setCadeia = function(cadeia) { this.cadeia = cadeia; }
    this.getCadeia = function() { return this.cadeia; }

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
                posicao = 0;
                break;
            default:
                break;
        }
        variaveis = new Array();
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
        posicao = 0;
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



    // Insere um simbolo na tabela de s�mbolos
    this.inserir = function(simbolo) {

        var v = new Simbolo(simbolo);

        switch (estado) {
            case 0:
            case 2:
                if (!tabelaSimbolos.verificar(v)) {
                    if (!tabelaSimbolos.inserir(v)) {
                        this.error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
                        return false;
                    }
                }
                else {
                    this.error("Erro na declaracao do procedimento '" + v.getCadeia() + "' - ja declarado.");
                    return false;
                }
                return true;
                break;

            case 1:
            case 3:
            case 4:
                if (estado == 1) {
                    v.setCategoria("global");
                }
                if (estado == 3) {
                    v.setPosicao(posicao++);
                    v.setCategoria("parametro");
                    v.setProcedimento(this.procedimento);
                }
                if (estado == 4) {
                    v.setCategoria("local");
                    v.setProcedimento(this.procedimento);
                }

                if (v.getCadeia() != undefined) {
                    variaveis.push(v);
                }
                else if (v.getTipo() != undefined) {
                    var v2 = new Variavel();
                    posicao--;
                    for (var c in variaveis) {
                        v2.setCadeia(variaveis[c].getCadeia());
                        v2.setProcedimento(variaveis[c].getProcedimento());
                        if (tabelaSimbolos.verificar(v2)) {
                            this.error("Erro na declaracao da variavel '" + v2.getCadeia() + "' - ja declarada.");
                        }
                        else {
                            v2.setTipo(v.getTipo());
                            v2.setCategoria(variaveis[c].getCategoria());
                            v2.setPosicao(variaveis[c].getPosicao());
                            tabelaSimbolos.inserir(v2);
                        }
                    }
                }
                return true; // exceto em caso de erro
                break;

        }

    }

    this.verificar = function(variavel) {

        var v = new Variavel(variavel);

        switch (estado) {
            case 0:
            case 1:
            case 2:
                if (tabelaSimbolos.verificar(v)) {
                    //error("Variavel '" + v.getCadeia() + "' ja declarada.");
                    return false;
                }
                break;
            case 3:
            case 4:
                v.setProcedimento(this.procedimento);
                if (tabelaSimbolos.verificar(v)) {
                    //error("Variavel '" + v.getCadeia() + "' ja declarada.");
                    return false;
                }
                break;
            case 5:
            case 7:
            case 8:
                v.setProcedimento(this.procedimento);
                w = tabelaSimbolos.verificar(v);
                if (!w) {
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
                    // Verifica se todas as variaveis que chegam t�m o mesmo tipo
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
                    var temp = new Variavel({"tipo":w.getTipo(), "procedimento":this.procedimento, "posicao":posicao++});

                    if (!tabelaSimbolos.verificar(temp)) {
                        this.error("Parametro " + w.getCadeia() + " incorreto.");
                    }
                }

                return w;
                break;
            case 6:
            case 9:
            case 10:
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
                    // Verifica se todas as variaveis que chegam t�m o mesmo tipo
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
// checar se nos estados 7 e 9 isso tamb�m n�o acontece!!!
                    if (w.getTipo() == undefined) {
                        w.setTipo("invalid");
                    }
////////////////////////////////////////////////////////////////////////////////////////////
                    var temp = new Variavel({"tipo":w.getTipo(), "procedimento":this.procedimento, "posicao":posicao++});

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
        }

    }

    this.remover = function(variavel) {
        var v = new Variavel(variavel);
        tabelaSimbolos.remover(v);
    }

    this.imprimir = function() {
        alert(tabelaSimbolos);
    }

    this.toString = function() {
        return tabelaSimbolos;
    }

}

