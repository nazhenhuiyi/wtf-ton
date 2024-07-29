import {
  KeyPair,
  mnemonicNew,
  mnemonicToPrivateKey,
  mnemonicValidate,
} from "@ton/crypto";

import * as dotenv from "dotenv";
dotenv.config();

(async () => {
  const password: string | null | undefined = "12345678910";
  // generate mnemonics
  const mnemonics: string[] = await mnemonicNew(24, password);
  const mnemonicsValid: boolean = await mnemonicValidate(mnemonics, password);
  const keyPair: KeyPair = await mnemonicToPrivateKey(mnemonics, password);
  console.log(mnemonics.join(" "), mnemonicsValid, keyPair);
})();
