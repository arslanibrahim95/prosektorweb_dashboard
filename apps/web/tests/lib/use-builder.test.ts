import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBuilderStore } from '@/hooks/use-builder-store';
import { type BuilderComponent } from '@/hooks/use-builder-types';

// API servislerini mockla
vi.mock('@/server/api', () => ({
    api: {
        put: vi.fn(),
        get: vi.fn(),
        post: vi.fn(),
    }
}));

// Logger modülünü mockla
vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    }
}));

// window.crypto.randomUUID mock if not available in test env
if (!global.crypto.randomUUID) {
    global.crypto.randomUUID = () => '123e4567-e89b-12d3-a456-426614174000' as `${string}-${string}-${string}-${string}-${string}`;
}

describe('useBuilderStore', () => {
    // Her testten önce store'u sıfırla
    beforeEach(() => {
        useBuilderStore.getState().reset();
    });

    const createMockComponent = (id: string): BuilderComponent => ({
        id,
        type: 'text',
        name: 'Text Block',
        props: { text: 'Hello' }
    });

    it('başlangıç durumunda boş olmalıdır (should initialize with empty state)', () => {
        const state = useBuilderStore.getState();
        expect(state.layoutData.components).toEqual([]);
        expect(state.history).toHaveLength(1);
        expect(state.historyIndex).toBe(0);
        expect(state.isDirty).toBe(false);
    });

    it('bileşen eklendiğinde geçmiş güncellenmelidir (should add a component and update history)', () => {
        const store = useBuilderStore.getState();
        const comp = createMockComponent('test-1');

        store.addComponent(comp);

        const newState = useBuilderStore.getState();
        expect(newState.layoutData.components).toHaveLength(1);
        expect(newState.layoutData.components[0]).toEqual(comp);

        // PushHistory should have added 1 entry (total 2)
        expect(newState.history).toHaveLength(2);
        expect(newState.historyIndex).toBe(1);
        expect(newState.isDirty).toBe(true);
    });

    it('geçmiş limiti 15 ile sınırlandırılmalıdır (should limit history to 15 items)', () => {
        // 20 bileşen ekleyerek limiti (15) aşmaya zorla
        for (let i = 0; i < 20; i++) {
            useBuilderStore.getState().addComponent(createMockComponent(`test-${i}`));
        }

        const newState = useBuilderStore.getState();

        // Sınırın doğru uygulanıp uygulanmadığını kontrol et
        expect(newState.history.length).toBe(15);
        expect(newState.historyIndex).toBe(14);

        // Canvas'ta tüm bileşenler kalmaya devam etmeli
        expect(newState.layoutData.components.length).toBe(20);
    });

    it('geri al ve yinele (undo/redo) fonksiyonları doğru çalışmalıdır', () => {
        const store = useBuilderStore.getState();

        // Bileşen 1 ekle
        store.addComponent(createMockComponent('comp-1'));

        // Bileşen 2 ekle
        useBuilderStore.getState().addComponent(createMockComponent('comp-2'));

        let currentState = useBuilderStore.getState();
        expect(currentState.layoutData.components).toHaveLength(2);

        // Geri Al (Undo)
        currentState.undo();
        currentState = useBuilderStore.getState();
        expect(currentState.layoutData.components).toHaveLength(1);
        expect(currentState.layoutData.components[0]?.id).toBe('comp-1');

        // Yinele (Redo)
        currentState.redo();
        currentState = useBuilderStore.getState();
        expect(currentState.layoutData.components).toHaveLength(2);
        expect(currentState.layoutData.components[1]?.id).toBe('comp-2');
    });

    it('geri aldıktan sonra yeni bir işlem yapıldığında ileri alma (redo) geçmişi silinmelidir', () => {
        const store = useBuilderStore.getState();

        store.addComponent(createMockComponent('comp-1'));
        useBuilderStore.getState().addComponent(createMockComponent('comp-2'));

        useBuilderStore.getState().undo();

        expect(useBuilderStore.getState().history.length).toBe(3);

        // comp-2'yi kaybettiğimiz yer
        useBuilderStore.getState().addComponent(createMockComponent('comp-3'));

        const finalState = useBuilderStore.getState();

        // History durumu: [init, add comp-1, add comp-3] -> uzunluk 3 olmalı
        expect(finalState.history.length).toBe(3);
        expect(finalState.historyIndex).toBe(2);
        expect(finalState.layoutData.components).toHaveLength(2);
        expect(finalState.layoutData.components[1]?.id).toBe('comp-3');
    });

    it('bileşen silme işlemi doğru çalışmalıdır (removeComponent)', () => {
        const store = useBuilderStore.getState();
        store.addComponent(createMockComponent('comp-1'));

        useBuilderStore.getState().removeComponent('comp-1');

        const newState = useBuilderStore.getState();
        expect(newState.layoutData.components).toHaveLength(0);
        expect(newState.history.length).toBe(3); // init, add, remove
    });
});
