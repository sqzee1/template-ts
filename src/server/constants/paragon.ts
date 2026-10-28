// Configuração da telemetria Paragon (painel de analytics do studio).
// Fica no server: ServerScriptService não replica para o client, então a chave não vaza.

/** URL do endpoint de ingestão do painel (`PUBLIC_URL/api/ingest`). */
export const PARAGON_ENDPOINT = "https://paragonstudios.duckdns.org/api/ingest";

/** Chave do jogo (aba Integração do painel). Vazio = telemetria desligada. */
export const PARAGON_API_KEY = "";

/** Envia eventos também quando rodando no Studio (útil para testar a integração). */
export const PARAGON_ENABLED_IN_STUDIO = false;

/** Segundos entre envios em lote. Compras ignoram e vão na hora. */
export const PARAGON_FLUSH_INTERVAL = 15;

/** Segundos entre heartbeats (mantém sessões vivas no painel). */
export const PARAGON_HEARTBEAT_INTERVAL = 60;

/** Máximo de eventos por requisição. */
export const PARAGON_MAX_BATCH = 400;

/** Limite da fila em memória se o painel ficar fora do ar. */
export const PARAGON_MAX_QUEUE = 5000;
