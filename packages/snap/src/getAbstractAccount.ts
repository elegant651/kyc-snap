import { ethers } from 'ethers';
import { SimpleAccountAPI } from '@account-abstraction/sdk';

const entryPointAddress = process.env.ENTRY_POINT_ADDRESS || '';
const factoryAddress = process.env.FACTORY_ADDRESS;

export const getAbstractAccount = async (): Promise<SimpleAccountAPI> => {
  const provider = new ethers.providers.Web3Provider(wallet as any);
  await provider.send('eth_requestAccounts', []);
  const owner = provider.getSigner();
  const aa = new SimpleAccountAPI({
    provider,
    entryPointAddress,
    owner,
    factoryAddress,
  });
  return aa;
};
