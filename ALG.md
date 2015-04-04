# Introdução #

A linguagem ALG é uma linguagem hipotética baseada em pascal. Como tal, é uma linguagem procedural, porém com algumas limitações para tornar a criação de seu compilador mais simples.


# Especificação #

## Sintaxe ##

Todo programa em ALG deve iniciar com a palavra chave **programa** seguida do nome do programa que se segue. Um exemplo de programa válido segundo a linguagem ALG, que calcula os primeiros _n_ números da sequência de fibonacci, seria:

```
programa fibonacci;
{ imprime os n primeiros numeros de fibonacci }

var n1, n2, n3, qtde, i : inteiro;
inicio
    n1 := 0;
    n2 := 1;
    i := 0;
    le(qtde);
    enquanto i < qtde faca
    inicio
        escreve(n2);
        n3 := n1 + n2;
        n1 := n2;
        n2 := n3;
        i := i + 1;
    fim;
fim.
```

Construções básicas são:

  * se ... então ... fim;
  * enquanto ... faca .... fim;

Atribuições de variáveis são da forma

  * a := b

Note, no entanto, que a única forma de laço disponivel é o laço **enquanto**.
