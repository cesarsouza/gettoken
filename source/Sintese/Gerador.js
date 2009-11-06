// Copyright � 2009 C�sar Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Gerador
//   Esta classe � respons�vel por realizar a gera��o de c�digo fonte
//     ANSI C equivalente ao programa fornecido em ALG.
//   Apenas programas bem formados ser�o compilados. Qualquer erro
//     encontrado durante qualquer fase de an�lise interromper� o
//     processo de gera��o.

        // COLOCAR IDENTA��O em todas as gera��es!!

function Gerador() {

    // Vari�vel que guardar� o c�digo produzido
    var codigo = "";

    // Nivel de identa��o em que o c�digo se encontra
    var identacao = 0;


    var variaveis = false;
    var parametros = false;
    var corpo = false;

    var listaVariaveis;

    this.getCodigo = function () {
        return codigo;
    }



    this.genStart = function (cadeia) {
        codigo += "// programa " + cadeia + "\n\n";
        codigo += "#include <stdio.h>\n\n";
    }

    this.guardaVariavel = function (cadeia) {
        if (listaVariaveis == undefined) {
            listaVariaveis = Array();
        }
        listaVariaveis.push(cadeia);
    }

    this.genDeclaracao = function (tipo) {
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
        // Retiramos a ultima virgula que sobra ao final
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ";\n";
        delete listaVariaveis;
//        listaVariaveis = undefined;
    }

    this.genProcedimento = function (cadeia) {
        codigo += "void " + cadeia + " (";
    }

    this.genParametros = function (tipo) {
        for (v in listaVariaveis) {
            codigo += tipo + " " + listaVariaveis[v] + ", ";
        }
        delete listaVariaveis;
    }

    this.finalizaParametros = function () {
        // Retiramos a ultima virgula que sobra ao final
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ") {\n";
        identacao++;
    }

    this.finalizarProcedimento = function () {
        identacao--;
        codigo += "}\n\n";
    }

    this.iniciarMain = function () {
        codigo += "int main (int argc, char **argv) {\n";
        identacao++;
    }

    this.finalizarMain = function () {
        codigo += "return 0;\n\n";
        identacao--;
        codigo += "}\n";
    }

    this.iniciaLe = function () {
        codigo += "scanf(";
    }

    this.finalizarLe = function () {
        codigo += ");\n";
    }

    this.genPrintf = function () {

    }


}