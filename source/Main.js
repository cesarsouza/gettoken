// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
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

    // Efetua a an�lise sint�tica da entrada
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

        // Removemos a �ltima quebra de linha apenas para motivos de formata��o
        output = output.substring(0, output.length - 1);

        // Ao finalizarmos a an�lise, retornamos sua sa�da.
        return output;
    }
}





// Ponto de entrada para o analisador lexico
function Main(input) {

    // Instanciamos um novo um analisador l�xico
    var analisadorLexico = new AnalisadorLexico(input);

    var output = new String(); // Inicializamos o texto de sa�da
    var token = null;  // Inicializamos o token a ser lido com null


    do // Iniciamos a an�lise l�xica na entrada
    {
        // Solicitamos o pr�ximo token
        token = analisadorLexico.getToken();

        if (token != null) // reconhecemos
            output += token.toString() + "\n";

        // Verificamos se nos deparamos com algum erro n�o-tokeniz�vel,
        //  como a aus�ncia de delimitador final de coment�rios. O mais
        //  ideal seria retornar este tipo de erro num console separado.
        if (analisadorLexico.error() != null)
            output += analisadorLexico.error().toString() + "\n";

    } while (token != null);


    // Removemos a �ltima quebra de linha apenas para motivos de formata��o
    output = output.substring(0, output.length - 1);

    // Ao finalizarmos a an�lise, retornamos sua sa�da.
    return output;
}





// Fun��o auxiliar para incluir os outros arquivos de script.
function include(file) {
    var scriptNode = document.createElement('script');
    scriptNode.type = 'text/javascript';
    scriptNode.src = file;
    document.getElementsByTagName("head")[0].appendChild(scriptNode);
}


// Fun��o auxiliar para tracing - mensagens s� ser�o exibidas
//   se a vari�vel global TRACE estiver setada como true.
function trace(msg) {
    if (TRACE)
        alert(msg);
}

// Fun��o auxiliar para debugging - mensagens s� ser�o exibidas
//   se a vari�vel global DEBUG estiver setada como true.
function debug(msg) {
    if (DEBUG)
        alert(msg);
}
