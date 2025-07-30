const fs = require('fs').promises;
const path = require('path');
const esprima = require('esprima');
const { parse: babelParse } = require('@babel/parser');
const { parse: typescriptParse } = require('@typescript-eslint/parser');
const acorn = require('acorn');

class AnalysisEngine {
  constructor() {
    this.supportedLanguages = {
      javascript: {
        extensions: ['.js', '.jsx', '.mjs'],
        parser: 'esprima',
        analyzer: 'javascript'
      },
      typescript: {
        extensions: ['.ts', '.tsx'],
        parser: 'typescript',
        analyzer: 'typescript'
      },
      python: {
        extensions: ['.py'],
        parser: 'python',
        analyzer: 'python'
      },
      java: {
        extensions: ['.java'],
        parser: 'java',
        analyzer: 'java'
      },
      go: {
        extensions: ['.go'],
        parser: 'go',
        analyzer: 'go'
      },
      rust: {
        extensions: ['.rs'],
        parser: 'rust',
        analyzer: 'rust'
      },
      cpp: {
        extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.h'],
        parser: 'cpp',
        analyzer: 'cpp'
      }
    };

    this.rules = {
      complexity: {
        id: 'complexity',
        name: 'Cyclomatic Complexity',
        category: 'maintainability',
        enabled: true,
        threshold: 10
      },
      security: {
        id: 'security',
        name: 'Security Vulnerabilities',
        category: 'security',
        enabled: true
      },
      performance: {
        id: 'performance',
        name: 'Performance Issues',
        category: 'performance',
        enabled: true
      },
      bugs: {
        id: 'bugs',
        name: 'Potential Bugs',
        category: 'bug',
        enabled: true
      },
      style: {
        id: 'style',
        name: 'Code Style',
        category: 'style',
        enabled: false
      }
    };
  }

  async analyzeFile(filePath, content, language) {
    const issues = [];
    const metrics = {
      complexity: 0,
      lines: content.split('\n').length,
      functions: 0,
      classes: 0
    };

    try {
      const ast = await this.parseFile(content, language);
      if (ast) {
        // Analyze different aspects
        issues.push(...await this.analyzeComplexity(ast, filePath));
        issues.push(...await this.analyzeSecurity(ast, filePath, language));
        issues.push(...await this.analyzePerformance(ast, filePath, language));
        issues.push(...await this.analyzeBugs(ast, filePath, language));
        
        // Calculate metrics
        metrics.complexity = this.calculateComplexity(ast);
        metrics.functions = this.countFunctions(ast);
        metrics.classes = this.countClasses(ast);
      }
    } catch (error) {
      console.error(`Error analyzing file ${filePath}:`, error);
      issues.push({
        id: `parse-error-${Date.now()}`,
        type: 'bug',
        severity: 'high',
        title: 'Parse Error',
        description: `Failed to parse file: ${error.message}`,
        file: {
          path: filePath,
          line: 1,
          column: 1
        },
        rule: {
          id: 'parse-error',
          name: 'Parse Error',
          category: 'syntax'
        }
      });
    }

    return { issues, metrics };
  }

  async parseFile(content, language) {
    try {
      switch (language) {
        case 'javascript':
          return esprima.parseScript(content, {
            loc: true,
            range: true,
            comments: true,
            tolerant: true
          });
        
        case 'typescript':
          return typescriptParse(content, {
            loc: true,
            range: true,
            comment: true,
            errorOnUnknownASTType: false
          });
        
        case 'python':
          // For Python, we'd use a Python AST parser
          // This is a simplified approach
          return this.parsePython(content);
        
        default:
          console.warn(`Unsupported language: ${language}`);
          return null;
      }
    } catch (error) {
      console.error(`Parse error for ${language}:`, error);
      throw error;
    }
  }

  async analyzeComplexity(ast, filePath) {
    const issues = [];
    const complexity = this.calculateComplexity(ast);
    
    if (complexity > this.rules.complexity.threshold) {
      issues.push({
        id: `complexity-${filePath}-${Date.now()}`,
        type: 'complexity',
        severity: complexity > 20 ? 'high' : 'medium',
        title: `High Cyclomatic Complexity (${complexity})`,
        description: `This file has a cyclomatic complexity of ${complexity}, which exceeds the recommended threshold of ${this.rules.complexity.threshold}.`,
        file: {
          path: filePath,
          line: 1,
          column: 1
        },
        rule: this.rules.complexity,
        suggestion: {
          fix: 'Consider breaking down complex functions into smaller, more manageable pieces.',
          confidence: 80
        }
      });
    }

    return issues;
  }

