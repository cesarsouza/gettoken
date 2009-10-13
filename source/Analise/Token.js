// Copyright © 2009 César Roberto de Souza, Leonardo Sameshima Taba
// ----------------------------------------------------------------

// A classe Token encompassa um lexema e a categoria do lexema
//   identificado, como, por exemplo: <54, numero_inteiro>
function Token(id, valor)
{

    var tokenId = id;     // Categoria do lexema identificado
    var cadeia = valor;   // Cadeia do lexema identificado


    // Retorna a cadeia identificada
    this.cadeia = function()
    {
        return cadeia;
    }

    // Retorna a categoria da cadeia identificada
    this.id = function()
    {
        return id;
    }

    // Retorna uma representacao em string do token
    //  no formato "lexema - categoria", sem aspas
    this.toString = function()
    {
        if (!cadeia || cadeia == "")
        return new String();

        var output = new String(cadeia) + " - ";

        // Caso seja uma palavra reservada, tratamos como uma
        //  forma especial e repetimos a cadeia como categoria
        if (tokenId == TokenId.Keyword)
            output += new String(cadeia);
        else
            output += new String(tokenId);

        return output;
    }
}


// Enumeracao de categorias de lexemas
var TokenId =
{
    Error:      "erro",
    Keyword:    "palavra_reservada",
    Identifier: "identificador",
    Integer:    "numero_inteiro",
    Real:       "numero_real"
}
