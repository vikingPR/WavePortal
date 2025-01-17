import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from './utils/WavePortal.json'

const TWITTER_HANDLE_VIKING = '0xViking';
const TWITTER_LINK_VIKING = `https://twitter.com/${TWITTER_HANDLE_VIKING}`;
const LINKEDIN_HANDLE_VIKING = 'praneethreddyarikatla';
const LINKEDIN_LINK_VIKING = `https://www.linkedin.com/in/${LINKEDIN_HANDLE_VIKING}`;


const App = () =>{

  const contractAddress = "0x36ED4e0eC5bD06efDB20e7c5d937a51bFCEa2a16";
  const contractABI = abi.abi;
  const [inputValue, setInputValue] = useState('');
  const [currentAccount, setCurrentAccount] = useState("");
  const [allWaves, setAllWaves] = useState([]);

 const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const checkIfWalletIsConnected = async() => {
    document.getElementById("loadingGif").style.display = "none";
      try{
        /*
        * First make sure we have access to window.ethereum
        */
        const { ethereum } = window;

        if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
        } else {
          console.log("We have the ethereum object", ethereum);
        }

        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
        } else {
          console.log("No authorized account found")
        }
      }
      catch (error) {
        console.log(error);
      }   

    }

    const connectWallet = async () => {
      try {
        const { ethereum } = window;

        if (!ethereum) {
          alert("Get MetaMask!");
          return;
        }

        const accounts = await ethereum.request({ method: "eth_requestAccounts" });

        console.log("Connected", accounts[0]);
        setCurrentAccount(accounts[0]); 
      } catch (error) {
        console.log(error)
      }
    }

    const wave = async () => {
        try {
          const { ethereum } = window;

          if (ethereum) {
            const provider = new ethers.providers.Web3Provider(ethereum);
            const signer = provider.getSigner();
            const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
            
            let count = await wavePortalContract.getTotalWaves();
            console.log("Retrieved total wave count...", count.toNumber());

            const waveTxn = await wavePortalContract.wave(inputValue, { gasLimit: 300000 })
            console.log("Mining...", waveTxn.hash);
            document.getElementById("waveButton").style.display = 'none'
            document.getElementById("loadingGif").style.display = "flex";


            await waveTxn.wait()
            console.log("Mined -- ", waveTxn.hash);
            document.getElementById("loadingGif").style.display = "none";
            document.getElementById("waveButton").style.display = 'block'
            setInputValue("");

            count = await wavePortalContract.getTotalWaves();
            console.log("Retrieved total wave count...", count.toNumber());

          } else {
            console.log("Ethereum object doesn't exist!");
          }
        } catch (error) {
          console.log(error)
        }
    }

    /*
    * This runs our function when the page loads.
    */
    useEffect(() => {
      checkIfWalletIsConnected();
    }, [])
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey there!
        </div>
        
        <div className="bio">
        I am Praneeth Reddy, puruing masters in computer science at Polimi, Milan, Italy. As of now i came for an exchange program called Alliance4Tech which is part of Erasmus+. You can contact me via Twitter <a
            className="footer-text-rune"
            href={TWITTER_LINK_VIKING}
            target="_blank"
            rel="noreferrer"
          >{`@${TWITTER_HANDLE_VIKING}`}</a> or through Linkedin <a
            className="footer-text-rune"
            href={LINKEDIN_LINK_VIKING}
            target="_blank"
            rel="noreferrer"
          >{`@${LINKEDIN_HANDLE_VIKING}`}</a>
        </div>
        
        <div className="connected-container"> 
          <form
            onSubmit={(event) => {
              event.preventDefault();
              wave();
            }}
          >
            <input
              type="text"
              placeholder="Send a Message to Me!"
              required
              value={inputValue}
              onChange={onInputChange}
            />
            <button type="submit" id="waveButton" className="cta-button submit-gif-button">
            Wave at Me
          </button>
          </form>
        </div>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
        {allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}

export default App
