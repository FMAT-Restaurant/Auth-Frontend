/// <reference types="vite/client" />

declare module 'salaApp/App' {
  const App: import('react').ComponentType<import('./types/auth').FederatedModuleProps>;
  export default App;
}

declare module 'menuApp/App' {
  const App: import('react').ComponentType<import('./types/auth').FederatedModuleProps>;
  export default App;
}

declare module 'inventarioApp/App' {
  const App: import('react').ComponentType<import('./types/auth').FederatedModuleProps>;
  export default App;
}

declare module 'ordenesApp/App' {
  const App: import('react').ComponentType<import('./types/auth').FederatedModuleProps>;
  export default App;
}

declare module 'cajaApp/App' {
  const App: import('react').ComponentType<import('./types/auth').FederatedModuleProps>;
  export default App;
}
