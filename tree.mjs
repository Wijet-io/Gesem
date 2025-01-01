import fs from 'fs';
import path from 'path';

const excludeDirs = ['node_modules', '.git'];

async function generateTree(dir, prefix = '') {
  const files = await fs.promises.readdir(dir);
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const filePath = path.join(dir, file);
    const isLast = index === files.length - 1;
    const newPrefix = prefix + (isLast ? '└── ' : '├── ');

    const stat = await fs.promises.stat(filePath);
    if (stat.isDirectory()) {
      if (!excludeDirs.includes(file)) {
        console.log(newPrefix + file);
        await generateTree(filePath, prefix + (isLast ? '    ' : '│   '));
      }
    } else {
      console.log(newPrefix + file);
    }
  }
}

console.log('.');
generateTree('.');