  async analyzeSecurity(ast, filePath, language) {
    const issues = [];
    
    if (language === 'javascript' || language === 'typescript') {
      // Check for common security issues
      this.traverseAST(ast, (node) => {
        // eval() usage
        if (node.type === 'CallExpression' && 
            node.callee && node.callee.name === 'eval') {
          issues.push({
            id: `security-eval-${filePath}-${node.loc.start.line}`,
            type: 'security',
            severity: 'critical',
            title: 'Dangerous eval() usage',
            description: 'Using eval() can lead to code injection vulnerabilities.',
            file: {
              path: filePath,
              line: node.loc.start.line,
              column: node.loc.start.column
            },
            rule: {
              id: 'no-eval',
              name: 'No eval()',
              category: 'security',
              documentation: 'https://eslint.org/docs/rules/no-eval'
            },
            metadata: {
              cwe: ['CWE-95']
            }
          });
        }

        // innerHTML usage (potential XSS)
        if (node.type === 'MemberExpression' && 
            node.property && node.property.name === 'innerHTML') {
          issues.push({
            id: `security-innerHTML-${filePath}-${node.loc.start.line}`,
            type: 'security',
            severity: 'high',
            title: 'Potential XSS vulnerability',
            description: 'Direct innerHTML manipulation can lead to XSS attacks.',
            file: {
              path: filePath,
              line: node.loc.start.line,
              column: node.loc.start.column
            },
            rule: {
              id: 'no-innerHTML',
              name: 'No innerHTML',
              category: 'security'
            },
            metadata: {
              cwe: ['CWE-79']
            }
          });
        }
      });
    }

    return issues;
  }

  async analyzePerformance(ast, filePath, language) {
    const issues = [];
    
    if (language === 'javascript' || language === 'typescript') {
      this.traverseAST(ast, (node) => {
        // Nested loops
        if (node.type === 'ForStatement' || node.type === 'WhileStatement') {
          const nestedLoops = this.findNestedLoops(node);
          if (nestedLoops > 2) {
            issues.push({
              id: `performance-nested-loops-${filePath}-${node.loc.start.line}`,
              type: 'performance',
              severity: 'medium',
              title: `Deeply nested loops (${nestedLoops} levels)`,
              description: 'Deeply nested loops can cause performance issues.',
              file: {
                path: filePath,
                line: node.loc.start.line,
                column: node.loc.start.column
              },
              rule: {
                id: 'max-nested-loops',
                name: 'Maximum nested loops',
                category: 'performance'
              }
            });
          }
        }

        // Large arrays/objects
        if (node.type === 'ArrayExpression' && node.elements.length > 1000) {
          issues.push({
            id: `performance-large-array-${filePath}-${node.loc.start.line}`,
            type: 'performance',
            severity: 'low',
            title: 'Large array literal',
            description: `Array with ${node.elements.length} elements may impact performance.`,
            file: {
              path: filePath,
              line: node.loc.start.line,
              column: node.loc.start.column
            },
            rule: {
              id: 'max-array-size',
              name: 'Maximum array size',
              category: 'performance'
            }
          });
        }
      });
    }

    return issues;
  }

  async analyzeBugs(ast, filePath, language) {
    const issues = [];
    
    if (language === 'javascript' || language === 'typescript') {
      this.traverseAST(ast, (node) => {
        // Unreachable code after return
        if (node.type === 'ReturnStatement') {
          const parent = node.parent;
          if (parent && parent.type === 'BlockStatement') {
            const index = parent.body.indexOf(node);
            if (index < parent.body.length - 1) {
              issues.push({
                id: `bug-unreachable-${filePath}-${node.loc.start.line}`,
                type: 'bug',
                severity: 'medium',
                title: 'Unreachable code after return',
                description: 'Code after return statement will never be executed.',
                file: {
                  path: filePath,
                  line: parent.body[index + 1].loc.start.line,
                  column: parent.body[index + 1].loc.start.column
                },
                rule: {
                  id: 'no-unreachable',
                  name: 'No unreachable code',
                  category: 'bug'
                }
              });
            }
          }
        }

        // Assignment in conditions
        if ((node.type === 'IfStatement' || node.type === 'WhileStatement') &&
            node.test && node.test.type === 'AssignmentExpression') {
          issues.push({
            id: `bug-assignment-condition-${filePath}-${node.loc.start.line}`,
            type: 'bug',
            severity: 'high',
            title: 'Assignment in condition',
            description: 'Assignment in condition is likely a mistake. Did you mean to use == or ===?',
            file: {
              path: filePath,
              line: node.test.loc.start.line,
              column: node.test.loc.start.column
            },
            rule: {
              id: 'no-assignment-in-condition',
              name: 'No assignment in condition',
              category: 'bug'
            }
          });
        }
      });
    }

    return issues;
  }

