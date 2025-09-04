import React from 'react';
import { ProgressiveListRenderer } from './ProgressiveListRenderer';

export const IndentationTest: React.FC = () => {
  const testContent = `
## Prueba de Indentación

### Lista simple
- **Padre 1:** Elemento principal sin indentación
- **Padre 2:** Otro elemento principal sin indentación

### Lista con indentación
- **Padre 1:** Elemento principal sin indentación
  - **Hijo 1:** Sub-elemento con indentación media
  - **Hijo 2:** Otro sub-elemento con indentación media
- **Padre 2:** Otro elemento principal sin indentación
  - **Hijo 3:** Sub-elemento con indentación media

### Lista con múltiples niveles
- **Padre 1:** Elemento principal sin indentación
  - **Hijo 1:** Sub-elemento con indentación media
    - **Nieto 1:** Sub-sub-elemento con más indentación
    - **Nieto 2:** Otro sub-sub-elemento con más indentación
  - **Hijo 2:** Otro sub-elemento con indentación media
- **Padre 2:** Otro elemento principal sin indentación
  - **Hijo 3:** Sub-elemento con indentación media
    - **Nieto 3:** Sub-sub-elemento con más indentación
`;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba de Indentación Progresiva</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        <ProgressiveListRenderer content={testContent} />
      </div>
    </div>
  );
};

export default IndentationTest;
