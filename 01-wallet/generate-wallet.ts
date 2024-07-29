import {
  fromNano,
  internal,
  WalletContractV4,
  TonClient4,
  toNano,
} from "@ton/ton";
import { KeyPair, mnemonicToPrivateKey } from "@ton/crypto";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
// ------
import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  const endpoint = await getHttpV4Endpoint({ network: "testnet" });
  const client = new TonClient4({ endpoint });
  // create wallet
  const password: string | null | undefined = "12345678910";

  const keyPair: KeyPair = await mnemonicToPrivateKey(
    process.env.MEME?.split(" ") || [],
    password
  );
  console.log(keyPair);

  let workchain = 0;
  let wallet_contract = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  let wallet = client.open(wallet_contract);
  console.log("Wallet address: ", wallet.address);

  // ====== Deploying contract (希望被部署的新合約)======

  let seqno: number = await wallet.getSeqno();
  let balance: bigint = await wallet.getBalance();
  console.log(`wallet address: ${wallet.address.toString()}`, seqno, balance);

  await wallet.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    messages: [
      internal({
        to: "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N",
        value: toNano("0.05"),
        bounce: true,
        init: wallet_contract.init,
      }),
    ],
  });
  console.log(
    "Current deployment wallet balance: ",
    fromNano(balance).toString(),
    "💎TON"
  );
  console.log("=====================================");
  console.log("Deploying contract: " + wallet_contract.address.toString());
  console.log("=====================================");
  console.log(wallet.init.code.toBoc().toString("hex"));
})();
