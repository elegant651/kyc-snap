import { OnRpcRequestHandler, OnTransactionHandler } from '@metamask/snaps-types';
import { heading, panel, text } from '@metamask/snaps-ui';
import { ethers } from 'ethers';
import { getAbstractAccount } from './getAbstractAccount';

async function getFees() {
  const response = await fetch('https://beaconcha.in/api/v1/execution/gasnow');
  return response.text();
}

const getEoaAddress = async (): Promise<string> => {
  const provider = new ethers.providers.Web3Provider(wallet as any);
  const accounts = await provider.send('eth_requestAccounts', []);
  return accounts[0];
};

export const getAddressAA = async (): Promise<string> => {
  const aa = await getAbstractAccount();
  const address = await aa.getAccountAddress();
  return address;
};

const verifyWorldIdToken = async (token: string) => {
  const response = await fetch(`${process.env.HOST_URI}/api/worldcoin/auth?token=${token}`);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data.result;
};

/**
 * Handle incoming JSON-RPC requests, sent through `wallet_invokeSnap`.
 *
 * @param args - The request handler args as object.
 * @param args.origin - The origin of the request, e.g., the website that
 * invoked the snap.
 * @param args.request - A validated JSON-RPC request object.
 * @returns The result of `snap_dialog`.
 * @throws If the request method is not valid for this snap.
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  switch (request.method) {
    case 'hello':
      return getFees().then(fees => {
        return snap.request({
          method: 'snap_dialog',
          params: {
            type: 'alert',
            content: panel([
              text(`Hello, **${origin}**!`),
              text(`Current gas fee estimates: ${fees}`),
            ]),
          },
        });
      });
    case 'setWorldId':
      return await snap.request({
        method: 'snap_manageState',
        params: {
          operation: 'update',
          newState: { worldId: request.params.worldId },
        }
      })
    case 'getWorldId':
      return await snap.request({
        method: 'snap_manageState',
        params: { operation: 'get' }
      })
    case 'connect_eoa':
      return await getEoaAddress()
    case 'connect_aa':
      return await getAddressAA()
    default:
      throw new Error('Method not found.');
  }
};

// Handle outgoing transactions.
export const onTransaction: OnTransactionHandler = async ({ chainId, transaction }) => {
  const data = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });

  if (!data) {
    return {
      content: panel([
        heading('KYC authentication is required!!'),
        text('In order to execute the transaction, KYC authentication must be performed first.'),
      ]),
    };
  }

  const verifiedWorldId = await verifyWorldIdToken(data.worldId as string);
  if (!verifiedWorldId) {
    return {
      content: panel([
        heading('KYC authentication is required!!'),
        text('In order to execute the transaction, KYC authentication must be performed first.'),
      ]),
    };
  }

  const walletAddress = transaction.from?.toString();
  const toAddress = transaction.to?.toString();
  const inputData = transaction.data?.toString();

  if (!walletAddress || !toAddress || !inputData || !chainId) {
    throw new Error('Missing required parameters');
  }

  // Display percentage of gas fees in the transaction insights UI.
  return {
    content: panel([
      heading('Verified with KYC-Snap!!'),
      text(verifiedWorldId.sub),
    ]),
  };
};
