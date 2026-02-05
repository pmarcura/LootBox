/**
 * Script para converter imagens PNG para WebP com qualidade 80-85%.
 * Reduz tamanho de ~8MB para ~800KB-1.5MB por imagem.
 * 
 * Uso: npx tsx src/scripts/convert-images-webp.ts
 */
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const QUALITY = 82; // 80-85 é um bom balanço qualidade/tamanho
const DIRS = [
  "public/images/creatures",
  "public/images/strains",
];

async function convertToWebP(inputPath: string): Promise<{ original: number; converted: number }> {
  const outputPath = inputPath.replace(/\.png$/i, ".webp");
  const originalStats = fs.statSync(inputPath);
  
  await sharp(inputPath)
    .webp({ quality: QUALITY })
    .toFile(outputPath);
  
  const convertedStats = fs.statSync(outputPath);
  
  return {
    original: originalStats.size,
    converted: convertedStats.size,
  };
}

async function processDirectory(dir: string): Promise<void> {
  const fullPath = path.resolve(process.cwd(), dir);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Diretório não encontrado: ${fullPath}`);
    return;
  }
  
  const files = fs.readdirSync(fullPath).filter(f => f.toLowerCase().endsWith(".png"));
  
  if (files.length === 0) {
    console.log(`Nenhum PNG encontrado em: ${dir}`);
    return;
  }
  
  console.log(`\n📁 ${dir} (${files.length} arquivos)`);
  
  let totalOriginal = 0;
  let totalConverted = 0;
  
  for (const file of files) {
    const filePath = path.join(fullPath, file);
    try {
      const { original, converted } = await convertToWebP(filePath);
      totalOriginal += original;
      totalConverted += converted;
      
      const reduction = ((1 - converted / original) * 100).toFixed(1);
      console.log(`  ✓ ${file} → ${(original / 1024 / 1024).toFixed(1)}MB → ${(converted / 1024 / 1024).toFixed(2)}MB (-${reduction}%)`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }
  
  const totalReduction = ((1 - totalConverted / totalOriginal) * 100).toFixed(1);
  console.log(`  Total: ${(totalOriginal / 1024 / 1024).toFixed(1)}MB → ${(totalConverted / 1024 / 1024).toFixed(1)}MB (-${totalReduction}%)`);
}

async function main() {
  console.log("🖼️  Convertendo imagens PNG para WebP...\n");
  console.log(`Qualidade: ${QUALITY}%`);
  
  for (const dir of DIRS) {
    await processDirectory(dir);
  }
  
  console.log("\n✅ Conversão concluída!");
  console.log("\n📝 Próximos passos:");
  console.log("   1. Atualizar season01.json: trocar .png por .webp nas image_url");
  console.log("   2. (Opcional) Remover os arquivos .png originais após testar");
  console.log("   3. Fazer deploy e testar o reveal");
}

main().catch(console.error);
