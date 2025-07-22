// Динамический реестр компонентов UserFace
// В userface (движке) не должно быть жёстко прописанных компонентов!
// В проекте клиента этот механизм должен быть переопределён/расширен.

// Попытка динамически импортировать компоненты из userface/library (если есть)
let componentRegistry: Record<string, any> = {};
try {
  // @ts-ignore
  // eslint-disable-next-line
  const req = require.context('../../../../userface/library', true, /index\.(js|ts)$/);
  req.keys().forEach((key: string) => {
    const name = key.split('/')[1]?.toLowerCase();
    if (name) {
      componentRegistry[name] = req(key).default || req(key);
    }
  });
} catch (e) {
  // Если папки нет — просто пустой реестр
  componentRegistry = {};
}

export { componentRegistry };
export type ComponentName = keyof typeof componentRegistry;
