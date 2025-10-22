// test/e2e/setup-tests.ts
// Setup global para testes E2E
// O cleanup será feito individualmente em cada arquivo de teste

// Configurar timeout global para testes
jest.setTimeout(30000);

// Suprimir warnings desnecessários
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  // Filtrar warnings de autenticação do PostgreSQL que não são relevantes
  if (args[0] && typeof args[0] === 'string' && args[0].includes('autenticação do tipo senha falhou')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

