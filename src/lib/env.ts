import { env } from "cloudflare:workers";

type StringEnvKeys = {
  [K in keyof Cloudflare.Env]: Cloudflare.Env[K] extends string ? K : never;
}[keyof Cloudflare.Env];

type BindingEnvKeys = {
  [K in keyof Cloudflare.Env]: Cloudflare.Env[K] extends string ? never : K;
}[keyof Cloudflare.Env];

export function requireEnv(name: StringEnvKeys): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getBinding<K extends BindingEnvKeys>(name: K): Cloudflare.Env[K] {
  const value = env[name];

  if (value == null) {
    throw new Error(`Missing binding: ${name}`);
  }

  return value;
}
