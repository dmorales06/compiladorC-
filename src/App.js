import React, {useState, useCallback} from 'react';
import {Play, Code, AlertCircle, CheckCircle, Info, FileText} from 'lucide-react';

const Compiler = () => {
    const [sourceCode, setSourceCode] = useState(`int prueba(){
    int a, suma;
    string b;
    suma = a + b;  // Error: int + string incompatible
}`);
    const [activeTab, setActiveTab] = useState('lexico');
    const [compilationResult, setCompilationResult] = useState(null);

    // Analizador Léxico (mismo que antes)
    const lexicalAnalysis = useCallback((code) => {
        const tokens = [];
        const keywords = [
            'int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short', 'unsigned', 'signed',
            'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default', 'break', 'continue',
            'return', 'class', 'struct', 'public', 'private', 'protected', 'virtual', 'static', 'const',
            'using', 'namespace', 'include', 'define', 'typedef', 'template', 'typename',
            'true', 'false', 'null', 'nullptr', 'this',
            'new', 'delete', 'sizeof', 'operator', 'friend', 'inline', 'extern',
            'auto', 'register', 'volatile', 'mutable'
        ];

        const operators = [
            '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=',
            '==', '!=', '<=', '>=', '<<', '>>',
            '&&', '||',
            '++', '--',
            '->', '::',
            '=', '+', '-', '*', '/', '%', '<', '>', '!', '&', '|', '^', '~', '?', ':'
        ];

        const delimiters = ['(', ')', '{', '}', '[', ']', ';', ',', '.', '"', "'"];
        const lines = code.split('\n');
        let tokenId = 1;
        let inBlockComment = false;

        lines.forEach((line, lineNum) => {
            let i = 0;

            while (i < line.length) {
                const char = line[i];

                if (inBlockComment) {
                    if (char === '*' && line[i + 1] === '/') {
                        inBlockComment = false;
                        i += 2;
                    } else {
                        i++;
                    }
                    continue;
                }

                if (/\s/.test(char)) {
                    i++;
                    continue;
                }

                let startColumn = i;

                if (char === '/' && line[i + 1] === '/') {
                    break;
                }

                if (char === '/' && line[i + 1] === '*') {
                    inBlockComment = true;
                    i += 2;
                    continue;
                }

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

                if (delimiters.includes(char)) {
                    if (char === '"') {
                        let stringContent = '"';
                        i++;

                        while (i < line.length && line[i] !== '"') {
                            if (line[i] === '\\' && i + 1 < line.length) {
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
                    else if (char === "'") {
                        let charContent = "'";
                        i++;

                        while (i < line.length && line[i] !== "'") {
                            if (line[i] === '\\' && i + 1 < line.length) {
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

                let currentToken = '';
                while (i < line.length &&
                !operators.some(op => line.substr(i, op.length) === op) &&
                !delimiters.includes(line[i]) &&
                !/\s/.test(line[i])) {
                    currentToken += line[i];
                    i++;
                }

                if (currentToken) {
                    tokens.push(categorizeToken(currentToken, tokenId++, lineNum + 1, startColumn + 1));
                }
            }
        });

        return tokens;

        function categorizeToken(lexeme, id, line, column) {
            if (keywords.includes(lexeme)) {
                return {id, lexeme, type: 'KEYWORD', line, column};
            } else if (/^\d+$/.test(lexeme)) {
                return {id, lexeme, type: 'INTEGER_LITERAL', line, column};
            } else if (/^\d*\.\d+([eE][+-]?\d+)?$/.test(lexeme)) {
                return {id, lexeme, type: 'FLOAT_LITERAL', line, column};
            } else if (/^\d+[eE][+-]?\d+$/.test(lexeme)) {
                return {id, lexeme, type: 'FLOAT_LITERAL', line, column};
            } else if (/^0[xX][0-9a-fA-F]+$/.test(lexeme)) {
                return {id, lexeme, type: 'HEX_LITERAL', line, column};
            } else if (/^0[0-7]+$/.test(lexeme)) {
                return {id, lexeme, type: 'OCTAL_LITERAL', line, column};
            } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(lexeme)) {
                return {id, lexeme, type: 'IDENTIFIER', line, column};
            } else {
                return {id, lexeme, type: 'UNKNOWN', line, column};
            }
        }
    }, []);

    // Analizador Sintáctico (mismo que antes)
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

        function expect(expected, errorMessage) {
            const token = peek();
            if (!token) {
                errors.push(`Error línea ${current}: Se esperaba '${expected}' pero se encontró fin de archivo. ${errorMessage}`);
                return false;
            }

            if (Array.isArray(expected)) {
                if (!expected.some(exp => token.lexeme === exp || token.type === exp)) {
                    errors.push(`Error línea ${token.line}: Se esperaba uno de [${expected.join(', ')}] pero se encontró '${token.lexeme}'. ${errorMessage}`);
                    return false;
                }
            } else {
                if (token.lexeme !== expected && token.type !== expected) {
                    errors.push(`Error línea ${token.line}: Se esperaba '${expected}' pero se encontró '${token.lexeme}'. ${errorMessage}`);
                    return false;
                }
            }

            advance();
            return true;
        }

        function synchronize() {
            while (!isAtEnd()) {
                const token = peek();
                if (!token) break;

                if (token.lexeme === ';' || token.lexeme === '}' ||
                    token.lexeme === '{' || token.type === 'KEYWORD') {
                    return;
                }
                advance();
            }
        }

        try {
            while (!isAtEnd()) {
                skipComments();
                if (isAtEnd()) break;

                try {
                    const statement = parseTopLevelStatement();
                    if (statement) {
                        parseTree.children.push(statement);
                    }
                } catch (error) {
                    errors.push(`Error sintáctico línea ${peek()?.line || 'EOF'}: ${error.message}`);
                    synchronize();
                }
            }
        } catch (error) {
            errors.push(`Error fatal en análisis sintáctico: ${error.message}`);
        }

        function parseTopLevelStatement() {
            skipComments();
            if (isAtEnd()) return null;

            const token = peek();
            if (!token) return null;

            if (token.type === 'PREPROCESSOR') {
                return parsePreprocessorDirective();
            }

            if (matchLexeme('using')) {
                return parseUsingDirective();
            }

            if (matchLexeme('template')) {
                return parseTemplateDeclaration();
            }

            if (matchLexeme('class', 'struct')) {
                return parseClassDeclaration();
            }

            if (matchLexeme('typedef')) {
                return parseTypedefDeclaration();
            }

            if (isFunctionDeclaration()) {
                return parseFunctionDeclaration();
            }

            if (isVariableDeclaration()) {
                return parseVariableDeclaration();
            }

            if (matchLexeme('namespace')) {
                return parseNamespaceDeclaration();
            }

            errors.push(`Error línea ${token.line}: Token inesperado '${token.lexeme}' a nivel superior`);
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

            if (!expect(';', `Se esperaba ';' al final de la directiva using`)) {
                return null;
            }

            return usingNode;
        }

        function parseTemplateDeclaration() {
            advance(); // template

            const templateNode = {
                type: 'TEMPLATE_DECLARATION',
                parameters: [],
                declaration: null
            };

            if (!expect('<', `Se esperaba '<' después de template`)) {
                return null;
            }

            templateNode.parameters = parseTemplateParameters();

            if (!expect('>', `Se esperaba '>' para cerrar parámetros de template`)) {
                return null;
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
            const classType = advance().lexeme;

            if (!match('IDENTIFIER')) {
                errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba nombre de clase después de '${classType}'`);
                return null;
            }

            const className = advance().lexeme;

            const classNode = {
                type: 'CLASS_DECLARATION',
                classType: classType,
                name: className,
                inheritance: [],
                body: []
            };

            if (matchLexeme(':')) {
                advance();
                classNode.inheritance = parseInheritanceList();
            }

            if (!expect('{', `Se esperaba '{' para iniciar el cuerpo de la clase '${className}'`)) {
                return null;
            }

            classNode.body = parseClassBody();

            if (!expect('}', `Se esperaba '}' para cerrar el cuerpo de la clase '${className}'`)) {
                return null;
            }

            if (!expect(';', `Se esperaba ';' después de la declaración de clase '${className}'`)) {
                return null;
            }

            return classNode;
        }

        function parseInheritanceList() {
            const inheritance = [];

            while (!isAtEnd() && !matchLexeme('{')) {
                let access = 'private';

                if (matchLexeme('public', 'private', 'protected')) {
                    access = advance().lexeme;
                }

                if (!match('IDENTIFIER')) {
                    errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba nombre de clase base`);
                    break;
                }

                inheritance.push({
                    access: access,
                    className: advance().lexeme
                });

                if (matchLexeme(',')) advance();
                else break;
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
                }
            }

            return members;
        }

        function parseClassMember() {
            if (matchLexeme('public', 'private', 'protected')) {
                const access = advance().lexeme;
                if (!expect(':', `Se esperaba ':' después del especificador de acceso '${access}'`)) {
                    return null;
                }
                return {
                    type: 'ACCESS_SPECIFIER',
                    access: access
                };
            }

            if (isFunctionDeclaration()) {
                return parseFunctionDeclaration();
            }

            if (isVariableDeclaration()) {
                return parseVariableDeclaration();
            }

            const token = peek();
            if (token) {
                errors.push(`Error línea ${token.line}: Miembro de clase no válido '${token.lexeme}'`);
                advance();
            }
            return null;
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

            if (!match('IDENTIFIER')) {
                errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba nombre del nuevo tipo en typedef`);
                return null;
            }

            typedefNode.newType = advance().lexeme;

            if (!expect(';', `Se esperaba ';' al final de typedef`)) {
                return null;
            }

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

            if (!expect('{', `Se esperaba '{' para iniciar el namespace`)) {
                return null;
            }

            while (!isAtEnd() && !matchLexeme('}')) {
                const statement = parseTopLevelStatement();
                if (statement) {
                    namespaceNode.body.push(statement);
                }
            }

            if (!expect('}', `Se esperaba '}' para cerrar el namespace`)) {
                return null;
            }

            return namespaceNode;
        }

        function isFunctionDeclaration() {
            let i = 0;
            let foundType = false;
            let foundIdentifier = false;

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
                    i++;
                } else {
                    break;
                }
            }

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

            if (!match('IDENTIFIER')) {
                errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba nombre de función`);
                return null;
            }
            functionNode.name = advance().lexeme;

            if (!expect('(', `Se esperaba '(' después del nombre de función '${functionNode.name}'`)) {
                return null;
            }

            functionNode.parameters = parseParameterList();

            if (!expect(')', `Se esperaba ')' para cerrar parámetros de función '${functionNode.name}'`)) {
                return null;
            }

            while (matchLexeme('const', 'override', 'final')) {
                functionNode.modifiers.push(advance().lexeme);
            }

            if (matchLexeme('{')) {
                advance();
                functionNode.body = parseFunctionBody();
                if (!expect('}', `Se esperaba '}' para cerrar el cuerpo de función '${functionNode.name}'`)) {
                    return null;
                }
            } else if (matchLexeme(';')) {
                advance();
            } else {
                errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba '{' o ';' después de la declaración de función '${functionNode.name}'`);
                return null;
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

                while (!isAtEnd() && !match('IDENTIFIER') && !matchLexeme(',', ')')) {
                    param.dataType.push(advance().lexeme);
                }

                if (match('IDENTIFIER')) {
                    param.name = advance().lexeme;
                }

                if (match('IDENTIFIER') && !matchLexeme(',', ')', '=')) {
                    const nextToken = peek();
                    errors.push(`Error línea ${nextToken.line}: Se esperaba ',' entre parámetros. Encontrado '${nextToken.lexeme}'`);

                    while (!isAtEnd() && !matchLexeme(',', ')')) {
                        advance();
                    }
                }

                if (matchLexeme('=')) {
                    advance(); // =
                    param.defaultValue = readUntilCommaOrCloseParen();
                }

                if (param.dataType.length > 0 || param.name) {
                    parameters.push(param);
                }

                if (matchLexeme(',')) {
                    advance();
                } else if (!matchLexeme(')')) {
                    const token = peek();
                    if (token) {
                        errors.push(`Error línea ${token.line}: Se esperaba ',' o ')' en lista de parámetros`);
                    }
                }
            }

            return parameters;
        }

        function isVariableDeclaration() {
            let i = 0;
            let foundType = false;

            while (current + i < tokens.length) {
                const token = tokens[current + i];

                if (token.type === 'KEYWORD' &&
                    ['int', 'float', 'double', 'char', 'bool', 'void', 'string', 'long', 'short',
                        'unsigned', 'signed', 'const', 'static', 'auto'].includes(token.lexeme)) {
                    foundType = true;
                    i++;
                } else if (token.type === 'IDENTIFIER' && foundType) {
                    const nextToken = tokens[current + i + 1];
                    return nextToken && nextToken.lexeme !== '(';
                } else if (token.lexeme === '*' || token.lexeme === '&') {
                    i++;
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

            while (!isAtEnd() && !matchLexeme(';')) {
                if (!match('IDENTIFIER')) {
                    errors.push(`Error línea ${peek()?.line || 'EOF'}: Se esperaba nombre de variable`);
                    break;
                }

                const variable = {
                    name: advance().lexeme,
                    arraySize: null,
                    initialValue: null
                };

                if (matchLexeme('[')) {
                    advance();
                    variable.arraySize = readUntilClosingBracket();
                    if (!expect(']', `Se esperaba ']' para cerrar array`)) {
                        break;
                    }
                }

                if (matchLexeme('=')) {
                    advance();
                    const startLine = peek()?.line;
                    variable.initialValue = readUntilCommaOrSemicolon();

                    const currentToken = peek();
                    if (currentToken && currentToken.line > startLine && variable.initialValue) {
                        errors.push(`Error línea ${startLine}: Se esperaba ';' al final de la declaración de variable '${variable.name}'`);
                    }
                }

                varDecl.variables.push(variable);

                if (matchLexeme(',')) {
                    advance();
                } else if (!matchLexeme(';')) {
                    if (match('IDENTIFIER')) {
                        const nextToken = peek();
                        errors.push(`Error línea ${nextToken.line}: Se esperaba ',' entre declaraciones de variables`);
                        break;
                    }
                } else {
                    break;
                }
            }

            if (!expect(';', `Se esperaba ';' al final de la declaración de variable`)) {
                return varDecl;
            }

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
                }
            }

            return statements;
        }

        function parseStatement() {
            skipComments();
            if (isAtEnd()) return null;

            const token = peek();
            if (!token) return null;

            if (isVariableDeclaration()) {
                return parseVariableDeclaration();
            }

            if (matchLexeme('if')) return parseIfStatement();
            if (matchLexeme('while')) return parseWhileStatement();
            if (matchLexeme('for')) return parseForStatement();
            if (matchLexeme('do')) return parseDoWhileStatement();
            if (matchLexeme('switch')) return parseSwitchStatement();
            if (matchLexeme('case')) return parseCaseStatement();
            if (matchLexeme('default')) return parseDefaultStatement();
            if (matchLexeme('break', 'continue')) return parseJumpStatement();
            if (matchLexeme('return')) return parseReturnStatement();

            if (matchLexeme('{')) {
                advance();
                const blockStmt = {
                    type: 'BLOCK_STATEMENT',
                    statements: []
                };

                while (!isAtEnd() && !matchLexeme('}')) {
                    const stmt = parseStatement();
                    if (stmt) blockStmt.statements.push(stmt);
                }

                if (!expect('}', `Se esperaba '}' para cerrar bloque`)) {
                    return null;
                }
                return blockStmt;
            }

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

            if (!expect('(', `Se esperaba '(' después de if`)) {
                return null;
            }

            ifStmt.condition = readUntilClosingParen();

            if (!expect(')', `Se esperaba ')' para cerrar condición de if`)) {
                return null;
            }

            ifStmt.thenStatement = parseStatement();

            if (matchLexeme('else')) {
                advance();
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

            if (!expect('(', `Se esperaba '(' después de while`)) {
                return null;
            }

            whileStmt.condition = readUntilClosingParen();

            if (!expect(')', `Se esperaba ')' para cerrar condición de while`)) {
                return null;
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
                body: null,
                variableDeclaration: null
            };

            if (!expect('(', `Se esperaba '(' después de for`)) {
                return null;
            }

            const forContent = readUntilClosingParen();

            if (!expect(')', `Se esperaba ')' para cerrar declaración de for`)) {
                return null;
            }

            if (forContent) {
                const parts = forContent.split(';');

                if (parts.length !== 3) {
                    errors.push(`Error línea ${peek()?.line || 'EOF'}: Estructura de for incorrecta. Debe tener 3 partes separadas por ';'`);
                } else {
                    forStmt.init = parts[0].trim();
                    forStmt.condition = parts[1].trim();
                    forStmt.update = parts[2].trim();

                    const varDeclMatch = forStmt.init.match(/^(int|float|bool|double|char)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
                    if (varDeclMatch) {
                        forStmt.variableDeclaration = {
                            type: 'VARIABLE_DECLARATION',
                            modifiers: [],
                            dataType: [varDeclMatch[1]],
                            variables: [{
                                name: varDeclMatch[2],
                                initialValue: varDeclMatch[3].trim()
                            }]
                        };
                    }
                }
            }

            forStmt.body = parseStatement();
            return forStmt;
        }

        function parseDoWhileStatement() {
            advance(); // do

            const doWhileStmt = {
                type: 'DO_WHILE_STATEMENT',
                body: null,
                condition: null
            };

            doWhileStmt.body = parseStatement();

            if (!expect('while', 'Se esperaba while después del cuerpo de do')) {
                return null;
            }

            if (!expect('(', `Se esperaba '(' después de while`)) {
                return null;
            }

            doWhileStmt.condition = readUntilClosingParen();

            if (!expect(')', `Se esperaba ')' para cerrar condición de while`)) {
                return null;
            }

            if (!expect(';', `Se esperaba ';' al final de do-while`)) {
                return null;
            }

            return doWhileStmt;
        }

        function parseSwitchStatement() {
            advance(); // switch

            const switchStmt = {
                type: 'SWITCH_STATEMENT',
                expression: null,
                cases: []
            };

            if (!expect('(', `Se esperaba '(' después de switch`)) {
                return null;
            }

            switchStmt.expression = readUntilClosingParen();

            if (!expect(')', `Se esperaba ')' para cerrar expresión de switch`)) {
                return null;
            }

            if (!expect('{', `Se esperaba '{' para iniciar cuerpo de switch`)) {
                return null;
            }

            while (!isAtEnd() && !matchLexeme('}')) {
                const caseStmt = parseStatement();
                if (caseStmt) {
                    switchStmt.cases.push(caseStmt);
                }
            }

            if (!expect('}', `Se esperaba '}' para cerrar cuerpo de switch`)) {
                return null;
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

            caseStmt.value = readUntilColon();

            if (!expect(':', `Se esperaba ':' después del valor de case`)) {
                return null;
            }

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

            if (!expect(':', `Se esperaba ':' después de default`)) {
                return null;
            }

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
            const keyword = advance().lexeme;

            const jumpStmt = {
                type: 'JUMP_STATEMENT',
                keyword: keyword
            };

            if (!expect(';', `Se esperaba ';' después de ${keyword}`)) {
                return null;
            }

            return jumpStmt;
        }

        function parseReturnStatement() {
            const returnToken = advance(); // return

            const returnStmt = {
                type: 'RETURN_STATEMENT',
                expression: null
            };

            if (!matchLexeme(';')) {
                const startLine = peek()?.line;
                returnStmt.expression = readUntilSemicolon();

                const currentToken = peek();
                if (currentToken && currentToken.line > startLine && returnStmt.expression) {
                    errors.push(`Error línea ${startLine}: Se esperaba ';' después de return "${returnStmt.expression}"`);
                    return returnStmt;
                }
            }

            if (!expect(';', `Se esperaba ';' después de return`)) {
                return returnStmt;
            }

            return returnStmt;
        }

        function parseExpressionStatement() {
            const startToken = peek();
            const expression = readUntilSemicolon();

            if (expression && expression.trim() !== '') {
                if (!expect(';', `Se esperaba ';' al final de la expresión`)) {
                    return {
                        type: 'EXPRESSION_STATEMENT',
                        expression: expression,
                        hasError: true
                    };
                }
            } else {
                if (peek() && peek().lexeme === ';') {
                    advance();
                }
            }

            return {
                type: 'EXPRESSION_STATEMENT',
                expression: expression
            };
        }

        function readUntilSemicolon() {
            let content = '';
            let lineStart = peek()?.line;

            while (!isAtEnd() && !matchLexeme(';')) {
                const token = peek();

                if (token.line > lineStart && content.trim() !== '') {
                    break;
                }

                content += token.lexeme + ' ';
                advance();
            }

            return content.trim();
        }

        function readUntilClosingParen() {
            let content = '';
            let parenLevel = 0;
            const startToken = peek();

            while (!isAtEnd()) {
                const token = peek();
                if (token.lexeme === '(') {
                    parenLevel++;
                    content += token.lexeme + ' ';
                    advance();
                } else if (token.lexeme === ')') {
                    if (parenLevel === 0) break;
                    parenLevel--;
                    content += token.lexeme + ' ';
                    advance();
                } else {
                    content += token.lexeme + ' ';
                    advance();
                }
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

        return {parseTree, errors};
    }, []);

    // Analizador Semántico MEJORADO con validación estricta de tipos
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
            if (symbolTable.has(node.name)) {
                errors.push(`Error: Función '${node.name}' ya declarada`);
                return;
            }

            symbolTable.set(node.name, {
                type: 'function',
                returnType: node.returnType?.join(' ') || 'void',
                used: true,
                modifiers: node.modifiers || []
            });

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

            if (node.body && Array.isArray(node.body)) {
                node.body.forEach(statement => analyzeNode(statement));
            }
        }

        function handleVariableDeclaration(node) {
            if (node.variables && Array.isArray(node.variables)) {
                node.variables.forEach(variable => {
                    if (!variable.name) return;

                    if (symbolTable.has(variable.name)) {
                        errors.push(`Error: Variable '${variable.name}' ya declarada`);
                        return;
                    }

                    const varType = node.dataType?.join(' ') || 'int';

                    symbolTable.set(variable.name, {
                        type: varType,
                        value: variable.initialValue || getDefaultValue(varType),
                        used: false,
                        modifiers: node.modifiers || [],
                        arraySize: variable.arraySize
                    });

                    if (variable.initialValue) {
                        const variables = extractVariables(variable.initialValue);
                        markVariablesAsUsed(variables);
                        // VALIDACIÓN ESTRICTA DE TIPOS MEJORADA
                        checkStrictTypeCompatibility(variable.name, varType, variable.initialValue);
                    }
                });
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

            if (node.body && Array.isArray(node.body)) {
                node.body.forEach(statement => analyzeNode(statement));
            }
        }

        function handleTemplateDeclaration(node) {
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

            if (node.declaration) {
                analyzeNode(node.declaration);
            }
        }

        function handleIfStatement(node) {
            if (node.condition) {
                const variables = extractVariables(node.condition);
                markVariablesAsUsed(variables);
                // Validar que la condición sea de tipo booleano
                validateBooleanExpression(node.condition, 'condición de if');
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
                validateBooleanExpression(node.condition, 'condición de while');
            }

            if (node.body) {
                analyzeNode(node.body);
            }
        }

        function handleForStatement(node) {
            if (node.variableDeclaration) {
                handleVariableDeclaration(node.variableDeclaration);
            }

            if (node.init && !node.variableDeclaration) {
                const initVars = extractVariables(node.init);
                markVariablesAsUsed(initVars);
            }

            if (node.condition) {
                const condVars = extractVariables(node.condition);
                markVariablesAsUsed(condVars);
                validateBooleanExpression(node.condition, 'condición de for');
            }

            if (node.update) {
                const updateVars = extractVariables(node.update);
                markVariablesAsUsed(updateVars);
            }

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
                validateBooleanExpression(node.condition, 'condición de do-while');
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
                // VALIDAR OPERACIONES Y ASIGNACIONES
                validateExpressionTypes(node.expression);
            }
        }

        function handleBlockStatement(node) {
            if (node.statements && Array.isArray(node.statements)) {
                node.statements.forEach(statement => analyzeNode(statement));
            }
        }

        // NUEVA FUNCIÓN: Validación estricta de compatibilidad de tipos
        function checkStrictTypeCompatibility(identifier, expectedType, value) {
            if (!value || typeof value !== 'string') return;

            const cleanValue = value.toString().trim();

            // Obtener el tipo de la expresión del lado derecho
            const valueType = getExpressionType(cleanValue);

            if (!areTypesCompatible(expectedType, valueType)) {
                errors.push(`Error de tipo: No se puede asignar '${valueType}' a variable '${identifier}' de tipo '${expectedType}'`);
            } else if (hasImplicitConversionWithLoss(expectedType, valueType)) {
                warnings.push(`Advertencia: Conversión implícita de '${valueType}' a '${expectedType}' en variable '${identifier}' puede causar pérdida de precisión`);
            }
        }

        // NUEVA FUNCIÓN: Detectar conversiones con pérdida de precisión
        function hasImplicitConversionWithLoss(targetType, sourceType) {
            // float/double a int = pérdida de decimales
            if (targetType === 'int' && (sourceType === 'float' || sourceType === 'double')) {
                return true;
            }

            // double a float = pérdida de precisión
            if (targetType === 'float' && sourceType === 'double') {
                return true;
            }

            return false;
        }

        // NUEVA FUNCIÓN: Determinar el tipo de una expresión
        function getExpressionType(expression) {
            if (!expression || typeof expression !== 'string') return 'unknown';

            const cleanExpr = expression.trim();

            // Literales booleanos
            if (cleanExpr === 'true' || cleanExpr === 'false') {
                return 'bool';
            }

            // Literales enteros
            if (/^\d+$/.test(cleanExpr)) {
                return 'int';
            }

            // Literales decimales
            if (/^\d*\.\d+([eE][+-]?\d+)?$/.test(cleanExpr) || /^\d+\.\d*([eE][+-]?\d+)?$/.test(cleanExpr)) {
                return 'float';
            }

            // Literales de cadena
            if (/^".*"$/.test(cleanExpr)) {
                return 'string';
            }

            // Literales de carácter
            if (/^'.*'$/.test(cleanExpr)) {
                return 'char';
            }

            // Variable simple
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanExpr)) {
                if (symbolTable.has(cleanExpr)) {
                    return symbolTable.get(cleanExpr).type;
                } else if (!isKeywordOrSystemFunction(cleanExpr)) {
                    return 'unknown';
                }
            }

            // Expresiones con operadores
            if (containsArithmeticOperators(cleanExpr)) {
                return getArithmeticExpressionType(cleanExpr);
            }

            if (containsLogicalOperators(cleanExpr)) {
                return 'bool';
            }

            if (containsComparisonOperators(cleanExpr)) {
                return 'bool';
            }

            return 'unknown';
        }

        // NUEVA FUNCIÓN: Verificar compatibilidad entre tipos
        function areTypesCompatible(targetType, sourceType) {
            if (targetType === sourceType) return true;

            // Casos específicos donde NO hay compatibilidad automática
            const incompatiblePairs = [
                // bool no es compatible con otros tipos básicos
                ['bool', 'int'], ['int', 'bool'],
                ['bool', 'float'], ['float', 'bool'],
                ['bool', 'double'], ['double', 'bool'],
                ['bool', 'string'], ['string', 'bool'],
                ['bool', 'char'], ['char', 'bool'],

                // string no es compatible con tipos numéricos
                ['string', 'int'], ['int', 'string'],
                ['string', 'float'], ['float', 'string'],
                ['string', 'double'], ['double', 'string'],
                ['string', 'char'], ['char', 'string'],

                // char no es compatible con tipos numéricos (estricto)
                ['char', 'int'], ['int', 'char'],
                ['char', 'float'], ['float', 'char'],
                ['char', 'double'], ['double', 'char']
            ];

            const pair = [targetType, sourceType];
            return !incompatiblePairs.some(incompatible =>
                incompatible[0] === pair[0] && incompatible[1] === pair[1]
            );
        }

        // NUEVA FUNCIÓN: Validar expresiones booleanas
        function validateBooleanExpression(expression, context) {
            const exprType = getExpressionType(expression);
            if (exprType !== 'bool' && exprType !== 'unknown') {
                errors.push(`Error de tipo: ${context} debe ser de tipo bool, pero se encontró '${exprType}'`);
            }
        }

        // NUEVA FUNCIÓN: Validar tipos en expresiones
        function validateExpressionTypes(expression) {
            if (!expression || typeof expression !== 'string') return;

            // Detectar asignaciones
            const assignmentMatch = expression.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
            if (assignmentMatch) {
                const [, variable, value] = assignmentMatch;
                if (symbolTable.has(variable)) {
                    const varType = symbolTable.get(variable).type;
                    checkStrictTypeCompatibility(variable, varType, value);

                    // NUEVO: Validar operaciones dentro de la asignación
                    validateArithmeticOperationsInExpression(value, variable);
                }
            }

            // Detectar operaciones aritméticas mixtas
            if (containsMixedTypeOperation(expression)) {
                validateMixedTypeOperations(expression);
            }
        }

        // NUEVA FUNCIÓN: Validar operaciones aritméticas en expresiones
        function validateArithmeticOperationsInExpression(expression, contextVar = '') {
            if (!expression || typeof expression !== 'string') return;

            // Buscar operaciones como: variable + variable, variable + literal, etc.
            const operationRegex = /([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|"[^"]*")\s*([+\-*/%])\s*([a-zA-Z_][a-zA-Z0-9_]*|\d+(?:\.\d+)?|"[^"]*")/g;

            let match;
            while ((match = operationRegex.exec(expression)) !== null) {
                const [fullMatch, leftOperand, operator, rightOperand] = match;

                const leftType = getOperandType(leftOperand.trim());
                const rightType = getOperandType(rightOperand.trim());

                // Verificar si los tipos son compatibles para operaciones aritméticas
                if (!areTypesCompatibleForArithmetic(leftType, rightType, operator)) {
                    const contextMsg = contextVar ? ` en asignación a '${contextVar}'` : '';
                    errors.push(`Error de tipo: No se puede realizar la operación '${leftType} ${operator} ${rightType}'${contextMsg}`);
                }
            }
        }

        // NUEVA FUNCIÓN: Obtener tipo de un operando
        function getOperandType(operand) {
            // Literal string
            if (/^".*"$/.test(operand)) {
                return 'string';
            }

            // Literal booleano
            if (operand === 'true' || operand === 'false') {
                return 'bool';
            }

            // Literal decimal
            if (/^\d*\.\d+$/.test(operand)) {
                return 'float';
            }

            // Literal entero
            if (/^\d+$/.test(operand)) {
                return 'int';
            }

            // Variable
            if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(operand)) {
                if (symbolTable.has(operand)) {
                    return symbolTable.get(operand).type;
                } else if (!isKeywordOrSystemFunction(operand)) {
                    // Variable no declarada - ya se reporta en otro lugar
                    return 'unknown';
                }
            }

            return 'unknown';
        }

        // NUEVA FUNCIÓN: Verificar compatibilidad para operaciones aritméticas
        function areTypesCompatibleForArithmetic(leftType, rightType, operator) {
            // Operaciones prohibidas con string
            if (leftType === 'string' || rightType === 'string') {
                // String solo puede usar + con otro string (concatenación)
                if (operator === '+' && leftType === 'string' && rightType === 'string') {
                    return true;
                }
                // Cualquier otra operación con string es inválida
                return false;
            }

            // Operaciones prohibidas con bool
            if (leftType === 'bool' || rightType === 'bool') {
                // Bool no puede participar en operaciones aritméticas
                return false;
            }

            // Operaciones entre tipos numéricos (int, float, double) son válidas
            const numericTypes = ['int', 'float', 'double', 'long', 'short'];
            if (numericTypes.includes(leftType) && numericTypes.includes(rightType)) {
                return true;
            }

            // Si algún tipo es unknown, no podemos validar
            if (leftType === 'unknown' || rightType === 'unknown') {
                return true;
            }

            return false;
        }

        // NUEVA FUNCIÓN: Detectar operaciones con tipos mixtos
        function containsMixedTypeOperation(expression) {
            return /[+\-*/%]/.test(expression) &&
                (expression.includes('true') || expression.includes('false') ||
                    /".+"/.test(expression));
        }

        // NUEVA FUNCIÓN: Validar operaciones con tipos mixtos
        function validateMixedTypeOperations(expression) {
            // Buscar operaciones entre bool y otros tipos
            if (/(true|false)\s*[+\-*/%]\s*\d+/.test(expression) ||
                /\d+\s*[+\-*/%]\s*(true|false)/.test(expression)) {
                errors.push(`Error de tipo: No se pueden realizar operaciones aritméticas entre bool e int`);
            }

            // Buscar operaciones entre string y números
            if (/"[^"]*"\s*[+\-*/%]\s*\d+/.test(expression) ||
                /\d+\s*[+\-*/%]\s*"[^"]*"/.test(expression)) {
                errors.push(`Error de tipo: No se pueden realizar operaciones aritméticas entre string y números`);
            }

            // Buscar operaciones entre bool y string
            if (/(true|false)\s*[+\-*/%]\s*"[^"]*"/.test(expression) ||
                /"[^"]*"\s*[+\-*/%]\s*(true|false)/.test(expression)) {
                errors.push(`Error de tipo: No se pueden realizar operaciones aritméticas entre bool y string`);
            }
        }

        // NUEVA FUNCIÓN: Obtener tipo de expresión aritmética
        function getArithmeticExpressionType(expression) {
            if (/\d*\.\d+/.test(expression)) return 'float';
            if (/\d+/.test(expression)) return 'int';

            // Verificar variables en la expresión
            const variables = extractVariables(expression);
            for (const varName of variables) {
                if (symbolTable.has(varName)) {
                    const varType = symbolTable.get(varName).type;
                    if (varType === 'float' || varType === 'double') return 'float';
                }
            }

            return 'int';
        }

        // FUNCIONES AUXILIARES NUEVAS
        function containsArithmeticOperators(expression) {
            return /[+\-*/%]/.test(expression);
        }

        function containsLogicalOperators(expression) {
            return /&&|\|\||!/.test(expression);
        }

        function containsComparisonOperators(expression) {
            return /==|!=|<=|>=|<|>/.test(expression);
        }

        function extractVariables(expression) {
            if (!expression || typeof expression !== 'string') return [];

            const variables = [];
            let cleanExpression = expression;

            cleanExpression = cleanExpression.replace(/"[^"]*"/g, '');
            cleanExpression = cleanExpression.replace(/'[^']*'/g, '');
            cleanExpression = cleanExpression.replace(/\/\/.*$/g, '');
            cleanExpression = cleanExpression.replace(/\/\*.*?\*\//g, '');
            cleanExpression = cleanExpression.replace(/\b(int|float|double|char|bool|void|string|long|short|unsigned|signed|const|static|auto)\s+/g, '');

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

            const isDefinedFunction = symbolTable.has(identifier) &&
                symbolTable.get(identifier)?.type === 'function';

            return keywords.includes(identifier) ||
                systemFunctions.includes(identifier) ||
                operators.includes(identifier) ||
                isDefinedFunction ||
                /^\d+(\.\d+)?$/.test(identifier);
        }

        function getDefaultValue(dataType) {
            switch (dataType) {
                case 'int':
                case 'long':
                case 'short':
                    return 0;
                case 'float':
                case 'double':
                    return 0.0;
                case 'bool':
                    return false;
                case 'char':
                    return "''";
                case 'string':
                    return '""';
                default:
                    return null;
            }
        }

        analyzeNode(parseTree);

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

    // Generación de código (mismo que antes)
    const codeGeneration = useCallback((parseTree, symbolTable) => {
        let assemblyCode = [];
        let jsCode = [];

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

        jsCode.push('');

        const functions = symbolTable.filter(s => s.type === 'function');
        functions.forEach(func => {
            jsCode.push(`function ${func.name}() {`);
            jsCode.push('    // Implementación de función');
            jsCode.push('}');
            jsCode.push('');
        });

        jsCode.push('function main() {');

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
            assembly: assemblyCode.join('\n')
        };
    }, []);

    const handleCompile = () => {
        const tokens = lexicalAnalysis(sourceCode);
        const {parseTree, errors: syntaxErrors} = syntacticAnalysis(tokens);
        const {symbolTable, errors: semanticErrors, warnings} = semanticAnalysis(parseTree);
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

            {compilationResult?.syntaxErrors?.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex items-center mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2"/>
                        <h4 className="font-semibold text-red-800">
                            Se encontraron {compilationResult.syntaxErrors.length} errores sintácticos:
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {compilationResult.syntaxErrors.map((error, index) => (
                            <div key={index} className="bg-red-100 rounded p-3 border border-red-200">
                                <p className="text-red-800 font-medium">Error {index + 1}:</p>
                                <p className="text-red-700 mt-1">{error}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {compilationResult?.parseTree ? (
                <div>
                    <h4 className="font-semibold mb-2">Árbol Sintáctico Generado:</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto max-h-96">
                  {JSON.stringify(compilationResult.parseTree, null, 2)}
                </pre>
                    </div>
                </div>
            ) : (
                <p className="text-gray-500">Ejecuta la compilación para ver el árbol sintáctico</p>
            )}

            {compilationResult?.syntaxErrors?.length === 0 && compilationResult?.parseTree && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2"/>
                        <p className="text-green-800 font-medium">✅ Análisis sintáctico completado sin errores</p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderSemanticAnalysis = () => (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-orange-600">Análisis Semántico</h3>

            {/* Errores Semánticos - Mostrar primero */}
            {compilationResult?.semanticErrors?.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <div className="flex items-center mb-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-2"/>
                        <h4 className="font-semibold text-red-800">
                            Errores Semánticos ({compilationResult.semanticErrors.length}):
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {compilationResult.semanticErrors.map((error, index) => (
                            <div key={index} className="bg-red-100 rounded p-3 border border-red-200">
                                <p className="text-red-700">{error}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Advertencias */}
            {compilationResult?.warnings?.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex items-center mb-3">
                        <Info className="w-5 h-5 text-yellow-600 mr-2"/>
                        <h4 className="font-semibold text-yellow-800">
                            Advertencias ({compilationResult.warnings.length}):
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {compilationResult.warnings.map((warning, index) => (
                            <div key={index} className="bg-yellow-100 rounded p-3 border border-yellow-200">
                                <p className="text-yellow-700">{warning}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabla de Símbolos */}
            <div>
                <h4 className="font-semibold mb-2">Tabla de Símbolos:</h4>
                {compilationResult?.symbolTable ? (
                    <div className="overflow-x-auto">
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
                    </div>
                ) : (
                    <p className="text-gray-500">Ejecuta la compilación para ver la tabla de símbolos</p>
                )}
            </div>

            {/* Estado de éxito */}
            {compilationResult?.semanticErrors?.length === 0 && compilationResult?.warnings?.length === 0 && compilationResult?.symbolTable && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                    <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2"/>
                        <p className="text-green-800 font-medium">✅ Análisis semántico completado sin errores</p>
                    </div>
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
                        Compilador Grupo #1 - Validación de Tipos Mejorada
                    </h1>
                    <p className="text-blue-100 mt-2">
                        Análisis Léxico • Sintáctico • Semántico Estricto • Generación de Código
                    </p>
                </div>

                <div className="p-6">
                    {/* Editor de Código */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-semibold">Editor de Código Fuente C++</h2>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSourceCode(`int main() {
    int a = 5;
    float b = 2.5;
    int resultado = a + b;  // ¿Error? float a int con pérdida
    return 0;
}`)}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    ⚠️ Pérdida de Precisión
                                </button>
                                <button
                                    onClick={() => setSourceCode(`/* Código correcto con tipos compatibles */
 
int main() {
    int edad = 25;
    float salario = 2500.75;
    bool esAdulto = true;
    string nombre = "Juan";
    
    // Asignaciones correctas:
    int otraEdad = edad;           // int a int ✓
    float otroSalario = salario;   // float a float ✓
    bool otroEstado = esAdulto;    // bool a bool ✓
    string otroNombre = nombre;    // string a string ✓
    
    // Operaciones correctas:
    int sumaEdades = edad + 5;     // int + int ✓
    float salarioTotal = salario * 12.0; // float * float ✓ 
    bool resultado = esAdulto && true;    // bool && bool ✓
    string nombreCompleto = nombre + " Perez"; // string + string ✓
    
    return 0;
}`)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                                >
                                    ✅ Código Correcto
                                </button>
                                <button
                                    onClick={handleCompile}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Play className="w-4 h-4"/>
                                    Compilar
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={sourceCode}
                            onChange={(e) => setSourceCode(e.target.value)}
                            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Escribe tu código C++ aquí..."
                        />
                    </div>

                    {/* Tabs de Análisis */}
                    <div className="border-b border-gray-200 mb-6">
                        <nav className="flex space-x-8">
                            {[
                                {id: 'lexico', label: 'Análisis Léxico', icon: FileText, desc: 'Tokenización'},
                                {
                                    id: 'sintactico',
                                    label: 'Análisis Sintáctico',
                                    icon: AlertCircle,
                                    desc: 'Detección de Errores'
                                },
                                {
                                    id: 'semantico',
                                    label: 'Análisis Semántico',
                                    icon: Info,
                                    desc: 'Validación de Tipos'
                                },
                                {id: 'codigo', label: 'Generación de Código', icon: Code, desc: 'Assembly'}
                            ].map(({id, label, icon: Icon, desc}) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                        activeTab === id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4"/>
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

                    {/* Status de Compilación Mejorado */}
                    {compilationResult && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                            <div className="flex items-center gap-2 mb-3">
                                {(compilationResult.syntaxErrors?.length > 0 || compilationResult.semanticErrors?.length > 0) ? (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-red-600"/>
                                        <span className="font-semibold text-red-800">
                      Compilación con errores - Validación de tipos estricta activada
                    </span>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5 text-green-600"/>
                                        <span className="font-semibold text-green-800">
                      Compilación exitosa - Todos los tipos son compatibles
                    </span>
                                    </>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div className="bg-blue-50 p-3 rounded border">
                                    <div className="font-medium text-blue-800">Tokens</div>
                                    <div className="text-blue-600">{compilationResult.tokens?.length || 0}</div>
                                </div>
                                <div className={`p-3 rounded border ${
                                    compilationResult.syntaxErrors?.length > 0 ? 'bg-red-50' : 'bg-green-50'
                                }`}>
                                    <div className={`font-medium ${
                                        compilationResult.syntaxErrors?.length > 0 ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                        Errores Sintácticos
                                    </div>
                                    <div className={`${
                                        compilationResult.syntaxErrors?.length > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {compilationResult.syntaxErrors?.length || 0}
                                    </div>
                                </div>
                                <div className={`p-3 rounded border ${
                                    compilationResult.semanticErrors?.length > 0 ? 'bg-red-50' : 'bg-green-50'
                                }`}>
                                    <div className={`font-medium ${
                                        compilationResult.semanticErrors?.length > 0 ? 'text-red-800' : 'text-green-800'
                                    }`}>
                                        Errores de Tipos
                                    </div>
                                    <div className={`${
                                        compilationResult.semanticErrors?.length > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {compilationResult.semanticErrors?.length || 0}
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded border">
                                    <div className="font-medium text-yellow-800">Advertencias</div>
                                    <div className="text-yellow-600">{compilationResult.warnings?.length || 0}</div>
                                </div>
                            </div>

                            <div className="mt-3 text-xs text-gray-500">
                                <strong>Validación mejorada:</strong> Se detectan incompatibilidades entre int↔bool,
                                string↔números, operaciones mixtas prohibidas, y asignaciones de tipos incompatibles.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Compiler;