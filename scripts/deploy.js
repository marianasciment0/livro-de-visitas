const hre = require("hardhat");

async function main() {
  console.log("Publicando contrato LivroDeVisitas na blockchain...\n");
  const LivroDeVisitas = await hre.ethers.getContractFactory("LivroDeVisitas");
  const contrato = await LivroDeVisitas.deploy();
  await contrato.waitForDeployment();
  const address = await contrato.getAddress();
  console.log(`✅ Contrato publicado com sucesso!`);
  console.log(`📍 Endereço: ${address}`);
  console.log(`\n👉 Cole esse endereço em frontend/app.js na variável CONTRACT_ADDRESS`);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
