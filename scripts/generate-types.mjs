import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const componentsDir = path.resolve(__dirname, '../src/components');

async function generateTypes() {
  try {
    const componentDirs = await fs.readdir(componentsDir, { withFileTypes: true });

    for (const dirent of componentDirs) {
      if (dirent.isDirectory()) {
        const componentPath = path.join(componentsDir, dirent.name);
        const specPath = path.join(componentPath, 'spec.json');

        try {
          await fs.access(specPath);
          const specContent = await fs.readFile(specPath, 'utf-8');
          const spec = JSON.parse(specContent);

          const tsContent = generateTsFromSpec(spec);
          const tsPath = path.join(componentPath, 'spec.ts');
          await fs.writeFile(tsPath, tsContent);

          console.log(`Generated types for ${spec.name} at ${tsPath}`);
        } catch (error) {
          if (error.code === 'ENOENT') {
            // spec.json not found, skipping
          } else {
            console.error(`Error processing component ${dirent.name}:`, error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate component types:', error);
  }
}

function generateTsFromSpec(spec) {
  const properties = spec.properties.map(prop => {
    let type;
    if (prop.options) {
      type = prop.options.map(o => `'${o}'`).join(' | ');
    } else {
      switch (prop.type) {
        case 'array':
          type = 'any[]';
          break;
        case 'function':
          type = 'Function';
          break;
        default:
          type = prop.type;
      }
    }
    return `  ${prop.name}${prop.required ? '' : '?'}: ${type};`;
  }).join('\n');

  const childrenProp = spec.children ? `  children?: any; // Adjust type as needed, e.g., BaseSpec for single, BaseSpec[] for multiple` : '';

  const eventTypes = spec.events?.map(event => (
    `    ${event.name}?: string;`
  )).join('\n') || '';

  const eventsBlock = spec.events?.length > 0 ? `
  events?: {
${eventTypes}
  };
` : '  events?: Record<string, string>;';

  return `import { BaseSpec } from '../../types';

export interface ${spec.name}Spec extends BaseSpec {
  component: '${spec.name}';
${properties}
${childrenProp ? `${childrenProp}\n` : ''}${eventsBlock}
}
`;
}

generateTypes(); 