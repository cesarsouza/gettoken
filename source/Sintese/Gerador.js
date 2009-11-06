// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------


// Classe Gerador
//   Esta classe é responsável por realizar a geração de código fonte
//     ANSI C equivalente ao programa fornecido em ALG.
//   Apenas programas bem formados serão compilados. Qualquer erro
//     encontrado durante qualquer fase de análise impedirá a
//     apresentação do programa compilado.

function Gerador() {

    // Variável que guardará o código produzido
    var codigo = "";

    // Nivel de identação em que o código se encontra
    var identacao = 0;
    var identSize = 4;

    var listaVariaveis;
    var listaTipos;


    function identar() {
        for (var i = 0; i < identacao; i++) {
            for (var j = 0; j < identSize; j++) {
                codigo += " ";
            }
        }
    }

    this.getCodigo = function () {
        return codigo;
    }



    this.genStart = function (cadeia) {
        identar();
        codigo += "// programa " + cadeia + "\n\n";
        codigo += "#include <stdio.h>\n\n";
    }

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

    this.genDeclaracao = function (tipo) {
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
        // Retiramos a ultima virgula que sobra ao final
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ";\n";
//        delete listaVariaveis;
        listaVariaveis = undefined;
    }

    this.genProcedimento = function (cadeia) {
        codigo += "\n";
        codigo += "void " + cadeia + " (";
    }

    this.genParametros = function (tipo) {
        identar();

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
    }

    this.finalizaParametros = function () {
        identar();
        // Retiramos a ultima virgula que sobra ao final
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ") {\n";
        identacao++;
    }

    this.finalizarProcedimento = function () {
        identacao--;
        identar();
        codigo += "}\n\n";
    }

    this.iniciarMain = function () {
        codigo += "\nint main (int argc, char **argv) {\n\n";
        identacao++;
    }

    this.finalizarMain = function () {
        codigo += "\n";
        identar();
        codigo += "return 0;\n\n";
        identacao--;
        codigo += "}\n";
    }

    this.iniciarLe = function () {
        identar();
        codigo += "scanf(\"";
    }

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

    this.iniciarEscreve = function () {
        identar();
        codigo += "printf(\"";
    }

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

    this.iniciarEnquanto = function () {
        identar();
        codigo += "while (";
    }

    this.iniciarSe = function () {
        identar();
        codigo += "if (";
    }

    this.iniciarSenao = function () {
        identar();
        codigo += "else\n";
    }

    this.genIdentificador = function (cadeia) {
        identar();
        codigo += cadeia;
    }

    this.iniciarAtribuicao = function () {
        codigo += " = ";
    }

    this.finalizarAtribuicao = function () {
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += ";\n";
    }

    this.iniciarChamada = function () {
        codigo += "(";
    }

    this.incluirArgumento = function (cadeia) {
        codigo += cadeia + ", ";
    }

    this.finalizarChamada = function () {
        codigo = codigo.substr(0, codigo.length - 2);
        codigo += ");\n";
    }

    this.iniciarCondicao = function () {

    }

    this.finalizarCondicao = function () {
        codigo = codigo.substr(0, codigo.length - 1);
        codigo += ")\n";
    }

    this.iniciarBloco = function () {
        identar();
        codigo += "{\n";
        identacao++;
    }

    this.finalizarBloco = function () {
        identacao--;
        identar();
        codigo += "}\n";
    }

    this.expressao = function (cadeia) {
        codigo += cadeia + " ";
    }


}