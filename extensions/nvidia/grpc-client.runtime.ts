import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type * as grpcNS from "@grpc/grpc-js";
import type * as protoLoaderNS from "@grpc/proto-loader";

// Use createRequire so protobufjs (inside proto-loader) finds a valid `require`
// and initialises its internal `fs` reference — it otherwise sets fs=null in ESM.
const _require = createRequire(import.meta.url);
const grpc = _require("@grpc/grpc-js") as typeof grpcNS;
const protoLoader = _require("@grpc/proto-loader") as typeof protoLoaderNS;

const PROTO_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "proto");
const NVCF_HOST = "grpc.nvcf.nvidia.com:443";
const LOADER_OPTS: protoLoaderNS.Options = {
  includeDirs: [PROTO_DIR],
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

export function makeNvcfMetadata(apiKey: string, functionId: string): grpcNS.Metadata {
  const md = new grpc.Metadata();
  md.set("authorization", `Bearer ${apiKey}`);
  md.set("function-id", functionId);
  return md;
}

export function createAsrClient(): grpcNS.Client {
  const pkg = grpc.loadPackageDefinition(
    protoLoader.loadSync(path.join(PROTO_DIR, "riva/proto/riva_asr.proto"), LOADER_OPTS),
  ) as Record<string, unknown>;
  const RivaSpeechRecognition = (
    (pkg["nvidia"] as Record<string, unknown>)?.["riva"] as Record<string, unknown>
  )?.["asr"] as Record<string, unknown>;
  const Client = RivaSpeechRecognition?.["RivaSpeechRecognition"] as typeof grpcNS.Client;
  return new Client(NVCF_HOST, grpc.credentials.createSsl());
}

export function createTtsClient(): grpcNS.Client {
  const pkg = grpc.loadPackageDefinition(
    protoLoader.loadSync(path.join(PROTO_DIR, "riva/proto/riva_tts.proto"), LOADER_OPTS),
  ) as Record<string, unknown>;
  const RivaSpeechSynthesis = (
    (pkg["nvidia"] as Record<string, unknown>)?.["riva"] as Record<string, unknown>
  )?.["tts"] as Record<string, unknown>;
  const Client = RivaSpeechSynthesis?.["RivaSpeechSynthesis"] as typeof grpcNS.Client;
  return new Client(NVCF_HOST, grpc.credentials.createSsl());
}
