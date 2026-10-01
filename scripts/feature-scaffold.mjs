import fs from 'node:fs';
import path from 'node:path';
import * as prettier from 'prettier';
import ts from 'typescript';
import { featureFiles } from './feature-template.mjs';
import { namingViolations } from './naming-rules.mjs';

export async function formattedFeatureFiles(name, root = path.resolve('src/features')) {
  const target = path.resolve(root, name);
  const configuration = (await prettier.resolveConfig(path.resolve('prettier.config.mjs'))) ?? {};
  const entries = await Promise.all(
    Object.entries(featureFiles(name)).map(async ([file, source]) => {
      if (namingViolations('src/features/' + name + '/' + file, source).length)
        throw new Error('Generated naming is invalid: ' + file);
      if (
        /\.tsx?$/.test(file) &&
        ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true).parseDiagnostics.length
      )
        throw new Error('Generated syntax is invalid: ' + file);
      return [
        file,
        await prettier.format(source, { ...configuration, filepath: path.join(target, file) }),
      ];
    }),
  );
  return Object.fromEntries(entries);
}

/** Stage before reserving a destination; never merge with or overwrite an existing module. */
export async function createFeature(
  name,
  {
    root = path.resolve('src/features'),
    stagingRoot = path.resolve('node_modules/.tmp/feature-scaffolds'),
    dryRun = false,
    copyFile = fs.copyFileSync,
  } = {},
) {
  const files = featureFiles(name);
  root = path.resolve(root);
  const target = path.resolve(root, name);
  if (!target.startsWith(root + path.sep)) throw new Error('Invalid destination.');
  if (fs.existsSync(target)) throw new Error('Feature already exists. No files were written.');
  if (dryRun) return Object.keys(files);
  const formatted = await formattedFeatureFiles(name, root);
  stagingRoot = path.resolve(stagingRoot);
  fs.mkdirSync(stagingRoot, { recursive: true });
  const stage = fs.mkdtempSync(path.join(stagingRoot, 'feature-'));
  const createdFiles = [];
  const createdDirectories = [];
  let reserved = false;
  try {
    for (const [file, content] of Object.entries(formatted)) {
      const stagedFile = path.resolve(stage, file);
      if (!stagedFile.startsWith(stage + path.sep)) throw new Error('Invalid staged path.');
      fs.mkdirSync(path.dirname(stagedFile), { recursive: true });
      fs.writeFileSync(stagedFile, content, { flag: 'wx' });
    }
    fs.mkdirSync(target); // Exclusive reservation prevents concurrent generators from merging.
    reserved = true;
    for (const file of Object.keys(formatted)) {
      const destination = path.resolve(target, file);
      if (!destination.startsWith(target + path.sep)) throw new Error('Invalid destination path.');
      let current = target;
      for (const segment of path.dirname(file).split(/[\\/]/)) {
        if (segment === '.') continue;
        current = path.join(current, segment);
        if (!createdDirectories.includes(current)) {
          fs.mkdirSync(current);
          createdDirectories.push(current);
        }
      }
      copyFile(path.join(stage, file), destination, fs.constants.COPYFILE_EXCL);
      createdFiles.push(destination);
    }
    return Object.keys(formatted);
  } catch (error) {
    // Remove only files published by this run. Never recursively remove a feature directory.
    for (const file of createdFiles.reverse()) {
      if (!file.startsWith(target + path.sep))
        throw new Error('Invalid rollback path.', { cause: error });
      const relative = path.relative(target, file).split(path.sep).join('/');
      if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === formatted[relative])
        fs.unlinkSync(file);
    }
    for (const directory of createdDirectories.reverse()) {
      try {
        fs.rmdirSync(directory);
      } catch {
        /* Preserve anything another actor added. */
      }
    }
    if (reserved) {
      try {
        fs.rmdirSync(target);
      } catch {
        /* Preserve external additions. */
      }
    }
    throw error;
  } finally {
    // stage comes directly from mkdtemp under this resolved staging root.
    if (stage.startsWith(stagingRoot + path.sep))
      fs.rmSync(stage, { recursive: true, force: true });
  }
}
