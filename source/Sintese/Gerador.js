// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Gerador
//   Esta classe é responsável por realizar a geração de código fonte
//     ANSI C equivalente ao programa fornecido em ALG.
//
//   Apenas programas corretos segundo a especificação ALG serão
//     compilados. Qualquer erro, seja léxico, semântico ou sintático,
//     ou seja, encontrado durante qualquer fase de análise, impedirá
//     a apresentação do código em ANSI C do programa gerado.
//
function Gerador() {



    // ************************************************************************
    // Variáveis privadas
    // ************************************************************************

    // Variável que guardará o código produzido
    var codigo = "";

    // Nivel de identação em que o código se encontra
    var identacao = 0;

    // Tamanho, em número de espaços, do recuo de identação
    var identSize = 4;

    // Lista de variáveis e lista de tipos, utilizadas na geração de
    //   declarações de variáveis e parâmetros
    var listaVariaveis = undefined;
    var listaTipos = undefined;

    // Variável booelana que é verdadeira quando existem parâmetros em
    //   uma declaração de procedimento
    var houveramParametros = false;



    // ************************************************************************
    // Métodos privados
    // ************************************************************************


    // Insere identação na linha atual do código gerado
    function identar() {
        for (var i = 0; i < identacao; i++) {
            for (var j = 0; j < identSize; j++) {
                codigo += " ";
            }
        }
    }



    // ************************************************************************
    // Métodos publicos
    // ************************************************************************


    // Retorna o código gerado
    this.codigo = function () {
        return codigo;
    }

    // Inicia a geração do código. Coloca um cabeçalho (nome do programa) e
    //   insere o #include <stdio.h>
    this.iniciar = function (cadeia) {
        codigo += "/* programa " + cadeia + " */\n\n";
        codigo += "#include <stdio.h>\n\n";
    }

    // Guarda uma variável e seu tipo em uma lista temporária (utilizada na declaração de
    //   variáveis e parâmetros)
    this.guardaVariavel = function (cadeia, tipo) {
        if (listaVariaveis == undefined) {
            listaVariaveis = Array();
        }
        if (listaTipos == undefined) {
            listaTipos = Array();
        }

        listaVariaveis.push(cadeia);

        if (tipo != undefined) {
            listaTipos.push(tipo);
        }
    }

    // Gera declaração de variáveis ou parâmetros
    this.iniciarDeclaracao = function (tipo) {
        identar();
        if (tipo == "inteiro") {
            tipo = "int";
        }
        else if (tipo == "real") {
            tipo = "float";
        }
        codigo += tipo + " ";
        for (v in listaVariaveis) {
            codigo += listaVariaveis[v] + ", ";
        }
        // Retiramos a ultima virgula e espaço que sobram ao final
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ";\n";

        listaVariaveis = undefined;
    }

    // Inicia a geração de um procedimento
    this.iniciarProcedimento = function (cadeia) {
        codigo += "\n";
        codigo = codigo + "void " + cadeia + " (";
        houveramParametros = false;
    }

    // Gera a declaração de parâmetros de uma função
    this.inserirParametros = function (tipo) {
        if (tipo == "inteiro") {
            tipo = "int";
        }
        else if (tipo == "real") {
            tipo = "float";
        }

        for (v in listaVariaveis) {
            codigo += tipo + " " + listaVariaveis[v] + ", ";
        }
        listaVariaveis = undefined;
        houveramParametros = true;
    }

    // Finaliza a declaração de parâmetros de uma função
    this.finalizarParametros = function () {
        // Retiramos a ultima virgula e espaço que sobram ao final
        if (houveramParametros) {
            codigo = codigo.substr(0, codigo.length - 2);
        }
        codigo += ")\n{\n";
        identacao++;
    }

    // Finaliza uma função
    this.finalizarProcedimento = function () {
        identacao--;
        identar();
        codigo += "}\n\n";
    }

    // Inicia a função principal
    this.iniciarMain = function () {
        codigo += "\nint main (int argc, char **argv)\n{\n\n";
        identacao++;
    }

    // Finaliza a função principal
    this.finalizarMain = function () {
        codigo += "\n";
        identar();
        codigo += "return 0;\n\n";
        identacao--;
        codigo += "}\n";
    }

    // Transforma uma instrução "le" em uma função "scanf"
    this.iniciarLe = function () {
        identar();
        codigo += "scanf(\"";
    }

    // Finaliza uma função scanf, escrevendo a string de formatação e os parâmetros
    this.finalizarLe = function () {
        for (t in listaTipos) {
            if (listaTipos[t] == "inteiro") {
                codigo += "%d ";
            }
            else if (listaTipos[t] == "real") {
                codigo += "%f ";
            }
        }
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += "\", ";

        for (v in listaVariaveis) {
            codigo += "&" + listaVariaveis[v] + ", ";
        }
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ");\n";

        listaTipos = undefined;
        listaVariaveis = undefined;
    }

    // Transforma uma instrução "escreve" em uma função "printf"
    this.iniciarEscreve = function () {
        identar();
        codigo += "printf(\"";
    }

    // Finaliza uma função "printf", escrevendo a string de formatação e os parâmetros
    this.finalizarEscreve = function () {
        for (t in listaTipos) {
            if (listaTipos[t] == "inteiro") {
                codigo += "%d ";
            }
            else if (listaTipos[t] == "real") {
                codigo += "%f ";
            }
        }
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += "\\n\", ";

        for (v in listaVariaveis) {
            codigo += listaVariaveis[v] + ", ";
        }
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ");\n";

        listaTipos = undefined;
        listaVariaveis = undefined;
    }

    // Transforma uma instrução "enquanto" em uma instrução "while"
    this.iniciarEnquanto = function () {
        identar();
        codigo += "while ";
    }

    // Transforma uma instrução "se" em uma instrução "if"
    this.iniciarSe = function () {
        identar();
        codigo += "if ";
    }

    // Transforma uma instrução "senao" em uma instrução "else"
    this.iniciarSenao = function () {
        identar();
        codigo += "else\n";
    }

    this.iniciarCondicao = function () {
        codigo += "(";
    }

    // Insere um identificador no código (pode ser uma atribuição de variável ou
    //   chamada de função)
    this.inserirIdentificador = function (cadeia) {
        identar();
        codigo += cadeia;
    }

    // Começa a inserir um comando de atribuição ('=')
    this.iniciarAtribuicao = function () {
        codigo += " = ";
    }

    // Finaliza a atribuição retirando o último caractere do código, que é um espaço (vindo da
    // expressão)
    this.finalizarAtribuicao = function () {
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += ";\n";
    }

    // Começa uma chamada de função
    this.iniciarChamada = function () {
        codigo += "(";
    }

    // Escreve os argumentos de chamadas de função
    this.inserirArgumento = function (cadeia) {
        codigo += cadeia + ", ";
    }

    // Finaliza uma chamada de função, retirando os dois últimos caracteres (vírgula e espaço)
    this.finalizarChamada = function () {
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ");\n";
    }

    // Insere uma lista de parâmetros vazia (necessária na linguagem C, quando não mandamos parâmetros)
    this.inserirChamadaVazia = function () {
        codigo += "();\n";
    }

    // Finaliza uma condição
    this.finalizarCondicao = function () {
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += ")\n";
    }

    // Inicia um bloco de comandos, aumentando o nível de identação
    this.iniciarBloco = function () {
        identar();
        codigo += "{\n";
        identacao++;
    }

    // Finaliza um bloco de comandos, diminuindo o nível de identação
    this.finalizarBloco = function () {
        identacao--;
        identar();
        codigo += "}\n";
    }

    // As expressões são transcritas ipsis litteris no código gerado, com exceção de
    //   números reais, onde a vírgula deve ser substituída pelo ponto.
    this.expressao = function (cadeia) {
        cadeia = cadeia.replace(",", ".");
        codigo += cadeia + " ";
    }


}