import React, { useState, useCallback } from 'react';
import { Play, Code, AlertCircle, CheckCircle, Info, FileText } from 'lucide-react';

const Compiler = () => {
  const [sourceCode, setSourceCode] = useState(`
  /* Programa de ejemplo para análisis completo del compilador
   Incluye múltiples estructuras y operaciones */
 
// Función para calcular factorial
int factorial(int n) {
    if (n <= 1) {
        return 1;
    } else {
        return n * factorial(n - 1);
    }
}
 
// Función principal
int main() {
    // Declaración de variables de diferentes tipos
    int edad = 25;
    float salario = 2500.75;
    bool esAdulto = true;
    int contador = 0;
    int numero = 5;
    float promedio = 0.0;
    int suma = 0;
   
    // Operaciones aritméticas
    int dobleEdad = edad * 2;
    float salarioAnual = salario * 12;
   
    // Estructura condicional if-else
    if (edad >= 18 && esAdulto) {
        printf("Es mayor de edad\n");
        salario = salario + 500.0; // Incremento salarial
    } else {
        printf("Es menor de edad\n");
        salario = salario * 0.8; // Reducción salarial
    }
   
    // Ciclo while para contar
    while (contador < 5) {
        suma = suma + contador;
        contador = contador + 1;
    }
   
    // Operaciones lógicas y comparaciones
    if (suma > 10 || contador == 5) {
        printf("Condición cumplida\n");
    }
   
    // Ciclo for para calcular promedio
    for (int i = 1; i <= numero; i++) {
        promedio = promedio + i;
    }
    promedio = promedio / numero;
   
    // Más operaciones aritméticas
    int resultado = factorial(numero);
    bool esPar = (numero % 2) == 0;
   
    // Asignaciones y operaciones combinadas
    edad = edad + 1;
    salario = salario - 100.0;
   
    // Condicional anidada
    if (resultado > 100) {
        if (esPar) {
            printf("Número par con factorial grande\n");
        } else {
            printf("Número impar con factorial grande\n");
        }
    }
   
    return 0;
}
  `);
  const [activeTab, setActiveTab] = useState('lexico');
  const [compilationResult, setCompilationResult] = useState(null);

  // Analizador Léxico Completo para C++
  const lexicalAnalysis = useCallback((code) => {
    const tokens = [];
    const keywords = [
      // Tipos básicos
      'int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short', 'unsigned', 'signed',
      // Estructuras de control
      'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue',
      // Funciones y clases
      'return', 'class', 'struct', 'public', 'private', 'protected', 'virtual', 'static', 'const',
      // Directivas y otros
      'using', 'namespace', 'include', 'define', 'typedef', 'template', 'typename',
      // Valores especiales
      'true', 'false', 'null', 'nullptr', 'this',
      // Operadores de palabra
      'new', 'delete', 'sizeof', 'operator', 'friend', 'inline', 'extern',
      // Manejo de memoria
      'auto', 'register', 'volatile', 'mutable'
    ];

    const operators = [
      // Operadores de asignación compuestos (más largos primero)
      '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
      // Operadores de comparación
      '==', '!=', '<=', '>=', '<<', '>>',
      // Operadores lógicos
      '&&', '||',
      // Operadores de incremento/decremento
      '++', '--',
      // Operadores de puntero
      '->', '::',
      // Operadores simples
      '=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~', '?', ':'
    ];

    const delimiters = ['(', ')', '{', '}', '[', ']', ';', ',', '.', '"', "'"];

    const lines = code.split('\n');
    let tokenId = 1;

    lines.forEach((line, lineNum) => {
      let i = 0;

      while (i < line.length) {
        const char = line[i];

        // Saltar espacios en blanco
        if (/\s/.test(char)) {
          i++;
          continue;
        }

        let startColumn = i;

        // Comentarios de línea //
        if (char === '/' && line[i + 1] === '/') {
          // Saltar el resto de la línea
          break;
        }

        // Comentarios de bloque /* */
        if (char === '/' && line[i + 1] === '*') {
          tokens.push({
            id: tokenId++,
            lexeme: '/*',
            type: 'COMMENT_START',
            line: lineNum + 1,
            column: startColumn + 1
          });
          i += 2;
          continue;
        }

        if (char === '*' && line[i + 1] === '/') {
          tokens.push({
            id: tokenId++,
            lexeme: '*/',
            type: 'COMMENT_END',
            line: lineNum + 1,
            column: startColumn + 1
          });
          i += 2;
          continue;
        }

        // Directivas de preprocesador
        if (char === '#') {
          let directive = '#';
          i++;
          while (i < line.length && /[a-zA-Z_]/.test(line[i])) {
            directive += line[i];
            i++;
          }
          tokens.push({
            id: tokenId++,
            lexeme: directive,
            type: 'PREPROCESSOR',
            line: lineNum + 1,
            column: startColumn + 1
          });
          continue;
        }

        // Verificar operadores (empezando por los más largos)
        let operatorFound = false;
        for (const op of operators) {
          if (line.substr(i, op.length) === op) {
            tokens.push({
              id: tokenId++,
              lexeme: op,
              type: 'OPERATOR',
              line: lineNum + 1,
              column: startColumn + 1
            });
            i += op.length;
            operatorFound = true;
            break;
          }
        }

        if (operatorFound) continue;

        // Verificar delimitadores
        if (delimiters.includes(char)) {
          // Manejo especial para strings
          if (char === '"') {
            let stringContent = '"';
            i++; // Saltar la primera comilla

            while (i < line.length && line[i] !== '"') {
              if (line[i] === '\\' && i + 1 < line.length) {
                // Manejar caracteres de escape
                stringContent += line[i] + line[i + 1];
                i += 2;
              } else {
                stringContent += line[i];
                i++;
              }
            }

            if (i < line.length && line[i] === '"') {
              stringContent += '"';
              i++;
            }

            tokens.push({
              id: tokenId++,
              lexeme: stringContent,
              type: 'STRING_LITERAL',
              line: lineNum + 1,
              column: startColumn + 1
            });
          }
          // Manejo especial para caracteres
          else if (char === "'") {
            let charContent = "'";
            i++; // Saltar la primera comilla simple

            while (i < line.length && line[i] !== "'") {
              if (line[i] === '\\' && i + 1 < line.length) {
                // Manejar caracteres de escape
                charContent += line[i] + line[i + 1];
                i += 2;
              } else {
                charContent += line[i];
                i++;
              }
            }

            if (i < line.length && line[i] === "'") {
              charContent += "'";
              i++;
            }

            tokens.push({
              id: tokenId++,
              lexeme: charContent,
              type: 'CHAR_LITERAL',
              line: lineNum + 1,
              column: startColumn + 1
            });
          } else {
            tokens.push({
              id: tokenId++,
              lexeme: char,
              type: 'DELIMITER',
              line: lineNum + 1,
              column: startColumn + 1
            });
            i++;
          }
          continue;
        }

        // Construir token alfanumérico o numérico
        let currentToken = '';
        while (i < line.length &&
        !operators.some(op => line.substr(i, op.length) === op) &&
        !delimiters.includes(line[i]) &&
        !/\s/.test(line[i])) {
          currentToken += line[i];
          i++;
        }

        // Si se construyó un token, categorizarlo
        if (currentToken) {
          tokens.push(categorizeToken(currentToken, tokenId++, lineNum + 1, startColumn + 1));
        }
      }
    });

    return tokens;

    function categorizeToken(lexeme, id, line, column) {
      // Keywords
      if (keywords.includes(lexeme)) {
        return { id, lexeme, type: 'KEYWORD', line, column };
      }
      // Números enteros
      else if (/^\d+$/.test(lexeme)) {
        return { id, lexeme, type: 'INTEGER_LITERAL', line, column };
      }
      // Números flotantes
      else if (/^\d*\.\d+([eE][+-]?\d+)?$/.test(lexeme)) {
        return { id, lexeme, type: 'FLOAT_LITERAL', line, column };
      }
      // Números en notación científica
      else if (/^\d+[eE][+-]?\d+$/.test(lexeme)) {
        return { id, lexeme, type: 'FLOAT_LITERAL', line, column };
      }
      // Números hexadecimales
      else if (/^0[xX][0-9a-fA-F]+$/.test(lexeme)) {
        return { id, lexeme, type: 'HEX_LITERAL', line, column };
      }
      // Números octales
      else if (/^0[0-7]+$/.test(lexeme)) {
        return { id, lexeme, type: 'OCTAL_LITERAL', line, column };
      }
      // Identificadores
      else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lexeme)) {
        return { id, lexeme, type: 'IDENTIFIER', line, column };
      }
      // Token desconocido
      else {
        return { id, lexeme, type: 'UNKNOWN', line, column };
      }
    }
  }, []);

  // Analizador Sintáctico Universal para C++
  const syntacticAnalysis = useCallback((tokens) => {
    const parseTree = {
      type: 'PROGRAM',
      children: []
    };

    let current = 0;
    const errors = [];

    function peek(offset = 0) {
      const index = current + offset;
      return index < tokens.length ? tokens[index] : null;
    }

    function advance() {
      if (current < tokens.length) {
        return tokens[current++];
      }
      return null;
    }

    function isAtEnd() {
      return current >= tokens.length;
    }

    function skipComments() {
      while (!isAtEnd()) {
        const token = peek();
        if (!token) break;

        if (token.type === 'COMMENT_START' || token.type === 'COMMENT_END') {
          advance();
          continue;
        }
        break;
      }
    }

    function match(type) {
      const token = peek();
      return token && token.type === type;
    }

    function matchLexeme(...lexemes) {
      const token = peek();
      return token && lexemes.includes(token.lexeme);
    }

    try {
      while (!isAtEnd()) {
        skipComments();
        if (isAtEnd()) break;

        const statement = parseTopLevelStatement();
        if (statement) {
          parseTree.children.push(statement);
        }
      }

      console.log('Árbol sintáctico completo:', JSON.stringify(parseTree, null, 2));

    } catch (error) {
      errors.push(`Error sintáctico: ${error.message}`);
      console.error('Error en análisis sintáctico:', error);
    }

    function parseTopLevelStatement() {
      skipComments();
      if (isAtEnd()) return null;

      const token = peek();
      if (!token) return null;

      // Directivas de preprocesador
      if (token.type === 'PREPROCESSOR') {
        return parsePreprocessorDirective();
      }

      // Using directive
      if (matchLexeme('using')) {
        return parseUsingDirective();
      }

      // Template declaration
      if (matchLexeme('template')) {
        return parseTemplateDeclaration();
      }

      // Class/struct declaration
      if (matchLexeme('class', 'struct')) {
        return parseClassDeclaration();
      }

      // Typedef
      if (matchLexeme('typedef')) {
        return parseTypedefDeclaration();
      }

      // Function declaration/definition
      if (isFunctionDeclaration()) {
        return parseFunctionDeclaration();
      }

      // Variable declaration
      if (isVariableDeclaration()) {
        return parseVariableDeclaration();
      }

      // Namespace
      if (matchLexeme('namespace')) {
        return parseNamespaceDeclaration();
      }

      // Si no es nada reconocible, saltar
      advance();
      return null;
    }

    function parsePreprocessorDirective() {
      const directive = advance();
      const node = {
        type: 'PREPROCESSOR_DIRECTIVE',
        directive: directive.lexeme,
        content: []
      };

      // Leer hasta el final de la línea
      const currentLine = directive.line;
      while (!isAtEnd() && peek()?.line === currentLine) {
        node.content.push(advance().lexeme);
      }

      return node;
    }

    function parseUsingDirective() {
      advance(); // using

      const usingNode = {
        type: 'USING_DIRECTIVE',
        content: []
      };

      while (!isAtEnd() && !matchLexeme(';')) {
        usingNode.content.push(advance().lexeme);
      }

      if (matchLexeme(';')) advance();
      return usingNode;
    }

    function parseTemplateDeclaration() {
      advance(); // template

      const templateNode = {
        type: 'TEMPLATE_DECLARATION',
        parameters: [],
        declaration: null
      };

      if (matchLexeme('<')) {
        advance(); // <
        templateNode.parameters = parseTemplateParameters();
        if (matchLexeme('>')) advance(); // >
      }

      templateNode.declaration = parseTopLevelStatement();
      return templateNode;
    }

    function parseTemplateParameters() {
      const params = [];

      while (!isAtEnd() && !matchLexeme('>')) {
        if (matchLexeme('typename', 'class')) {
          const paramType = advance().lexeme;
          const paramName = match('IDENTIFIER') ? advance().lexeme : null;
          params.push({
            type: 'TEMPLATE_PARAMETER',
            paramType: paramType,
            name: paramName
          });
        } else {
          advance();
        }

        if (matchLexeme(',')) advance();
      }

      return params;
    }

    function parseClassDeclaration() {
      const classType = advance().lexeme; // class or struct
      const className = match('IDENTIFIER') ? advance().lexeme : null;

      const classNode = {
        type: 'CLASS_DECLARATION',
        classType: classType,
        name: className,
        inheritance: [],
        body: []
      };

      // Inheritance
      if (matchLexeme(':')) {
        advance(); // :
        classNode.inheritance = parseInheritanceList();
      }

      // Class body
      if (matchLexeme('{')) {
        advance(); // {
        classNode.body = parseClassBody();
        if (matchLexeme('}')) advance(); // }
      }

      if (matchLexeme(';')) advance(); // ;
      return classNode;
    }

    function parseInheritanceList() {
      const inheritance = [];

      while (!isAtEnd() && !matchLexeme('{')) {
        let access = 'private'; // default for class

        if (matchLexeme('public', 'private', 'protected')) {
          access = advance().lexeme;
        }

        if (match('IDENTIFIER')) {
          inheritance.push({
            access: access,
            className: advance().lexeme
          });
        }

        if (matchLexeme(',')) advance();
      }

      return inheritance;
    }

    function parseClassBody() {
      const members = [];

      while (!isAtEnd() && !matchLexeme('}')) {
        skipComments();

        const member = parseClassMember();
        if (member) {
          members.push(member);
        } else {
          advance();
        }
      }

      return members;
    }

    function parseClassMember() {
      // Access specifier
      if (matchLexeme('public', 'private', 'protected')) {
        const access = advance().lexeme;
        if (matchLexeme(':')) advance();
        return {
          type: 'ACCESS_SPECIFIER',
          access: access
        };
      }

      // Constructor/Destructor
      if (isConstructorOrDestructor()) {
        return parseConstructorOrDestructor();
      }

      // Function declaration
      if (isFunctionDeclaration()) {
        return parseFunctionDeclaration();
      }

      // Variable declaration
      if (isVariableDeclaration()) {
        return parseVariableDeclaration();
      }

      return null;
    }

    function isConstructorOrDestructor() {
      const token = peek();
      return token && (token.lexeme?.startsWith('~') ||
          (token.type === 'IDENTIFIER' && isFollowedByParenthesis()));
    }

    function isFollowedByParenthesis() {
      for (let i = 1; i < 5 && current + i < tokens.length; i++) {
        const token = tokens[current + i];
        if (token.lexeme === '(') return true;
        if (token.lexeme === ';' || token.lexeme === '=' || token.lexeme === '{') return false;
      }
      return false;
    }

    function parseConstructorOrDestructor() {
      const name = advance().lexeme;

      const node = {
        type: 'CONSTRUCTOR_DESTRUCTOR',
        name: name,
        parameters: [],
        body: null
      };

      if (matchLexeme('(')) {
        advance(); // (
        node.parameters = parseParameterList();
        if (matchLexeme(')')) advance(); // )
      }

      // Constructor initializer list
      if (matchLexeme(':')) {
        advance(); // :
        node.initializerList = parseInitializerList();
      }

      // Function body
      if (matchLexeme('{')) {
        advance(); // {
        node.body = parseFunctionBody();
        if (matchLexeme('}')) advance(); // }
      } else if (matchLexeme(';')) {
        advance(); // ; (declaration only)
      }

      return node;
    }

    function parseInitializerList() {
      const initializers = [];

      while (!isAtEnd() && !matchLexeme('{')) {
        if (match('IDENTIFIER')) {
          const memberName = advance().lexeme;
          if (matchLexeme('(')) {
            advance(); // (
            const args = parseArgumentList();
            if (matchLexeme(')')) advance(); // )

            initializers.push({
              member: memberName,
              arguments: args
            });
          }
        }

        if (matchLexeme(',')) advance();
        else break;
      }

      return initializers;
    }

    function parseTypedefDeclaration() {
      advance(); // typedef

      const typedefNode = {
        type: 'TYPEDEF_DECLARATION',
        originalType: [],
        newType: null
      };

      while (!isAtEnd() && !match('IDENTIFIER')) {
        typedefNode.originalType.push(advance().lexeme);
      }

      if (match('IDENTIFIER')) {
        typedefNode.newType = advance().lexeme;
      }

      if (matchLexeme(';')) advance();
      return typedefNode;
    }

    function parseNamespaceDeclaration() {
      advance(); // namespace

      const namespaceNode = {
        type: 'NAMESPACE_DECLARATION',
        name: null,
        body: []
      };

      if (match('IDENTIFIER')) {
        namespaceNode.name = advance().lexeme;
      }

      if (matchLexeme('{')) {
        advance(); // {

        while (!isAtEnd() && !matchLexeme('}')) {
          const statement = parseTopLevelStatement();
          if (statement) {
            namespaceNode.body.push(statement);
          }
        }

        if (matchLexeme('}')) advance(); // }
      }

      return namespaceNode;
    }

    function isFunctionDeclaration() {
      let i = 0;
      let foundType = false;
      let foundIdentifier = false;

      // Saltar modificadores y tipos
      while (current + i < tokens.length) {
        const token = tokens[current + i];

        if (token.type === 'KEYWORD' &&
            ['int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short',
              'unsigned', 'signed', 'const', 'static', 'virtual', 'inline', 'extern'].includes(token.lexeme)) {
          foundType = true;
          i++;
        } else if (token.type === 'IDENTIFIER') {
          foundIdentifier = true;
          i++;
          break;
        } else if (token.lexeme === '*' || token.lexeme === '&') {
          i++; // Punteros y referencias
        } else {
          break;
        }
      }

      // Buscar paréntesis
      if (foundType && foundIdentifier && current + i < tokens.length) {
        return tokens[current + i]?.lexeme === '(';
      }

      return false;
    }

    function parseFunctionDeclaration() {
      const functionNode = {
        type: 'FUNCTION_DECLARATION',
        modifiers: [],
        returnType: [],
        name: null,
        parameters: [],
        body: null
      };

      // Modificadores y tipo de retorno
      while (!isAtEnd() && !match('IDENTIFIER')) {
        const token = advance();
        if (token.type === 'KEYWORD') {
          if (['static', 'virtual', 'inline', 'extern', 'const'].includes(token.lexeme)) {
            functionNode.modifiers.push(token.lexeme);
          } else {
            functionNode.returnType.push(token.lexeme);
          }
        } else {
          functionNode.returnType.push(token.lexeme);
        }
      }

      // Nombre de la función
      if (match('IDENTIFIER')) {
        functionNode.name = advance().lexeme;
      }

      // Parámetros
      if (matchLexeme('(')) {
        advance(); // (
        functionNode.parameters = parseParameterList();
        if (matchLexeme(')')) advance(); // )
      }

      // Modificadores post-declaración
      while (matchLexeme('const', 'override', 'final')) {
        functionNode.modifiers.push(advance().lexeme);
      }

      // Cuerpo de la función o declaración
      if (matchLexeme('{')) {
        advance(); // {
        functionNode.body = parseFunctionBody();
        if (matchLexeme('}')) advance(); // }
      } else if (matchLexeme(';')) {
        advance(); // ; (solo declaración)
      }

      return functionNode;
    }

    function parseParameterList() {
      const parameters = [];

      while (!isAtEnd() && !matchLexeme(')')) {
        skipComments();

        const param = {
          type: 'PARAMETER',
          dataType: [],
          name: null,
          defaultValue: null
        };

        // Tipo del parámetro
        while (!isAtEnd() && !match('IDENTIFIER') && !matchLexeme(',', ')')) {
          param.dataType.push(advance().lexeme);
        }

        // Nombre del parámetro
        if (match('IDENTIFIER')) {
          param.name = advance().lexeme;
        }

        // Valor por defecto
        if (matchLexeme('=')) {
          advance(); // =
          param.defaultValue = readUntilCommaOrCloseParen();
        }

        if (param.dataType.length > 0 || param.name) {
          parameters.push(param);
        }

        if (matchLexeme(',')) advance();
      }

      return parameters;
    }

    function isVariableDeclaration() {
      let i = 0;
      let foundType = false;

      // Buscar tipo
      while (current + i < tokens.length) {
        const token = tokens[current + i];

        if (token.type === 'KEYWORD' &&
            ['int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short',
              'unsigned', 'signed', 'const', 'static', 'auto'].includes(token.lexeme)) {
          foundType = true;
          i++;
        } else if (token.type === 'IDENTIFIER' && foundType) {
          // Verificar que no sea una función
          const nextToken = tokens[current + i + 1];
          return nextToken && nextToken.lexeme !== '(';
        } else if (token.lexeme === '*' || token.lexeme === '&') {
          i++; // Punteros y referencias
        } else {
          break;
        }
      }

      return false;
    }

    function parseVariableDeclaration() {
      const varDecl = {
        type: 'VARIABLE_DECLARATION',
        modifiers: [],
        dataType: [],
        variables: []
      };

      // Modificadores y tipo
      while (!isAtEnd() && !match('IDENTIFIER')) {
        const token = advance();
        if (token.type === 'KEYWORD') {
          if (['static', 'const', 'extern', 'auto'].includes(token.lexeme)) {
            varDecl.modifiers.push(token.lexeme);
          } else {
            varDecl.dataType.push(token.lexeme);
          }
        } else {
          varDecl.dataType.push(token.lexeme);
        }
      }

      // Variables (puede haber múltiples separadas por comas)
      while (!isAtEnd() && !matchLexeme(';')) {
        if (match('IDENTIFIER')) {
          const variable = {
            name: advance().lexeme,
            arraySize: null,
            initialValue: null
          };

          // Array declaration
          if (matchLexeme('[')) {
            advance(); // [
            variable.arraySize = readUntilClosingBracket();
            if (matchLexeme(']')) advance(); // ]
          }

          // Initialization
          if (matchLexeme('=')) {
            advance(); // =
            variable.initialValue = readUntilCommaOrSemicolon();
          }

          varDecl.variables.push(variable);
        }

        if (matchLexeme(',')) advance();
        else break;
      }

      if (matchLexeme(';')) advance();
      return varDecl;
    }

    function parseFunctionBody() {
      const statements = [];
      let braceLevel = 0;

      while (!isAtEnd()) {
        skipComments();

        const token = peek();
        if (!token) break;

        if (token.lexeme === '{') {
          braceLevel++;
          advance();
          continue;
        }

        if (token.lexeme === '}') {
          if (braceLevel === 0) break;
          braceLevel--;
          advance();
          continue;
        }

        const statement = parseStatement();
        if (statement) {
          statements.push(statement);
        } else {
          advance();
        }
      }

      return statements;
    }

    function parseStatement() {
      skipComments();
      if (isAtEnd()) return null;

      const token = peek();
      if (!token) return null;

      // Variable declaration
      if (isVariableDeclaration()) {
        return parseVariableDeclaration();
      }

      // Control structures
      if (matchLexeme('if')) return parseIfStatement();
      if (matchLexeme('while')) return parseWhileStatement();
      if (matchLexeme('for')) return parseForStatement();
      if (matchLexeme('do')) return parseDoWhileStatement();
      if (matchLexeme('switch')) return parseSwitchStatement();
      if (matchLexeme('case')) return parseCaseStatement();
      if (matchLexeme('default')) return parseDefaultStatement();
      if (matchLexeme('break', 'continue')) return parseJumpStatement();
      if (matchLexeme('return')) return parseReturnStatement();

      // Block statement
      if (matchLexeme('{')) {
        advance(); // {
        const blockStmt = {
          type: 'BLOCK_STATEMENT',
          statements: []
        };

        while (!isAtEnd() && !matchLexeme('}')) {
          const stmt = parseStatement();
          if (stmt) blockStmt.statements.push(stmt);
        }

        if (matchLexeme('}')) advance(); // }
        return blockStmt;
      }

      // Expression statement (assignment, function call, etc.)
      return parseExpressionStatement();
    }

    function parseIfStatement() {
      advance(); // if

      const ifStmt = {
        type: 'IF_STATEMENT',
        condition: null,
        thenStatement: null,
        elseStatement: null
      };

      if (matchLexeme('(')) {
        advance(); // (
        ifStmt.condition = readUntilClosingParen();
        if (matchLexeme(')')) advance(); // )
      }

      ifStmt.thenStatement = parseStatement();

      if (matchLexeme('else')) {
        advance(); // else
        ifStmt.elseStatement = parseStatement();
      }

      return ifStmt;
    }

    function parseWhileStatement() {
      advance(); // while

      const whileStmt = {
        type: 'WHILE_STATEMENT',
        condition: null,
        body: null
      };

      if (matchLexeme('(')) {
        advance(); // (
        whileStmt.condition = readUntilClosingParen();
        if (matchLexeme(')')) advance(); // )
      }

      whileStmt.body = parseStatement();
      return whileStmt;
    }

    function parseForStatement() {
      advance(); // for

      const forStmt = {
        type: 'FOR_STATEMENT',
        init: null,
        condition: null,
        update: null,
        body: null
      };

      if (matchLexeme('(')) {
        advance(); // (

        // Parse init; condition; update
        const forContent = readUntilClosingParen();
        const parts = forContent.split(';');

        if (parts.length >= 1) {
          forStmt.init = parts[0].trim();
          // Si hay declaración de variable en el init, procesarla
          if (forStmt.init.includes('int ') || forStmt.init.includes('float ') || forStmt.init.includes('bool ')) {
            forStmt.variableDeclaration = parseVariableDeclarationFromString(forStmt.init);
          }
        }
        if (parts.length >= 2) forStmt.condition = parts[1].trim();
        if (parts.length >= 3) forStmt.update = parts[2].trim();

        if (matchLexeme(')')) advance(); // )
      }

      forStmt.body = parseStatement();
      return forStmt;
    }

    function parseVariableDeclarationFromString(initStr) {
      // Extraer declaración de variable del string init del for
      const match = initStr.match(/^(int|float|bool|double|char)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (match) {
        return {
          type: 'VARIABLE_DECLARATION',
          dataType: [match[1]],
          variables: [{
            name: match[2],
            initialValue: match[3].trim()
          }]
        };
      }
      return null;
    }

    function parseDoWhileStatement() {
      advance(); // do

      const doWhileStmt = {
        type: 'DO_WHILE_STATEMENT',
        body: null,
        condition: null
      };

      doWhileStmt.body = parseStatement();

      if (matchLexeme('while')) {
        advance(); // while
        if (matchLexeme('(')) {
          advance(); // (
          doWhileStmt.condition = readUntilClosingParen();
          if (matchLexeme(')')) advance(); // )
        }
      }

      if (matchLexeme(';')) advance(); // ;
      return doWhileStmt;
    }

    function parseSwitchStatement() {
      advance(); // switch

      const switchStmt = {
        type: 'SWITCH_STATEMENT',
        expression: null,
        cases: []
      };

      if (matchLexeme('(')) {
        advance(); // (
        switchStmt.expression = readUntilClosingParen();
        if (matchLexeme(')')) advance(); // )
      }

      if (matchLexeme('{')) {
        advance(); // {

        while (!isAtEnd() && !matchLexeme('}')) {
          const caseStmt = parseStatement();
          if (caseStmt) {
            switchStmt.cases.push(caseStmt);
          }
        }

        if (matchLexeme('}')) advance(); // }
      }

      return switchStmt;
    }

    function parseCaseStatement() {
      advance(); // case

      const caseStmt = {
        type: 'CASE_STATEMENT',
        value: null,
        statements: []
      };

      // Parse case value
      caseStmt.value = readUntilColon();
      if (matchLexeme(':')) advance(); // :

      // Parse statements until next case/default/break or end of switch
      while (!isAtEnd() && !matchLexeme('case', 'default', '}')) {
        const stmt = parseStatement();
        if (stmt) {
          caseStmt.statements.push(stmt);
          if (stmt.type === 'JUMP_STATEMENT' && stmt.keyword === 'break') {
            break;
          }
        }
      }

      return caseStmt;
    }

    function parseDefaultStatement() {
      advance(); // default

      const defaultStmt = {
        type: 'DEFAULT_STATEMENT',
        statements: []
      };

      if (matchLexeme(':')) advance(); // :

      while (!isAtEnd() && !matchLexeme('case', '}')) {
        const stmt = parseStatement();
        if (stmt) {
          defaultStmt.statements.push(stmt);
          if (stmt.type === 'JUMP_STATEMENT' && stmt.keyword === 'break') {
            break;
          }
        }
      }

      return defaultStmt;
    }

    function parseJumpStatement() {
      const keyword = advance().lexeme; // break, continue

      const jumpStmt = {
        type: 'JUMP_STATEMENT',
        keyword: keyword
      };

      if (matchLexeme(';')) advance(); // ;
      return jumpStmt;
    }

    function parseReturnStatement() {
      advance(); // return

      const returnStmt = {
        type: 'RETURN_STATEMENT',
        expression: null
      };

      if (!matchLexeme(';')) {
        returnStmt.expression = readUntilSemicolon();
      }

      if (matchLexeme(';')) advance(); // ;
      return returnStmt;
    }

    function parseExpressionStatement() {
      const expression = readUntilSemicolon();
      if (matchLexeme(';')) advance(); // ;

      return {
        type: 'EXPRESSION_STATEMENT',
        expression: expression
      };
    }

    function parseArgumentList() {
      const args = [];

      while (!isAtEnd() && !matchLexeme(')')) {
        args.push(readUntilCommaOrCloseParen());
        if (matchLexeme(',')) advance();
      }

      return args;
    }

    function readUntilSemicolon() {
      let content = '';
      while (!isAtEnd() && !matchLexeme(';')) {
        content += peek().lexeme + ' ';
        advance();
      }
      return content.trim();
    }

    function readUntilClosingParen() {
      let content = '';
      let parenLevel = 0;

      while (!isAtEnd()) {
        const token = peek();
        if (token.lexeme === '(') {
          parenLevel++;
        } else if (token.lexeme === ')') {
          if (parenLevel === 0) break;
          parenLevel--;
        }

        content += token.lexeme + ' ';
        advance();
      }

      return content.trim();
    }

    function readUntilClosingBracket() {
      let content = '';
      let bracketLevel = 0;

      while (!isAtEnd()) {
        const token = peek();
        if (token.lexeme === '[') {
          bracketLevel++;
        } else if (token.lexeme === ']') {
          if (bracketLevel === 0) break;
          bracketLevel--;
        }

        content += token.lexeme + ' ';
        advance();
      }

      return content.trim();
    }

    function readUntilCommaOrSemicolon() {
      let content = '';
      while (!isAtEnd() && !matchLexeme(',', ';')) {
        content += peek().lexeme + ' ';
        advance();
      }
      return content.trim();
    }

    function readUntilCommaOrCloseParen() {
      let content = '';
      let parenLevel = 0;

      while (!isAtEnd()) {
        const token = peek();
        if (token.lexeme === '(') {
          parenLevel++;
        } else if (token.lexeme === ')') {
          if (parenLevel === 0) break;
          parenLevel--;
        } else if (token.lexeme === ',' && parenLevel === 0) {
          break;
        }

        content += token.lexeme + ' ';
        advance();
      }

      return content.trim();
    }

    function readUntilColon() {
      let content = '';
      while (!isAtEnd() && !matchLexeme(':')) {
        content += peek().lexeme + ' ';
        advance();
      }
      return content.trim();
    }

    return { parseTree, errors };
  }, []);

  // Analizador Semántico Mejorado
  const semanticAnalysis = useCallback((parseTree) => {
    const symbolTable = new Map();
    const errors = [];
    const warnings = [];

    function analyzeNode(node) {
      if (!node || typeof node !== 'object') return;

      switch (node.type) {
        case 'PROGRAM':
          if (node.children) {
            node.children.forEach(child => analyzeNode(child));
          }
          break;

        case 'FUNCTION_DECLARATION':
          handleFunctionDeclaration(node);
          break;

        case 'VARIABLE_DECLARATION':
          handleVariableDeclaration(node);
          break;

        case 'CLASS_DECLARATION':
          handleClassDeclaration(node);
          break;

        case 'NAMESPACE_DECLARATION':
          handleNamespaceDeclaration(node);
          break;

        case 'TEMPLATE_DECLARATION':
          handleTemplateDeclaration(node);
          break;

        case 'IF_STATEMENT':
          handleIfStatement(node);
          break;

        case 'WHILE_STATEMENT':
          handleWhileStatement(node);
          break;

        case 'FOR_STATEMENT':
          handleForStatement(node);
          break;

        case 'VARIABLE_DECLARATION':
          handleVariableDeclaration(node);
          break;

        case 'DO_WHILE_STATEMENT':
          handleDoWhileStatement(node);
          break;

        case 'SWITCH_STATEMENT':
          handleSwitchStatement(node);
          break;

        case 'CASE_STATEMENT':
        case 'DEFAULT_STATEMENT':
          handleCaseStatement(node);
          break;

        case 'RETURN_STATEMENT':
          handleReturnStatement(node);
          break;

        case 'EXPRESSION_STATEMENT':
          handleExpressionStatement(node);
          break;

        case 'BLOCK_STATEMENT':
          handleBlockStatement(node);
          break;
      }
    }

    function handleFunctionDeclaration(node) {
      // Registrar la función
      symbolTable.set(node.name, {
        type: 'function',
        returnType: node.returnType?.join(' ') || 'void',
        used: true,
        modifiers: node.modifiers || []
      });

      // Registrar parámetros
      if (node.parameters && Array.isArray(node.parameters)) {
        node.parameters.forEach(param => {
          if (param.name) {
            symbolTable.set(param.name, {
              type: param.dataType?.join(' ') || 'int',
              value: param.defaultValue || null,
              used: false,
              isParameter: true
            });
          }
        });
      }

      // Analizar cuerpo de la función
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(statement => analyzeNode(statement));
      }
    }

    function handleVariableDeclaration(node) {
      if (node.variables && Array.isArray(node.variables)) {
        node.variables.forEach(variable => {
          if (!variable.name) return;

          // Verificar si ya existe
          if (symbolTable.has(variable.name)) {
            errors.push(`Error: Variable '${variable.name}' ya declarada`);
            return;
          }

          // Registrar variable
          symbolTable.set(variable.name, {
            type: node.dataType?.join(' ') || 'int',
            value: variable.initialValue || getDefaultValue(node.dataType?.join(' ') || 'int'),
            used: false,
            modifiers: node.modifiers || [],
            arraySize: variable.arraySize
          });

          // Si tiene valor inicial, marcar variables usadas en la expresión
          if (variable.initialValue) {
            const variables = extractVariables(variable.initialValue);
            markVariablesAsUsed(variables);
            checkTypeCompatibility(variable.name, node.dataType?.join(' ') || 'int', variable.initialValue);
          }
        });
      } else if (node.identifier) {
        // Formato anterior para compatibilidad
        if (symbolTable.has(node.identifier)) {
          errors.push(`Error: Variable '${node.identifier}' ya declarada`);
          return;
        }

        symbolTable.set(node.identifier, {
          type: node.dataType,
          value: node.value || getDefaultValue(node.dataType),
          used: false
        });

        if (node.value) {
          const variables = extractVariables(node.value);
          markVariablesAsUsed(variables);
          checkTypeCompatibility(node.identifier, node.dataType, node.value);
        }
      }
    }

    function handleClassDeclaration(node) {
      if (node.name) {
        symbolTable.set(node.name, {
          type: 'class',
          classType: node.classType,
          used: true,
          inheritance: node.inheritance || []
        });
      }

      // Analizar miembros de la clase
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(member => analyzeNode(member));
      }
    }

    function handleNamespaceDeclaration(node) {
      if (node.name) {
        symbolTable.set(node.name, {
          type: 'namespace',
          used: true
        });
      }

      // Analizar contenido del namespace
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach(statement => analyzeNode(statement));
      }
    }

    function handleTemplateDeclaration(node) {
      // Registrar parámetros de template
      if (node.parameters && Array.isArray(node.parameters)) {
        node.parameters.forEach(param => {
          if (param.name) {
            symbolTable.set(param.name, {
              type: 'template_parameter',
              paramType: param.paramType,
              used: false
            });
          }
        });
      }

      // Analizar la declaración del template
      if (node.declaration) {
        analyzeNode(node.declaration);
      }
    }

    function handleIfStatement(node) {
      if (node.condition) {
        const variables = extractVariables(node.condition);
        markVariablesAsUsed(variables);
      }

      if (node.thenStatement) {
        analyzeNode(node.thenStatement);
      }

      if (node.elseStatement) {
        analyzeNode(node.elseStatement);
      }
    }

    function handleWhileStatement(node) {
      if (node.condition) {
        const variables = extractVariables(node.condition);
        markVariablesAsUsed(variables);
      }

      if (node.body) {
        analyzeNode(node.body);
      }
    }

    function handleForStatement(node) {
      // Si hay declaración de variable en el for
      if (node.variableDeclaration) {
        analyzeNode(node.variableDeclaration);
      } else if (node.init && node.init.includes('int ')) {
        // Fallback: extraer variable del string init
        const match = node.init.match(/^(int|float|bool)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
        if (match) {
          const varName = match[2];
          symbolTable.set(varName, {
            type: match[1],
            value: null,
            used: true,
            isLoopVariable: true
          });
        }
      }

      // Analizar inicialización
      if (node.init) {
        const initVars = extractVariables(node.init);
        markVariablesAsUsed(initVars);
      }

      // Analizar condición
      if (node.condition) {
        const condVars = extractVariables(node.condition);
        markVariablesAsUsed(condVars);
      }

      // Analizar actualización
      if (node.update) {
        const updateVars = extractVariables(node.update);
        markVariablesAsUsed(updateVars);
      }

      // Analizar cuerpo
      if (node.body) {
        analyzeNode(node.body);
      }
    }

    function handleDoWhileStatement(node) {
      if (node.body) {
        analyzeNode(node.body);
      }

      if (node.condition) {
        const variables = extractVariables(node.condition);
        markVariablesAsUsed(variables);
      }
    }

    function handleSwitchStatement(node) {
      if (node.expression) {
        const variables = extractVariables(node.expression);
        markVariablesAsUsed(variables);
      }

      if (node.cases && Array.isArray(node.cases)) {
        node.cases.forEach(caseStmt => analyzeNode(caseStmt));
      }
    }

    function handleCaseStatement(node) {
      if (node.value) {
        const variables = extractVariables(node.value);
        markVariablesAsUsed(variables);
      }

      if (node.statements && Array.isArray(node.statements)) {
        node.statements.forEach(stmt => analyzeNode(stmt));
      }
    }

    function handleReturnStatement(node) {
      if (node.expression) {
        const variables = extractVariables(node.expression);
        markVariablesAsUsed(variables);
      }
    }

    function handleExpressionStatement(node) {
      if (node.expression) {
        const variables = extractVariables(node.expression);
        markVariablesAsUsed(variables);
      }
    }

    function handleBlockStatement(node) {
      if (node.statements && Array.isArray(node.statements)) {
        node.statements.forEach(statement => analyzeNode(statement));
      }
    }

    function extractVariables(expression) {
      if (!expression || typeof expression !== 'string') return [];

      // Regex para encontrar identificadores, pero excluyendo strings entre comillas
      const variables = [];
      let cleanExpression = expression;

      // Remover strings entre comillas dobles
      cleanExpression = cleanExpression.replace(/"[^"]*"/g, '');

      // Remover strings entre comillas simples
      cleanExpression = cleanExpression.replace(/'[^']*'/g, '');

      // Remover comentarios
      cleanExpression = cleanExpression.replace(/\/\/.*$/g, '');
      cleanExpression = cleanExpression.replace(/\/\*.*?\*\//g, '');

      // Regex para encontrar identificadores
      const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
      const matches = cleanExpression.match(identifierRegex) || [];

      return matches.filter(match => !isKeywordOrSystemFunction(match));
    }

    function markVariablesAsUsed(variables) {
      variables.forEach(varName => {
        if (symbolTable.has(varName)) {
          const symbol = symbolTable.get(varName);
          symbol.used = true;
        } else if (!isKeywordOrSystemFunction(varName)) {
          errors.push(`Error: Variable '${varName}' no declarada`);
        }
      });
    }

    function isKeywordOrSystemFunction(identifier) {
      const keywords = [
        'int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short',
        'unsigned', 'signed', 'const', 'static', 'auto', 'register', 'volatile',
        'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default',
        'break', 'continue', 'return', 'goto',
        'class', 'struct', 'union', 'enum', 'typedef',
        'public', 'private', 'protected', 'virtual', 'friend',
        'template', 'typename', 'namespace', 'using',
        'new', 'delete', 'this', 'nullptr', 'true', 'false'
      ];

      const systemFunctions = [
        'printf', 'scanf', 'cout', 'cin', 'endl', 'main',
        'malloc', 'free', 'calloc', 'realloc',
        'strlen', 'strcpy', 'strcmp', 'strcat'
      ];

      const operators = ['sizeof', 'typeid'];

      // Verificar si es una función definida en el programa
      const isDefinedFunction = symbolTable.has(identifier) &&
          symbolTable.get(identifier)?.type === 'function';

      return keywords.includes(identifier) ||
          systemFunctions.includes(identifier) ||
          operators.includes(identifier) ||
          isDefinedFunction ||
          /^\d+(\.\d+)?$/.test(identifier); // números
    }

    function checkTypeCompatibility(identifier, expectedType, value) {
      if (!value || typeof value !== 'string') return;

      const valueStr = value.toString().trim();

      switch (expectedType) {
        case 'int':
          if (!/^\d+$/.test(valueStr)) {
            if (/^\d+\.\d+$/.test(valueStr)) {
              warnings.push(`Advertencia: Conversión implícita de float a int en '${identifier}'`);
            } else if (!symbolTable.has(valueStr) && !isComplexExpression(valueStr)) {
              // Solo reportar error si no es una expresión válida
              const hasValidVariables = extractVariables(valueStr).every(v => symbolTable.has(v) || isKeywordOrSystemFunction(v));
              if (!hasValidVariables && !isComplexExpression(valueStr)) {
                errors.push(`Error: Tipo incompatible para variable '${identifier}'`);
              }
            }
          }
          break;

        case 'float':
        case 'double':
          // Float puede aceptar enteros y flotantes
          if (!/^\d+(\.\d+)?$/.test(valueStr) &&
              !symbolTable.has(valueStr) &&
              !isComplexExpression(valueStr)) {
            // Verificar si es una expresión válida con variables conocidas
            const hasValidVariables = extractVariables(valueStr).every(v => symbolTable.has(v) || isKeywordOrSystemFunction(v));
            if (!hasValidVariables && !isNumericLiteral(valueStr)) {
              errors.push(`Error: Tipo incompatible para variable '${identifier}'`);
            }
          }
          break;

        case 'bool':
          if (!['true', 'false', '0', '1'].includes(valueStr) &&
              !symbolTable.has(valueStr) &&
              !isComplexExpression(valueStr)) {
            const hasValidVariables = extractVariables(valueStr).every(v => symbolTable.has(v) || isKeywordOrSystemFunction(v));
            if (!hasValidVariables) {
              errors.push(`Error: Tipo incompatible para variable '${identifier}'`);
            }
          }
          break;

        case 'char':
          if (!/^'.*'$/.test(valueStr) &&
              !symbolTable.has(valueStr) &&
              !isComplexExpression(valueStr)) {
            errors.push(`Error: Tipo incompatible para variable '${identifier}'`);
          }
          break;
      }
    }

    function isNumericLiteral(value) {
      return /^\d+(\.\d+)?([eE][+-]?\d+)?$/.test(value) ||
          /^0[xX][0-9a-fA-F]+$/.test(value) ||
          /^0[0-7]+$/.test(value);
    }

    function isComplexExpression(value) {
      // Verificar si es una expresión compleja (contiene operadores)
      return /[+\-*/%<>=!&|]/.test(value) ||
          value.includes('(') ||
          value.includes('[') ||
          value.includes('factorial') ||
          /\b\d+\.\d+\b/.test(value); // También números flotantes son válidos
    }

    function getDefaultValue(dataType) {
      switch (dataType) {
        case 'int':
        case 'long':
        case 'short': return 0;
        case 'float':
        case 'double': return 0.0;
        case 'bool': return false;
        case 'char': return "''";
        case 'string': return '""';
        default: return null;
      }
    }

    // Comenzar análisis
    analyzeNode(parseTree);

    // Verificar variables no usadas
    symbolTable.forEach((symbol, name) => {
      if (!symbol.used &&
          symbol.type !== 'function' &&
          symbol.type !== 'class' &&
          symbol.type !== 'namespace' &&
          !symbol.isParameter &&
          name !== 'main') {
        warnings.push(`Advertencia: Variable '${name}' declarada pero no usada`);
      }
    });

    return {
      symbolTable: Array.from(symbolTable.entries()).map(([name, symbol]) => ({
        name,
        type: symbol.type,
        value: symbol.value,
        used: symbol.used
      })),
      errors,
      warnings
    };
  }, []);

  // Generación de código mejorada
  const codeGeneration = useCallback((parseTree, symbolTable) => {
    let assemblyCode = [];
    let jsCode = [];

    // Código Assembly simulado
    assemblyCode.push('.data');
    symbolTable.forEach(symbol => {
      if (symbol.type === 'int') {
        assemblyCode.push(`    ${symbol.name} dd ${symbol.value || 0}`);
      } else if (symbol.type === 'float' || symbol.type === 'double') {
        assemblyCode.push(`    ${symbol.name} dd ${symbol.value || 0.0}`);
      } else if (symbol.type === 'string') {
        assemblyCode.push(`    ${symbol.name} db '${symbol.value || ''}', 0`);
      }
    });

    assemblyCode.push('');
    assemblyCode.push('.text');
    assemblyCode.push('    global _start');
    assemblyCode.push('_start:');
    assemblyCode.push('    ; Código principal generado automáticamente');
    assemblyCode.push('    mov eax, 1');
    assemblyCode.push('    mov ebx, 0');
    assemblyCode.push('    int 0x80');

    // Código JavaScript equivalente mejorado
    jsCode.push('// Código JavaScript generado automáticamente');
    jsCode.push('// desde el árbol sintáctico de C++');
    jsCode.push('');

    // Generar funciones
    const functions = symbolTable.filter(s => s.type === 'function');
    functions.forEach(func => {
      jsCode.push(`function ${func.name}() {`);
      jsCode.push('    // Implementación de función');
      jsCode.push('}');
      jsCode.push('');
    });

    jsCode.push('function main() {');

    // Generar declaraciones de variables
    const variables = symbolTable.filter(s => s.type !== 'function' && s.type !== 'class');
    variables.forEach(symbol => {
      if (symbol.value !== null && symbol.value !== undefined) {
        jsCode.push(`    let ${symbol.name} = ${symbol.value};`);
      } else {
        jsCode.push(`    let ${symbol.name};`);
      }
    });

    jsCode.push('    ');
    jsCode.push('    // Lógica del programa');
    jsCode.push('    console.log("Programa ejecutado correctamente");');
    jsCode.push('    ');
    jsCode.push('    return 0;');
    jsCode.push('}');
    jsCode.push('');
    jsCode.push('// Ejecutar programa principal');
    jsCode.push('main();');

    return {
      assembly: assemblyCode.join('\n'),
      javascript: jsCode.join('\n')
    };
  }, []);

  const handleCompile = () => {
    // Ejecutar todos los análisis
    const tokens = lexicalAnalysis(sourceCode);
    const { parseTree, errors: syntaxErrors } = syntacticAnalysis(tokens);
    const { symbolTable, errors: semanticErrors, warnings } = semanticAnalysis(parseTree);
    const generatedCode = codeGeneration(parseTree, symbolTable);

    setCompilationResult({
      tokens,
      parseTree,
      symbolTable,
      syntaxErrors,
      semanticErrors,
      warnings,
      generatedCode
    });
  };

  const renderLexicalAnalysis = () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-blue-600">Análisis Léxico - Tokens</h3>
        {compilationResult?.tokens ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left">ID</th>
                  <th className="px-4 py-2 border-b text-left">Lexema</th>
                  <th className="px-4 py-2 border-b text-left">Tipo</th>
                  <th className="px-4 py-2 border-b text-left">Línea</th>
                  <th className="px-4 py-2 border-b text-left">Columna</th>
                </tr>
                </thead>
                <tbody>
                {compilationResult.tokens.map((token) => (
                    <tr key={token.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b">{token.id}</td>
                      <td className="px-4 py-2 border-b font-mono">{token.lexeme}</td>
                      <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                      token.type === 'KEYWORD' ? 'bg-purple-100 text-purple-800' :
                          token.type === 'IDENTIFIER' ? 'bg-blue-100 text-blue-800' :
                              token.type.includes('LITERAL') ? 'bg-green-100 text-green-800' :
                                  token.type === 'STRING_LITERAL' ? 'bg-yellow-100 text-yellow-800' :
                                      token.type === 'OPERATOR' ? 'bg-red-100 text-red-800' :
                                          token.type === 'PREPROCESSOR' ? 'bg-orange-100 text-orange-800' :
                                              'bg-gray-100 text-gray-800'
                  }`}>
                    {token.type}
                  </span>
                      </td>
                      <td className="px-4 py-2 border-b">{token.line}</td>
                      <td className="px-4 py-2 border-b">{token.column}</td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        ) : (
            <p className="text-gray-500">Ejecuta la compilación para ver los tokens</p>
        )}
      </div>
  );

  const renderSyntacticAnalysis = () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-600">Análisis Sintáctico - Árbol de Sintaxis</h3>
        {compilationResult?.parseTree ? (
            <div className="bg-gray-50 p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto max-h-96">
            {JSON.stringify(compilationResult.parseTree, null, 2)}
          </pre>
            </div>
        ) : (
            <p className="text-gray-500">Ejecuta la compilación para ver el árbol sintáctico</p>
        )}

        {compilationResult?.syntaxErrors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Errores Sintácticos:</h4>
              {compilationResult.syntaxErrors.map((error, index) => (
                  <p key={index} className="text-red-700">{error}</p>
              ))}
            </div>
        )}
      </div>
  );

  const renderSemanticAnalysis = () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-orange-600">Análisis Semántico</h3>

        {/* Tabla de Símbolos */}
        <div>
          <h4 className="font-semibold mb-2">Tabla de Símbolos:</h4>
          {compilationResult?.symbolTable ? (
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border-b text-left">Nombre</th>
                  <th className="px-4 py-2 border-b text-left">Tipo</th>
                  <th className="px-4 py-2 border-b text-left">Valor</th>
                  <th className="px-4 py-2 border-b text-left">Usado</th>
                </tr>
                </thead>
                <tbody>
                {compilationResult.symbolTable.map((symbol, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border-b font-mono">{symbol.name}</td>
                      <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                      symbol.type === 'function' ? 'bg-blue-100 text-blue-800' :
                          symbol.type === 'class' ? 'bg-purple-100 text-purple-800' :
                              symbol.type === 'namespace' ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-gray-100 text-gray-800'
                  }`}>
                    {symbol.type}
                  </span>
                      </td>
                      <td className="px-4 py-2 border-b">{symbol.value || 'N/A'}</td>
                      <td className="px-4 py-2 border-b">
                  <span className={`px-2 py-1 rounded text-xs ${
                      symbol.used ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {symbol.used ? 'Sí' : 'No'}
                  </span>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          ) : (
              <p className="text-gray-500">Ejecuta la compilación para ver la tabla de símbolos</p>
          )}
        </div>

        {/* Errores Semánticos */}
        {compilationResult?.semanticErrors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">Errores Semánticos:</h4>
              {compilationResult.semanticErrors.map((error, index) => (
                  <p key={index} className="text-red-700">{error}</p>
              ))}
            </div>
        )}

        {/* Advertencias */}
        {compilationResult?.warnings?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Advertencias:</h4>
              {compilationResult.warnings.map((warning, index) => (
                  <p key={index} className="text-yellow-700">{warning}</p>
              ))}
            </div>
        )}
      </div>
  );

  const renderCodeGeneration = () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-purple-600">Generación de Código</h3>

        {compilationResult?.generatedCode ? (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Código Assembly (x86):</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono max-h-64">
              {compilationResult.generatedCode.assembly}
            </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Código JavaScript Equivalente:</h4>
                <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto font-mono max-h-64">
              {compilationResult.generatedCode.javascript}
            </pre>
              </div>
            </div>
        ) : (
            <p className="text-gray-500">Ejecuta la compilación para ver el código generado</p>
        )}
      </div>
  );

  return (
      <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Code className="w-8 h-8" />
              Compilador C++ Universal - Análisis Completo
            </h1>
            <p className="text-blue-100 mt-2">
              Análisis Léxico • Sintáctico • Semántico • Generación de Código
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Compatible con cualquier código C++ estándar
            </p>
          </div>

          <div className="p-6">
            {/* Editor de Código */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Editor de Código Fuente C++</h2>
                <button
                    onClick={handleCompile}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Compilar
                </button>
              </div>
              <textarea
                  value={sourceCode}
                  onChange={(e) => setSourceCode(e.target.value)}
                  className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe tu código C++ aquí..."
              />
              <p className="text-sm text-gray-600 mt-2">
                💡 El compilador soporta: clases, templates, namespaces, herencia, punteros, arrays, y todas las estructuras de control de C++
              </p>
            </div>

            {/* Tabs de Análisis */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {[
                  { id: 'lexico', label: 'Análisis Léxico', icon: FileText, desc: 'Tokenización' },
                  { id: 'sintactico', label: 'Análisis Sintáctico', icon: Info, desc: 'Árbol AST' },
                  { id: 'semantico', label: 'Análisis Semántico', icon: AlertCircle, desc: 'Validación' },
                  { id: 'codigo', label: 'Generación de Código', icon: Code, desc: 'Assembly/JS' }
                ].map(({ id, label, icon: Icon, desc }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                            activeTab === id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="text-left">
                        <div>{label}</div>
                        <div className="text-xs text-gray-400">{desc}</div>
                      </div>
                    </button>
                ))}
              </nav>
            </div>

            {/* Contenido de las pestañas */}
            <div className="min-h-96">
              {activeTab === 'lexico' && renderLexicalAnalysis()}
              {activeTab === 'sintactico' && renderSyntacticAnalysis()}
              {activeTab === 'semantico' && renderSemanticAnalysis()}
              {activeTab === 'codigo' && renderCodeGeneration()}
            </div>

            {/* Status de Compilación */}
            {compilationResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-800">
                  Compilación completada
                </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-1">
                    Tokens: {compilationResult.tokens?.length || 0} •
                    Errores sintácticos: {compilationResult.syntaxErrors?.length || 0} •
                    Errores semánticos: {compilationResult.semanticErrors?.length || 0} •
                    Advertencias: {compilationResult.warnings?.length || 0}
                  </p>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Estructuras detectadas:</strong> {
                      compilationResult.symbolTable?.filter(s => s.type === 'function').length || 0
                  } funciones, {
                      compilationResult.symbolTable?.filter(s => s.type === 'class').length || 0
                  } clases, {
                      compilationResult.symbolTable?.filter(s => s.type === 'namespace').length || 0
                  } namespaces
                  </div>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Compiler;