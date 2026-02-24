import { ComponentConfig } from '../registry';
import HeroComponent from '../hero';
import { asRegistryComponent } from '../registry-utils';

export const heroConfig: ComponentConfig = {
    name: 'Hero Bolumu',
    description: 'Dikkat çekici giris bolumu',
    category: 'hero',
    icon: 'Square',
    type: 'hero',
    defaultProps: {
        title: 'Harika Bir Baslik',
        subtitle: 'Buraya etkileyici bir alt baslik yazabilirsiniz. Sizi anlatan kisa ve oz bir cumle.',
        backgroundImage: '',
        backgroundColor: '#f3f4f6',
        textColor: '#1f2937',
        buttonText: 'Baslayalim',
        buttonUrl: '#',
        buttonColor: '#6366f1',
        overlay: true,
        overlayOpacity: 50,
        align: 'center',
        height: 'medium',
    },
    schema: {
        title: { type: 'text', label: 'Baslik', placeholder: 'Ana baslik girin' },
        subtitle: { type: 'text', label: 'Alt Baslik', placeholder: 'Alt baslik girin' },
        backgroundImage: { type: 'image', label: 'Arka Plan Resmi' },
        backgroundColor: { type: 'color', label: 'Arka Plan Rengi' },
        textColor: { type: 'color', label: 'Metin Rengi' },
        buttonText: { type: 'text', label: 'Buton Metni', placeholder: 'Baslayalim' },
        buttonUrl: { type: 'url', label: 'Buton Linki' },
        buttonColor: { type: 'color', label: 'Buton Rengi' },
        overlay: { type: 'boolean', label: 'Karartma Katmani' },
        overlayOpacity: { type: 'range', label: 'Karartma Yogunlugu', min: 0, max: 100 },
        align: {
            type: 'select',
            label: 'Hizalama',
            options: [
                { value: 'left', label: 'Sol' },
                { value: 'center', label: 'Orta' },
                { value: 'right', label: 'Sag' },
            ]
        },
        height: {
            type: 'select',
            label: 'Yukseklik',
            options: [
                { value: 'small', label: 'Kucuk' },
                { value: 'medium', label: 'Orta' },
                { value: 'large', label: 'Buyuk' },
                { value: 'full', label: 'Tam Ekran' },
            ]
        },
    },
    component: asRegistryComponent(HeroComponent),
    responsive: true,
    themeable: true,
};
