// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// A classe Error encompassa erros não tokenizáveis, como por exemplo,
//   final de arquivo não esperado encontrado ou delimitador direito
//   de comentário não encontrado. Durante a análise léxica, comentários
//   são simplesmente descartados, assim como espaços em branco, e não
//   constituem tokens.
//
function Error(mensagem, linha, fase) {

    var msg = mensagem;   // Mensagem do erro identificado
    var lin = linha;      // Linha em que aparece o erro
    var fas = fase;       // Fase da análise em que o erro ocorreu

    this.message = function() {
       return msg;
    }

    this.line = function() {
       return lin;
    }

    this.phase = function() { //TODO: acho que o termo correto é "step"
        return fase;
    }

    this.toString = function() {
        var mensagem = msg;

        if (!msg || msg == "")
            mensagem = "Erro desconhecido";

        return "Erro na linha " + lin + ": " + mensagem;
    }
}

