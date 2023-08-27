import { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { MetamaskActions, MetaMaskContext } from '../hooks';
import {
  connectAA,
  connectEOA,
  connectSnap,
  getSnap,
  getWorldIdFromSnap,
  sendHello,
  setSubscribe,
  setWorldIdToSnap,
  shouldDisplayReconnectButton,
} from '../utils';
import {
  ConnectButton,
  InstallFlaskButton,
  ReconnectButton,
  SendHelloButton,
  Card,
  WorldIdButton,
} from '../components';

const Index = () => {
  const [state, dispatch] = useContext(MetaMaskContext);
  const [eoaAddress, setEOAAddress] = useState('');
  const [addressAA, setAddressAA] = useState('');

  useEffect(() => {
    const searchParams = new URLSearchParams(document.location.search);
    const idToken = searchParams.get('id_token');
    const subscribeToken = searchParams.get('token');

    if (idToken) {
      handleVerify(idToken);
    }
    if (subscribeToken) {
      handleSubscribe();
    }
  }, []);

  const handleVerify = async (idToken: string) => {
    const result = await fetch(
      `${process.env.HOST_URI}/api/worldcoin/verify`,
      {
        mode: 'no-cors',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: idToken,
        }),
      },
    );

    if (result.status === 500) {
      console.error(result);
      return;
    }

    await setWorldIdToSnap(idToken);
    // const res = await getWorldIdFromSnap();
    // console.log(res);
  };

  const handleSubscribe = async () => {
    await setSubscribe();
  };

  const handleConnectClick = async () => {
    try {
      await connectSnap();
      const installedSnap = await getSnap();

      dispatch({
        type: MetamaskActions.SetInstalled,
        payload: installedSnap,
      });
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleConnectAAClick = async () => {
    try {
      setEOAAddress(await connectEOA());
      setAddressAA(await connectAA());
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleSendHelloClick = async () => {
    try {
      await sendHello();
    } catch (e) {
      console.error(e);
      dispatch({ type: MetamaskActions.SetError, payload: e });
    }
  };

  const handleWorldIdConnect = async () => {
    const walletAddress = await window.ethereum.request({
      method: 'eth_requestAccounts',
    })
    window.location.href = `https://id.worldcoin.org/authorize?client_id=${process.env.WORLD_COIN_CLIENT_ID}&response_type=code%20id_token&redirect_uri=${process.env.WORLD_COIN_REDIRECT_URI}&state=${walletAddress}&nonce=${new Date().getTime()}`;
  };

  return (
    <Container>
      <Heading>
        Welcome to <Span>KYC-Snap</Span>
      </Heading>
      <CardContainer>
        {state.error && (
          <ErrorMessage>
            <b>An error happened:</b> {state.error.message}
          </ErrorMessage>
        )}
        {!state.isFlask && (
          <Card
            content={{
              title: 'Install',
              description:
                'Snaps is pre-release software only available in MetaMask Flask, a canary distribution for developers with access to upcoming features.',
              button: <InstallFlaskButton />,
            }}
            fullWidth
          />
        )}
        {/* {!state.installedSnap && (
          <Card
            content={{
              title: 'Connect',
              description:
                'Get started by connecting to and installing the example snap.',
              button: (
                <ConnectButton
                  onClick={handleConnectClick}
                  disabled={!state.isFlask}
                />
              ),
            }}
            disabled={!state.isFlask}
          />
        )} */}
        
        {!state.installedSnap && (
          <Card
            content={{
              title: 'ConnectAA',
              description:
                'Connecting to abstract account.',
              button: (
                <ConnectButton
                  onClick={handleConnectAAClick}
                  disabled={!state.isFlask}
                />
              ),
            }}
            disabled={!state.isFlask}
          />
        )}

        {eoaAddress && addressAA && (
          <div>
            <div>EOA Account: {eoaAddress} </div>
            <div>Abstract Account: {addressAA}</div>
          </div>
        )}

        <Card
          content={{
            title: 'World ID',
            description: 'Connect with World ID.',
            button: (
              <WorldIdButton
                onClick={handleWorldIdConnect}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />

        {shouldDisplayReconnectButton(state.installedSnap) && (
          <Card
            content={{
              title: 'Reconnect',
              description:
                'While connected to a local running snap this button will always be displayed in order to update the snap if a change is made.',
              button: (
                <ReconnectButton
                  onClick={handleConnectClick}
                  disabled={!state.installedSnap}
                />
              ),
            }}
            disabled={!state.installedSnap}
          />
        )}
        <Card
          content={{
            title: 'Send Hello message',
            description:
              'Display a custom message within a confirmation screen in MetaMask.',
            button: (
              <SendHelloButton
                onClick={handleSendHelloClick}
                disabled={!state.installedSnap}
              />
            ),
          }}
          disabled={!state.installedSnap}
          fullWidth={
            state.isFlask &&
            Boolean(state.installedSnap) &&
            !shouldDisplayReconnectButton(state.installedSnap)
          }
        />
      </CardContainer>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  margin-top: 7.6rem;
  margin-bottom: 7.6rem;
  ${({ theme }) => theme.mediaQueries.small} {
    padding-left: 2.4rem;
    padding-right: 2.4rem;
    margin-top: 2rem;
    margin-bottom: 2rem;
    width: auto;
  }
`;

const Heading = styled.h1`
  margin-top: 0;
  margin-bottom: 2.4rem;
  text-align: center;
`;

const Span = styled.span`
  color: ${(props) => props.theme.colors.primary.default};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.large};
  font-weight: 500;
  margin-top: 0;
  margin-bottom: 0;
  ${({ theme }) => theme.mediaQueries.small} {
    font-size: ${({ theme }) => theme.fontSizes.text};
  }
`;

const CardContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 64.8rem;
  width: 100%;
  height: 100%;
  margin-top: 1.5rem;
`;

const ErrorMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.error.muted};
  border: 1px solid ${({ theme }) => theme.colors.error.default};
  color: ${({ theme }) => theme.colors.error.alternative};
  border-radius: ${({ theme }) => theme.radii.default};
  padding: 2.4rem;
  margin-bottom: 2.4rem;
  margin-top: 2.4rem;
  max-width: 60rem;
  width: 100%;
  ${({ theme }) => theme.mediaQueries.small} {
    padding: 1.6rem;
    margin-bottom: 1.2rem;
    margin-top: 1.2rem;
    max-width: 100%;
  }
`;

export default Index;
