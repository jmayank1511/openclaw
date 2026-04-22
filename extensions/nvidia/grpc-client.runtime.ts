import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROTO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "proto");
const NVCF_HOST = "grpc.nvcf.nvidia.com:443";
const LOADER_OPTS: protoLoader.Options = {
  includeDirs: [PROTO_DIR],
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export function makeNvcfMetadata(apiKey: string, functionId: string): grpc.Metadata {
  const md = new grpc.Metadata();
  md.set("authorization", `Bearer ${apiKey}`);
  md.set("function-id", functionId);
  return md;
}

export function createAsrClient(): grpc.Client {
  const pkg = grpc.loadPackageDefinition(
    protoLoader.loadSync(path.join(PROTO_DIR, "riva/proto/riva_asr.proto"), LOADER_OPTS),
  ) as Record<string, unknown>;
  const RivaSpeechRecognition = (
    (pkg["nvidia"] as Record<string, unknown>)?.["riva"] as Record<string, unknown>
  )?.["asr"] as Record<string, unknown>;
  const Client = RivaSpeechRecognition?.["RivaSpeechRecognition"] as typeof grpc.Client;
  return new Client(NVCF_HOST, grpc.credentials.createSsl());
}

export function createTtsClient(): grpc.Client {
  const pkg = grpc.loadPackageDefinition(
    protoLoader.loadSync(path.join(PROTO_DIR, "riva/proto/riva_tts.proto"), LOADER_OPTS),
  ) as Record<string, unknown>;
  const RivaSpeechSynthesis = (
    (pkg["nvidia"] as Record<string, unknown>)?.["riva"] as Record<string, unknown>
  )?.["tts"] as Record<string, unknown>;
  const Client = RivaSpeechSynthesis?.["RivaSpeechSynthesis"] as typeof grpc.Client;
  return new Client(NVCF_HOST, grpc.credentials.createSsl());
}