  calculateComplexity(ast) {
    let complexity = 1; // Base complexity
    
    this.traverseAST(ast, (node) => {
      // Add complexity for control flow statements
      switch (node.type) {
        case 'IfStatement':
        case 'ConditionalExpression':
        case 'SwitchCase':
        case 'ForStatement':
        case 'ForInStatement':
        case 'ForOfStatement':
        case 'WhileStatement':
        case 'DoWhileStatement':
        case 'CatchClause':
          complexity++;
          break;
        case 'LogicalExpression':
          if (node.operator === '&&' || node.operator === '||') {
            complexity++;
          }
          break;
      }
    });

    return complexity;
  }

  countFunctions(ast) {
    let count = 0;
    this.traverseAST(ast, (node) => {
      if (node.type === 'FunctionDeclaration' || 
          node.type === 'FunctionExpression' ||
          node.type === 'ArrowFunctionExpression') {
        count++;
      }
    });
    return count;
  }

  countClasses(ast) {
    let count = 0;
    this.traverseAST(ast, (node) => {
      if (node.type === 'ClassDeclaration') {
        count++;
      }
    });
    return count;
  }

  findNestedLoops(node, depth = 0) {
    let maxDepth = depth;
    
    if (node.type === 'ForStatement' || 
        node.type === 'WhileStatement' ||
        node.type === 'DoWhileStatement') {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    }

    // Traverse child nodes
    for (const key in node) {
      if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            if (child && typeof child === 'object') {
              maxDepth = Math.max(maxDepth, this.findNestedLoops(child, depth));
            }
          }
        } else if (node[key].type) {
          maxDepth = Math.max(maxDepth, this.findNestedLoops(node[key], depth));
        }
      }
    }

    return maxDepth;
  }

  traverseAST(node, callback, parent = null) {
    if (!node || typeof node !== 'object') return;
    
    node.parent = parent;
    callback(node);

    for (const key in node) {
      if (key !== 'parent' && typeof node[key] === 'object' && node[key] !== null) {
        if (Array.isArray(node[key])) {
          for (const child of node[key]) {
            if (child && typeof child === 'object') {
              this.traverseAST(child, callback, node);
            }
          }
        } else if (node[key].type) {
          this.traverseAST(node[key], callback, node);
        }
      }
    }
  }

  parsePython(content) {
    // Simplified Python parsing - in a real implementation,
    // you'd use a proper Python AST parser
    return {
      type: 'Module',
      body: [],
      loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 0 } }
    };
  }

  getLanguageFromFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    for (const [language, config] of Object.entries(this.supportedLanguages)) {
      if (config.extensions.includes(ext)) {
        return language;
      }
    }
    
    return null;
  }

  async analyzeRepository(repositoryPath, options = {}) {
    const results = {
      summary: {
        totalFiles: 0,
        analyzedFiles: 0,
        totalIssues: 0,
        criticalIssues: 0,
        highIssues: 0,
        mediumIssues: 0,
        lowIssues: 0,
        totalLines: 0
      },
      files: [],
      issues: []
    };

    try {
      const files = await this.getSourceFiles(repositoryPath, options);
      results.summary.totalFiles = files.length;

      for (const filePath of files) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const language = this.getLanguageFromFile(filePath);
          
          if (language) {
            const analysis = await this.analyzeFile(filePath, content, language);
            
            results.files.push({
              path: filePath,
              language,
              metrics: analysis.metrics,
              issuesCount: analysis.issues.length
            });
            
            results.issues.push(...analysis.issues);
            results.summary.analyzedFiles++;
            results.summary.totalLines += analysis.metrics.lines;
            
            // Count issues by severity
            analysis.issues.forEach(issue => {
              results.summary.totalIssues++;
              results.summary[`${issue.severity}Issues`]++;
            });
          }
        } catch (error) {
          console.error(`Error processing file ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error('Error analyzing repository:', error);
      throw error;
    }

    return results;
  }

  async getSourceFiles(repositoryPath, options = {}) {
    const files = [];
    const excludePaths = options.excludePaths || ['node_modules', '.git', 'dist', 'build'];
    const includePaths = options.includePaths || [];

    async function scanDirectory(dirPath) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          const relativePath = path.relative(repositoryPath, fullPath);
          
          // Check exclude patterns
          if (excludePaths.some(pattern => relativePath.includes(pattern))) {
            continue;
          }
          
          // Check include patterns (if specified)
          if (includePaths.length > 0 && 
              !includePaths.some(pattern => relativePath.includes(pattern))) {
            continue;
          }

          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
      }
    }

    await scanDirectory(repositoryPath);
    return files;
  }
}

module.exports = AnalysisEngine;