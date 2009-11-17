// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Analisador Sem�ntico
//   Esta classe � respons�vel por executar a etapa de an�lise sem�ntica,
//   analisando a corretude na utiliza��o de vari�veis e reportando os
//   erros encontrados atrav�s da lista de erros em error()

///////////////////////////////////////////////////////////////////////////////////////////////
//
// OBSERVA��ES:
//
// ---------------------------------------------------------------------------------------
// 091106 - Erro que ainda n�o � capturado: Chamada de procedimento que tem par�metros mas
//          nenhum par�metro ou um n�mero menor � passado
//



function AnalisadorSemantico() {

    // Lista de erros encontrados
    var erros = new Array();

    // Tabelas de s�mbolos
    var tabelaSimbolos = new TabelaSimbolos();

    // Analisador sem�ntico implementado como uma m�quina de estados para facilitar o processamento
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

    // Retorna o vetor de erros sem�nticos enconrados (� necess�rio retornar uma c�pia do
    //   vetor de erros pois este � resetado ap�s a chamada desta fun��o)
    this.erro = function() {
        var e;
        if (erros.length > 0) {
            e = erros;
            erros = new Array();
            return e;
        }
        return false;
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




    this.inserir = function(variavel) {

        var v = new Variavel(variavel);

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
                this.inserir(variavel);
                break;
            case 5:
            case 6:
            case 7:
            case 9:
                this.verificar(variavel);
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






// Classe TabelaSimbolos
//  Implementa��o da tabela de s�mbolos como uma tabela hash (estrutura intr�nseca do
//  JavaScript) juntamente com um vetor din�mico para tratar os casos de colis�o

function TabelaSimbolos() {

    var tabela = new Array();

    this.tabela = new Array();

    this.inserir = function(variavel) {
        var cadeia = variavel.getCadeia();
        if (!this.verificar(variavel)) {
            if (tabela[cadeia] == undefined) {
                tabela[cadeia] = new Vetor();
            }
            tabela[cadeia].inserir(variavel);
            return true;
        }
        else {
            //return "Erro na insercao da variavel '" + variavel.getCadeia() + "' - ja declarada" + "\n";;
            return false;
        }
    }

    this.verificar = function(variavel) {
        if (tabela[variavel.getCadeia()] == undefined) {
            for (var a in tabela) {
                var x = tabela[a].verificar(variavel);
                if (x) {
                    return x;
                }
            }
            return false;
        }
        else {
            return tabela[variavel.getCadeia()].verificar(variavel);
        }
    }

    this.remover = function(variavel) {
        // Passamos por todos os registros da tabela, removendo todos que tenham a categoria local
        // e o nome do procedimento igual ao que passamos
        for (var a in tabela) {
            tabela[a].remover(variavel);
        }
    }

    this.imprimir = function() {
        var texto = "Imprimindo tabela de simbolos\n\n";
        for (var o in tabela) {
            texto += "Linha " + o + "\n";
            texto += tabela[o] + "\n";
        }
        alert(texto);
    }

}

// Classe Vetor
//  Implementa��o de um vetor din�mico de s�mbolos. Conforme s�mbolos v�o sendo
//  inseridos o vetor cresce dinamicamente

function Vetor() {

    var vetor;
    var fim;

    vetor = new Array();
    fim = 0;

    this.inserir = function(variavel) {
        vetor[fim++] = new Variavel(variavel);
        return true;
    }

    this.verificar = function(variavel) {

        var achou;
        var i;

        for (i = fim - 1; i >= 0; i--) {

            achou = true;

            if (variavel.getCadeia() != undefined && vetor[i].getCadeia() != variavel.getCadeia()) {
                achou = false;
            }
            if (variavel.getTipo() != undefined && vetor[i].getTipo() != variavel.getTipo()) {
                achou = false;
            }
            if (variavel.getCategoria() != undefined && vetor[i].getCategoria() != variavel.getCategoria()) {
                achou = false;
            }
            if (variavel.getProcedimento() != undefined && vetor[i].getProcedimento() != variavel.getProcedimento()) {
                achou = false;
            }
            if (variavel.getPosicao() != undefined && vetor[i].getPosicao() != variavel.getPosicao()) {
                achou = false;
            }

            if (achou) {
                return vetor[i];
            }

        }
        // Se n�o encontrou, retorna undefined
        return undefined;
    }

    this.remover = function(variavel) {
        while (this.verificar(variavel)) {
            fim--;
            delete vetor[fim];
        }
        return true;
    }

    this.toString = function() {
        var saida = "";
        for (var i = 0; i < fim; i++) {
            saida = saida + vetor[i].toString() + "\n";
        }
        return saida;
    }

}


// Classe Variavel
//  Representa um s�mbolo que pode ser guardado na tabela de s�mbolos.

function Variavel(variavel) {
    var cadeia;          // identificador
    var tipo;            // inteiro, real, nome_programa, nome_procedimento
    var categoria;       // local, global, parametro
    var procedimento;    // apenas para par�metros e vari�veis locais - indica a
                         //   qual procedimento a vari�vel pertence
    var posicao;         // apenas para parametros - representa a posi��o em que
                         //   o par�metro � declarado

    if (variavel != undefined) {
        if (typeof(variavel) == "object") {
            // Checamos se a variavel 'variavel' � um objeto Variavel (se o m�todo getCadeia
            //  for definido, ent�o �)
            if (variavel.getCadeia != undefined) {
                this.cadeia        = variavel.getCadeia();
                this.tipo          = variavel.getTipo();
                this.categoria     = variavel.getCategoria();
                this.procedimento  = variavel.getProcedimento();
                this.posicao       = variavel.getPosicao();
            }
            // Caso contr�rio, � um array
            else {
                this.cadeia       = variavel["cadeia"];
                this.tipo         = variavel["tipo"];
                this.categoria    = variavel["categoria"];
                this.procedimento = variavel["procedimento"];
                this.posicao      = variavel["posicao"];                
            }
        }
        else if (typeof(variavel) == "string") {
            this.cadeia = variavel;
        }
    }

    this.setCadeia       = function(cadeia)       { this.cadeia       = cadeia; }
    this.setTipo         = function(tipo)         { this.tipo         = tipo; }
    this.setCategoria    = function(categoria)    { this.categoria    = categoria; }
    this.setProcedimento = function(procedimento) { this.procedimento = procedimento; }
    this.setPosicao      = function(posicao)      { this.posicao      = posicao; }
    
    this.getCadeia       = function() { return this.cadeia; }
    this.getTipo         = function() { return this.tipo; }
    this.getCategoria    = function() { return this.categoria; }
    this.getProcedimento = function() { return this.procedimento; }
    this.getPosicao      = function() { return this.posicao; }

    this.toString = function() {
        return "cadeia = " + this.cadeia +
            "   tipo = " + this.tipo +
            "   categoria = " + this.categoria +
            "   procedimento = " + this.procedimento +
            "   posicao = " + this.posicao;
    }

}