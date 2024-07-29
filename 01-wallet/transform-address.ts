import { Address } from "@ton/core";

const bounceable_tag = 0x11;
const non_bounceable_tag = 0x51;
const test_flag = 0x80;

export function crc16(data: Buffer) {
  const poly = 0x1021;
  let reg = 0;
  const message = Buffer.alloc(data.length + 2);
  message.set(data);
  for (let byte of message) {
    let mask = 0x80;
    while (mask > 0) {
      reg <<= 1;
      if (byte & mask) {
        reg += 1;
      }
      mask >>= 1;
      if (reg > 0xffff) {
        reg &= 0xffff;
        reg ^= poly;
      }
    }
  }
  return Buffer.from([Math.floor(reg / 256), reg % 256]);
}

function parseFriendlyAddress(src: string | Buffer) {
  if (typeof src === "string" && !Address.isFriendly(src)) {
    throw new Error("Unknown address type");
  }

  const data = Buffer.isBuffer(src) ? src : Buffer.from(src, "base64");
  console.log(data);
  // 1byte tag + 1byte workchain + 32 bytes hash + 2 byte crc
  if (data.length !== 36) {
    throw new Error("Unknown address type: byte length is not equal to 36");
  }

  // Prepare data
  const addr = data.subarray(0, 34);
  const crc = data.subarray(34, 36);
  const calcedCrc = crc16(addr);
  if (!(calcedCrc[0] === crc[0] && calcedCrc[1] === crc[1])) {
    throw new Error("Invalid checksum: " + src);
  }

  // Parse tag
  let tag = addr[0];
  let isTestOnly = false;
  let isBounceable = false;
  if (tag & test_flag) {
    isTestOnly = true;
    tag = tag ^ test_flag;
  }
  if (tag !== bounceable_tag && tag !== non_bounceable_tag)
    throw "Unknown address tag";

  isBounceable = tag === bounceable_tag;

  let workchain: number | null = null;
  if (addr[1] === 0xff) {
    // TODO we should read signed integer here
    workchain = -1;
  } else {
    workchain = addr[1];
  }

  const hashPart = addr.subarray(2, 34);

  return { isTestOnly, isBounceable, workchain, hashPart };
}
function toStringBuffer(args: {
  bounceable?: boolean;
  testOnly?: boolean;
  workchain?: number;
  hash: Buffer;
}) {
  let testOnly = args && args.testOnly !== undefined ? args.testOnly : false;
  let bounceable =
    args && args.bounceable !== undefined ? args.bounceable : true;

  let tag = bounceable ? bounceable_tag : non_bounceable_tag;
  if (testOnly) {
    tag |= test_flag;
  }

  const addr = Buffer.alloc(34);
  addr[0] = tag;
  addr[1] = args.workchain ?? 0;
  addr.set(args.hash, 2);
  const addressWithChecksum = Buffer.alloc(36);
  addressWithChecksum.set(addr);
  addressWithChecksum.set(crc16(addr), 34);
  return Buffer.from(addressWithChecksum).toString("base64"); // addressWithChecksum;
}
(async () => {
  const parsedFriendlyAddress = parseFriendlyAddress(
    "EQD2c0_pQzJSWL8TFYadtCuCoNZCL8kKLve9nhye4UBlbEHq"
  );
  console.log(
    "EQD2c0_pQzJSWL8TFYadtCuCoNZCL8kKLve9nhye4UBlbEHq parsed friendly address: ",
    parsedFriendlyAddress
  );
  console.log(
    "Address:  isBounceable = false " +
      toStringBuffer({
        bounceable: false,
        testOnly: false,
        workchain: 0,
        hash: parsedFriendlyAddress.hashPart,
      })
  );
  console.log(
    "Address:  isBounceable = true " +
      toStringBuffer({
        bounceable: true,
        testOnly: false,
        workchain: 0,
        hash: parsedFriendlyAddress.hashPart,
      })
  );
})();
