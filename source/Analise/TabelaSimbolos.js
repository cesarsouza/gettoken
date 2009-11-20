// Classe TabelaSimbolos
//   Implementação da tabela de símbolos como uma tabela hash (estrutura intrínseca do
//   JavaScript) juntamente com um vetor dinâmico para tratar os casos de colisão
//
function TabelaSimbolos() {

// TODO: Definir melhor o nome de todas as classes. Porque, por exemplo, temos
//   classe Token, classe Errors, clase Keywords, todas em ingles... mas também
//   temos classe Simbolo, classes Analisadores...

/*

 Estrutura teórica da tabela de símbolos (que é construida utilizando-se objetos)

   [chave] => [simbolo1,simbolo2,simbolo3]

 em que simbolo1, simbolo2 e simbolo3 possuem o mesmo nome identificador
 referido por chave

 por exemplo:

   [x] => [variavel inteira global de nome x, variavel real no procedimento 1 de nome x]
   [y] => [variavel real no procedimento 1 de nome y]
   [z] => [procedimento global z]
   [fibonacci] => [procedimento global com assinatura (a:inteiro) global de nome fibonacci]
   [a] => [variavel local no procedimento fibonacci de nome a]

*/


    // ************************************************************************
    // Variáveis Privadas
    // ************************************************************************


    // Estrutura de tabela implementada como Tabela Hash
    //  (objetos em JavaScript são internamente implementados como tabelas hash)
    var tabela = new Object();




    // ************************************************************************
    // Métodos públicos
    // ************************************************************************


    // Insere um Símbolo na tabela.
    //   Retorna true caso o simbolo tenha sido inserido com
    //   sucesso, e falso caso o simbolo ja estava na tabela
    this.inserir = function(simbolo) {

        trace("> tabelaSimbolos.inserir(" + simbolo + ")");

        // Pegamos o nome identificador do simbolo
        var cadeia = simbolo.getCadeia();

        // Verificamos primeiro se o símbolo não
        //   está na tabela.
        if (!this.verificar(simbolo)) {

            // O símbolo não está.
            // Verificamos se ja existe uma linha contendo
            //   outros símbolos que atendem pelo mesmo nome
            //   identificador do simbolo
            if (!tabela[cadeia]) {
                tabela[cadeia] = new Array();
            }

            // Insere o simbolo na linha da tabela
            tabela[cadeia].push(simbolo);

            //alert("inserido - " + s);

            return true;
        }
        else {
            return false; // O Simbolo ja estava na tabela.
        }
    }


    // Verifica se um simbolo está na tabela de símbolos e
    //   o retorna com todos seus atributos
    this.verificar = function(simbolo) {

        trace("> tabelaSimbolos.verificar(" + simbolo + ")");

        var cadeia = simbolo.getCadeia();

        // Verifica se há uma linha na tabela identificada
        //   pelo nome do simbolo
        if (!tabela[cadeia]) {
            return null;
        }
        else {
            // O nome do símbolo está na tabela. Iremos varrer
            //   a linha procurando por um símbolo que tenha os
            //   mesmos atributos do simbolo passado

            var index = this.procuraSimboloNaLinha(simbolo, cadeia);

            // Retorna o primeiro simbolo que casar com o que procuramos
            if (index >= 0) {
                return tabela[cadeia][index];
            }

            // Se não encontrou, retorna null
            return null;
        }
    }


    // Remove um símbolo da tabela de símbolos.
    this.remover = function(simbolo) {

        trace("> tabelaSimbolos.remover()");

        //alert("vamos remover o simbolo " + simbolo);

        // Passamos por todos os registros da tabela, removendo todos
        //   que tenham a categoria local e o nome do procedimento igual
        //   ao que passamos

        // Para cada linha da tabela
        for (var linha in tabela) {

            // Verifica se há simbolos que casam com o procurado
            var index = this.procuraSimboloNaLinha(simbolo, linha);

            // Enquanto houver simbolos que casem
            while (index >= 0) {

                // Remove este simbolo
                tabela[linha].splice(index, 1);

                // Verifica se há mais simbolos a remover
                index = this.procuraSimboloNaLinha(simbolo, linha);
            }
        }
    }

    // Procura um simbolo na linha e retorna seu indice.
    // Retorna -1 caso o símbolo não esteja na linha.
    this.procuraSimboloNaLinha = function(simbolo, linha) {

        trace("> tabelaSimbolos.procuraSimboloNaLinha()");

        // Para cada simbolo na linha
        for (var i in tabela[linha]) {
            var achou = true;

            if (simbolo.getCadeia() != undefined && simbolo.getCadeia() != tabela[linha][i].getCadeia()) {
                achou = false;
            }
            if (simbolo.getTipo() != undefined && simbolo.getTipo() != tabela[linha][i].getTipo()) {
                achou = false;
            }
            if (simbolo.getEscopo() != undefined && simbolo.getEscopo() != tabela[linha][i].getEscopo()) {
                achou = false;
            }
            if (simbolo.getCategoria() != undefined && simbolo.getCategoria() != tabela[linha][i].getCategoria()) {
                achou = false;
            }
            if (simbolo.getProcedimento() != undefined && simbolo.getProcedimento() != tabela[linha][i].getProcedimento()) {
                achou = false;
            }
            if (simbolo.getAssinatura() != undefined && simbolo.getAssinatura() != tabela[linha][i].getAssinatura()) {
                achou = false;
            }

            // Retorna o primeiro simbolo que casar com o que procuramos
            if (achou) {
                return i;
            }
        }

        return -1; // Se nao acharmos, retorna -1.
    }



    // Retorna uma representação em string da tabela de símbolos
    this.toString = function() {
        var texto = "Imprimindo tabela de simbolos\n\n";

        for (var l in tabela) {
            texto = texto + "Linha " + l + "\n";
            for (var s in tabela[l]) {
                texto = texto + "[" + s + "] - " + tabela[l][s] + "\n";
            }
            texto += "\n";
        }

        return texto;
    }
}
