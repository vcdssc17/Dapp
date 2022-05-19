// constants
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import Web3Modal from "web3modal";
import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

// log
import { fetchData } from "../data/dataActions";
import blockchainReducer from "./blockchainReducer";


const connectRequest = () => {
  return {
    type: "CONNECTION_REQUEST",
  };
};

const connectSuccess = (payload) => {
  return {
    type: "CONNECTION_SUCCESS",
    payload: payload,
  };
};

const connectFailed = (payload) => {
  return {
    type: "CONNECTION_FAILED",
    payload: payload,
  };
};

const updateAccountRequest = (payload) => {
  return {
    type: "UPDATE_ACCOUNT",
    payload: payload,
  };
};

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest());
    const abiResponse = await fetch("/config/abi.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    const abi = await abiResponse.json();
    const configResponse = await fetch("/config/config.json", {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const providerOptions = {
      coinbasewallet: {
        package: CoinbaseWalletSDK,
        options: {
          appName: "Ruleks Web3",
          infuraId: "9aa3d95b3bc440fa88ea12eaa4456161"
          // https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161
        }
      }
    };

    const web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      // theme: "dark", // optional
      providerOptions // required

    });

    try {
      const provider = await web3Modal.connect();
      console.log(provider);

      const CONFIG = await configResponse.json();
      if (window.ethereum) {
        //   Web3EthContract.setProvider(provider);
        //   let web3 = new Web3(ethereum);

        Web3EthContract.setProvider(provider);
        let web3 = new Web3(provider);
        try {
          // const accounts = await ethereum.request({
          //   method: "eth_requestAccounts",
          // });
          const accounts = await web3.eth.getAccounts();

          // const networkId = await ethereum.request({
          //   method: "net_version",
          // });

          const networkId = await web3.eth.net.getId();

          if (networkId == CONFIG.NETWORK.ID) {
            const SmartContractObj = new Web3EthContract(
              abi,
              CONFIG.CONTRACT_ADDRESS
            );
            dispatch(
              connectSuccess({
                account: accounts[0],
                smartContract: SmartContractObj,
                web3: web3,
              })
            );

            //       // Add listeners start
            provider.on("accountsChanged", (accounts) => {
              dispatch(updateAccount(accounts[0]));
            });
            provider.on("chainChanged", () => {
              window.location.reload();
            });
            //       // Add listeners end
          } else {
            dispatch(connectFailed(`Change network to ${CONFIG.NETWORK.NAME}.`));
          }
        } catch (err) {
          dispatch(connectFailed("Something went wrong."));
        }
      } else {
        dispatch(connectFailed("Install Metamask or Coinbase."));
      }
    } catch (err) {
      dispatch(connectFailed("Something went wrong."));

    }



  };
};

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }));
    dispatch(fetchData(account));
  };
};
