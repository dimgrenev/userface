import fs from 'fs';
import path from 'path';

const LIBRARY_PATH = path.resolve(process.cwd(), 'userface/library');
const GENERATED_PATH = path.resolve(process.cwd(), 'userface/generated');

function scanComponents() {
  if (!fs.existsSync(LIBRARY_PATH)) return [];
  const libs = fs.readdirSync(LIBRARY_PATH);
  const components: { lib: string; name: string; entry: string; spec: string | null }[] = [];
  libs.forEach(lib => {
    const libPath = path.join(LIBRARY_PATH, lib);
    if (fs.statSync(libPath).isDirectory()) {
      fs.readdirSync(libPath).forEach(comp => {
        const compPath = path.join(libPath, comp);
        if (fs.statSync(compPath).isDirectory()) {
          const entry = path.join(compPath, 'index.ts');
          const spec = path.join(compPath, `${comp}.json`);
          components.push({
            lib,
            name: comp,
            entry: fs.existsSync(entry) ? entry : '',
            spec: fs.existsSync(spec) ? spec : null
          });
        }
      });
    }
  });
  return components;
}

function generateTypes(components: ReturnType<typeof scanComponents>) {
  let out = `// AUTO-GENERATED TYPES\n`;
  components.forEach(({ name, entry }) => {
    if (entry) {
      out += `import type * as ${name}Types from '../library/${name}/index';\n`;
    }
  });
  out += `\nexport type UserfaceComponent =\n`;
  components.forEach(({ name, entry }, i) => {
    if (entry) {
      out += `  | { component: '${name.toLowerCase()}'; props: ${name}Types.Props }\n`;
    }
  });
  out += `;\n`;
  return out;
}

function generateRegistry(components: ReturnType<typeof scanComponents>) {
  let out = `// AUTO-GENERATED REGISTRY\n`;
  out += `export const componentRegistry = {\n`;
  components.forEach(({ name, entry }) => {
    if (entry) {
      out += `  '${name.toLowerCase()}': require('../library/${name}/index').default,\n`;
    }
  });
  out += `};\n`;
  return out;
}

function generateSpecs(components: ReturnType<typeof scanComponents>) {
  const specs = components
    .filter(c => c.spec)
    .map(c => {
      try {
        return {
          lib: c.lib,
          name: c.name,
          spec: JSON.parse(fs.readFileSync(c.spec!, 'utf-8'))
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return JSON.stringify(specs, null, 2);
}

function writeGeneratedFiles(components: ReturnType<typeof scanComponents>) {
  if (!fs.existsSync(GENERATED_PATH)) fs.mkdirSync(GENERATED_PATH, { recursive: true });
  fs.writeFileSync(path.join(GENERATED_PATH, 'types.ts'), generateTypes(components));
  fs.writeFileSync(path.join(GENERATED_PATH, 'registry.ts'), generateRegistry(components));
  fs.writeFileSync(path.join(GENERATED_PATH, 'specs.json'), generateSpecs(components));
  console.log('✅ Сгенерированы types.ts, registry.ts, specs.json для', components.length, 'компонентов');
}

function main() {
  const components = scanComponents();
  writeGeneratedFiles(components);
}

if (process.argv.includes('--watch')) {
  console.log('👀 Watch mode: отслеживаю изменения в userface/library...');
  main();
  fs.watch(LIBRARY_PATH, { recursive: true }, () => {
    main();
  });
} else {
  main();
} 