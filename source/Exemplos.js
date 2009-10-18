// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


var exemplo = new Array();


// Exemplo 01: código contendo erros

exemplo[1] =  

"programa exemplo;  \n\
                    \n\
{entrada}           \n\
var a: inteiro;     \n\
                    \n\
inicio              \n\
  leia(a, @, 1);    \n\
fim.                 ";




// Exemplo 02: código contendo erros

exemplo[2] =

"#programa nome2;              \n\
{exemplo 2}                    \n\
var @: real;                   \n\
var b: inteiro;                \n\
procedimento nomep(x: real);   \n\
    var a, c: inteiro;         \n\
    inicio                     \n\
        le(c, a);              \n\
        se a<x+c entao         \n\
        inicio                 \n\
            a:= c+x;           \n\
            escreve(a);        \n\
        fim                    \n\
        senao c:=_ a+x;        \n\
    fim;                       \n\
                               \n\
inicio {programa principal}    \n\
    le(b);                     \n\
    nomep(b);                  \n\
fim.                            ";



// Exemplo 03: código sem erros

exemplo[3] =

"programa fibonacci;                \n\
{ imprime os n primeiros numeros de fibonacci } \n\
var n1, n2, n3, qtde, i : inteiro;  \n\
inicio                              \n\
    n1 := 0;                        \n\
    n2 := 1;                        \n\
    i := 0;                         \n\
    le(qtde);                       \n\
    enquanto i < qtde faca          \n\
    inicio                          \n\
        escreve(n2);                \n\
        n3 := n1 + n2;              \n\
        n1 := n2;                   \n\
        n2 := n3;                   \n\
        i := i + 1;                 \n\
    fim;                            \n\
fim.                                ";




// Exemplo 04: código com erros
exemplo[4] =

"programa exemplo;  \n\
                    \n\
{entrada            \n\
var a: inteiro;     \n\
                    \n\
inicio              \n\
  leia(a, @, 1);    \n\
fim.                 ";


// Exemplo 05: código com erros
exemplo[5] =

"programa exemplo;  \n\
                    \n\
{entrada     }      \n\
var a: inteiro;     \n\
var b: inteiro;     \n\
                    \n\
inicio              \n\
  a := a_ + b;      \n\
fim.                 ";


// Exemplo 06: código sem erros
exemplo[6] =

//"programa exemplo;  \n\
//                    \n\
//{entrada}           \n\
//var a: inteiro;     \n\
//                    \n\
//inicio              \n\
//  leia(a);          \n\
//fim.                 ";

"programa nome2;              \n\
{exemplo 2}                    \n\
var a: real;                   \n\
var b: inteiro;                \n\
procedimento nomep(x: real ;   \n\
    var a, c: inteiro;         \n\
    inicio                    {ele pensa que ate aqui ainda e a declaracao de argumentos} \n\
        le(c, a);              \n\
        se a<x+c entao         \n\
        inicio                 \n\
            a:= c+x;           \n\
            escreve(a);        \n\
        fim                    \n\
        senao c:= a+x;        \n\
    fim;                       \n\
                               \n\
inicio {programa principal}    \n\
    le(b);                     \n\
    nomep(b);                  \n\
fim.                            ";