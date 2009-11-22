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
                         //   (vetor contendo os tipos dos parametros)



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