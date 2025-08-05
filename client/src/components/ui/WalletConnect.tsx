import { ConnectWallet, useAddress, useDisconnect } from "@thirdweb-dev/react";

export default function WalletConnect() {
  const address = useAddress();
  const disconnect = useDisconnect();

  if (address) {
    return (
      <div className="flex items-center space-x-2">
        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </div>
        <button
          onClick={disconnect}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <ConnectWallet 
      btnTitle="Connect Wallet"
      className="!bg-blue-500 !text-white !px-4 !py-2 !rounded-lg !font-semibold"
    />
  );
}
