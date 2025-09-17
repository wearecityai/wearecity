import { FORM_BUTTON_START_MARKER, FORM_BUTTON_END_MARKER } from '../../constants';

interface FormButtonData {
  title: string;
  url: string;
  description?: string;
}

export const useFormButtonParser = () => {
  const parseFormButtons = (content: string): FormButtonData[] => {
    console.log('🔍 Looking for form button markers:', FORM_BUTTON_START_MARKER, FORM_BUTTON_END_MARKER);
    
    const formButtonRegex = new RegExp(`${FORM_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${FORM_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
    const matches = content.match(formButtonRegex);
    
    console.log('🔍 Form button matches found:', matches?.length || 0);
    
    if (!matches) return [];
    
    const formButtons: FormButtonData[] = [];
    
    matches.forEach((match, index) => {
      try {
        // Extract JSON content between markers
        const jsonMatch = match.match(new RegExp(`${FORM_BUTTON_START_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([\\s\\S]*?)${FORM_BUTTON_END_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
        
        if (jsonMatch && jsonMatch[1]) {
          const jsonStr = jsonMatch[1].trim();
          console.log(`🔍 Parsing form button ${index + 1} JSON:`, jsonStr);
          
          const formData = JSON.parse(jsonStr);
          
          if (formData.title && formData.url) {
            formButtons.push({
              title: formData.title,
              url: formData.url,
              description: formData.description || ''
            });
            console.log(`✅ Form button ${index + 1} parsed successfully:`, formData.title);
          } else {
            console.log(`❌ Form button ${index + 1} missing required fields:`, formData);
          }
        }
      } catch (error) {
        console.error(`❌ Error parsing form button ${index + 1}:`, error);
      }
    });
    
    console.log('🔍 Total form buttons parsed:', formButtons.length);
    return formButtons;
  };
  
  return { parseFormButtons };
};

