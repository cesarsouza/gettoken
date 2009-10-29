// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Analisador Sem�ntico
//  Esta classe � respons�vel por executar a etapa de an�lise sem�ntica,
//  analisando a corretude na utiliza��o de vari�veis e reportando os
//  erros encontrados atrav�s da lista de erros em error()

function AnalisadorSemantico() {

    // Local de codigo sendo analisado (bloco principal, procedimento x, y)
    var local;

    // Nivel de escopo sendo analisado (0 (global), 1, 2)
    var escopo;

    // Lista de erros sem�nticos encontrados
    var error_list = new Array();

    // Tabela de identificadores
    var tabelaIdentificadores = new Array();

    // Tabela de procedimentos
    var tabelaProcedimentos = new Array();



    ///////////////////////////////////////////
    // M�todos p�blicos

    this.insereVariavel(id, tipo, valor) {
        if (!verificaVariavel(id))
            tabela[id] = {;
    }
    this.verificaVariavel(id) {
        return tabela.verifica(simbolo);
    }

}

// Classe TabelaSimbolos
//  Guarda os simbolos encontrados na an�lise sem�ntica e realiza opera��es sobre
//  eles
function TabelaSimbolos() {

    ///////////////////////////////////////////
    // M�todos p�blicos

    this.insere(simbolo) {
        
    }

}