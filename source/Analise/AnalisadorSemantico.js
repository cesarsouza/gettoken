// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Analisador Semântico
//  Esta classe é responsável por executar a etapa de análise semântica,
//  analisando a corretude na utilização de variáveis e reportando os
//  erros encontrados através da lista de erros em error()

function AnalisadorSemantico() {

    // Local de codigo sendo analisado (bloco principal, procedimento x, y)
    var local;

    // Nivel de escopo sendo analisado (0 (global), 1, 2)
    var escopo;

    // Lista de erros semânticos encontrados
    var error_list = new Array();

    // Tabela de identificadores
    var tabelaIdentificadores = new Array();

    // Tabela de procedimentos
    var tabelaProcedimentos = new Array();



    ///////////////////////////////////////////
    // Métodos públicos

    this.insereVariavel(id, tipo, valor) {
        if (!verificaVariavel(id))
            tabela[id] = {;
    }
    this.verificaVariavel(id) {
        return tabela.verifica(simbolo);
    }

}

// Classe TabelaSimbolos
//  Guarda os simbolos encontrados na análise semântica e realiza operações sobre
//  eles
function TabelaSimbolos() {

    ///////////////////////////////////////////
    // Métodos públicos

    this.insere(simbolo) {
        
    }

}