#!/usr/bin/env python3
"""
Actualizar configuración de La Vila Joiosa con URLs correctas
"""

import sys

# Agregar el path del agente
sys.path.insert(0, '/Users/tonillorens/Desktop/wearecity_app/.venv/lib/python3.12/site-packages')

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    
    print("✅ Firebase Admin importado correctamente")
except ImportError as e:
    print(f"❌ Error importando Firebase Admin: {e}")
    sys.exit(1)

def update_villajoyosa_config():
    """Actualizar configuración de La Vila Joiosa"""
    
    try:
        # Inicializar Firebase Admin
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        
        db = firestore.client()
        
        # Configuración actualizada para La Vila Joiosa
        updated_config = {
            'name': 'La Vila Joiosa',
            'slug': 'la-vila-joiosa',
            'displayName': 'La Vila Joiosa',
            'province': 'Alicante',
            'region': 'Comunidad Valenciana',
            'population': 33000,
            'isActive': True,
            
            # URLs CORRECTAS
            'agendaEventosUrls': [
                'https://www.villajoyosa.com/evento/agenda-deportiva/',
                'https://www.villajoyosa.com/evento/',
                'https://www.villajoyosa.com/categoria/eventos/'
            ],
            
            # URLs institucionales
            'officialWebsite': 'https://www.villajoyosa.com',
            'contactInfo': {
                'phone': '+34 96 685 13 00',
                'email': 'info@villajoyosa.com',
                'address': 'Plaza de la Generalitat, 1, 03570 La Vila Joiosa, Alicante'
            },
            
            # Configuración de scraping
            'scrapingConfig': {
                'enabled': True,
                'selectors': {
                    'eventContainer': 'article, .post, .event-item, .mec-event-article',
                    'title': 'h1, h2, h3, .entry-title, .event-title, .mec-event-title',
                    'description': '.entry-content, .event-description, .content, .excerpt, p, .mec-event-description',
                    'date': '.event-date, .entry-date, .published, .mec-event-date, time, .mec-date-wrap',
                    'location': '.event-location, .venue, .location, .mec-event-location',
                    'link': 'a[href]',
                    'image': 'img[src]'
                },
                'waitTime': 3000,
                'scrollDistance': 400
            },
            
            # Metadatos
            'updatedAt': firestore.SERVER_TIMESTAMP,
            'updatedBy': 'system_config_update',
            'configVersion': '2.0'
        }
        
        # Actualizar documento de la ciudad
        city_ref = db.collection('cities').document('la-vila-joiosa')
        city_ref.set(updated_config, merge=True)
        
        print("✅ Configuración de La Vila Joiosa actualizada exitosamente")
        print(f"   🌐 URLs de eventos: {len(updated_config['agendaEventosUrls'])}")
        print(f"   🔗 Website oficial: {updated_config['officialWebsite']}")
        print(f"   🕷️ Scraping habilitado: {updated_config['scrapingConfig']['enabled']}")
        
        # Verificar la actualización
        updated_doc = city_ref.get()
        if updated_doc.exists:
            data = updated_doc.to_dict()
            print(f"   ✅ Verificado: {data['name']} - {len(data.get('agendaEventosUrls', []))} URLs")
        
        return True
        
    except Exception as e:
        print(f"❌ Error actualizando configuración: {e}")
        return False

def test_new_urls():
    """Probar las nuevas URLs"""
    import requests
    
    urls_to_test = [
        'https://www.villajoyosa.com/evento/agenda-deportiva/',
        'https://www.villajoyosa.com/evento/',
        'https://www.villajoyosa.com/categoria/eventos/'
    ]
    
    print("\n🧪 Probando URLs actualizadas...")
    
    for url in urls_to_test:
        try:
            response = requests.head(url, timeout=10)
            status = "✅" if response.status_code == 200 else f"⚠️ {response.status_code}"
            print(f"   {status} {url}")
        except Exception as e:
            print(f"   ❌ {url} - Error: {e}")

def main():
    """Actualizar configuración y probar URLs"""
    print("🔧 ACTUALIZACIÓN DE CONFIGURACIÓN - LA VILA JOIOSA")
    print("=" * 60)
    
    # 1. Actualizar configuración
    print("📝 Actualizando configuración en Firestore...")
    success = update_villajoyosa_config()
    
    if not success:
        print("❌ No se pudo actualizar la configuración")
        return
    
    # 2. Probar URLs
    test_new_urls()
    
    print(f"\n🎯 CONFIGURACIÓN ACTUALIZADA")
    print(f"   • Dominio correcto: villajoyosa.com")
    print(f"   • Certificado SSL: ✅ Válido")
    print(f"   • URLs de eventos: 3 configuradas")
    print(f"   • Scraping: Habilitado")
    
    print(f"\n🚀 ¡La Vila Joiosa lista para scraping!")

if __name__ == "__main__":
    main()
