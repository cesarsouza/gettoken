// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


/// <reference path="Analise\Keywords.js" />
/// <reference path="Analise\Token.js" />


// Para mais informações sobre Orientação a Objeto em JavaScript,
//  visite http://phrogz.net/JS/Classes/OOPinJS.html



// Classe Analisador Léxico
//  Esta classe é responsável por conduzir a etapa de análise léxica,
//  identificando lexemas como tokens e retornando-as sob demanda através
//  da chamada do método getToken(). Quando o valor de retorno de getToken
//  for null, então toda a entrada já terá sido completamente analisada.
//
function AnalisadorLexico(input) {


    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    var inputText = new String(input);  // texto de entrada a ser processado
    var currentIndex = 0;               // posição do cabeçote de leitura
    var currentLine = 1;
    var lastError = null;               // último erro não-tokenizável encontrado






    // ************************************************************************
    // Métodos públicos
    // ************************************************************************

    // Posiciona o ponteiro de leitura na posição desejada
    this.seek = function(index) {
        currentIndex = index;
    }

    // Indica se atingimos o final da entrada ou não
    this.eof = function() {
        return (currentIndex >= inputText.length);
    }

    // Retorna a linha do arquivo em que está o cabeçote de leitura
    this.line = function() {
        return currentLine;
    }

    // Indica se o análisador léxico encontrou algum erro que não pôde ser
    //  transformado em token durante a análise, como por exemplo, final
    //  de arquivo encontrado antes de um término de comentário.
    //
    // Comentários, assim como espaços em branco, são simplesmente ignorados
    //  pelo analisador léxico. Assim, não é correto retornar um token contendo
    //  o erro pois, por definição, comentários não são reconhecidos como tokens.
    //
    this.error = function() {
        return lastError;
    }


    // Retorna o próximo token da cadeia identificado pelo Analisador Léxico ou null
    //  caso o final de entrada tenha sido atingido ou um erro que não possa ser
    //  retornado como token seja encontrado. Neste caso, quaisquer erros identificados
    //  estarão disponíveis através do método error() acima especificado.
    //
    this.getToken = function() {

        // Este é o método principal que conduz a análise léxica, empregando
        //  autômatos finitos para tentar reconhecer as cadeias da entrada.

        lastError = null;

        // Caminha ignorando os comentários
        // e espacos em branco (se existirem)
        avancaAoProximoToken();

        // Verificamos se atingimos o final da entrada
        if (this.eof()) return null;


        var token;
        var startIndex = currentIndex;


        // Verifica se o próximo lexema é um Identificador (ou palavra reservada)
        token = proximoIdentificador();   // tenta recuperar um identificador
        if (token != null)                // verifica se o identificador foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se não, retrocede ao ponto inicial


        // Verifica se o próximo lexema é um número (real ou inteiro)
        token = proximoNumero();          // tenta recuperar um número
        if (token != null)                // verifica se o número foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se não, retrocede ao ponto inicial


        // Verifica se o próximo lexema é um símbolo
        token = proximoSimbolo();         // tenta recuperar o símbolo
        if (token != null)                // verifica se o símbolo foi aceito
            return token;                 //   e retorna seu token
        else this.seek(startIndex);       // se não, retrocede ao ponto inicial



        // Se chegamos até aqui, o lexema não foi reconhecido.
        token = new Token(TokenId.Error, getNext());


        // Retornamos o token contendo o erro léxico.
        return token;
    }



    // ************************************************************************
    // Métodos Privados
    // ************************************************************************

    // Retorna o próximo caractere e avança na entrada
    function getNext() {
        return inputText.charAt(currentIndex++);
    }

    // Retrocede a entrada em um caractere
    function goBack() {
        if (currentIndex > 0)
            currentIndex--;
    }



    //  Autômatos
    //  *********

    // Tenta reconhecer um próximo identificador na entrada através de um
    //  autômato reconhecedor de identificadores (ou palavras reservadas)
    function proximoIdentificador() {
        // Expressão regular para identificadores:
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
                        goBack(); // devolve o último caractere (não reconhecido)

                        if (cadeia in Keywords) // verifica se é palavra reservada
                            return new Token(TokenId.Keyword, cadeia); // aceita (reservada)
                        return new Token(TokenId.Identifier, cadeia);  // aceita (identificador)
                    }
                    break;
            }
        }
    }


    // Tenta reconhecer um próximo número na entrada através de
    //  um autômato reconhecedor de números (inteiros ou reais)
    function proximoNumero() {
        // Expressões regulares para números:
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
                        goBack(); // devolve o último caractere não reconhecido
                        return new Token(TokenId.Integer, cadeia); // aceita (número inteiro)
                    }
                    break;

                case 2:
                    if (isDigit(c)) {
                        cadeia += c;
                        c = getNext();
                        estado = 3;
                    }
                    else {
                        // Caso especial: o autômato esperava real mas o numero é inteiro
                        goBack(); // devolve o último caractere não reconhecido
                        goBack(); // devolve o separador decimal

                        // remove o separador decimal da cadeia
                        cadeia = cadeia.substr(0, cadeia.length - 1);

                        // retorna o número inteiro
                        return new Token(TokenId.Integer, cadeia); // aceita (número inteiro)
                    }
                    break;

                case 3:
                    if (isDigit(c)) {
                        cadeia += c;
                        c = getNext();
                    }
                    else {
                        goBack(); // devolve o último caractere não reconhecido
                        return new Token(TokenId.Real, cadeia); // aceita (número real)
                    }
                    break;
            }
        }
    }


    // Tenta reconhecer um próximo símbolo na entrada através de
    //  um autômato reconhecedor de símbolos da linguagem.
    function proximoSimbolo() {
        // Expressão regular para símbolos:
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

    // Avança na entrada ignorando espaços e comentários
    //  até o próximo token (ou até o término da entrada)
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
                        //  comentário. Este é um caso especial pois não compreende um
                        //  erro tokenizável, já que comentários, assim como espaços em
                        //  branco, são simplesmente ignorados nesta fase da análise.

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



    //  Funções Auxiliares
    //  ******************

    // Determina se o caractere c é uma letra
    function isLetter(c) {
        if (!c)
            return false;

        var re = /[a-zA-Z]/;
        return c.match(re);
    }

    // Determina se o caractere c é um dígito
    function isDigit(c) {
        if (!c)
            return false;

        var re = /[0-9]/;
        return c.match(re);
    }

    // Determina se o caractere c é um espaço
    function isSpace(c) {
        if (!c)
            return false;

        // O simbolo \s casa com um espaço em branco simples, incluindo espaco,
        //   tab, line feed, form feed, carriage return, entre outros.
        var re = /\s/;
        return c.match(re);
    }


}