// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


var exemplo = new Array();


exemplo[1] = // Exemplo 01: código sem erros

"programa fibonacci;\n\
{ imprime os n primeiros numeros de fibonacci }\n\
\n\
var n1, n2, n3, qtde, i : inteiro;\n\
inicio\n\
    n1 := 0;\n\
    n2 := 1;\n\
    i := 0;\n\
    le(qtde);\n\
    enquanto i < qtde faca\n\
    inicio\n\
        escreve(n2);\n\
        n3 := n1 + n2;\n\
        n1 := n2;\n\
        n2 := n3;\n\
        i := i + 1;\n\
    fim;\n\
fim.";



exemplo[2] = // Exemplo 02: código sem erros

"programa exemplo2;\n\
{ testa erros no uso de condicionais }\n\
\n\
var a: real;\n\
var b: inteiro;\n\
procedimento nomep(x: real);\n\
    var a, c: inteiro;\n\
    inicio\n\
        le(c, a);\n\
        se a<x+c enta\n\
        inicio\n\
            a:= c+x;\n\
            escreve(a);\n\
        fim\n\
        senao c:= a+x;\n\
    fim;\n\
\n\
inicio {programa principal}\n\
    le(b);\n\
    nomep(b);\n\
fim.";



exemplo[3] = // Exemplo 03: código contendo erros

"programa exemplo3;\n\
{ testa passagem de parametros com erros }\n\
\n\
var a: inteiro;\n\
\n\
inicio\n\
  leia(a, @, 1);\n\
fim.";


exemplo[4] =

"#programa exemplo4;\n\
{ testa inicio de programa, declaracao de\n\
  variaveis e expressoes contendo erros }\n\
\n\
var @: real;\n\
var b: inteiro;\n\
procedimento nomep(x: real);\n\
    var a, c: inteiro;\n\
    inicio\n\
        le(c, a);\n\
        se a<x+c entao\n\
        inicio\n\
            a:= c+x;\n\
            escreve(a);\n\
        fim\n\
        senao c:=_ a+x;\n\
    fim;\n\
\n\
inicio {programa principal}\n\
    le(b);\n\
    nomep(b);\n\
fim.";




exemplo[5] = // Exemplo 05: código com erros

"programa exemplo5;\n\
{ testa comentarios nao finalizados, como este\n\
\n\
var a: inteiro;\n\
\n\
inicio\n\
  leia(a, @, 1);\n\
fim.";



exemplo[6] =

"programa exemplo6;\n\
{ testa um programa sem inicio }\n\
\n\
var a: real;\n\
var b: inteiro;\n\
procedimento nomep(x: real);\n\
\n\
        le(c, a);\n\
        se a<x+c entao\n\
        inicio\n\
            a:= c+x;\n\
            escreve(a);\n\
        fim\n\
        senao c:= a+x;\n\
    fim;\n\
\n\
inicio {programa principal}\n\
    le(b);\n\
    nomep(b);\n\
fim.";

exemplo[7] =

"programa teste;\n\
\n\
inicio\n\
    le(b);\n\
fim.";