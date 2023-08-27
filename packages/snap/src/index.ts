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
export const onTransaction: OnTransactionHandler = async ({ transaction }) => {
  if (typeof transaction.data === 'string' && transaction.data !== '0x') {
    return {
      content: panel([
        heading('Percent Snap'),
        text(
          'This snap only provides transaction insights for simple ETH transfers.',
        ),
      ]),
    };
  }

  // Display percentage of gas fees in the transaction insights UI.
  return {
    content: panel([
      heading('Transaction insights snap'),
      text(
        `for this transaction.`,
      ),
    ]),
  };
};
