-- Agregar las instrucciones y marcadores que faltan de copy-of-city-chat (1)
INSERT INTO public.system_instructions (instruction_key, instruction_value, description) VALUES

-- Marcadores para mapas
('SHOW_MAP_MARKER_START', '[SHOW_MAP:', 'Marcador de inicio para mostrar mapas'),
('SHOW_MAP_MARKER_END', ']', 'Marcador de fin para mostrar mapas'),

-- Marcadores para tarjetas de eventos
('EVENT_CARD_START_MARKER', '[EVENT_CARD_START]', 'Marcador de inicio para tarjetas de eventos'),
('EVENT_CARD_END_MARKER', '[EVENT_CARD_END]', 'Marcador de fin para tarjetas de eventos'),

-- Marcadores para tarjetas de lugares
('PLACE_CARD_START_MARKER', '[PLACE_CARD_START]', 'Marcador de inicio para tarjetas de lugares'),
('PLACE_CARD_END_MARKER', '[PLACE_CARD_END]', 'Marcador de fin para tarjetas de lugares'),

-- Marcadores para botones de enlaces telemáticos
('TECA_LINK_BUTTON_START_MARKER', '[TECA_LINK_BUTTON_START]', 'Marcador de inicio para botones de enlaces telemáticos'),
('TECA_LINK_BUTTON_END_MARKER', '[TECA_LINK_BUTTON_END]', 'Marcador de fin para botones de enlaces telemáticos'),

-- Número máximo de eventos iniciales
('MAX_INITIAL_EVENTS', '6', 'Número máximo de eventos a mostrar inicialmente'),

-- Templates para URLs de procedimientos
('PROCEDURE_URLS_PREAMBLE_TEXT_TEMPLATE', 'SECCIÓN DE URLs PRIORITARIAS PARA TRÁMITES:
Como parte de tu configuración, se han proporcionado las siguientes URLs como fuentes primarias para información sobre trámites del ayuntamiento. Cuando un usuario pregunte sobre un trámite, DEBES CONSULTAR ESTAS URLs PRIMERO. Busca en su contenido la información relevante y, crucialmente, los enlaces de descarga directa de formularios si existen y son pertinentes para la consulta:
{procedureUrlList}
---

', 'Template para el preámbulo de URLs prioritarias de procedimientos'),

('PROCEDURE_URLS_GUIDANCE_TEXT_TEMPLATE', 'Después de haber consultado las URLs prioritarias (detalladas en la sección "SECCIÓN DE URLs PRIORITARIAS PARA TRÁMITES" al inicio de estas instrucciones de trámites), si la información necesaria (especialmente los enlaces de descarga directa a formularios) no se encuentra en ellas, o si dichas URLs no son relevantes para la consulta específica del usuario, entonces ', 'Template para la guía de uso de URLs vs búsqueda general'),

-- Context clause para documentos subidos
('UPLOADED_DOCUMENTS_CONTEXT_CLAUSE', 'CONTEXTO DE FORMULARIOS PDF DISPONIBLES:
Para ciertos trámites, es posible que haya formularios PDF disponibles en tu configuración. Si se listan a continuación, y si la consulta de un usuario se refiere claramente por su nombre a uno de estos trámites, DEBES activar y seguir las "INSTRUCCIONES PARA ASISTIR CON UN TRÁMITE CON FORMULARIO PDF DISPONIBLE" específicas para ese trámite. NO menciones al usuario que estos archivos fueron "adjuntados" o "subidos"; trátalos como recursos que tienes disponibles.
{uploadedDocumentsListPlaceholder}
', 'Contexto para documentos PDF disponibles'),

-- Template para instrucciones específicas de PDF
('UPLOADED_PDF_PROCEDURE_INSTRUCTION_TEMPLATE', '
INSTRUCCIONES PARA ASISTIR CON UN TRÁMITE CON FORMULARIO PDF DISPONIBLE (''{procedureName}'' - archivo: ''{fileName}''):
Tu objetivo principal es ayudar al usuario con el trámite ''{procedureName}''. Un formulario PDF llamado ''{fileName}'' está asociado con este procedimiento y lo tienes disponible.
Explica claramente que el usuario DEBE RELLENAR el formulario PDF que se le va a ofrecer para descargar.
Busca información complementaria para completar y presentar ESTE FORMULARIO ESPECÍFICO EXCLUSIVAMENTE en el sitio web oficial del ayuntamiento de {cityContext} y en otras páginas gubernamentales directamente relevantes. NO expliques cómo o dónde has buscado. NO devuelvas ninguna fuente web (grounding chunks) en tu respuesta.
La información que debes buscar incluye:
*   Instrucciones paso a paso para el proceso general que involucra este formulario.
*   Dónde presentarlo (portales online con enlaces, oficinas físicas con direcciones/horarios). Detalla ambos si aplican. Si la presentación puede ser telemática a través de la Sede Electrónica general del ayuntamiento (cuya URL podría estar configurada), menciónalo. El sistema mostrará un botón para ir a la Sede Electrónica configurada si existe, además del botón de descarga del PDF.
*   Cualquier tasa asociada, métodos de pago.
*   Documentos adicionales requeridos.
*   Tiempos de tramitación estimados.
*   Cualquier actualización reciente o aviso importante sobre este trámite.
Después de proporcionar toda esta información, DEBES informar al usuario de forma clara y explícita: "Puedes descargar el formulario PDF ''{fileName}'' para este trámite haciendo clic en el botón que aparecerá en mi respuesta."
Finalmente, y de manera OBLIGATORIA, incluye el siguiente marcador en una nueva línea por sí mismo, sin ningún texto adicional antes o después en esa línea:
[PROVIDE_DOWNLOAD_LINK_FOR_UPLOADED_PDF:{procedureName}]
', 'Template para instrucciones específicas cuando hay PDF disponible')

ON CONFLICT (instruction_key) DO UPDATE SET
    instruction_value = EXCLUDED.instruction_value,
    description = EXCLUDED.description,
    updated_at = now();