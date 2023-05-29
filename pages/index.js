/* eslint-disable react/no-unknown-property */
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ethers, utils } from 'ethers';
import { setAddresses } from '../slices/flippandoSlice';
import {
  flippandoAddress,
  flipAddress,
  flippandoBundlerAddress
} from '../config'
import Flippando from '../artifacts/contracts/Flippando.sol/Flippando.json'
import Flip from '../artifacts/contracts/Flip.sol/Flip.json'
import FlippandoBundler from '../artifacts/contracts/FlippandoBundler.sol/FlippandoBundler.json'
import SmallTile from '../components/SmallTile';

export default function Home() {

  const dispatch = useDispatch();
  const [flipBalance, setFlipBalance] = useState(0);
  const [lockedFlipBalance, setLockedFlipBalance] = useState(0);
  const [nfts, setNfts] = useState([]);
  const [currentBlockchain, setCurrentBlockchain] = useState(undefined);
  const blockchains = [
    {'Ethereum Goerli': 'goerli'},
    {'Polygon Mumbai': 'mumbai'}, 
    {'Polygon zkEVM' :'polygon-zkevm'},
    {'Near Protocol': 'near'}, 
    {'Evmos': 'evmos'},
    {'Gnosis Chain': 'gnosis'},
    {'Arbitrum': 'arbitrum'},
    {'Optimism': 'optimism'}
  ];
  //console.log('nfts ' + JSON.stringify(nfts, null, 2));

  useEffect(() => {
    if(currentBlockchain !== undefined){
      fetchNFTs();
      fetchUserBalances();
    }
  }, [currentBlockchain]);


  const fetchUserBalances = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(flipAddress, Flip.abi, signer);

    const accountAddress = await signer.getAddress();
    console.log('Address:', accountAddress);

    try {
      const balance = await contract.balanceOf(accountAddress);

      console.log('Balance:', balance);
      const balanceFormatted = ethers.utils.formatEther(balance, "ether");
      console.log('Account Balance:', balanceFormatted);
      setFlipBalance(Math.round(balanceFormatted * 100) / 100);
    }
    catch (error) {
      console.log('Error:', error);
    }
  
  }

  const fetchNFTs = async () => {
    // Connect to the Ethereum network
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(flippandoAddress, Flippando.abi, signer);
    const flipContract = new ethers.Contract(flipAddress, Flip.abi, signer);
    const flippandoBundlerContract = new ethers.Contract(flippandoBundlerAddress, FlippandoBundler.abi, signer);
    const accountAddress = await signer.getAddress();
    // Get the current user's address
    const userAddress = await signer.getAddress();
    var incrementedBalance = 0;
    try {
      const tokenIds = await contract.getUserNFTs({ from: userAddress });
      var nftData = [];
      await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            try {
              const lockedBalanceInToken = await flipContract.getLockedBalance(accountAddress, tokenId);
              const formattedLockedBalanceInToken = Math.round(lockedBalanceInToken) / 1000000000000000000;
              incrementedBalance = lockedFlipBalance + formattedLockedBalanceInToken;
            }
            catch {
              console.error('Error while retrieving lockedFlipBalance:', error);
            }
            try {
              const isPartOfArtwork = await flippandoBundlerContract.isPartOfArtwork(tokenId);
              console.log("isPartOfArtwork ", isPartOfArtwork);
              if (isPartOfArtwork === false) {
                console.log("inside isPartOfArtwork check");
                const tokenUri = await contract.tokenURI(tokenId);
                const response = await fetch(tokenUri);
                const metadata = await response.text();
                console.log("metadata ", metadata);
                if (metadata !== undefined && metadata !== null) {
                  var nftObject = {
                    tokenId: tokenId.toString(),
                    metadata: JSON.parse(metadata),
                  };
                  nftData.push(nftObject);
                }
              }
            }
            catch {
              console.error('Error while checking if nft is part of artwork:', error);
            }
            
          } catch (error) {
            console.error('Error while retrieving NFT metadata:', error);
          }          
        })
      );
      setLockedFlipBalance(incrementedBalance);
      console.log('nftData ', nftData);
      setNfts(nftData);
    
    } catch (error) {
      if (error.code === ethers.utils.Logger.errors.CALL_EXCEPTION) {
        console.log('Error: Exception in the getUserNFTs contract function call');
      } else {
        console.error('Error:', error);
      }
    }
    
    
  };

  const handleClick = (value) => {
    dispatch(setAddresses({network: value}));    
  };

  
  return (
    <div className={styles.container}>
      <Head>
        <title>Flippando</title>
        <meta name="description" content="Entry point" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="grid flex grid-cols-5">
        
        <div className='col-span-5'>
          {blockchains.map((block, index) => {
            const key = Object.keys(block)[0];
            const value = block[key];
            return(
              <button key={index} onClick={() => handleClick(value)}>
                {key}
              </button>
            )
          })}
          <footer className={styles.footer}>
          </footer>
          
        </div>
      </div>
      
    </div>
  )
}
