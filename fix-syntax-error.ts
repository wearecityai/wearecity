// CORRECCIÓN DEL ERROR DE SINTAXIS EN LA LÍNEA 2715
// Cambiar esta línea:
//      } else if (intentsForProactiveSearch.has('places')) {

// Por esta:
//      } else if (intentsForProactiveSearch.has('places')) {

// El problema está en que hay un } extra antes del else if
// Esto causa el error: "Expression expected at file:///.../index.ts:2715:9"

// SOLUCIÓN:
// 1. Abrir el archivo supabase/functions/chat-ia/index.ts
// 2. Ir a la línea 2715
// 3. Cambiar "} else if" por "} else if" (eliminar el } extra)
// 4. Guardar y desplegar
