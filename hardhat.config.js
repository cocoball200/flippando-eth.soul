/* hardhat.config.js */
require("@nomiclabs/hardhat-waffle")

module.exports = {
  defaultNetwork: "evmosTestnet",
    networks: {
      hardhat: {
        chainId: 1337
      },
      polygonzkEVMTestnet: {
        url: "https://rpc.public.zkevm-test.net",
        accounts: [process.env.privateKey],
        chainId: 1442,
      },
      polygonzkEVMMainnet: {
        url: "https://zkevm-rpc.com",
        accounts: [process.env.privateKey],
        chainId: 1101,
      },
      polygonTestnet: {
        url: "https://rpc-mumbai.maticvigil.com",
        accounts: [process.env.privateKey],
        chainId: 80001,
      },
      polygonMainnet: {
        url: "https://rpc-mainnet.maticvigil.com",
        accounts: [process.env.privateKey],
        chainId: 1101,
      },
      evmosTestnet: {
        url: "https://eth.bd.evmos.dev:8545/",
        accounts: [process.env.privateKey],
        chainId: 9000,
      },    
      evmosLocal: {
        url: "http://localhost:8545/",
        chainId: 9000,
        accounts: [process.env.privateKey]
      },
      auroraMain: {
        url: "	https://mainnet.aurora.dev",
        chainId: 1313161554,
        accounts: [process.env.privateKey]
      },
      auroraTestnet: {
        url: "	https://testnet.aurora.dev",
        chainId: 1313161555,
        accounts: [process.env.privateKey]
      },
      gnosisTestnet: {
        url: "https://rpc.testnet.gnosis.io",
        accounts: [process.env.privateKey],
        chainId: 42220,
      },
      arbitrumTestnet: {
        url: "https://rinkeby.arbitrum.io/rpc",
        accounts: [process.env.privateKey],
        chainId: 421611,
      },
      optimismTestnet: {
        url: "https://kovan.optimism.io",
        accounts: [process.env.privateKey],
        chainId: 420,
      },
      goerli: {
        url: "https://rpc.ankr.com/eth_goerli",
        accounts: [process.env.privateKey],
        chainId: 5,
      }                        
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 50
      }
    }
  }
}