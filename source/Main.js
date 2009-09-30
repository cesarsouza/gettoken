// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------

var TRACE = true;
var DEBUG = true;


/// <reference path="Analise\AnalisadorLexico.js" />
/// <reference path="Analise\AnalisadorSintatico.js" />


include("source/Analise/Error.js");
include("source/Analise/Token.js");
include("source/Analise/Keywords.js");
include("source/Analise/AnalisadorLexico.js");
include("source/Analise/AnalisadorSintatico.js");



// Ponto de entrada para o analisador sintatico
function Main2(input) {

    var analisadorSintatico = new AnalisadorSintatico(input);

    // Efetua a análise sintática da entrada
    var success = analisadorSintatico.parse();

    if (success) {
        return "Analise concluida com sucesso";
    }
    else {
        var output = new String("Analise terminada com erros\n");
        var errors = analisadorSintatico.errors();

        for (i in errors) {
            output += errors[i].toString() + "\n";
        }

        // Removemos a última quebra de linha apenas para motivos de formatação
        output = output.substring(0, output.length - 1);

        // Ao finalizarmos a análise, retornamos sua saída.
        return output;
    }
}





// Ponto de entrada para o analisador lexico
function Main(input) {

    // Instanciamos um novo um analisador léxico
    var analisadorLexico = new AnalisadorLexico(input);

    var output = new String(); // Inicializamos o texto de saída
    var token = null;  // Inicializamos o token a ser lido com null


    do // Iniciamos a análise léxica na entrada
    {
        // Solicitamos o próximo token
        token = analisadorLexico.getToken();

        if (token != null) // reconhecemos
            output += token.toString() + "\n";

        // Verificamos se nos deparamos com algum erro não-tokenizável,
        //  como a ausência de delimitador final de comentários. O mais
        //  ideal seria retornar este tipo de erro num console separado.
        if (analisadorLexico.error() != null)
            output += analisadorLexico.error().toString() + "\n";

    } while (token != null);


    // Removemos a última quebra de linha apenas para motivos de formatação
    output = output.substring(0, output.length - 1);

    // Ao finalizarmos a análise, retornamos sua saída.
    return output;
}





// Função auxiliar para incluir os outros arquivos de script.
function include(file) {
    var scriptNode = document.createElement('script');
    scriptNode.type = 'text/javascript';
    scriptNode.src = file;
    document.getElementsByTagName("head")[0].appendChild(scriptNode);
}


// Função auxiliar para tracing - mensagens só serão exibidas
//   se a variável global TRACE estiver setada como true.
function trace(msg) {
    if (TRACE)
        alert(msg);
}

// Função auxiliar para debugging - mensagens só serão exibidas
//   se a variável global DEBUG estiver setada como true.
function debug(msg) {
    if (DEBUG)
        alert(msg);
}
