// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


/// <reference path="Analise\Keywords.js" />
/// <reference path="Analise\Token.js" />


// Para mais informa��es sobre Orienta��o a Objeto em JavaScript,
//  visite http://phrogz.net/JS/Classes/OOPinJS.html



// Classe Analisador L�xico
//  Esta classe � respons�vel por conduzir a etapa de an�lise l�xica,
//  identificando lexemas como tokens e retornando-as sob demanda atrav�s
//  da chamada do m�todo getToken(). Quando o valor de retorno de getToken
//  for null, ent�o toda a entrada j� ter� sido completamente analisada.
//
function AnalisadorLexico(input) {


    // ************************************************************************
    // Vari�veis privadas
    // ************************************************************************

    var inputText = new String(input);  // texto de entrada a ser processado
    var currentIndex = 0;               // posi��o do cabe�ote de leitura
    var currentLine = 1;
    var lastError = null;               // �ltimo erro n�o-tokeniz�vel encontrado






    // ************************************************************************
    // M�todos p�blicos
    // ************************************************************************

    // Posiciona o ponteiro de leitura na posi��o desejada
    this.seek = function(index) {
        currentIndex = index;
    }

    // Indica se atingimos o final da entrada ou n�o
    this.eof = function() {
        return (currentIndex >= inputText.length);
    }

    // Retorna a linha do arquivo em que est� o cabe�ote de leitura
    this.line = function() {
        return currentLine;
    }

    // Indica se o an�lisador l�xico encontrou algum erro que n�o p�de ser
    //  transformado em token durante a an�lise, como por exemplo, final
    //  de arquivo encontrado antes de um t�rmino de coment�rio.
    //
    // Coment�rios, assim como espa�os em branco, s�o simplesmente ignorados
    //  pelo analisador l�xico. Assim, n�o � correto retornar um token contendo
    //  o erro pois, por defini��o, coment�rios n�o s�o reconhecidos como tokens.
    //
    this.error = function() {
        return lastError;
    }


    // Retorna o pr�ximo token da cadeia identificado pelo Analisador L�xico ou null
    //  caso o final de entrada tenha sido atingido ou um erro que n�o possa ser
    //  retornado como token seja encontrado. Neste caso, quaisquer erros identificados
    //  estar�o dispon�veis atrav�s do m�todo error() acima especificado.
    //
    this.getToken = function() {

        // Este � o m�todo principal que conduz a an�lise l�xica, empregando
        //  aut�matos finitos para tentar reconhecer as cadeias da entrada.

        lastError = null;

        // Caminha ignorando os coment�rios
        // e espacos em branco (se existirem)
        avancaAoProximoToken();

        // Verificamos se atingimos o final da entrada
        if (this.eof()) return null;


        var token;
        var startIndex = currentIndex;


        // Verifica se o pr�ximo lexema � um Identificador (ou palavra reservada)
        token = proximoIdentificador();   // tenta recuperar um identificador
        if (token != null)                // verifica se o identificador foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se n�o, retrocede ao ponto inicial


        // Verifica se o pr�ximo lexema � um n�mero (real ou inteiro)
        token = proximoNumero();          // tenta recuperar um n�mero
        if (token != null)                // verifica se o n�mero foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se n�o, retrocede ao ponto inicial


        // Verifica se o pr�ximo lexema � um s�mbolo
        token = proximoSimbolo();         // tenta recuperar o s�mbolo
        if (token != null)                // verifica se o s�mbolo foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se n�o, retrocede ao ponto inicial



        // Se chegamos at� aqui, o lexema n�o foi reconhecido.
        token = new Token(TokenId.Error, getNext());


        // Retornamos o token contendo o erro l�xico.
        return token;
    }



    // ************************************************************************
    // M�todos Privados
    // ************************************************************************

    // Retorna o pr�ximo caractere e avan�a na entrada
    function getNext() {
        return inputText.charAt(currentIndex++);
    }

    // Retrocede a entrada em um caractere
    function goBack() {
        if (currentIndex > 0)
            currentIndex--;
    }



    //  Aut�matos
    //  *********

    // Tenta reconhecer um pr�ximo identificador na entrada atrav�s de um
    //  aut�mato reconhecedor de identificadores (ou palavras reservadas)
    function proximoIdentificador() {
        // Express�o regular para identificadores:
        // {letra}({letra}|{digito})*

        var estado = 0;
        var c = getNext();
        var cadeia = new String();

        while (true) {
            switch (estado) {
                case 0:
                    if (isLetter(c)) {
                        estado = 1;
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        return null; // erro
                    }
                    break;

                case 1:
                    if (isDigit(c) || isLetter(c)) {
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack(); // devolve o �ltimo caractere (n�o reconhecido)

                        if (cadeia in Keywords) // verifica se � palavra reservada
                            return new Token(TokenId.Keyword, cadeia); // aceita (reservada)
                        return new Token(TokenId.Identifier, cadeia);  // aceita (identificador)
                    }
                    break;
            }
        }
    }


    // Tenta reconhecer um pr�ximo n�mero na entrada atrav�s de
    //  um aut�mato reconhecedor de n�meros (inteiros ou reais)
    function proximoNumero() {
        // Express�es regulares para n�meros:
        // Inteiro:  {digito}{digito}*
        // Real:     {digito}{digito}*,{digito}{digito}*

        var estado = 0;
        var c = getNext();
        var cadeia = new String();

        while (true) {
            switch (estado) {
                case 0:
                    if (isDigit(c)) {
                        estado = 1;
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        return null; // erro
                    }
                    break;

                case 1:
                    if (isDigit(c)) {
                        cadeia += c;
                        c = getNext();
                    }
                    else if (c == ",") {
                        cadeia += c;
                        c = getNext();
                        estado = 2;
                    }
                    else {
                        goBack(); // devolve o �ltimo caractere n�o reconhecido
                        return new Token(TokenId.Integer, cadeia); // aceita (n�mero inteiro)
                    }
                    break;

                case 2:
                    if (isDigit(c)) {
                        cadeia += c;
                        c = getNext();
                        estado = 3;
                    }
                    else {
                        // Caso especial: o aut�mato esperava real mas o numero � inteiro
                        goBack(); // devolve o �ltimo caractere n�o reconhecido
                        goBack(); // devolve o separador decimal

                        // remove o separador decimal da cadeia
                        cadeia = cadeia.substr(0, cadeia.length - 1);

                        // retorna o n�mero inteiro
                        return new Token(TokenId.Integer, cadeia); // aceita (n�mero inteiro)
                    }
                    break;

                case 3:
                    if (isDigit(c)) {
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack(); // devolve o �ltimo caractere n�o reconhecido
                        return new Token(TokenId.Real, cadeia); // aceita (n�mero real)
                    }
                    break;
            }
        }
    }


    // Tenta reconhecer um pr�ximo s�mbolo na entrada atrav�s de
    //  um aut�mato reconhecedor de s�mbolos da linguagem.
    function proximoSimbolo() {
        // Express�o regular para s�mbolos:
        // == | <> | >= | <= | > | < | + | - | * | / | := | ; | : | . | , | ( | )

        var estado = 0;
        var c = getNext();
        var cadeia = new String();

        while (true) {

            switch (estado) {

                case 0:
                    switch (c) {
                        case '=':
                        case '+':
                        case '-':
                        case '*':
                        case '/':
                        case ';':
                        case '.':
                        case ',':
                        case '(':
                        case ')':
                            estado = 1;
                            cadeia += c;
                            c = getNext();
                            break;

                        case '<':
                            estado = 2;
                            cadeia += c;
                            c = getNext();
                            break;

                        case '>':
                            estado = 3;
                            cadeia += c;
                            c = getNext();
                            break;

                        case ':':
                            estado = 4;
                            cadeia += c;
                            c = getNext();
                            break;

                        default:
                            return null;     // outro caractere encontrado
                    }
                    break;

                case 1:
                    goBack();
                    return new Token(TokenId.Keyword, cadeia); // aceita
                    break;

                case 2:
                    if (c == '=' || c == '>') {
                        estado = 1;
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack();
                        return new Token(TokenId.Keyword, cadeia);
                    }
                    break;

                case 3:
                    if (c == '=') {
                        estado = 1;
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack();
                        return new Token(TokenId.Keyword, cadeia);
                    }
                    break;

                case 4:
                    if (c == '=') {
                        estado = 1;
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack();
                        return new Token(TokenId.Keyword, cadeia);
                    }
                    break;

            }
        }
    }

    // Avan�a na entrada ignorando espa�os e coment�rios
    //  at� o pr�ximo token (ou at� o t�rmino da entrada)
    function avancaAoProximoToken() {

        var estado = 0;
        var c = getNext();


        while (true) {
            switch (estado) {
                case 0:
                    if (isSpace(c)) {
                        if (c == "\n") currentLine++;
                        c = getNext();
                    }
                    else if (c == "{") {
                        estado = 1;
                        c = getNext();
                    }
                    else {
                        if (c != null) {
                            goBack();
                        }
                        return;
                    }
                    break;

                case 1:
                    if (c == "}") {
                        estado = 0;
                        c = getNext();
                    }
                    else if (!c) {
                        // Atingimos o final da entrada antes de chegarmos ao final do
                        //  coment�rio. Este � um caso especial pois n�o compreende um
                        //  erro tokeniz�vel, j� que coment�rios, assim como espa�os em
                        //  branco, s�o simplesmente ignorados nesta fase da an�lise.

                        lastError = new Error("fim de comentario nao encontrado", currentLine);
                        return;
                    }
                    else {
                        if (c == "\n") currentLine++;
                        c = getNext();
                    }
                    break;
            }
        }
    }



    //  Fun��es Auxiliares
    //  ******************

    // Determina se o caractere c � uma letra
    function isLetter(c) {
        if (!c)
            return false;

        var re = /[a-zA-Z]/;
        return c.match(re);
    }

    // Determina se o caractere c � um d�gito
    function isDigit(c) {
        if (!c)
            return false;

        var re = /[0-9]/;
        return c.match(re);
    }

    // Determina se o caractere c � um espa�o
    function isSpace(c) {
        if (!c)
            return false;

        // O simbolo \s casa com um espa�o em branco simples, incluindo espaco,
        //   tab, line feed, form feed, carriage return, entre outros.
        var re = /\s/;
        return c.match(re);
    }


}