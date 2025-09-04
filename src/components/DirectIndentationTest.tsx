import React from 'react';

export const DirectIndentationTest: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Prueba Directa de Indentación</h1>
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border">
        
        {/* Prueba directa con CSS */}
        <div className="space-y-2 my-4">
          <div className="flex items-start ml-0">
            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Padre 1:</strong> Elemento principal sin indentación
            </div>
          </div>
          
          <div className="flex items-start ml-8">
            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
            <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Hijo 1:</strong> Sub-elemento con indentación media
            </div>
          </div>
          
          <div className="flex items-start ml-16">
            <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 mr-3 flex-shrink-0"></span>
            <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Nieto 1:</strong> Sub-sub-elemento con más indentación
            </div>
          </div>
          
          <div className="flex items-start ml-8">
            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
            <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Hijo 2:</strong> Otro sub-elemento con indentación media
            </div>
          </div>
          
          <div className="flex items-start ml-0">
            <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <div className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed">
              <strong>Padre 2:</strong> Otro elemento principal sin indentación
            </div>
          </div>
        </div>
        
        <hr className="my-6 border-t border-gray-200 dark:border-gray-700" />
        
        {/* Prueba con markdown renderizado */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <h3>Prueba con Markdown</h3>
          <ul className="space-y-1 my-4 list-none ml-0">
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                <div className="flex-1">
                  <strong>Padre 1:</strong> Elemento principal sin indentación
                </div>
              </div>
            </li>
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <div className="flex items-start ml-8">
                <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
                <div className="flex-1">
                  <strong>Hijo 1:</strong> Sub-elemento con indentación media
                </div>
              </div>
            </li>
            <li className="text-gray-700 dark:text-gray-300 leading-relaxed">
              <div className="flex items-start ml-16">
                <span className="w-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 mr-3 flex-shrink-0"></span>
                <div className="flex-1">
                  <strong>Nieto 1:</strong> Sub-sub-elemento con más indentación
                </div>
              </div>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  );
};

export default DirectIndentationTest;
