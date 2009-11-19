// Classe TabelaSimbolos
//  Implementação da tabela de símbolos como uma tabela hash (estrutura intrínseca do
//  JavaScript) juntamente com um vetor dinâmico para tratar os casos de colisão
//
function Symbols() {

 /*
 
 [chave][simbolo1,simbolo2,simbolo3]
 
 em que simbolo1, simbolo2 e simbolo3 possuem o mesmo nome identificador
 referido por chave
 
 por exemplo
 
 [x][variavel inteira global de nome x, variavel real no procedimento 1 de nome x]
 [y][variavel real no procedimento 1 de nome y]
 [z][procedimento global z]
 
 */

    var tabela = new Object();

    // Insere um Símbolo na tabela.
    //  Retorna true caso o simbolo tenha sido inserido com
    //  sucesso, e falso caso o simbolo ja estava na tabela
    this.inserir = function(simbolo) {

        trace("> tabelaSimbolos.inserir(" + simbolo + ")");

//        var s = new Simbolo(simbolo);

        // Pegamos o nome identificador do simbolo
        var cadeia = simbolo.getCadeia();
        
        // Verificamos primeiro se o símbolo não
        //  está na tabela.
        if (!this.verificar(simbolo)) {

            // O símbolo não está.
            // Verificamos se ja existe uma linha contendo
            //  outros símbolos que atendem pelo mesmo nome
            //  identificador do simbolo 
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

        //alert("Verificando simbolo " + simbolo);

        var cadeia = simbolo.getCadeia();

        // Verifica se há uma linha na tabela identificada
        //   pelo nome do simbolo
        if (!tabela[cadeia]) {
            return null;
        }
        else {
            // O nome do símbolo está na tabela. Iremos varrer
            //  a linha procurando por um símbolo que tenha os
            //  mesmos atributos do simbolo passado 

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

        // alert("vamos remover o simbolo " + simbolo);
        // Passamos por todos os registros da tabela, removendo todos
        //  que tenham a categoria local e o nome do procedimento igual
        //  ao que passamos
        
        // Para cada linha da tabela
        for (var linha in tabela) {

            // Verifica se há simbolos que casam com o procurado
            var index = this.procuraSimboloNaLinha(simbolo, linha);

            // Enquanto houver simbolos que casem
            while (index >= 0) {

                //alert("linha " + linha + ", " + index + "\n\n" + this);

                // Remove este simbolo
                tabela[linha].splice(index, 1);

                // Verifica se há mais simbolos a remover
                index = this.procuraSimboloNaLinha(simbolo, linha);
            }
        }
    }

    // Modifica uma entrada de procedimento, inserindo sua assinatura (lista de tipos dos parâmetros)
    this.insereAssinatura = function(procedimento, assinatura) {
        var v = this.verificar(new Simbolo({"procedimento":procedimento, "categoria":"procedimento"}));
        v.setAssinatura(assinatura);
        alert("uou");
    }

    // Procura um simbolo na linha e retorna seu indice.
    //  Retorna -1 caso o símbolo não esteja na linha.
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



// Classe Simbolo
//  Representa um símbolo que pode ser guardado na tabela de símbolos.
//
function Simbolo(simbolo) {

    var cadeia;          // cadeia que identifica o simbolo
    var tipo;            // tipo do simbolo, como inteiro, real (se aplicável)
    var escopo;          // local ou global
    var categoria;       // variavel, parametro, programa, procedimento
    var procedimento;    // apenas para parâmetros e variáveis locais
                         //   indica a qual procedimento a variável pertence
    var assinatura;      // apenas para procedimentos
                         //   indica os tipos dos parametros do procedimento
                         //   vetor contendo os tipos dos parametros
                         

/*
    debug("simbolo instanceof Simbolo? " + (simbolo instanceof Simbolo) + "\n" +
        "simbolo instanceof Array? " + (simbolo instanceof Array) + "\n" +
        "simbolo instanceof String? " + (simbolo instanceof String) + "\n" +
        "simbolo instanceof Object? " + (simbolo instanceof Object));
*/

    // Determina o tipo do parametro "simbolo" para
    //  criarmos este objeto adequadamente
    //
    if (simbolo instanceof Simbolo) {
        // Checamos se a variavel 'simbolo' é um objeto Simbolo
        this.cadeia        = simbolo.cadeia;
        this.tipo          = simbolo.tipo;
        this.escopo        = simbolo.escopo;
        this.categoria     = simbolo.categoria;
        this.procedimento  = simbolo.procedimento;
        this.assinatura    = simbolo.assinatura;
    }
    
    else if (simbolo instanceof Object) {
        // Um array associativo é um objeto do tipo Object, e não do tipo Array
        this.cadeia       = simbolo["cadeia"];
        this.tipo         = simbolo["tipo"];
        this.escopo       = simbolo["escopo"];
        this.categoria    = simbolo["categoria"];
        this.procedimento = simbolo["procedimento"];
        this.assinatura   = simbolo["assinatura"];
     }
     
     else if (simbolo instanceof String) {
        // Caso seja uma string
        this.cadeia = simbolo;
     }
    

    // Métodos Públicos
    // ************************************************************************
    
    this.setCadeia       = function(cadeia)       { this.cadeia       = cadeia; }
    this.setTipo         = function(tipo)         { this.tipo         = tipo; }
    this.setEscopo       = function(escopo)       { this.escopo       = escopo; }
    this.setCategoria    = function(categoria)    { this.categoria    = categoria; }
    this.setProcedimento = function(procedimento) { this.procedimento = procedimento; }
    this.setAssinatura   = function(assinatura)   { this.assinatura   = assinatura; }
    
    this.getCadeia       = function() { return this.cadeia; }
    this.getTipo         = function() { return this.tipo; }
    this.getEscopo       = function() { return this.escopo; }
    this.getCategoria    = function() { return this.categoria; }
    this.getProcedimento = function() { return this.procedimento; }
    this.getAssinatura   = function() { return this.assinatura; }


    this.toString = function() {
        return "cadeia = " + this.cadeia +
            "   tipo = " + this.tipo +
            "   escopo = " + this.escopo +
            "   categoria = " + this.categoria +
            "   procedimento = " + this.procedimento +
            "   assinatura = " + this.assinatura;
    }

}