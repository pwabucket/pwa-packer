import * as Comlink from "comlink";

import EncrypterWorker from "../workers/EncrypterWorker?worker";
import type Encrypter from "../lib/Encrypter";

const worker = new EncrypterWorker();
const encryption = Comlink.wrap<typeof Encrypter>(worker);

export { encryption };
