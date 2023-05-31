const fs = require("fs");
const hre = require("hardhat");

const { network } = require("hardhat");

const currentNetwork = network.name;
console.log("Current network:", currentNetwork);
var configFile;


if (currentNetwork === 'polygonzkEVMTestnet') { configFile = "./src/config/testnet/ploygon-zkevm.js" }
else if (currentNetwork === 'polygonTestnet') { configFile = "./src/config/testnet/mumbai.js" }
else if (currentNetwork === 'evmosTestnet') { configFile = "./src/config/testnet/evmos.js" }
else if (currentNetwork === 'auroraTestnet') { configFile = "./src/config/testnet/near.js" }
else if (currentNetwork === 'gnosisTestnet') { configFile = "./src/config/testnet/gnosis.js" }
else if (currentNetwork === 'arbitrumTestnet') { configFile = "./src/config/testnet/arbitrum.js" }
else if (currentNetwork === 'optimismTestnet') { configFile = "./src/config/testnet/optimism.js" }
else if (currentNetwork === 'goerli') { configFile = "./src/config/testnet/goerli.js" }
console.log("Current configFile: ", configFile);
async function main() {
  // Deploy SVG.sol
  const SVG = await hre.ethers.getContractFactory("SVG");
  const svg = await SVG.deploy();
  await svg.deployed();
  console.log("SVG deployed to:", svg.address);

  // Deploy FLIP.sol
  const FLIP = await hre.ethers.getContractFactory("FLIP");
  const flip = await FLIP.deploy();
  await flip.deployed();
  console.log("Flip deployed to:", flip.address);

  // Deploy FlippandoBundler.sol
  const FlippandoBundler = await hre.ethers.getContractFactory("FlippandoBundler");
  const flippandoBundler = await FlippandoBundler.deploy();
  await flippandoBundler.deployed();
  console.log("FlippandoBundler deployed to:", flippandoBundler.address);

  // Deploy FlippandoGameMaster.sol
  const FlippandoGameMaster = await hre.ethers.getContractFactory("FlippandoGameMaster");
  const flippandoGameMaster = await FlippandoGameMaster.deploy(flip.address);
  await flippandoGameMaster.deployed();
  console.log("FlippandoGameMaster deployed to:", flippandoGameMaster.address);

  // Deploy Flippando.sol
  const Flippando = await hre.ethers.getContractFactory("Flippando");
  const flippando = await Flippando.deploy(svg.address, flip.address, flippandoBundler.address, flippandoGameMaster.address);
  await flippando.deployed();
  console.log("Flippando deployed to:", flippando.address);

  // Change owner to Flippando
  await flip.changeOwner(flippando.address);
  console.log("Changed owner of FLIP to:", flippando.address);

  // Change owner to Flippando
  await flippandoBundler.changeOwner(flippando.address);
  console.log("Changed owner of FlippandoBundler to:", flippando.address);
  
  // Change owner to Flippando
  await flippandoGameMaster.changeOwner(flippando.address);
  console.log("Changed owner of FlippandoGameMaster to:", flippando.address);
  
  // Write the addresses to config.js
  if (configFile !== ""){
  fs.writeFileSync(configFile, `
    module.exports = {
      svgAddress: "${svg.address}",
      flippandoAddress: "${flippando.address}",
      flipAddress: "${flip.address}",
      flippandoBundlerAddress: "${flippandoBundler.address}",
      flippandoGameMasterAddress: "${flippandoGameMaster.address}",
    }`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
